"use server";

import { revalidatePath } from "next/cache";
import { withUser } from "@/lib/auth-action";

export async function saveCombo(input: {
  id?: string;
  name: string;
  description?: string | null;
  discount_pct: number;
}) {
  await withUser(async ({ supabase, userId }) => {
    const payload = {
      name: input.name,
      description: input.description ?? null,
      discount_pct: input.discount_pct,
      fixed_price: null, // desativa override manual ao salvar pela UI nova
      user_id: userId,
    };
    if (input.id) {
      const { error } = await supabase.from("combos").update(payload).eq("id", input.id);
      if (error) throw error;
    } else {
      const { error } = await supabase.from("combos").insert(payload);
      if (error) throw error;
    }
  });
  revalidatePath("/combos");
  revalidatePath("/pedidos/novo");
}

export async function deleteCombo(id: string) {
  await withUser(async ({ supabase }) => {
    const { error } = await supabase.from("combos").delete().eq("id", id);
    if (error) throw error;
  });
  revalidatePath("/combos");
}

export async function addComboItem(input: {
  combo_id: string;
  recipe_size_id: string;
  quantity: number;
}) {
  await withUser(async ({ supabase, userId }) => {
    const { error } = await supabase.from("combo_items").insert({
      combo_id: input.combo_id,
      recipe_size_id: input.recipe_size_id,
      quantity: input.quantity,
      user_id: userId,
    });
    if (error) throw error;
  });
  revalidatePath("/combos");
}

export async function deleteComboItem(id: string) {
  await withUser(async ({ supabase }) => {
    const { error } = await supabase.from("combo_items").delete().eq("id", id);
    if (error) throw error;
  });
  revalidatePath("/combos");
}
