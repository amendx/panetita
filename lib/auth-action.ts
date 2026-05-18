import { createClient } from "@/lib/supabase/server";
import type { SupabaseClient } from "@supabase/supabase-js";

export type ActionContext = {
  supabase: SupabaseClient;
  userId: string;
};

export async function withUser<T>(fn: (ctx: ActionContext) => Promise<T>): Promise<T> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Não autenticado");
  return fn({ supabase, userId: user.id });
}
