"use client";

import { useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Target } from "lucide-react";
import {
  breakEven,
  ingredientLineCost,
  lossFactor,
  pctFromCostPrice,
  profitModeLabel,
  recipeSizeCost,
} from "@/lib/pricing";
import { formatBRL, unitLabel } from "@/lib/format";
import type { IngredientUnit, ProfitCalcMode } from "@/types/database";

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
    ingredients: { id: string; name: string; unit: string; price_per_unit: number; loss_pct?: number | null };
  }>;
}

export function PricingCalculator({
  sizes,
  profitMode,
  monthlyFixedCost,
}: {
  sizes: SizeRow[];
  profitMode: ProfitCalcMode;
  monthlyFixedCost: number;
}) {
  const [sizeId, setSizeId] = useState(sizes[0]?.id ?? "");
  // Default 100% markup ≈ 50% margem (dobra o custo).
  const [pct, setPct] = useState(profitMode === "markup" ? "100" : "50");

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
          loss_pct: Number(r.ingredients.loss_pct ?? 0),
          stock_quantity: 0,
          notes: null,
          created_at: "",
        },
      })),
    });
  }, [selected]);

  const pctNumber = parseFloat(pct.replace(",", ".")) || 0;
  const fixed = selected?.fixed_price != null ? Number(selected.fixed_price) : null;

  const result = breakEven({
    ingredientCost: cost,
    pct: pctNumber,
    mode: profitMode,
    monthlyFixedCost,
  });

  // Avaliação do preço fixo cadastrado: markup atual e quantas unidades nele.
  const fixedCurrentPct =
    fixed != null && fixed > 0 ? pctFromCostPrice(cost, fixed, profitMode) : null;
  const fixedContribution = fixed != null ? fixed - cost : null;
  const fixedBreakEven =
    fixedContribution != null && fixedContribution > 0 && monthlyFixedCost > 0
      ? Math.ceil(monthlyFixedCost / fixedContribution)
      : null;

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
                  const ingredientForCost = {
                    id: ing.id,
                    user_id: "",
                    name: ing.name,
                    unit: ing.unit as IngredientUnit,
                    price_per_unit: ing.price_per_unit,
                    loss_pct: Number(ing.loss_pct ?? 0),
                    stock_quantity: 0,
                    notes: null,
                    created_at: "",
                  };
                  const adjustedCost = ingredientLineCost(
                    ingredientForCost,
                    r.quantity,
                    r.unit as IngredientUnit
                  );
                  const factor = lossFactor(ingredientForCost);
                  const baseCost = factor !== 0 ? adjustedCost / factor : adjustedCost;
                  const loss = Number(ing.loss_pct ?? 0);
                  const lossAbs = Math.abs(loss);
                  const lossPctStr = lossAbs.toFixed(lossAbs % 1 === 0 ? 0 : 1);
                  return (
                    <li key={r.id} className="flex justify-between gap-2">
                      <span className="flex items-center gap-1.5">
                        <span>
                          {ing.name} — {r.quantity} {unitLabel(r.unit as IngredientUnit)}
                        </span>
                        {loss > 0 && (
                          <Popover>
                            <PopoverTrigger asChild>
                              <button
                                type="button"
                                className="inline-flex cursor-help items-center rounded-full bg-amber-100 px-1.5 py-0.5 text-[10px] font-medium text-amber-900 hover:bg-amber-200"
                              >
                                📉 Perda
                              </button>
                            </PopoverTrigger>
                            <PopoverContent className="w-64 text-xs">
                              <div className="mb-1 font-medium text-amber-900">
                                Perde {lossPctStr}% no preparo
                              </div>
                              <p className="text-muted-foreground">
                                Como rende menos depois de pronto, o custo de{" "}
                                <strong>
                                  {r.quantity} {unitLabel(r.unit as IngredientUnit)}
                                </strong>{" "}
                                sobe de <strong>{formatBRL(baseCost)}</strong> para{" "}
                                <strong>{formatBRL(adjustedCost)}</strong>.
                              </p>
                            </PopoverContent>
                          </Popover>
                        )}
                        {loss < 0 && (
                          <Popover>
                            <PopoverTrigger asChild>
                              <button
                                type="button"
                                className="inline-flex cursor-help items-center rounded-full bg-emerald-100 px-1.5 py-0.5 text-[10px] font-medium text-emerald-900 hover:bg-emerald-200"
                              >
                                📈 Ganho
                              </button>
                            </PopoverTrigger>
                            <PopoverContent className="w-64 text-xs">
                              <div className="mb-1 font-medium text-emerald-900">
                                Rende {lossPctStr}% no preparo
                              </div>
                              <p className="text-muted-foreground">
                                Como rende mais depois de pronto, o custo de{" "}
                                <strong>
                                  {r.quantity} {unitLabel(r.unit as IngredientUnit)}
                                </strong>{" "}
                                cai de <strong>{formatBRL(baseCost)}</strong> para{" "}
                                <strong>{formatBRL(adjustedCost)}</strong>.
                              </p>
                            </PopoverContent>
                          </Popover>
                        )}
                      </span>
                      <span className="tabular-nums">{formatBRL(adjustedCost)}</span>
                    </li>
                  );
                })}
              </ul>
            </CardContent>
          </Card>

          {/* Cards principais: custo, preço sugerido e lucro por unidade */}
          <div className="grid gap-3 sm:grid-cols-3">
            <Card>
              <CardContent className="p-4">
                <div className="text-xs text-muted-foreground">Custo dos ingredientes</div>
                <div className="text-xl font-bold">{formatBRL(cost)}</div>
                <div className="mt-1 text-[11px] text-muted-foreground">por unidade</div>
              </CardContent>
            </Card>
            <Card className="border-primary/40 bg-primary/5">
              <CardContent className="p-4">
                <div className="text-xs text-muted-foreground">
                  Preço sugerido ({pct}% {modeLabel.toLowerCase()})
                </div>
                <div className="text-xl font-bold text-primary">
                  {formatBRL(result.suggestedPrice)}
                </div>
                <div className="mt-1 text-xs text-muted-foreground">
                  Lucro por unidade:{" "}
                  <span className="font-medium text-emerald-700">
                    {formatBRL(result.contributionPerUnit)}
                  </span>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="text-xs text-muted-foreground">Preço fixo cadastrado</div>
                <div className="text-xl font-bold">
                  {fixed != null ? formatBRL(fixed) : "—"}
                </div>
                {fixedCurrentPct != null && (
                  <Badge variant="secondary" className="mt-1">
                    {modeLabel} atual: {fixedCurrentPct.toFixed(1)}%
                  </Badge>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Ponto de equilíbrio: quantas unidades cobrem o custo mensal */}
          <Card className="border-primary/40">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Target className="h-5 w-5 text-primary" /> Quantas vender pra cobrir o mês
              </CardTitle>
            </CardHeader>
            <CardContent>
              {monthlyFixedCost <= 0 ? (
                <p className="text-sm text-muted-foreground">
                  Preencha o <strong>custo mensal do negócio</strong> acima pra ver quantas
                  unidades você precisa vender pra ficar no zero a zero.
                </p>
              ) : result.unitsToBreakEven == null ? (
                <p className="text-sm text-destructive">
                  Com esse {modeLabel.toLowerCase()} o lucro por unidade é{" "}
                  {formatBRL(result.contributionPerUnit)} — não dá pra cobrir o custo mensal.
                  Aumente o {modeLabel.toLowerCase()} pra que cada venda deixe lucro.
                </p>
              ) : (
                <div className="space-y-3">
                  <p className="text-sm text-muted-foreground">
                    Seu custo mensal é{" "}
                    <strong className="text-foreground">{formatBRL(monthlyFixedCost)}</strong>. Cada{" "}
                    <strong className="text-foreground">{selected.recipes.name} · {selected.size_label}</strong>{" "}
                    vendida a {formatBRL(result.suggestedPrice)} deixa{" "}
                    <strong className="text-emerald-700">{formatBRL(result.contributionPerUnit)}</strong>{" "}
                    de lucro.
                  </p>
                  <div className="rounded-lg bg-primary/5 p-4 text-center">
                    <div className="text-4xl font-bold tabular-nums text-primary">
                      {result.unitsToBreakEven}
                    </div>
                    <div className="mt-1 text-sm text-muted-foreground">
                      unidades por mês pra ficar no zero a zero
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {formatBRL(monthlyFixedCost)} ÷ {formatBRL(result.contributionPerUnit)} de lucro
                    por unidade. A partir da {result.unitsToBreakEven}ª venda, o lucro é todo seu.
                  </p>
                  {fixedBreakEven != null && fixedBreakEven !== result.unitsToBreakEven && (
                    <p className="text-xs text-muted-foreground">
                      No preço fixo cadastrado ({formatBRL(fixed!)}), seriam{" "}
                      <strong>{fixedBreakEven}</strong> unidades.
                    </p>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
