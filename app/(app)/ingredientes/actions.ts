"use server";

import { revalidatePath } from "next/cache";
import { withUser } from "@/lib/auth-action";
import type { IngredientUnit } from "@/types/database";

interface IngredientInput {
  id?: string;
  name: string;
  unit: IngredientUnit;
  price_per_unit: number;
  stock_quantity?: number;
  loss_pct?: number;
  notes?: string | null;
}

export async function saveIngredient(input: IngredientInput) {
  await withUser(async ({ supabase, userId }) => {
    const payload: Record<string, unknown> = {
      name: input.name,
      unit: input.unit,
      price_per_unit: input.price_per_unit,
      loss_pct: input.loss_pct ?? 0,
      notes: input.notes ?? null,
      user_id: userId,
    };
    if (input.stock_quantity != null) {
      payload.stock_quantity = input.stock_quantity;
    }
    if (input.id) {
      const { error } = await supabase.from("ingredients").update(payload).eq("id", input.id);
      if (error) throw error;
    } else {
      const { error } = await supabase.from("ingredients").insert(payload);
      if (error) throw error;
    }
  });
  revalidatePath("/ingredientes");
  revalidatePath("/estoque");
  revalidatePath("/compras");
}

export async function updateStock(input: { id: string; stock_quantity: number }) {
  await withUser(async ({ supabase }) => {
    const { error } = await supabase
      .from("ingredients")
      .update({ stock_quantity: input.stock_quantity })
      .eq("id", input.id);
    if (error) throw error;
  });
  revalidatePath("/estoque");
  revalidatePath("/compras");
  revalidatePath("/ingredientes");
}

export async function adjustStock(input: { id: string; delta: number }) {
  await withUser(async ({ supabase }) => {
    const { data, error: fetchErr } = await supabase
      .from("ingredients")
      .select("stock_quantity")
      .eq("id", input.id)
      .single();
    if (fetchErr) throw fetchErr;
    const newQty = Math.max(0, Number(data?.stock_quantity ?? 0) + input.delta);
    const { error } = await supabase
      .from("ingredients")
      .update({ stock_quantity: newQty })
      .eq("id", input.id);
    if (error) throw error;
  });
  revalidatePath("/estoque");
  revalidatePath("/compras");
  revalidatePath("/ingredientes");
}

export async function deleteIngredient(id: string) {
  await withUser(async ({ supabase }) => {
    const { error } = await supabase.from("ingredients").delete().eq("id", id);
    if (error) throw error;
  });
  revalidatePath("/ingredientes");
  revalidatePath("/estoque");
}
