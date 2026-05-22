"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Eye, MoreVertical, Pencil, Search, Trash2, X } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useToast } from "@/components/ui/use-toast";
import { isRedirectError } from "@/lib/is-redirect-error";
import { formatBRL } from "@/lib/format";
import {
  pctFromCostPrice,
  profitModeLabel,
  recipeSizeCost,
  type RecipeSizeWithIngredients,
} from "@/lib/pricing";
import type { ProfitCalcMode } from "@/types/database";
import { deleteRecipe } from "./actions";

export interface RecipeRow {
  id: string;
  name: string;
  description: string | null;
  pet_id: string | null;
  pets: { id: string; name: string; customers: { name: string } | null } | null;
  recipe_sizes: Array<{
    id: string;
    size_label: string;
    fixed_price: number | null;
    recipe_size_ingredients: Array<{
      id: string;
      quantity: number;
      unit: string;
      ingredient_id: string;
      ingredients: {
        id: string;
        name: string;
        unit: string;
        price_per_unit: number;
        loss_pct?: number | null;
      };
    }>;
    combo_items?: Array<{
      combo_id: string;
      combos: { id: string; name: string } | null;
    }>;
  }>;
}

function sizeWithIngredients(s: RecipeRow["recipe_sizes"][number]): RecipeSizeWithIngredients {
  return {
    id: s.id,
    user_id: "",
    recipe_id: "",
    size_label: s.size_label,
    fixed_price: s.fixed_price,
    notes: null,
    ingredients: s.recipe_size_ingredients.map((r) => ({
      id: r.id,
      user_id: "",
      recipe_size_id: s.id,
      ingredient_id: r.ingredient_id,
      quantity: r.quantity,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      unit: r.unit as any,
      ingredient: {
        id: r.ingredients.id,
        user_id: "",
        name: r.ingredients.name,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        unit: r.ingredients.unit as any,
        price_per_unit: r.ingredients.price_per_unit,
        loss_pct: Number(r.ingredients.loss_pct ?? 0),
        stock_quantity: 0,
        notes: null,
        created_at: "",
      },
    })),
  };
}

function rangeBRL(values: number[]): string {
  if (values.length === 0) return "—";
  const min = Math.min(...values);
  const max = Math.max(...values);
  if (min === max) return formatBRL(min);
  return `${formatBRL(min)} – ${formatBRL(max)}`;
}

function avgPct(sizes: RecipeRow["recipe_sizes"], mode: ProfitCalcMode): number | null {
  const withPrice = sizes.filter((s) => s.fixed_price != null && Number(s.fixed_price) > 0);
  if (withPrice.length === 0) return null;
  const pcts = withPrice.map((s) =>
    pctFromCostPrice(recipeSizeCost(sizeWithIngredients(s)), Number(s.fixed_price), mode)
  );
  return pcts.reduce((a, b) => a + b, 0) / pcts.length;
}

type RecipeFilter = "all" | "custom" | "generic";

