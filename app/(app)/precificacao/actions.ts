"use server";

import { revalidatePath } from "next/cache";
import { withUser } from "@/lib/auth-action";
import type { ProfitCalcMode } from "@/types/database";

export async function setProfitCalcMode(mode: ProfitCalcMode) {
  await withUser(async ({ supabase, userId }) => {
    const { error } = await supabase
      .from("user_settings")
      .upsert(
        { user_id: userId, profit_calc_mode: mode, updated_at: new Date().toISOString() },
        { onConflict: "user_id" }
      );
    if (error) throw error;
  });
  // Invalida todas as telas que dependem do modo
  revalidatePath("/precificacao");
  revalidatePath("/receitas");
  revalidatePath("/pedidos/novo");
  revalidatePath("/relatorios");
}

export async function saveBusinessSettings(input: {
  monthly_rent: number;
  monthly_energy: number;
  monthly_marketing: number;
  monthly_mei: number;
  reserve_pct: number;
  estimated_units_per_month: number;
}) {
  await withUser(async ({ supabase }) => {
    // Singleton: pega a unica linha ou cria uma nova
    const { data: existing } = await supabase
      .from("business_settings")
      .select("id")
      .limit(1)
      .maybeSingle();

    const payload = {
      monthly_rent: input.monthly_rent,
      monthly_energy: input.monthly_energy,
      monthly_marketing: input.monthly_marketing,
      monthly_mei: input.monthly_mei,
      reserve_pct: input.reserve_pct,
      estimated_units_per_month: input.estimated_units_per_month,
      updated_at: new Date().toISOString(),
    };

    if (existing?.id) {
      const { error } = await supabase
        .from("business_settings")
        .update(payload)
        .eq("id", existing.id);
      if (error) throw error;
    } else {
      const { error } = await supabase.from("business_settings").insert(payload);
      if (error) throw error;
    }
  });
  revalidatePath("/precificacao");
}
