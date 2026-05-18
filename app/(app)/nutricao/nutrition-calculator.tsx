"use client";

import { useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";

interface RecipeOption {
  id: string;
  name: string;
  recipe_sizes: Array<{ id: string; size_label: string; fixed_price: number | null }>;
}

// Tabela de % do peso corporal recomendada para comida natural
// (referência típica para cães adultos saudáveis — varia conforme idade/atividade)
const PROFILES = [
  { key: "filhote", label: "Filhote / muito ativo", min: 4.0, max: 6.0 },
  { key: "adulto-ativo", label: "Adulto ativo", min: 3.0, max: 4.0 },
  { key: "adulto", label: "Adulto padrão", min: 2.5, max: 3.0 },
  { key: "senior", label: "Sênior / sedentário", min: 2.0, max: 2.5 },
];

function fmtGrams(g: number): string {
  if (g >= 1000) return `${(g / 1000).toFixed(2).replace(".", ",")} kg`;
  return `${Math.round(g)} g`;
}

export function NutritionCalculator({ recipes }: { recipes: RecipeOption[] }) {
  const [weight, setWeight] = useState("10");
  const [profileKey, setProfileKey] = useState("adulto");
  const [recipeId, setRecipeId] = useState("");

  const w = parseFloat(weight.replace(",", ".")) || 0;
  const profile = PROFILES.find((p) => p.key === profileKey) ?? PROFILES[2];

  const dailyMin = (w * profile.min * 1000) / 100; // gramas/dia mínimo
  const dailyMax = (w * profile.max * 1000) / 100;
  const dailyAvg = (dailyMin + dailyMax) / 2;

  const weeklyAvg = dailyAvg * 7;
  const biweeklyAvg = dailyAvg * 14;
  const monthlyAvg = dailyAvg * 28;

  // Sugestão de combinação de tamanhos pra cobrir o dia
  const selectedRecipe = recipes.find((r) => r.id === recipeId) ?? null;

  // Extrai pesos dos rótulos quando possível (ex.: "Médio I - 450g")
  const sizesWithGrams = useMemo(() => {
    if (!selectedRecipe) return [];
    return selectedRecipe.recipe_sizes
      .map((s) => {
        const match = s.size_label.match(/(\d+)\s*g/i);
        const grams = match ? parseInt(match[1], 10) : null;
        return { ...s, grams };
      })
      .filter((s) => s.grams != null)
      .sort((a, b) => (a.grams ?? 0) - (b.grams ?? 0));
  }, [selectedRecipe]);

  // Acha o melhor tamanho único do cardápio que cobre a refeição diária
  const closestSize = useMemo(() => {
    if (sizesWithGrams.length === 0) return null;
    // Tamanho com gramas >= dailyAvg, senão o maior
    const fit = sizesWithGrams.find((s) => (s.grams ?? 0) >= dailyAvg);
    return fit ?? sizesWithGrams[sizesWithGrams.length - 1];
  }, [sizesWithGrams, dailyAvg]);

  // Quantas unidades do MAIOR tamanho seriam necessárias por dia
  const maxSize = sizesWithGrams[sizesWithGrams.length - 1] ?? null;
  const dailyUnitsOfMax = maxSize?.grams ? dailyAvg / maxSize.grams : null;

  return (
    <div className="space-y-4">
      {/* INPUTS */}
      <Card>
        <CardContent className="grid gap-3 p-4 sm:grid-cols-2 lg:grid-cols-3">
          <div>
            <Label>Peso do animal (kg)</Label>
            <Input
              inputMode="decimal"
              value={weight}
              onChange={(e) => setWeight(e.target.value)}
              placeholder="Ex: 12.5"
            />
          </div>
          <div>
            <Label>Perfil</Label>
            <Select value={profileKey} onValueChange={setProfileKey}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {PROFILES.map((p) => (
                  <SelectItem key={p.key} value={p.key}>
                    {p.label} ({p.min}–{p.max}%)
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Receita (opcional)</Label>
            <Select value={recipeId} onValueChange={setRecipeId}>
              <SelectTrigger>
                <SelectValue placeholder="Para comparar com tamanhos" />
              </SelectTrigger>
              <SelectContent>
                {recipes.map((r) => (
                  <SelectItem key={r.id} value={r.id}>
                    {r.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* RESULTADO PRINCIPAL */}
      <Card className="border-primary/40 bg-primary/5">
        <CardContent className="p-5">
          <div className="text-xs uppercase tracking-wide text-muted-foreground">
            Recomendação diária
          </div>
          <div className="mt-1 flex items-baseline gap-2">
            <div className="text-3xl font-bold tabular-nums text-primary">
              {fmtGrams(dailyAvg)}
            </div>
            <div className="text-sm text-muted-foreground">
              por dia (faixa: {fmtGrams(dailyMin)} – {fmtGrams(dailyMax)})
            </div>
          </div>
          <p className="mt-2 text-xs text-muted-foreground">
            Baseado em {profile.min}–{profile.max}% do peso corporal — para {profile.label.toLowerCase()}.
          </p>
        </CardContent>
      </Card>

      {/* TOTAIS POR PLANO */}
      <div className="grid gap-3 sm:grid-cols-3">
        <PlanCard label="Semanal (7 dias)" total={weeklyAvg} />
        <PlanCard label="Quinzenal (14 dias)" total={biweeklyAvg} />
        <PlanCard label="Mensal (28 dias)" total={monthlyAvg} />
      </div>

      {/* COMPARAÇÃO COM TAMANHOS */}
      {selectedRecipe && sizesWithGrams.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">
              Comparando com {selectedRecipe.name}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="rounded-md bg-muted/40 p-3 text-sm">
              <div className="flex items-center justify-between">
                <span>Maior tamanho disponível:</span>
                <Badge variant="secondary">
                  {maxSize?.size_label} ({fmtGrams(maxSize?.grams ?? 0)})
                </Badge>
              </div>
              {dailyUnitsOfMax != null && (
                <div className="mt-2 flex items-center justify-between">
                  <span>Unidades por dia necessárias:</span>
                  <span className="font-bold tabular-nums text-primary">
                    {dailyUnitsOfMax.toFixed(2)} unid.
                  </span>
                </div>
              )}
              {closestSize && (closestSize.grams ?? 0) >= dailyAvg ? (
                <p className="mt-2 text-xs text-emerald-700">
                  ✓ O tamanho <strong>{closestSize.size_label}</strong> já cobre a refeição
                  diária ({fmtGrams(closestSize.grams ?? 0)} ≥ {fmtGrams(dailyAvg)}).
                </p>
              ) : (
                <p className="mt-2 text-xs text-amber-700">
                  ⚠️ Nenhum tamanho padrão cobre a refeição diária sozinho. Considere:
                  <br />
                  <strong>
                    {dailyUnitsOfMax ? dailyUnitsOfMax.toFixed(2) : "?"}× {maxSize?.size_label}
                  </strong>{" "}
                  por dia, ou criar um tamanho customizado.
                </p>
              )}
            </div>

            <div className="text-xs text-muted-foreground">
              <strong>Tabela completa de tamanhos:</strong>
            </div>
            <div className="space-y-1.5">
              {sizesWithGrams.map((s) => {
                const portionsForDay = dailyAvg / (s.grams ?? 1);
                const portionsForMonth = monthlyAvg / (s.grams ?? 1);
                return (
                  <div
                    key={s.id}
                    className="flex items-center justify-between rounded-md border bg-background px-3 py-2 text-sm"
                  >
                    <div>
                      <div className="font-medium">{s.size_label}</div>
                      <div className="text-xs text-muted-foreground">
                        {fmtGrams(s.grams ?? 0)} cada
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="tabular-nums">
                        {portionsForDay.toFixed(2)} / dia
                      </div>
                      <div className="text-xs text-muted-foreground tabular-nums">
                        {portionsForMonth.toFixed(1)} no mês
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      <p className="text-center text-xs text-muted-foreground">
        💡 Estas são estimativas baseadas em % do peso corporal. Sempre confirme com o veterinário.
      </p>
    </div>
  );
}

function PlanCard({ label, total }: { label: string; total: number }) {
  return (
    <div className="rounded-lg border bg-card p-3">
      <div className="text-xs uppercase tracking-wide text-muted-foreground">{label}</div>
      <div className="mt-1 text-xl font-bold tabular-nums">{fmtGrams(total)}</div>
    </div>
  );
}
