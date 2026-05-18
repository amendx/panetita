import { addDays } from "date-fns";
import { Package } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/layout/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { StockTable } from "./stock-table";
import { aggregateIngredients, type DeliveryAggregateInput } from "@/lib/shopping-list";
import { toISODate } from "@/lib/format";

export const dynamic = "force-dynamic";

const HORIZONS = [
  { key: "d7", days: 7, label: "7 dias" },
  { key: "d14", days: 14, label: "14 dias" },
  { key: "d30", days: 30, label: "30 dias" },
] as const;

export default async function EstoquePage() {
  const supabase = await createClient();
  const today = new Date();
  const maxEnd = addDays(today, 30);

  const [{ data: ingredients }, { data: deliveries }] = await Promise.all([
    supabase.from("ingredients").select("*").order("name"),
    supabase
      .from("deliveries")
      .select(
        `scheduled_date,
         delivery_items(quantity, order_items(
           recipe_sizes(id, size_label, recipe_id, recipes(name),
             recipe_size_ingredients(id, quantity, unit, ingredient_id,
               ingredients(id, name, unit, price_per_unit))),
           combos(id, combo_items(quantity, recipe_sizes(id, size_label, recipe_id, recipes(name),
             recipe_size_ingredients(id, quantity, unit, ingredient_id,
               ingredients(id, name, unit, price_per_unit))))))
         )`
      )
      .gte("scheduled_date", toISODate(today))
      .lte("scheduled_date", toISODate(maxEnd))
      .neq("status", "cancelled"),
  ]);

  /* eslint-disable @typescript-eslint/no-explicit-any */
  function buildAggregateInputs(maxDate: Date): DeliveryAggregateInput[] {
    const inputs: DeliveryAggregateInput[] = [];
    const maxIso = toISODate(maxDate);
    for (const d of (deliveries ?? []) as any[]) {
      if (d.scheduled_date > maxIso) continue;
      for (const di of d.delivery_items ?? []) {
        const oi = di.order_items;
        if (oi?.recipe_sizes) {
          inputs.push({
            recipe_size: convertSize(oi.recipe_sizes),
            quantity: Number(di.quantity),
          });
        }
        if (oi?.combos) {
          for (const ci of oi.combos.combo_items ?? []) {
            inputs.push({
              recipe_size: convertSize(ci.recipe_sizes),
              quantity: Number(di.quantity) * Number(ci.quantity),
            });
          }
        }
      }
    }
    return inputs;
  }

  const demandByHorizon = Object.fromEntries(
    HORIZONS.map((h) => {
      const inputs = buildAggregateInputs(addDays(today, h.days));
      const lines = aggregateIngredients(inputs);
      return [h.key, lines];
    })
  );

  return (
    <div className="mx-auto max-w-6xl">
      <PageHeader
        title="Estoque"
        description="Acompanhe seus ingredientes em estoque e o que falta para as próximas entregas."
      />

      {(ingredients?.length ?? 0) === 0 ? (
        <Card>
          <CardContent className="p-8 text-center text-muted-foreground">
            <Package className="mx-auto mb-3 h-10 w-10 opacity-50" />
            Nenhum ingrediente cadastrado.
          </CardContent>
        </Card>
      ) : (
        <StockTable
          ingredients={(ingredients ?? []) as never[]}
          demandByHorizon={demandByHorizon as never}
          horizons={HORIZONS}
        />
      )}
    </div>
  );
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function convertSize(s: any) {
  return {
    id: s.id,
    user_id: "",
    recipe_id: s.recipe_id,
    size_label: s.size_label,
    fixed_price: s.fixed_price ?? null,
    notes: null,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ingredients: (s.recipe_size_ingredients ?? []).map((r: any) => ({
      id: r.id,
      user_id: "",
      recipe_size_id: s.id,
      ingredient_id: r.ingredient_id,
      quantity: Number(r.quantity),
      unit: r.unit,
      ingredient: {
        id: r.ingredients.id,
        user_id: "",
        name: r.ingredients.name,
        unit: r.ingredients.unit,
        price_per_unit: Number(r.ingredients.price_per_unit),
        stock_quantity: 0,
        notes: null,
        created_at: "",
      },
    })),
  };
}