export function RecipesTable({
  recipes,
  profitMode,
}: {
  recipes: RecipeRow[];
  profitMode: ProfitCalcMode;
}) {
  const router = useRouter();
  const { toast } = useToast();
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<RecipeFilter>("all");
  const modeLabel = profitModeLabel(profitMode);
  // Markup pode passar de 100%; margem fica entre 0 e 100. Ajusta os limiares.
  const thresholds = profitMode === "markup" ? { good: 100, ok: 50 } : { good: 50, ok: 30 };

  const counts = useMemo(
    () => ({
      custom: recipes.filter((r) => !!r.pet_id).length,
      generic: recipes.filter((r) => !r.pet_id).length,
    }),
    [recipes]
  );

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return recipes.filter((r) => {
      if (filter === "custom" && !r.pet_id) return false;
      if (filter === "generic" && r.pet_id) return false;
      if (!q) return true;
      const haystacks = [
        r.name,
        r.description ?? "",
        r.pets?.name ?? "",
        r.pets?.customers?.name ?? "",
      ];
      return haystacks.some((h) => h.toLowerCase().includes(q));
    });
  }, [recipes, search, filter]);

  async function handleDelete(id: string, name: string, comboNames: string[]) {
    if (comboNames.length > 0) {
      toast({
        title: "Receita usada em combo",
        description: `Exclua antes ${comboNames.length === 1 ? "o combo" : "os combos"}: ${comboNames.join(", ")}.`,
        variant: "destructive",
      });
      return;
    }
    if (!confirm(`Excluir a receita "${name}"? Todos os tamanhos e composições serão removidos.`))
      return;
    setDeletingId(id);
    try {
      await deleteRecipe(id);
      toast({ title: "Receita excluída" });
    } catch (e) {
      if (isRedirectError(e)) throw e;
      toast({ title: "Erro ao excluir", description: String(e), variant: "destructive" });
      setDeletingId(null);
    }
  }

  return (
    <>
      <div className="mb-3 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative flex-1 max-w-md">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Buscar receita, pet ou tutor..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 pr-9"
          />
          {search && (
            <button
              type="button"
              onClick={() => setSearch("")}
              className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-1 text-muted-foreground hover:bg-muted"
              aria-label="Limpar busca"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>

      <div className="mb-3 flex flex-wrap gap-2">
        <FilterChip
          label={`Todas (${recipes.length})`}
          active={filter === "all"}
          onClick={() => setFilter("all")}
        />
        <FilterChip
          label={`Sob medida (${counts.custom})`}
          active={filter === "custom"}
          onClick={() => setFilter("custom")}
        />
        <FilterChip
          label={`Genéricas (${counts.generic})`}
          active={filter === "generic"}
          onClick={() => setFilter("generic")}
        />
      </div>

      <Card>
        <CardContent className="p-0">
          {filtered.length === 0 ? (
            <p className="p-8 text-center text-sm text-muted-foreground">
              Nenhuma receita bate com a busca/filtros.
            </p>
          ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Receita</TableHead>
              <TableHead>Tamanhos</TableHead>
              <TableHead className="hidden text-right md:table-cell">Ingredientes</TableHead>
              <TableHead className="text-right">Custo</TableHead>
              <TableHead className="text-right">Preço fixo</TableHead>
              <TableHead className="hidden text-right md:table-cell">{modeLabel} médio</TableHead>
              <TableHead className="w-14"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.map((r) => {
              const sizes = r.recipe_sizes ?? [];
              const costs = sizes.map((s) => recipeSizeCost(sizeWithIngredients(s)));
              const prices = sizes
                .map((s) => (s.fixed_price != null ? Number(s.fixed_price) : null))
                .filter((p): p is number => p != null);
              const ingredientIds = new Set<string>();
              for (const s of sizes) {
                for (const rsi of s.recipe_size_ingredients ?? []) ingredientIds.add(rsi.ingredient_id);
              }
              const pctAvg = avgPct(sizes, profitMode);
              const isDeleting = deletingId === r.id;
              const comboNames = Array.from(
                new Set(
                  sizes.flatMap((s) =>
                    (s.combo_items ?? [])
                      .map((ci) => ci.combos?.name)
                      .filter((n): n is string => !!n)
                  )
                )
              );

              return (
                <TableRow
                  key={r.id}
                  className={`cursor-pointer ${isDeleting ? "opacity-50" : ""}`}
                  onClick={() => router.push(`/receitas/${r.id}`)}
                >
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{r.name}</span>
                      {r.pets && (
                        <span
                          className="inline-flex items-center rounded-full bg-violet-100 px-1.5 py-0.5 text-[10px] font-medium text-violet-900"
                          title={`Sob medida pra ${r.pets.name}${r.pets.customers?.name ? ` (${r.pets.customers.name})` : ""}`}
                        >
                          🎯 {r.pets.name}
                        </span>
                      )}
                    </div>
                    {r.description && (
                      <div className="mt-0.5 line-clamp-1 text-xs text-muted-foreground">
                        {r.description}
                      </div>
                    )}
                  </TableCell>
                  <TableCell>
                    {sizes.length > 0 ? (
                      <div className="flex flex-wrap gap-1">
                        {sizes.map((s) => (
                          <Badge key={s.id} variant="secondary">
                            {s.size_label}
                          </Badge>
                        ))}
                      </div>
                    ) : (
                      <span className="text-xs text-muted-foreground">Sem tamanhos</span>
                    )}
                  </TableCell>
                  <TableCell className="hidden text-right tabular-nums md:table-cell">
                    {ingredientIds.size > 0 ? ingredientIds.size : "—"}
                  </TableCell>
                  <TableCell className="text-right tabular-nums">{rangeBRL(costs.filter((c) => c > 0))}</TableCell>
                  <TableCell className="text-right tabular-nums">{rangeBRL(prices)}</TableCell>
                  <TableCell className="hidden text-right tabular-nums md:table-cell">
                    {pctAvg != null ? (
                      <Badge
                        variant={
                          pctAvg >= thresholds.good
                            ? "success"
                            : pctAvg >= thresholds.ok
                            ? "warning"
                            : "destructive"
                        }
                      >
                        {pctAvg.toFixed(1)}%
                      </Badge>
                    ) : (
                      <span className="text-xs text-muted-foreground">—</span>
                    )}
                  </TableCell>
                  <TableCell onClick={(e) => e.stopPropagation()}>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => router.push(`/receitas/${r.id}`)}>
                          <Eye className="h-4 w-4" /> Visualizar
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => router.push(`/receitas/${r.id}?edit=1`)}>
                          <Pencil className="h-4 w-4" /> Editar
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          className="text-destructive focus:text-destructive"
                          onClick={() => handleDelete(r.id, r.name, comboNames)}
                        >
                          <Trash2 className="h-4 w-4" /> Excluir
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
          )}
        </CardContent>
      </Card>
    </>
  );
}

function FilterChip({
  label,
  active,
  onClick,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "rounded-full px-3 py-1.5 text-xs font-medium transition-colors",
        active
          ? "bg-primary text-primary-foreground"
          : "bg-muted text-foreground hover:bg-muted/80"
      )}
    >
      {label}
    </button>
  );
}
