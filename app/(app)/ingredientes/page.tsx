import { createClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/layout/page-header";
import { IngredientList } from "./ingredient-list";
import type { Ingredient } from "@/types/database";

export const dynamic = "force-dynamic";

export default async function IngredientesPage() {
  const supabase = await createClient();
  const { data } = await supabase
    .from("ingredients")
    .select("*")
    .order("name", { ascending: true });

  return (
    <div className="mx-auto max-w-5xl">
      <PageHeader
        title="Ingredientes"
        description="Cadastre os insumos e seus preços. São a base do cálculo de custo das receitas."
      />
      <IngredientList ingredients={(data ?? []) as Ingredient[]} />
    </div>
  );
}
