"use client";

import { useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  fullPricing,
  pctFromCostPrice,
  priceFromCostPct,
  profitModeLabel,
  recipeSizeCost,
} from "@/lib/pricing";
import { formatBRL, unitLabel } from "@/lib/format";
import type { BusinessSettings, ProfitCalcMode } from "@/types/database";

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
  businessSettings,
  fixedCostPerUnit,
}: {
  sizes: SizeRow[];
  profitMode: ProfitCalcMode;
  businessSettings: BusinessSettings;
  fixedCostPerUnit: number;
}) {
  const [sizeId, setSizeId] = useState(sizes[0]?.id ?? "");
  // Default 60% margem ≈ 150% markup. Mantém um número confortável por modo.
  const [pct, setPct] = useState(profitMode === "markup" ? "100" : "60");
  // Toggle pra incluir/excluir os custos fixos no cálculo
  const [includeFixed, setIncludeFixed] = useState(fixedCostPerUnit > 0);

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
  const fixed = selected?.fixed_price != null ? Number(selected.fixed_price) : null;
  const effectiveFixedPerUnit = includeFixed ? fixedCostPerUnit : 0;
  const breakdown = fullPricing({
    variableCost: cost,
    fixedCostPerUnit: effectiveFixedPerUnit,
    pct: pctNumber,
    mode: profitMode,
    reservePct: includeFixed ? businessSettings.reserve_pct : 0,
  });
  // Sem custo fixo (modo legado): preço só sobre custo de ingredientes
  const simpleSuggested = priceFromCostPct(cost, pctNumber, profitMode);
  // Avaliação do preço fixo cadastrado vs. o cálculo COMPLETO
  const fixedCurrentPct =
    fixed != null && fixed > 0 ? pctFromCostPrice(cost, fixed, profitMode) : null;
  const fixedNetProfit = fixed != null ? fixed - breakdown.totalCost : null;

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

          {/* Toggle pra incluir custos fixos */}
          {fixedCostPerUnit > 0 && (
            <label className="flex cursor-pointer items-start gap-3 rounded-lg border bg-muted/30 p-3">
              <input
                type="checkbox"
                checked={includeFixed}
                onChange={(e) => setIncludeFixed(e.target.checked)}
                className="mt-0.5 h-4 w-4 shrink-0"
              />
              <div className="flex-1">
                <div className="text-sm font-medium">
                  Incluir custos fixos do negócio ({formatBRL(fixedCostPerUnit)}/un.) + reserva (
                  {businessSettings.reserve_pct}%)
                </div>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  Quando ligado, o preço sugerido cobre matéria-prima + aluguel/energia/marketing/MEI
                  rateados, e ainda separa {businessSettings.reserve_pct}% do lucro para fundo de
                  reserva.
                </p>
              </div>
            </label>
          )}

          {/* Cards principais */}
          <div className="grid gap-3 sm:grid-cols-3">
            <Card>
              <CardContent className="p-4">
                <div className="text-xs text-muted-foreground">Custo total por unidade</div>
                <div className="text-xl font-bold">{formatBRL(breakdown.totalCost)}</div>
                {includeFixed && fixedCostPerUnit > 0 && (
                  <div className="mt-1 text-[11px] text-muted-foreground leading-tight">
                    {formatBRL(cost)} ingredientes
                    <br />+ {formatBRL(fixedCostPerUnit)} overhead
                  </div>
                )}
              </CardContent>
            </Card>
            <Card className="border-primary/40 bg-primary/5">
              <CardContent className="p-4">
                <div className="text-xs text-muted-foreground">
                  Preço sugerido ({pct}% {modeLabel.toLowerCase()})
                </div>
                <div className="text-xl font-bold text-primary">
                  {formatBRL(includeFixed ? breakdown.suggestedPrice : simpleSuggested)}
                </div>
                <div className="mt-1 text-xs text-muted-foreground">
                  Lucro líquido:{" "}
                  <span className="font-medium text-emerald-700">
                    {formatBRL(includeFixed ? breakdown.netProfit : simpleSuggested - cost)}
                  </span>
                  {includeFixed && breakdown.suggestedPrice > 0 && (
                    <> ({breakdown.netMarginPct.toFixed(1)}%)</>
                  )}
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
                {fixed != null && includeFixed && fixedNetProfit != null && (
                  <div className="mt-1 text-[11px] text-muted-foreground">
                    Sobra após custo total:{" "}
                    <span
                      className={
                        fixedNetProfit >= 0 ? "font-medium text-emerald-700" : "font-medium text-destructive"
                      }
                    >
                      {formatBRL(fixedNetProfit)}
                    </span>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Breakdown detalhado (apenas quando incluindo custos fixos) */}
          {includeFixed && breakdown.suggestedPrice > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Detalhamento do preço sugerido</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-1.5 text-sm">
                  <BreakdownRow label="Custo dos ingredientes" value={cost} tone="muted" />
                  <BreakdownRow
                    label="Overhead (aluguel + energia + marketing + MEI)"
                    value={fixedCostPerUnit}
                    tone="muted"
                  />
                  <Separator className="my-1.5" />
                  <BreakdownRow
                    label="Custo total por panelinha"
                    value={breakdown.totalCost}
                    bold
                  />
                  <BreakdownRow label="Lucro bruto" value={breakdown.grossProfit} tone="success" />
                  <BreakdownRow
                    label={`Fundo de reserva (${businessSettings.reserve_pct}% do lucro)`}
                    value={-breakdown.reserveAmount}
                    tone="warning"
                    sign
                  />
                  <Separator className="my-1.5" />
                  <BreakdownRow
                    label="Preço sugerido (cobre tudo + lucro líquido)"
                    value={breakdown.suggestedPrice}
                    tone="primary"
                    bold
                  />
                  <BreakdownRow
                    label="Lucro líquido no seu bolso"
                    value={breakdown.netProfit}
                    tone="success"
                    bold
                  />
                </div>
              </CardContent>
            </Card>
          )}
        </>
      )}
    </div>
  );
}

function BreakdownRow({
  label,
  value,
  tone,
  bold,
  sign,
}: {
  label: string;
  value: number;
  tone?: "muted" | "success" | "warning" | "primary";
  bold?: boolean;
  /** Mostra o sinal explicitamente (− para reservas) */
  sign?: boolean;
}) {
  const toneClass =
    tone === "muted"
      ? "text-muted-foreground"
      : tone === "success"
      ? "text-emerald-700"
      : tone === "warning"
      ? "text-amber-700"
      : tone === "primary"
      ? "text-primary"
      : "";
  const display = sign && value < 0 ? `−${formatBRL(Math.abs(value))}` : formatBRL(value);
  return (
    <div className={`flex items-center justify-between ${toneClass}`}>
      <span className={bold ? "font-semibold" : ""}>{label}</span>
      <span className={`tabular-nums ${bold ? "font-bold" : ""}`}>{display}</span>
    </div>
  );
}
