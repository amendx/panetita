import { cache } from "react";
import { createClient } from "@/lib/supabase/server";
import type { BusinessSettings } from "@/types/database";

export const DEFAULT_BUSINESS_SETTINGS: BusinessSettings = {
  id: "",
  monthly_rent: 0,
  monthly_energy: 0,
  monthly_marketing: 0,
  monthly_mei: 0,
  reserve_pct: 3,
  estimated_units_per_month: 0,
  updated_at: "",
};

/**
 * Carrega o singleton de configurações do negócio. Se a tabela estiver vazia,
 * devolve os defaults — não cria a linha aqui (criamos no update).
 */
export const getBusinessSettings = cache(async (): Promise<BusinessSettings> => {
  const supabase = await createClient();
  const { data } = await supabase
    .from("business_settings")
    .select("*")
    .limit(1)
    .maybeSingle();
  if (!data) return DEFAULT_BUSINESS_SETTINGS;
  return {
    id: data.id as string,
    monthly_rent: Number(data.monthly_rent ?? 0),
    monthly_energy: Number(data.monthly_energy ?? 0),
    monthly_marketing: Number(data.monthly_marketing ?? 0),
    monthly_mei: Number(data.monthly_mei ?? 0),
    reserve_pct: Number(data.reserve_pct ?? 3),
    estimated_units_per_month: Number(data.estimated_units_per_month ?? 0),
    updated_at: (data.updated_at as string) ?? "",
  };
});

/** Total fixo mensal do negócio (aluguel + energia + marketing + MEI). */
export function totalMonthlyFixedCost(settings: BusinessSettings): number {
  return (
    Number(settings.monthly_rent) +
    Number(settings.monthly_energy) +
    Number(settings.monthly_marketing) +
    Number(settings.monthly_mei)
  );
}
