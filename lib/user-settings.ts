import { cache } from "react";
import { createClient } from "@/lib/supabase/server";
import type { ProfitCalcMode } from "@/types/database";

export const DEFAULT_PROFIT_MODE: ProfitCalcMode = "markup";

/**
 * Carrega as preferências do usuário logado. Se o registro ainda não existir,
 * devolve os defaults — sem criar a linha (criamos apenas quando o usuário
 * altera algo de fato, em `setProfitCalcMode`).
 */
export const getProfitCalcMode = cache(async (): Promise<ProfitCalcMode> => {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return DEFAULT_PROFIT_MODE;

  const { data } = await supabase
    .from("user_settings")
    .select("profit_calc_mode")
    .eq("user_id", user.id)
    .maybeSingle();

  const mode = data?.profit_calc_mode;
  return mode === "margin" || mode === "markup" ? mode : DEFAULT_PROFIT_MODE;
});
