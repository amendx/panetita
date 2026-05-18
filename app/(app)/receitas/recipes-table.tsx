"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Eye, MoreVertical, Pencil, Trash2 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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
import { formatBRL } from "@/lib/format";
import { recipeSizeCost, type RecipeSizeWithIngredients } from "@/lib/pricing";
import { deleteRecipe } from "./actions";

export interface RecipeRow {
  id: string;
  name: string;
  description: string | null;
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

function avgMargin(sizes: RecipeRow["recipe_sizes"]): number | null {
  const withPrice = sizes.filter((s) => s.fixed_price != null && Number(s.fixed_price) > 0);
  if (withPrice.length === 0) return null;
  const margins = withPrice.map((s) => {
    const cost = recipeSizeCost(sizeWithIngredients(s));
    const price = Number(s.fixed_price);
    return ((price - cost) / price) * 100;
  });
  return margins.reduce((a, b) => a + b, 0) / margins.length;
}

export function RecipesTable({ recipes }: { recipes: RecipeRow[] }) {
  const router = useRouter();
  const { toast } = useToast();
  const [deletingId, setDeletingId] = useState<string | null>(null);

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
      toast({ title: "Erro ao excluir", description: String(e), variant: "destructive" });
      setDeletingId(null);
    }
  }

  return (
    <Card>
      <CardContent className="p-0">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Receita</TableHead>
              <TableHead>Tamanhos</TableHead>
              <TableHead className="hidden text-right md:table-cell">Ingredientes</TableHead>
              <TableHead className="text-right">Custo</TableHead>
              <TableHead className="text-right">Preço fixo</TableHead>
              <TableHead className="hidden text-right md:table-cell">Margem média</TableHead>
              <TableHead className="w-14"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {recipes.map((r) => {
              const sizes = r.recipe_sizes ?? [];
              const costs = sizes.map((s) => recipeSizeCost(sizeWithIngredients(s)));
              const prices = sizes
                .map((s) => (s.fixed_price != null ? Number(s.fixed_price) : null))
                .filter((p): p is number => p != null);
              const ingredientIds = new Set<string>();
              for (const s of sizes) {
                for (const rsi of s.recipe_size_ingredients ?? []) ingredientIds.add(rsi.ingredient_id);
              }
              const margin = avgMargin(sizes);
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
                    <div className="font-medium">{r.name}</div>
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
                    {margin != null ? (
                      <Badge variant={margin >= 50 ? "success" : margin >= 30 ? "warning" : "destructive"}>
                        {margin.toFixed(1)}%
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
      </CardContent>
    </Card>
  );
}
