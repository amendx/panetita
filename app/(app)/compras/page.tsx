import Link from "next/link";
import { addDays, startOfWeek, endOfWeek } from "date-fns";
import { ShoppingCart } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/layout/page-header";
import { Card, CardContent } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatBRL, formatDate, toISODate, unitLabel } from "@/lib/format";
import { aggregateIngredients, type DeliveryAggregateInput } from "@/lib/shopping-list";

export const dynamic = "force-dynamic";

export default async function ComprasPage({
  searchParams,
}: {
  searchParams: Promise<{ period?: string }>;
}) {
  const { period = "week" } = await searchParams;
  const today = new Date();

  let start: Date;
  let end: Date;
  if (period === "week") {
    start = startOfWeek(today, { weekStartsOn: 1 });
    end = endOfWeek(today, { weekStartsOn: 1 });
  } else if (period === "next7") {
    start = today;
    end = addDays(today, 7);
  } else if (period === "next14") {
    start = today;
    end = addDays(today, 14);
  } else {
    start = today;
    end = addDays(today, 30);
  }

  const supabase = await createClient();
  const { data: deliveries } = await supabase
    .from("deliveries")
    .select(
      `id, scheduled_date,
       delivery_items(quantity, order_items(
         recipe_sizes(id, size_label, recipe_id, recipes(name),
         recipe_size_ingredients(id, quantity, unit, ingredient_id, ingredients(id, name, unit, price_per_unit))),
         combos(id, combo_items(quantity, recipe_sizes(id, size_label, recipe_id, recipes(name),
           recipe_size_ingredients(id, quantity, unit, ingredient_id, ingredients(id, name, unit, price_per_unit)))))
       ))`
    )
    .gte("scheduled_date", toISODate(start))
    .lte("scheduled_date", toISODate(end))
    .neq("status", "cancelled");

  /* eslint-disable @typescript-eslint/no-explicit-any */
  const aggregateInputs: DeliveryAggregateInput[] = [];
  for (const d of (deliveries ?? []) as any[]) {
    for (const di of d.delivery_items ?? []) {
      const oi = di.order_items;
      if (oi?.recipe_sizes) {
        aggregateInputs.push({
          recipe_size: convertSize(oi.recipe_sizes),
          quantity: Number(di.quantity),
        });
      }
      if (oi?.combos) {
        for (const ci of oi.combos.combo_items ?? []) {
          aggregateInputs.push({
            recipe_size: convertSize(ci.recipe_sizes),
            quantity: Number(di.quantity) * Number(ci.quantity),
          });
        }
      }
    }
  }

  const lines = aggregateIngredients(aggregateInputs);

  // Buscar estoque dos ingredientes envolvidos
  const ingIds = lines.map((l) => l.ingredient.id);
  const { data: stockRows } = ingIds.length
    ? await supabase.from("ingredients").select("id, stock_quantity").in("id", ingIds)
    : { data: [] };
  /* eslint-disable @typescript-eslint/no-explicit-any */
  const stockMap = new Map<string, number>(
    (stockRows ?? []).map((r: any) => [r.id, Number(r.stock_quantity ?? 0)])
  );

  // Calcular o que comprar: max(necessario - estoque, 0)
  const enriched = lines.map((l) => {
    const stock = stockMap.get(l.ingredient.id) ?? 0;
    const toBuy = Math.max(l.totalQuantity - stock, 0);
    const buyCost = toBuy * (Number(l.ingredient.price_per_unit) || 0);
    return { ...l, stock, toBuy, buyCost };
  });

  const totalCostToBuy = enriched.reduce((a, l) => a + l.buyCost, 0);
  const totalNeed = enriched.reduce((a, l) => a + l.totalCost, 0);

  return (
    <div className="mx-auto max-w-4xl">
      <PageHeader
        title="Lista de Compras"
        description={`Período: ${formatDate(start)} a ${formatDate(end)}`}
      />

      <div className="mb-4 flex flex-wrap gap-2">
        <FilterLink current={period} value="week" label="Esta semana" />
        <FilterLink current={period} value="next7" label="Próximos 7 dias" />
        <FilterLink current={period} value="next14" label="Próximos 14 dias" />
        <FilterLink current={period} value="next30" label="Próximos 30 dias" />
      </div>

      {enriched.length === 0 ? (
        <Card>
          <CardContent className="p-8 text-center text-muted-foreground">
            <ShoppingCart className="mx-auto mb-3 h-10 w-10 opacity-50" />
            Sem entregas neste período.
          </CardContent>
        </Card>
      ) : (
        <>
          <div className="mb-3 rounded-md border border-primary/30 bg-primary/5 p-3 text-sm">
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Custo total se você não tivesse estoque</span>
              <span className="font-medium tabular-nums">{formatBRL(totalNeed)}</span>
            </div>
            <div className="mt-1 flex items-center justify-between text-base">
              <span className="font-semibold">A comprar agora (descontando estoque)</span>
              <span className="font-bold tabular-nums text-primary">
                {formatBRL(totalCostToBuy)}
              </span>
            </div>
          </div>
          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Ingrediente</TableHead>
                    <TableHead className="text-right">Precisa</TableHead>
                    <TableHead className="text-right">Estoque</TableHead>
                    <TableHead className="text-right">Comprar</TableHead>
                    <TableHead className="text-right">Custo da compra</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {enriched.map((l) => (
                    <TableRow key={l.ingredient.id}>
                      <TableCell className="font-medium">{l.ingredient.name}</TableCell>
                      <TableCell className="text-right tabular-nums">
                        {l.totalQuantity.toFixed(2)} {unitLabel(l.unit)}
                      </TableCell>
                      <TableCell className="text-right tabular-nums text-muted-foreground">
                        {l.stock.toFixed(2)} {unitLabel(l.unit)}
                      </TableCell>
                      <TableCell className="text-right">
                        {l.toBuy > 0 ? (
                          <span className="font-semibold tabular-nums text-destructive">
                            {l.toBuy.toFixed(2)} {unitLabel(l.unit)}
                          </span>
                        ) : (
                          <span className="text-xs text-emerald-700">tem estoque</span>
                        )}
                      </TableCell>
                      <TableCell className="text-right tabular-nums">
                        {l.toBuy > 0 ? formatBRL(l.buyCost) : "—"}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
                <TableFooter>
                  <TableRow>
                    <TableCell colSpan={4} className="font-semibold">
                      Total a comprar
                    </TableCell>
                    <TableCell className="text-right font-bold tabular-nums">
                      {formatBRL(totalCostToBuy)}
                    </TableCell>
                  </TableRow>
                </TableFooter>
              </Table>
            </CardContent>
          </Card>
        </>
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
      quantity: r.quantity,
      unit: r.unit,
      ingredient: {
        id: r.ingredients.id,
        user_id: "",
        name: r.ingredients.name,
        unit: r.ingredients.unit,
        price_per_unit: r.ingredients.price_per_unit,
        stock_quantity: 0,
        notes: null,
        created_at: "",
      },
    })),
  };
}

function FilterLink({
  current,
  value,
  label,
}: {
  current: string;
  value: string;
  label: string;
}) {
  const active = current === value;
  return (
    <Link
      href={`?period=${value}`}
      className={`rounded-full px-3 py-1.5 text-sm transition-colors ${
        active ? "bg-primary text-primary-foreground" : "bg-muted text-foreground hover:bg-muted/80"
      }`}
    >
      {label}
    </Link>
  );
}
