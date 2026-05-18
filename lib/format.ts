import { format, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";

const BRL = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
});

export function formatBRL(value: number | null | undefined): string {
  if (value == null || Number.isNaN(value)) return BRL.format(0);
  return BRL.format(value);
}

export function parseBRL(value: string): number {
  const cleaned = value.replace(/[^\d,-]/g, "").replace(",", ".");
  const n = parseFloat(cleaned);
  return Number.isNaN(n) ? 0 : n;
}

export function formatDate(date: Date | string, pattern = "dd/MM/yyyy"): string {
  const d = typeof date === "string" ? parseISO(date) : date;
  return format(d, pattern, { locale: ptBR });
}

export function formatDateLong(date: Date | string): string {
  return formatDate(date, "EEEE, dd 'de' MMMM 'de' yyyy");
}

export function formatDateTime(date: Date | string): string {
  return formatDate(date, "dd/MM/yyyy 'às' HH:mm");
}

export function toISODate(date: Date): string {
  return format(date, "yyyy-MM-dd");
}

export function unitLabel(unit: string): string {
  const map: Record<string, string> = {
    g: "g",
    kg: "kg",
    un: "un",
    ml: "ml",
    l: "L",
    portion: "porção",
    weight: "peso",
  };
  return map[unit] ?? unit;
}

export function recurrenceLabel(r: string): string {
  const map: Record<string, string> = {
    single: "Único",
    weekly: "Semanal",
    biweekly: "Quinzenal",
    monthly: "Mensal",
    custom: "Personalizado",
  };
  return map[r] ?? r;
}

export function statusLabel(s: string): string {
  const map: Record<string, string> = {
    draft: "Rascunho",
    confirmed: "Confirmado",
    delivered: "Entregue",
    cancelled: "Cancelado",
    scheduled: "Agendado",
    pending: "Pendente",
    paid: "Pago",
    overdue: "Atrasado",
  };
  return map[s] ?? s;
}

export function pricingStrategyLabel(s: string): string {
  const map: Record<string, string> = {
    fixed: "Preço fixo",
    fixed_editable: "Fixo editável",
    margin: "Margem definida",
  };
  return map[s] ?? s;
}

export function deliveryTypeLabel(t: string): string {
  const map: Record<string, string> = {
    uber_99: "Uber/99 (cliente paga)",
    pickup: "Retirada na loja",
  };
  return map[t] ?? t;
}

export function deliveryTypeShort(t: string): string {
  const map: Record<string, string> = {
    uber_99: "Uber/99",
    pickup: "Retirada",
  };
  return map[t] ?? t;
}

export function paymentMethodLabel(m: string): string {
  const map: Record<string, string> = {
    pix: "PIX",
    cash: "Dinheiro",
    card: "Cartão",
    transfer: "Transferência",
    other: "Outro",
  };
  return map[m] ?? m;
}
