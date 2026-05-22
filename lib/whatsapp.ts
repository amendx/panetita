/**
 * Limpa o telefone (so digitos), normaliza DDI 55 para BR.
 * Retorna null se nao tiver pelo menos 10 digitos.
 */
export function normalizeBrPhone(phone: string | null | undefined): string | null {
  if (!phone) return null;
  const digits = phone.replace(/\D/g, "");
  if (digits.length < 10) return null;
  // Se ja comeca com 55 e tem 12 ou 13 digitos, mantem
  if ((digits.length === 12 || digits.length === 13) && digits.startsWith("55")) {
    return digits;
  }
  // Caso contrario, adiciona 55 na frente
  return `55${digits}`;
}

export function whatsappUrl(phone: string | null | undefined, message?: string): string | null {
  const normalized = normalizeBrPhone(phone);
  if (!normalized) return null;
  const base = `https://wa.me/${normalized}`;
  if (!message) return base;
  return `${base}?text=${encodeURIComponent(message)}`;
}

/**
 * URL "intent" do Android que aponta especificamente pro WhatsApp Business
 * (package com.whatsapp.w4b). Só funciona em browsers Android — em iOS/desktop
 * o navegador não sabe lidar com o scheme `intent://` e o link quebra.
 */
function whatsappBusinessAndroidUrl(
  phone: string | null | undefined,
  message?: string
): string | null {
  const normalized = normalizeBrPhone(phone);
  if (!normalized) return null;
  const params = new URLSearchParams({ phone: normalized });
  if (message) params.set("text", message);
  return `intent://send/?${params.toString()}#Intent;scheme=whatsapp;package=com.whatsapp.w4b;end`;
}

function isAndroid(): boolean {
  if (typeof navigator === "undefined") return false;
  return /android/i.test(navigator.userAgent);
}

/**
 * Abre o WhatsApp pra conversar com o número informado. Em Android,
 * força o WhatsApp Business (`com.whatsapp.w4b`); em outros sistemas,
 * cai no `wa.me/` padrão (que abre o app marcado como padrão pra
 * conversas WhatsApp).
 *
 * Retorna `false` se o telefone for inválido.
 */
export function openWhatsapp(
  phone: string | null | undefined,
  message?: string
): boolean {
  if (isAndroid()) {
    const intent = whatsappBusinessAndroidUrl(phone, message);
    if (intent) {
      // navegar via location é mais confiável que window.open pra schemes custom no Android
      window.location.href = intent;
      return true;
    }
  }
  const url = whatsappUrl(phone, message);
  if (!url) return false;
  window.open(url, "_blank", "noopener,noreferrer");
  return true;
}
