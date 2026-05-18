"use client";

import { useState } from "react";
import { Plus, Pencil, Trash2, Layers, Loader2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/components/ui/use-toast";
import { formatBRL } from "@/lib/format";
import { comboCalculatedPrice, comboCost, comboItemsSubtotal } from "@/lib/pricing";
import type { ComboWithItems } from "@/lib/pricing";
import { addComboItem, deleteCombo, deleteComboItem, saveCombo } from "./actions";

interface SizeOption {
  id: string;
  size_label: string;
  fixed_price: number | null;
  recipe_id: string;
  recipes: { name: string };
}

interface ComboItemRow {
  id: string;
  recipe_size_id: string;
  quantity: number;
  recipe_sizes: {
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
  };
}

interface ComboRow {
  id: string;
  name: string;
  description: string | null;
  fixed_price: number | null;
  discount_pct: number | null;
  combo_items: ComboItemRow[];
}

function toWithItems(c: ComboRow): ComboWithItems {
  return {
    id: c.id,
    user_id: "",
    name: c.name,
    description: c.description,
    fixed_price: c.fixed_price != null ? Number(c.fixed_price) : null,
    discount_pct: Number(c.discount_pct ?? 0),
    created_at: "",
    items: c.combo_items.map((it) => ({
      id: it.id,
      user_id: "",
      combo_id: c.id,
      recipe_size_id: it.recipe_size_id,
      quantity: Number(it.quantity),
      recipe_size: {
        id: it.recipe_sizes.id,
        user_id: "",
        recipe_id: it.recipe_sizes.recipe_id,
        size_label: it.recipe_sizes.size_label,
        fixed_price:
          it.recipe_sizes.fixed_price != null ? Number(it.recipe_sizes.fixed_price) : null,
        notes: null,
        ingredients: it.recipe_sizes.recipe_size_ingredients.map((r) => ({
          id: r.id,
          user_id: "",
          recipe_size_id: it.recipe_sizes.id,
          ingredient_id: r.ingredient_id,
          quantity: Number(r.quantity),
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          unit: r.unit as any,
          ingredient: {
            id: r.ingredients.id,
            user_id: "",
            name: r.ingredients.name,
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            unit: r.ingredients.unit as any,
            price_per_unit: Number(r.ingredients.price_per_unit),
            stock_quantity: 0,
            notes: null,
            created_at: "",
          },
        })),
      },
    })),
  };
}

export function ComboManager({ combos, sizes }: { combos: ComboRow[]; sizes: SizeOption[] }) {
  const { toast } = useToast();
  const [editing, setEditing] = useState<ComboRow | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [itemTarget, setItemTarget] = useState<ComboRow | null>(null);
  const [sizeId, setSizeId] = useState("");
  const [qty, setQty] = useState("1");
  const [addingItem, setAddingItem] = useState(false);

  async function handleSaveCombo(input: {
    id?: string;
    name: string;
    description: string;
    discount_pct: string;
  }) {
    try {
      await saveCombo({
        id: input.id,
        name: input.name,
        description: input.description || null,
        discount_pct: parseFloat(input.discount_pct.replace(",", ".")) || 0,
      });
      toast({ title: "Combo salvo" });
      setFormOpen(false);
      setEditing(null);
    } catch (e) {
      toast({ title: "Erro", description: String(e), variant: "destructive" });
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("Excluir este combo?")) return;
    try {
      await deleteCombo(id);
    } catch (e) {
      toast({ title: "Erro", description: String(e), variant: "destructive" });
    }
  }

  async function handleAddItem() {
    if (!itemTarget || !sizeId) return;
    setAddingItem(true);
    try {
      await addComboItem({
        combo_id: itemTarget.id,
        recipe_size_id: sizeId,
        quantity: parseInt(qty, 10) || 1,
      });
      toast({ title: "Item adicionado" });
      setItemTarget(null);
      setSizeId("");
      setQty("1");
    } catch (e) {
      toast({ title: "Erro", description: String(e), variant: "destructive" });
    } finally {
      setAddingItem(false);
    }
  }

  return (
    <>
      <div className="mb-3 flex justify-end">
        <Button
          onClick={() => {
            setEditing(null);
            setFormOpen(true);
          }}
        >
          <Plus className="h-4 w-4" /> Novo combo
        </Button>
      </div>

      {combos.length === 0 ? (
        <Card>
          <CardContent className="p-8 text-center text-muted-foreground">
            <Layers className="mx-auto mb-3 h-10 w-10 opacity-50" />
            Nenhum combo cadastrado.
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {combos.map((c) => {
            const combo = toWithItems(c);
            const subtotal = comboItemsSubtotal(combo);
            const finalPrice = comboCalculatedPrice(combo);
            const cost = comboCost(combo);
            const discount = Number(c.discount_pct ?? 0);
            const discountValue = subtotal - finalPrice;
            const profit = finalPrice - cost;
            const margin = finalPrice > 0 ? (profit / finalPrice) * 100 : 0;
            return (
              <Card key={c.id}>
                <CardHeader className="flex flex-row items-start justify-between">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <CardTitle className="text-base">{c.name}</CardTitle>
                      {discount > 0 && (
                        <Badge variant="warning">−{discount.toFixed(0)}% desconto</Badge>
                      )}
                    </div>
                    {c.description && (
                      <p className="mt-1 text-sm text-muted-foreground">{c.description}</p>
                    )}
                  </div>
                  <div className="flex gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => {
                        setEditing(c);
                        setFormOpen(true);
                      }}
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => handleDelete(c.id)}>
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  {c.combo_items.length === 0 ? (
                    <p className="text-sm text-muted-foreground">Nenhuma receita adicionada.</p>
                  ) : (
                    <ul className="divide-y rounded-md border">
                      {c.combo_items.map((i) => {
                        const recipeName = i.recipe_sizes.recipes.name;
                        const size = i.recipe_sizes.size_label;
                        const unitPrice =
                          i.recipe_sizes.fixed_price != null
                            ? Number(i.recipe_sizes.fixed_price)
                            : 0;
                        const lineTotal = unitPrice * Number(i.quantity);
                        return (
                          <li
                            key={i.id}
                            className="flex items-center justify-between gap-2 px-3 py-2"
                          >
                            <div className="text-sm">
                              <span className="font-medium">{recipeName}</span>
                              <span className="text-muted-foreground">
                                {" "}
                                · {size} × {i.quantity}
                              </span>
                            </div>
                            <div className="flex items-center gap-3">
                              <span className="text-sm tabular-nums text-muted-foreground">
                                {formatBRL(lineTotal)}
                              </span>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-7 w-7"
                                onClick={async () => {
                                  try {
                                    await deleteComboItem(i.id);
                                  } catch (e) {
                                    toast({
                                      title: "Erro",
                                      description: String(e),
                                      variant: "destructive",
                                    });
                                  }
                                }}
                              >
                                <Trash2 className="h-4 w-4 text-destructive" />
                              </Button>
                            </div>
                          </li>
                        );
                      })}
                    </ul>
                  )}

                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setItemTarget(c)}
                  >
                    <Plus className="h-4 w-4" /> Adicionar receita ao combo
                  </Button>

                  {c.combo_items.length > 0 && (
                    <>
                      <Separator />
                      <div className="rounded-md bg-muted/40 p-3 text-sm">
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Soma das receitas</span>
                          <span className="tabular-nums">{formatBRL(subtotal)}</span>
                        </div>
                        {discount > 0 && (
                          <div className="flex justify-between text-amber-700">
                            <span>Desconto ({discount.toFixed(0)}%)</span>
                            <span className="tabular-nums">−{formatBRL(discountValue)}</span>
                          </div>
                        )}
                        <Separator className="my-1.5" />
                        <div className="flex justify-between text-base font-bold">
                          <span>Preço do combo</span>
                          <span className="tabular-nums text-primary">
                            {formatBRL(finalPrice)}
                          </span>
                        </div>
                        <div className="mt-1 flex justify-between text-xs text-muted-foreground">
                          <span>Custo de fabricação</span>
                          <span className="tabular-nums">{formatBRL(cost)}</span>
                        </div>
                        <div className="flex justify-between text-xs">
                          <span className="text-muted-foreground">Lucro / margem</span>
                          <span className="tabular-nums text-emerald-700">
                            {formatBRL(profit)} ({margin.toFixed(1)}%)
                          </span>
                        </div>
                      </div>
                    </>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      <ComboFormDialog
        open={formOpen}
        onOpenChange={(v) => {
          setFormOpen(v);
          if (!v) setEditing(null);
        }}
        combo={editing}
        onSave={handleSaveCombo}
      />

      <Dialog open={!!itemTarget} onOpenChange={(v) => !v && setItemTarget(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Adicionar receita ao combo</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <Label>Receita & Tamanho</Label>
              <Select value={sizeId} onValueChange={setSizeId}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione" />
                </SelectTrigger>
                <SelectContent>
                  {sizes.map((s) => (
                    <SelectItem key={s.id} value={s.id}>
                      {s.recipes.name} — {s.size_label}
                      {s.fixed_price != null && ` (${formatBRL(Number(s.fixed_price))})`}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Quantidade</Label>
              <Input
                inputMode="numeric"
                value={qty}
                onChange={(e) => setQty(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setItemTarget(null)}>
              Cancelar
            </Button>
            <Button onClick={handleAddItem} disabled={addingItem || !sizeId}>
              {addingItem && <Loader2 className="h-4 w-4 animate-spin" />}
              {addingItem ? "Adicionando..." : "Adicionar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

function ComboFormDialog({
  open,
  onOpenChange,
  combo,
  onSave,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  combo: ComboRow | null;
  onSave: (input: {
    id?: string;
    name: string;
    description: string;
    discount_pct: string;
  }) => Promise<void> | void;
}) {
  const [name, setName] = useState(combo?.name ?? "");
  const [description, setDescription] = useState(combo?.description ?? "");
  const [discount, setDiscount] = useState(
    combo?.discount_pct != null ? String(combo.discount_pct) : "0"
  );
  const [saving, setSaving] = useState(false);

  function reset(c: ComboRow | null) {
    setName(c?.name ?? "");
    setDescription(c?.description ?? "");
    setDiscount(c?.discount_pct != null ? String(c.discount_pct) : "0");
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        onOpenChange(v);
        if (!v) reset(null);
        else reset(combo);
      }}
    >
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{combo ? "Editar combo" : "Novo combo"}</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <div>
            <Label>Nome</Label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ex: Combo Semana Variada"
            />
          </div>
          <div>
            <Label>Descrição</Label>
            <Textarea value={description} onChange={(e) => setDescription(e.target.value)} />
          </div>
          <div>
            <Label>Desconto (%)</Label>
            <div className="flex items-center gap-2">
              <Input
                inputMode="decimal"
                value={discount}
                onChange={(e) => setDiscount(e.target.value)}
                placeholder="0"
              />
              <span className="text-sm text-muted-foreground">%</span>
            </div>
            <p className="mt-1 text-xs text-muted-foreground">
              Aplicado sobre a soma dos preços das receitas do combo.
            </p>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button
            disabled={saving || !name.trim()}
            onClick={async () => {
              setSaving(true);
              try {
                await onSave({
                  id: combo?.id,
                  name: name.trim(),
                  description,
                  discount_pct: discount,
                });
              } finally {
                setSaving(false);
              }
            }}
          >
            {saving && <Loader2 className="h-4 w-4 animate-spin" />}
            {saving ? "Salvando..." : "Salvar"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
