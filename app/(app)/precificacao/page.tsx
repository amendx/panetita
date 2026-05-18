import { createClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/layout/page-header";
import { getProfitCalcMode } from "@/lib/user-settings";
import { ProfitModeSection } from "./profit-mode-section";
import { PricingCalculator } from "./pricing-calculator";

export const dynamic = "force-dynamic";

export default async function PrecificacaoPage() {
  const supabase = await createClient();
  const [{ data: sizes }, mode] = await Promise.all([
    supabase
      .from("recipe_sizes")
      .select(
        "id, size_label, fixed_price, recipe_id, recipes(name), recipe_size_ingredients(id, quantity, unit, ingredient_id, ingredients(id, name, unit, price_per_unit))"
      )
      .order("size_label"),
    getProfitCalcMode(),
  ]);

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <PageHeader
        title="Precificação"
        description="Decida como calcular o lucro e simule preços antes de definir o valor de venda."
      />
      <ProfitModeSection initialMode={mode} />
      <PricingCalculator sizes={(sizes ?? []) as never[]} profitMode={mode} />
    </div>
  );
}
