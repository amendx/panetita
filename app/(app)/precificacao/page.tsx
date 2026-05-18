import { createClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/layout/page-header";
import { PricingCalculator } from "./pricing-calculator";

export const dynamic = "force-dynamic";

export default async function PrecificacaoPage() {
  const supabase = await createClient();
  const { data: sizes } = await supabase
    .from("recipe_sizes")
    .select(
      "id, size_label, fixed_price, recipe_id, recipes(name), recipe_size_ingredients(id, quantity, unit, ingredient_id, ingredients(id, name, unit, price_per_unit))"
    )
    .order("size_label");

  return (
    <div className="mx-auto max-w-3xl">
      <PageHeader
        title="Precificação"
        description="Simule custos, margens e preços antes de definir o valor de venda."
      />
      <PricingCalculator sizes={(sizes ?? []) as never[]} />
    </div>
  );
}
