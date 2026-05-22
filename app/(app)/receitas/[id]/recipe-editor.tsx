"use client";

import { useState } from "react";
import { Pencil, Plus, Trash2, Save, Loader2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { CurrencyInput } from "@/components/ui/currency-input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { useToast } from "@/components/ui/use-toast";
import { isRedirectError } from "@/lib/is-redirect-error";
import { formatBRL, unitLabel } from "@/lib/format";
import {
  ingredientLineCost,
  lossFactor,
  pctFromCostPrice,
  priceFromCostPct,
  profitModeLabel,
  recipeSizeCost,
} from "@/lib/pricing";
import {
  addRecipeSize,
  addSizeIngredient,
  deleteRecipe,
  deleteRecipeSize,
  deleteSizeIngredient,
  updateRecipe,
  updateRecipeSize,
} from "../actions";
import type {
  Ingredient,
  IngredientUnit,
  ProfitCalcMode,
  Recipe,
  RecipeSize,
} from "@/types/database";

type SizeRow = RecipeSize & {
  recipe_size_ingredients: Array<{
    id: string;
    ingredient_id: string;
    quantity: number;
    unit: IngredientUnit;
    ingredients: Ingredient;
  }>;
};

export interface PetOption {
  id: string;
  name: string;
  customer_name: string | null;
}

const PET_NONE = "__none";

export function RecipeEditor({
  recipe,
  sizes,
  ingredients,
  pets,
  startInEditMode = false,
  profitMode,
}: {
  recipe: Recipe;
  sizes: SizeRow[];
  ingredients: Ingredient[];
  pets: PetOption[];
  startInEditMode?: boolean;
  profitMode: ProfitCalcMode;
}) {
  const { toast } = useToast();
  const [editingRecipe, setEditingRecipe] = useState(startInEditMode);
  const [name, setName] = useState(recipe.name);
  const [description, setDescription] = useState(recipe.description ?? "");
  const [petId, setPetId] = useState<string>(recipe.pet_id ?? PET_NONE);
  const linkedPet = pets.find((p) => p.id === recipe.pet_id);

  const [addingSize, setAddingSize] = useState(false);
  const [newSizeLabel, setNewSizeLabel] = useState("");
  const [newSizePrice, setNewSizePrice] = useState<number>(0);
  const [savingSize, setSavingSize] = useState(false);
  const [savingRecipe, setSavingRecipe] = useState(false);

  const [editingSizeId, setEditingSizeId] = useState<string | null>(null);

  async function handleSaveRecipe() {
    setSavingRecipe(true);
    try {
      await updateRecipe(recipe.id, {
        name,
        description: description || null,
        pet_id: petId === PET_NONE ? null : petId,
      });
      toast({ title: "Receita atualizada" });
      setEditingRecipe(false);
    } catch (e) {
      toast({ title: "Erro", description: String(e), variant: "destructive" });
    } finally {
      setSavingRecipe(false);
    }
  }

  async function handleDeleteRecipe() {
    if (!confirm("Excluir esta receita? Todos os tamanhos e composições serão removidos.")) return;
    try {
      await deleteRecipe(recipe.id);
      toast({ title: "Receita excluída" });
    } catch (e) {
      if (isRedirectError(e)) throw e;
      toast({
        title: "Erro ao excluir receita",
        description: e instanceof Error ? e.message : String(e),
        variant: "destructive",
      });
    }
  }

  async function handleAddSize() {
    setSavingSize(true);
    try {
      await addRecipeSize({
        recipe_id: recipe.id,
        size_label: newSizeLabel,
        fixed_price: newSizePrice > 0 ? newSizePrice : null,
      });
      toast({ title: "Tamanho adicionado" });
      setAddingSize(false);
      setNewSizeLabel("");
      setNewSizePrice(0);
    } catch (e) {
      toast({ title: "Erro", description: String(e), variant: "destructive" });
    } finally {
      setSavingSize(false);
    }
  }

  async function handleDeleteSize(id: string) {
    if (!confirm("Excluir este tamanho?")) return;
    try {
      await deleteRecipeSize({ id, recipe_id: recipe.id });
      toast({ title: "Tamanho excluído" });
    } catch (e) {
      toast({
        title: "Erro ao excluir tamanho",
        description: e instanceof Error ? e.message : String(e),
        variant: "destructive",
      });
    }
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="flex flex-row items-start justify-between">
          <div className="space-y-1">
            <CardTitle className="text-base">Detalhes da receita</CardTitle>
            {linkedPet && !editingRecipe && (
              <div className="inline-flex items-center gap-1 rounded-full bg-violet-100 px-2 py-0.5 text-xs font-medium text-violet-900">
                🎯 Sob medida pra {linkedPet.name}
                {linkedPet.customer_name ? ` (${linkedPet.customer_name})` : ""}
              </div>
            )}
          </div>
          <div className="flex gap-2">
            <Button variant="ghost" size="sm" onClick={() => setEditingRecipe((v) => !v)}>
              <Pencil className="h-4 w-4" /> Editar
            </Button>
            <Button variant="ghost" size="sm" onClick={handleDeleteRecipe}>
              <Trash2 className="h-4 w-4 text-destructive" />
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {editingRecipe ? (
            <div className="space-y-3">
              <div>
                <Label>Nome</Label>
                <Input value={name} onChange={(e) => setName(e.target.value)} />
              </div>
              <div>
                <Label>Descrição</Label>
                <Textarea value={description} onChange={(e) => setDescription(e.target.value)} />
              </div>
              <div>
                <Label>Pet (opcional)</Label>
                <Select value={petId} onValueChange={setPetId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Receita genérica" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={PET_NONE}>Receita genérica (qualquer pet)</SelectItem>
                    {pets.map((p) => (
                      <SelectItem key={p.id} value={p.id}>
                        🎯 {p.name}
                        {p.customer_name ? ` — ${p.customer_name}` : ""}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="mt-1 text-xs text-muted-foreground">
                  Receita sob medida fica marcada com um aviso quando usada em pedido de outro pet.
                </p>
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setEditingRecipe(false)}>
                  Cancelar
                </Button>
                <Button onClick={handleSaveRecipe} disabled={savingRecipe}>
                  {savingRecipe ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Save className="h-4 w-4" />
                  )}{" "}
                  {savingRecipe ? "Salvando..." : "Salvar"}
                </Button>
              </div>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">
              {recipe.description ?? "Sem descrição."}
            </p>
          )}
        </CardContent>
      </Card>

      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">Tamanhos</h2>
          <Button size="sm" onClick={() => setAddingSize(true)}>
            <Plus className="h-4 w-4" /> Novo tamanho
          </Button>
        </div>

        {sizes.length === 0 ? (
          <Card>
            <CardContent className="p-6 text-center text-sm text-muted-foreground">
              Nenhum tamanho cadastrado. Adicione um (PP, P, M, G, GG).
            </CardContent>
          </Card>
        ) : (
          sizes.map((size) => (
            <SizeCard
              key={size.id}
              size={size}
              ingredients={ingredients}
              recipeId={recipe.id}
              isEditing={editingSizeId === size.id}
              onEdit={() => setEditingSizeId(size.id)}
              onCancelEdit={() => setEditingSizeId(null)}
              onDelete={() => handleDeleteSize(size.id)}
              profitMode={profitMode}
            />
          ))
        )}
      </div>

      <Dialog open={addingSize} onOpenChange={setAddingSize}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Novo tamanho</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <Label>Rótulo</Label>
              <Input
                value={newSizeLabel}
                onChange={(e) => setNewSizeLabel(e.target.value)}
                placeholder="PP, P, M, G, GG..."
              />
            </div>
            <div>
              <Label>Preço fixo (opcional)</Label>
              <CurrencyInput
                value={newSizePrice}
                onChange={setNewSizePrice}
                placeholder="0,00"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAddingSize(false)}>
              Cancelar
            </Button>
            <Button onClick={handleAddSize} disabled={!newSizeLabel || savingSize}>
              {savingSize && <Loader2 className="h-4 w-4 animate-spin" />}
              {savingSize ? "Adicionando..." : "Adicionar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function SizeCard({
  size,
  ingredients,
  recipeId,
  isEditing,
  onEdit,
  onCancelEdit,
  onDelete,
  profitMode,
}: {
  size: SizeRow;
  ingredients: Ingredient[];
  recipeId: string;
  isEditing: boolean;
  onEdit: () => void;
  onCancelEdit: () => void;
  onDelete: () => void;
  profitMode: ProfitCalcMode;
}) {
  const { toast } = useToast();
  const modeLabel = profitModeLabel(profitMode);
  // Sugestão padrão: 60% se modo margem, 100% se modo markup (ambos ≈ dobram o custo).
  const defaultPct = profitMode === "markup" ? 100 : 60;
  const [label, setLabel] = useState(size.size_label);
  const [price, setPrice] = useState<number>(
    size.fixed_price != null ? Number(size.fixed_price) : 0
  );
  const [pct, setPct] = useState(String(defaultPct));

  const [ingredientId, setIngredientId] = useState("");
  const [quantity, setQuantity] = useState("");
  const [unit, setUnit] = useState<IngredientUnit>("g");
  const [ingredientSearch, setIngredientSearch] = useState("");
  const [adding, setAdding] = useState(false);
  const [savingSize, setSavingSize] = useState(false);

  const cost = recipeSizeCost({
    ...size,
    ingredients: size.recipe_size_ingredients.map((r) => ({
      id: r.id,
      user_id: size.user_id,
      recipe_size_id: size.id,
      ingredient_id: r.ingredient_id,
      quantity: r.quantity,
      unit: r.unit,
      ingredient: r.ingredients,
    })),
  });

  // Sugestão padrão conforme o modo (60% margem ou 100% markup — ambos ≈ dobram o custo)
  const suggestedPrice = priceFromCostPct(cost, defaultPct, profitMode);

  function handlePctChange(value: string) {
    setPct(value);
    const n = parseFloat(value.replace(",", ".")) || 0;
    if (cost > 0) {
      setPrice(priceFromCostPct(cost, n, profitMode));
    }
  }

  function handlePriceChange(newPrice: number) {
    setPrice(newPrice);
    if (cost > 0 && newPrice > 0) {
      setPct(pctFromCostPrice(cost, newPrice, profitMode).toFixed(1));
    }
  }

  function applySuggestion() {
    setPrice(suggestedPrice);
    setPct(String(defaultPct));
  }

  async function handleSave() {
    setSavingSize(true);
    try {
      await updateRecipeSize({
        id: size.id,
        recipe_id: recipeId,
        size_label: label,
        fixed_price: price > 0 ? price : null,
      });
      toast({ title: "Tamanho atualizado" });
      onCancelEdit();
    } catch (e) {
      toast({ title: "Erro", description: String(e), variant: "destructive" });
    } finally {
      setSavingSize(false);
    }
  }

  async function handleAddIngredient() {
    if (!ingredientId || !quantity) return;
    setAdding(true);
    try {
      await addSizeIngredient({
        recipe_size_id: size.id,
        recipe_id: recipeId,
        ingredient_id: ingredientId,
        quantity: parseFloat(quantity.replace(",", ".")),
        unit,
      });
      setIngredientId("");
      setQuantity("");
      setUnit("g");
      toast({ title: "Ingrediente adicionado" });
    } catch (e) {
      toast({ title: "Erro", description: String(e), variant: "destructive" });
    } finally {
      setAdding(false);
    }
  }

  const [removingId, setRemovingId] = useState<string | null>(null);

  async function handleRemoveIngredient(id: string) {
    setRemovingId(id);
    try {
      await deleteSizeIngredient({ id, recipe_id: recipeId });
      toast({ title: "Ingrediente removido" });
    } catch (e) {
      toast({
        title: "Erro ao remover",
        description: e instanceof Error ? e.message : String(e),
        variant: "destructive",
      });
    } finally {
      setRemovingId(null);
    }
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-start justify-between">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <CardTitle className="text-base">Tamanho {size.size_label}</CardTitle>
            {size.fixed_price != null ? (
              <Badge variant="secondary">Preço fixo {formatBRL(Number(size.fixed_price))}</Badge>
            ) : suggestedPrice > 0 ? (
              <Badge variant="warning">Sem preço fixo</Badge>
            ) : null}
          </div>
          <p className="mt-1 text-xs text-muted-foreground">
            Custo calculado: <span className="font-medium">{formatBRL(cost)}</span>
            {size.fixed_price != null && Number(size.fixed_price) > 0 ? (
              <>
                {" "}
                · {modeLabel}:{" "}
                <span className="font-medium">
                  {pctFromCostPrice(cost, Number(size.fixed_price), profitMode).toFixed(1)}%
                </span>
              </>
            ) : suggestedPrice > 0 ? (
              <>
                {" "}
                · Sugestão ({defaultPct}% {modeLabel.toLowerCase()}):{" "}
                <span className="font-medium text-primary">{formatBRL(suggestedPrice)}</span>
              </>
            ) : null}
          </p>
        </div>
        <div className="flex gap-1">
          <Button variant="ghost" size="sm" onClick={isEditing ? onCancelEdit : onEdit}>
            <Pencil className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="sm" onClick={onDelete}>
            <Trash2 className="h-4 w-4 text-destructive" />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {isEditing && (
          <div className="space-y-3 rounded-md border bg-muted/30 p-3">
            <div>
              <Label>Rótulo</Label>
              <Input value={label} onChange={(e) => setLabel(e.target.value)} />
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <Label>Preço fixo</Label>
                <CurrencyInput value={price} onChange={handlePriceChange} />
              </div>
              <div>
                <Label>{modeLabel} desejado (%)</Label>
                <Input
                  value={pct}
                  onChange={(e) => handlePctChange(e.target.value)}
                  placeholder={String(defaultPct)}
                  inputMode="decimal"
                />
              </div>
            </div>
            {cost > 0 && (
              <div className="flex flex-wrap items-center justify-between gap-2 rounded-md bg-background p-2 text-xs">
                <span className="text-muted-foreground">
                  Custo: <span className="font-medium">{formatBRL(cost)}</span> · Sugestão
                  ({defaultPct}%): <span className="font-medium">{formatBRL(suggestedPrice)}</span>
                </span>
                <Button type="button" variant="outline" size="sm" onClick={applySuggestion}>
                  Usar sugestão ({defaultPct}%)
                </Button>
              </div>
            )}
            <div className="flex justify-end">
              <Button size="sm" onClick={handleSave} disabled={savingSize}>
                {savingSize ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Save className="h-4 w-4" />
                )}{" "}
                {savingSize ? "Salvando..." : "Salvar tamanho"}
              </Button>
            </div>
          </div>
        )}

        <div>
          <div className="mb-2 text-xs font-medium text-muted-foreground">Ingredientes</div>
          {size.recipe_size_ingredients.length === 0 ? (
            <p className="rounded-md border border-dashed p-3 text-sm text-muted-foreground">
              Nenhum ingrediente ainda. Adicione abaixo.
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Ingrediente</TableHead>
                  <TableHead>Quantidade</TableHead>
                  <TableHead className="text-right">Custo</TableHead>
                  <TableHead className="w-10"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {size.recipe_size_ingredients.map((row) => {
                  const loss = Number(row.ingredients.loss_pct ?? 0);
                  const adjustedCost = ingredientLineCost(row.ingredients, row.quantity, row.unit);
                  const factor = lossFactor(row.ingredients);
                  const baseCost = factor !== 0 ? adjustedCost / factor : adjustedCost;
                  const lossAbs = Math.abs(loss);
                  const lossPctStr = lossAbs.toFixed(lossAbs % 1 === 0 ? 0 : 1);
                  return (
                  <TableRow key={row.id}>
                    <TableCell className="font-medium">
                      {row.ingredients.name}
                      {loss > 0 && (
                        <Popover>
                          <PopoverTrigger asChild>
                            <button
                              type="button"
                              className="ml-1.5 inline-flex cursor-help items-center rounded-full bg-amber-100 px-1.5 py-0.5 text-[10px] font-medium text-amber-900 hover:bg-amber-200"
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
                              <strong>{row.quantity} {unitLabel(row.unit)}</strong> sobe de{" "}
                              <strong>{formatBRL(baseCost)}</strong> para{" "}
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
                              className="ml-1.5 inline-flex cursor-help items-center rounded-full bg-emerald-100 px-1.5 py-0.5 text-[10px] font-medium text-emerald-900 hover:bg-emerald-200"
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
                              <strong>{row.quantity} {unitLabel(row.unit)}</strong> cai de{" "}
                              <strong>{formatBRL(baseCost)}</strong> para{" "}
                              <strong>{formatBRL(adjustedCost)}</strong>.
                            </p>
                          </PopoverContent>
                        </Popover>
                      )}
                    </TableCell>
                    <TableCell>
                      {row.quantity} {unitLabel(row.unit)}
                    </TableCell>
                    <TableCell className="text-right tabular-nums">
                      {formatBRL(ingredientLineCost(row.ingredients, row.quantity, row.unit))}
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="icon"
                        disabled={removingId === row.id}
                        onClick={() => handleRemoveIngredient(row.id)}
                      >
                        {removingId === row.id ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Trash2 className="h-4 w-4 text-destructive" />
                        )}
                      </Button>
                    </TableCell>
                  </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </div>

        <div className="rounded-md border bg-muted/30 p-3">
          <div className="mb-2 text-xs font-medium text-muted-foreground">
            Adicionar ingrediente
          </div>
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-[1fr_120px_100px_auto] sm:items-end">
            <div>
              <Label className="text-xs">Ingrediente</Label>
              <Select
                value={ingredientId}
                onValueChange={setIngredientId}
                onOpenChange={(o) => {
                  if (!o) setIngredientSearch("");
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione" />
                </SelectTrigger>
                <SelectContent>
                  {ingredients.length === 0 ? (
                    <SelectItem value="__none" disabled>
                      Cadastre ingredientes primeiro
                    </SelectItem>
                  ) : (
                    <>
                      <div className="sticky top-0 z-10 -mx-1 -mt-1 mb-1 border-b bg-popover p-1.5">
                        <Input
                          autoFocus
                          value={ingredientSearch}
                          onChange={(e) => setIngredientSearch(e.target.value)}
                          onKeyDown={(e) => e.stopPropagation()}
                          placeholder="Buscar ingrediente..."
                          className="h-8 text-sm"
                        />
                      </div>
                      {(() => {
                        const q = ingredientSearch.trim().toLowerCase();
                        const filtered = q
                          ? ingredients.filter((i) => i.name.toLowerCase().includes(q))
                          : ingredients;
                        if (filtered.length === 0) {
                          return (
                            <div className="px-2 py-3 text-center text-xs text-muted-foreground">
                              Nenhum ingrediente encontrado
                            </div>
                          );
                        }
                        return filtered.map((i) => (
                          <SelectItem key={i.id} value={i.id}>
                            {i.name} — {formatBRL(Number(i.price_per_unit))}/{unitLabel(i.unit)}
                          </SelectItem>
                        ));
                      })()}
                    </>
                  )}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs">Quantidade</Label>
              <Input
                inputMode="decimal"
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                placeholder="0"
              />
            </div>
            <div>
              <Label className="text-xs">Unidade</Label>
              <Select value={unit} onValueChange={(v) => setUnit(v as IngredientUnit)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="g">g</SelectItem>
                  <SelectItem value="kg">kg</SelectItem>
                  <SelectItem value="un">un</SelectItem>
                  <SelectItem value="ml">ml</SelectItem>
                  <SelectItem value="l">L</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button
              size="icon"
              onClick={handleAddIngredient}
              disabled={!ingredientId || !quantity || adding}
              title="Adicionar"
            >
              {adding ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
