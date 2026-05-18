"use client";

import { useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import {
  pctFromCostPrice,
  priceFromCostPct,
  profitModeLabel,
  recipeSizeCost,
} from "@/lib/pricing";
import { formatBRL, unitLabel } from "@/lib/format";
import type { ProfitCalcMode } from "@/types/database";

interface SizeRow {
  id: string;
  size_label: string;
  fixed_price: number | null;
  recipe_id: string;
  recipes: { name: string };
  recipe_size_ingredients: Array<{
    id: string;
    quantity: number;
    unit: string;
    ingredient_id: string;
    ingredients: { id: string; name: string; unit: string; price_per_unit: number };
  }>;
}

export function PricingCalculator({
  sizes,
  profitMode,
}: {
  sizes: SizeRow[];
  profitMode: ProfitCalcMode;
}) {
  const [sizeId, setSizeId] = useState(sizes[0]?.id ?? "");
  // Default 60% margem ≈ 150% markup. Mantém um número confortável por modo.
  const [pct, setPct] = useState(profitMode === "markup" ? "100" : "60");

  const selected = sizes.find((s) => s.id === sizeId) ?? null;
  const modeLabel = profitModeLabel(profitMode);

  const cost = useMemo(() => {
    if (!selected) return 0;
    return recipeSizeCost({
      id: selected.id,
      user_id: "",
      recipe_id: selected.recipe_id,
      size_label: selected.size_label,
      fixed_price: selected.fixed_price,
      notes: null,
      ingredients: selected.recipe_size_ingredients.map((r) => ({
        id: r.id,
        user_id: "",
        recipe_size_id: selected.id,
        ingredient_id: r.ingredient_id,
        quantity: r.quantity,
        unit: r.unit as never,
        ingredient: {
          id: r.ingredients.id,
          user_id: "",
          name: r.ingredients.name,
          unit: r.ingredients.unit as never,
          price_per_unit: r.ingredients.price_per_unit,
          stock_quantity: 0,
          notes: null,
          created_at: "",
        },
      })),
    });
  }, [selected]);

  const pctNumber = parseFloat(pct.replace(",", ".")) || 0;
  const suggested = priceFromCostPct(cost, pctNumber, profitMode);
  const fixed = selected?.fixed_price != null ? Number(selected.fixed_price) : null;
  const currentPct =
    fixed != null && fixed > 0 ? pctFromCostPrice(cost, fixed, profitMode) : null;

  return (
    <div className="space-y-4">
      <Card>
        <CardContent className="grid gap-3 p-4 sm:grid-cols-2">
          <div>
            <Label>Receita e tamanho</Label>
            <Select value={sizeId} onValueChange={setSizeId}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {sizes.map((s) => (
                  <SelectItem key={s.id} value={s.id}>
                    {s.recipes.name} · {s.size_label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>{modeLabel} desejado (%)</Label>
            <Input
              inputMode="decimal"
              value={pct}
              onChange={(e) => setPct(e.target.value)}
            />
            <p className="mt-1 text-xs text-muted-foreground">
              {profitMode === "markup"
                ? "Aplicado sobre o custo (preço = custo × (1 + %))"
                : "Aplicado sobre o preço final (preço = custo ÷ (1 − %))"}
            </p>
          </div>
        </CardContent>
      </Card>

      {selected && (
        <>
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Composição</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-1 text-sm">
                {selected.recipe_size_ingredients.map((r) => {
                  const ing = r.ingredients;
                  const qtyInIngUnit =
                    r.unit === ing.unit
                      ? r.quantity
                      : (() => {
                          if (r.unit === "kg" && ing.unit === "g") return r.quantity * 1000;
                          if (r.unit === "g" && ing.unit === "kg") return r.quantity / 1000;
                          if (r.unit === "l" && ing.unit === "ml") return r.quantity * 1000;
                          if (r.unit === "ml" && ing.unit === "l") return r.quantity / 1000;
                          return r.quantity;
                        })();
                  const c = qtyInIngUnit * ing.price_per_unit;
                  return (
                    <li key={r.id} className="flex justify-between">
                      <span>
                        {ing.name} — {r.quantity} {unitLabel(r.unit)}
                      </span>
                      <span className="tabular-nums">{formatBRL(c)}</span>
                    </li>
                  );
                })}
              </ul>
            </CardContent>
          </Card>

          <div className="grid gap-3 sm:grid-cols-3">
            <Card>
              <CardContent className="p-4">
                <div className="text-xs text-muted-foreground">Custo de fabricação</div>
                <div className="text-xl font-bold">{formatBRL(cost)}</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="text-xs text-muted-foreground">
                  Preço sugerido ({pct}% {modeLabel.toLowerCase()})
                </div>
                <div className="text-xl font-bold text-primary">{formatBRL(suggested)}</div>
                <div className="mt-1 text-xs text-muted-foreground">
                  Lucro: {formatBRL(suggested - cost)}
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="text-xs text-muted-foreground">Preço fixo cadastrado</div>
                <div className="text-xl font-bold">
                  {fixed != null ? formatBRL(fixed) : "—"}
                </div>
                {currentPct != null && (
                  <Badge variant="secondary" className="mt-1">
                    {modeLabel} atual: {currentPct.toFixed(1)}%
                  </Badge>
                )}
              </CardContent>
            </Card>
          </div>
        </>
      )}
    </div>
  );
}
