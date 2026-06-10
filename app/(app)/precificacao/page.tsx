import { createClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/layout/page-header";
import { getProfitCalcMode } from "@/lib/user-settings";
import { getBusinessSettings, totalMonthlyFixedCost } from "@/lib/business-settings";
import { ProfitModeSection } from "./profit-mode-section";
import { FixedCostsSection } from "./fixed-costs-section";
import { PricingCalculator } from "./pricing-calculator";

export const dynamic = "force-dynamic";

export default async function PrecificacaoPage() {
  const supabase = await createClient();
  const [{ data: sizes }, mode, businessSettings] = await Promise.all([
    supabase
      .from("recipe_sizes")
      .select(
        "id, size_label, fixed_price, recipe_id, recipes(name), recipe_size_ingredients(id, quantity, unit, ingredient_id, ingredients(id, name, unit, price_per_unit, loss_pct))"
      )
      .order("size_label"),
    getProfitCalcMode(),
    getBusinessSettings(),
  ]);

  const monthlyFixedCost = totalMonthlyFixedCost(businessSettings);

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <PageHeader
        title="Precificação"
        description="Registre seu custo mensal, escolha o markup de cada receita e veja quantas você precisa vender pra cobrir o mês."
      />
      <ProfitModeSection initialMode={mode} />
      <FixedCostsSection initial={businessSettings} />
      <PricingCalculator
        sizes={(sizes ?? []) as never[]}
        profitMode={mode}
        monthlyFixedCost={monthlyFixedCost}
      />
    </div>
  );
}
