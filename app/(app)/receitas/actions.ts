"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { withUser } from "@/lib/auth-action";
import type { IngredientUnit } from "@/types/database";

export async function createRecipe(input: {
  name: string;
  description?: string;
  pet_id?: string | null;
}) {
  let newId = "";
  await withUser(async ({ supabase, userId }) => {
    const { data, error } = await supabase
      .from("recipes")
      .insert({
        name: input.name,
        description: input.description ?? null,
        pet_id: input.pet_id ?? null,
        user_id: userId,
      })
      .select("id")
      .single();
    if (error) throw error;
    newId = data!.id;
  });
  revalidatePath("/receitas");
  redirect(`/receitas/${newId}`);
}

export async function updateRecipe(
  id: string,
  input: { name: string; description?: string | null; pet_id?: string | null }
) {
  await withUser(async ({ supabase }) => {
    const { error } = await supabase
      .from("recipes")
      .update({
        name: input.name,
        description: input.description ?? null,
        pet_id: input.pet_id ?? null,
      })
      .eq("id", id);
    if (error) throw error;
  });
  revalidatePath(`/receitas/${id}`);
  revalidatePath("/receitas");
}

export async function deleteRecipe(id: string) {
  await withUser(async ({ supabase }) => {
    const { error } = await supabase.from("recipes").delete().eq("id", id);
    if (error) throw error;
  });
  revalidatePath("/receitas");
  redirect("/receitas");
}

export async function addRecipeSize(input: {
  recipe_id: string;
  size_label: string;
  fixed_price?: number | null;
}) {
  await withUser(async ({ supabase, userId }) => {
    const { error } = await supabase.from("recipe_sizes").insert({
      recipe_id: input.recipe_id,
      size_label: input.size_label,
      fixed_price: input.fixed_price ?? null,
      user_id: userId,
    });
    if (error) throw error;
  });
  revalidatePath(`/receitas/${input.recipe_id}`);
}

export async function updateRecipeSize(input: {
  id: string;
  recipe_id: string;
  size_label: string;
  fixed_price?: number | null;
}) {
  await withUser(async ({ supabase }) => {
    const { error } = await supabase
      .from("recipe_sizes")
      .update({ size_label: input.size_label, fixed_price: input.fixed_price ?? null })
      .eq("id", input.id);
    if (error) throw error;
  });
  revalidatePath(`/receitas/${input.recipe_id}`);
}

export async function deleteRecipeSize(input: { id: string; recipe_id: string }) {
  await withUser(async ({ supabase }) => {
    const { error } = await supabase.from("recipe_sizes").delete().eq("id", input.id);
    if (error) throw error;
  });
  revalidatePath(`/receitas/${input.recipe_id}`);
}

export async function addSizeIngredient(input: {
  recipe_size_id: string;
  recipe_id: string;
  ingredient_id: string;
  quantity: number;
  unit: IngredientUnit;
}) {
  await withUser(async ({ supabase, userId }) => {
    const { error } = await supabase.from("recipe_size_ingredients").insert({
      recipe_size_id: input.recipe_size_id,
      ingredient_id: input.ingredient_id,
      quantity: input.quantity,
      unit: input.unit,
      user_id: userId,
    });
    if (error) throw error;
  });
  revalidatePath(`/receitas/${input.recipe_id}`);
}

export async function deleteSizeIngredient(input: { id: string; recipe_id: string }) {
  await withUser(async ({ supabase }) => {
    const { error } = await supabase
      .from("recipe_size_ingredients")
      .delete()
      .eq("id", input.id);
    if (error) throw error;
  });
  revalidatePath(`/receitas/${input.recipe_id}`);
}
