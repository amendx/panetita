import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { getProfitCalcMode } from "@/lib/user-settings";
import { RecipeEditor } from "./recipe-editor";

export const dynamic = "force-dynamic";

export default async function ReceitaDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ edit?: string }>;
}) {
  const { id } = await params;
  const { edit } = await searchParams;
  const supabase = await createClient();

  const [{ data: recipe }, { data: sizes }, { data: ingredients }, { data: pets }, profitMode] =
    await Promise.all([
      supabase.from("recipes").select("*").eq("id", id).single(),
      supabase
        .from("recipe_sizes")
        .select(
          "*, recipe_size_ingredients(id, ingredient_id, quantity, unit, ingredients(id, name, unit, price_per_unit, loss_pct))"
        )
        .eq("recipe_id", id)
        .order("size_label"),
      supabase.from("ingredients").select("*").order("name"),
      supabase.from("pets").select("id, name, customers(name)").order("name"),
      getProfitCalcMode(),
    ]);

  if (!recipe) notFound();

  const petOptions = (pets ?? []).map((p) => ({
    id: p.id,
    name: p.name,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    customer_name: (p.customers as any)?.name ?? null,
  }));

  return (
    <div className="mx-auto max-w-4xl">
      <Button asChild variant="ghost" size="sm" className="mb-3">
        <Link href="/receitas">
          <ArrowLeft className="h-4 w-4" /> Voltar
        </Link>
      </Button>
      <PageHeader title={recipe.name} description={recipe.description ?? undefined} />
      <RecipeEditor
        recipe={recipe}
        sizes={(sizes ?? []) as never[]}
        ingredients={ingredients ?? []}
        pets={petOptions}
        startInEditMode={edit === "1"}
        profitMode={profitMode}
      />
    </div>
  );
}
