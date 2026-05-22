import { createClient } from "@/lib/supabase/client";

const BUCKET = "pet-photos";
const MAX_DIMENSION = 800;
const JPEG_QUALITY = 0.82;

/**
 * Redimensiona a imagem pra no máximo MAX_DIMENSION e devolve como Blob JPEG.
 * Mantém proporção. Reduz drasticamente o tamanho de fotos de celular
 * (5-10 MB) pra ~150-300 KB.
 */
async function compressImage(file: File): Promise<Blob> {
  const dataUrl = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(new Error("Falha ao ler imagem"));
    reader.readAsDataURL(file);
  });

  const img = await new Promise<HTMLImageElement>((resolve, reject) => {
    const i = new Image();
    i.onload = () => resolve(i);
    i.onerror = () => reject(new Error("Falha ao carregar imagem"));
    i.src = dataUrl;
  });

  const scale = Math.min(1, MAX_DIMENSION / Math.max(img.width, img.height));
  const targetW = Math.round(img.width * scale);
  const targetH = Math.round(img.height * scale);

  const canvas = document.createElement("canvas");
  canvas.width = targetW;
  canvas.height = targetH;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas indisponível");
  ctx.drawImage(img, 0, 0, targetW, targetH);

  return await new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(
      (b) => (b ? resolve(b) : reject(new Error("Falha ao comprimir imagem"))),
      "image/jpeg",
      JPEG_QUALITY
    );
  });
}

/**
 * Faz upload e devolve a URL pública. O `path` fica `<petId>/<timestamp>.jpg`,
 * agrupado por pet para facilitar limpeza.
 */
export async function uploadPetPhoto(petId: string, file: File): Promise<string> {
  if (!file.type.startsWith("image/")) {
    throw new Error("Selecione um arquivo de imagem");
  }
  const blob = await compressImage(file);
  const supabase = createClient();
  const path = `${petId}/${Date.now()}.jpg`;
  const { error } = await supabase.storage.from(BUCKET).upload(path, blob, {
    contentType: "image/jpeg",
    upsert: false,
  });
  if (error) throw error;
  const { data } = supabase.storage.from(BUCKET).getPublicUrl(path);
  return data.publicUrl;
}

/**
 * Extrai o path da URL pública e remove o arquivo do bucket.
 * URL formato: https://<proj>.supabase.co/storage/v1/object/public/pet-photos/<path>
 */
export async function deletePetPhoto(publicUrl: string): Promise<void> {
  const marker = `/${BUCKET}/`;
  const idx = publicUrl.indexOf(marker);
  if (idx === -1) return;
  const path = publicUrl.slice(idx + marker.length);
  const supabase = createClient();
  await supabase.storage.from(BUCKET).remove([path]);
}
