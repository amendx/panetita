import { createClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/layout/page-header";
import { getProfitCalcMode } from "@/lib/user-settings";
import { fixedCostPerUnit, getBusinessSettings } from "@/lib/business-settings";
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

  const overhead = fixedCostPerUnit(businessSettings);

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <PageHeader
        title="Precificação"
        description="Configure o modo de cálculo, registre seus custos fixos e simule preços que cobrem tudo (não só os ingredientes)."
      />
      <ProfitModeSection initialMode={mode} />
      <FixedCostsSection initial={businessSettings} />
      <PricingCalculator
        sizes={(sizes ?? []) as never[]}
        profitMode={mode}
        businessSettings={businessSettings}
        fixedCostPerUnit={overhead}
      />
    </div>
  );
}
