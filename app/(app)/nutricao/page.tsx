import { createClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/layout/page-header";
import { NutritionCalculator } from "./nutrition-calculator";

export const dynamic = "force-dynamic";

export default async function NutricaoPage() {
  const supabase = await createClient();
  const { data: recipes } = await supabase
    .from("recipes")
    .select("id, name, recipe_sizes(id, size_label, fixed_price)")
    .order("name");

  return (
    <div className="mx-auto max-w-4xl">
      <PageHeader
        title="🧮 Calculadora nutricional"
        description="Quantos gramas de comida por dia para um cão de X kg? Útil para pets fora dos tamanhos padrão."
      />
      <NutritionCalculator recipes={(recipes ?? []) as never[]} />
    </div>
  );
}
