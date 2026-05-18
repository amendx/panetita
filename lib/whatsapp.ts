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
