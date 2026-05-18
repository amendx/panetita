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
