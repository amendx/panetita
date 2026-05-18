"use client";

import { useState } from "react";
import { Check, Loader2, Pencil, Plus, Minus } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { useToast } from "@/components/ui/use-toast";
import { adjustStock, updateStock } from "../ingredientes/actions";
import { formatBRL, unitLabel } from "@/lib/format";
import type { Ingredient } from "@/types/database";
import type { ShoppingListLine } from "@/lib/shopping-list";

type Horizon = { key: string; days: number; label: string };

export function StockTable({
  ingredients,
  demandByHorizon,
  horizons,
}: {
  ingredients: Ingredient[];
  demandByHorizon: Record<string, ShoppingListLine[]>;
  horizons: ReadonlyArray<Horizon>;
}) {
  const { toast } = useToast();
  const [editing, setEditing] = useState<Ingredient | null>(null);
  const [editValue, setEditValue] = useState("");
  const [savingId, setSavingId] = useState<string | null>(null);

  function demandFor(horizonKey: string, ingredientId: string): number {
    const lines = demandByHorizon[horizonKey] ?? [];
    const line = lines.find((l) => l.ingredient.id === ingredientId);
    return line ? line.totalQuantity : 0;
  }

  async function handleAdjust(ing: Ingredient, delta: number) {
    setSavingId(ing.id);
    try {
      await adjustStock({ id: ing.id, delta });
      toast({ title: delta > 0 ? "Estoque reposto" : "Estoque ajustado" });
    } catch (e) {
      toast({ title: "Erro", description: String(e), variant: "destructive" });
    } finally {
      setSavingId(null);
    }
  }

  function openEdit(ing: Ingredient) {
    setEditing(ing);
    setEditValue(String(ing.stock_quantity ?? 0));
  }

  async function handleSaveStock() {
    if (!editing) return;
    const value = parseFloat(editValue.replace(",", "."));
    if (Number.isNaN(value) || value < 0) {
      toast({ title: "Valor inválido", variant: "destructive" });
      return;
    }
    setSavingId(editing.id);
    try {
      await updateStock({ id: editing.id, stock_quantity: value });
      toast({ title: "Estoque atualizado" });
      setEditing(null);
    } catch (e) {
      toast({ title: "Erro", description: String(e), variant: "destructive" });
    } finally {
      setSavingId(null);
    }
  }

  return (
    <>
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Ingrediente</TableHead>
                <TableHead className="text-right">Estoque</TableHead>
                {horizons.map((h) => (
                  <TableHead key={h.key} className="text-right">
                    Precisa em {h.label}
                  </TableHead>
                ))}
                <TableHead>Status</TableHead>
                <TableHead className="w-48 text-right">Ajustar</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {ingredients.map((ing) => {
                const stock = Number(ing.stock_quantity ?? 0);
                const demand30 = demandFor("d30", ing.id);
                const shortfall30 = demand30 - stock;
                const demand7 = demandFor("d7", ing.id);
                const shortfall7 = demand7 - stock;

                const status =
                  shortfall7 > 0
                    ? "urgent"
                    : shortfall30 > 0
                    ? "warning"
                    : stock > 0
                    ? "ok"
                    : "empty";

                return (
                  <TableRow key={ing.id} className={savingId === ing.id ? "opacity-60" : ""}>
                    <TableCell>
                      <div className="font-medium">{ing.name}</div>
                      <div className="text-xs text-muted-foreground">
                        {formatBRL(Number(ing.price_per_unit))} / {unitLabel(ing.unit)}
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="text-base font-semibold tabular-nums">
                        {stock.toFixed(stock % 1 === 0 ? 0 : 2)} {unitLabel(ing.unit)}
                      </div>
                    </TableCell>
                    {horizons.map((h) => {
                      const need = demandFor(h.key, ing.id);
                      const diff = need - stock;
                      return (
                        <TableCell key={h.key} className="text-right">
                          {need > 0 ? (
                            <div>
                              <div className="text-sm tabular-nums">
                                {need.toFixed(need % 1 === 0 ? 0 : 2)} {unitLabel(ing.unit)}
                              </div>
                              {diff > 0 && (
                                <div className="text-xs font-medium tabular-nums text-destructive">
                                  faltam {diff.toFixed(diff % 1 === 0 ? 0 : 2)}{" "}
                                  {unitLabel(ing.unit)}
                                </div>
                              )}
                            </div>
                          ) : (
                            <span className="text-xs text-muted-foreground">—</span>
                          )}
                        </TableCell>
                      );
                    })}
                    <TableCell>
                      {status === "urgent" ? (
                        <Badge variant="destructive">Comprar urgente</Badge>
                      ) : status === "warning" ? (
                        <Badge variant="warning">Repor em breve</Badge>
                      ) : status === "ok" ? (
                        <Badge variant="success">OK</Badge>
                      ) : (
                        <Badge variant="outline">Sem estoque</Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button
                          variant="outline"
                          size="icon"
                          className="h-8 w-8"
                          title="Tirar 1 do estoque"
                          disabled={savingId === ing.id || stock <= 0}
                          onClick={() => handleAdjust(ing, -1)}
                        >
                          <Minus className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="icon"
                          className="h-8 w-8"
                          title="Adicionar 1 ao estoque"
                          disabled={savingId === ing.id}
                          onClick={() => handleAdjust(ing, 1)}
                        >
                          <Plus className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          title="Definir valor exato"
                          onClick={() => openEdit(ing)}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={!!editing} onOpenChange={(v) => !v && setEditing(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>
              {editing?.name} — estoque em {editing ? unitLabel(editing.unit) : ""}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-2">
            <Label>Quantidade em estoque</Label>
            <Input
              inputMode="decimal"
              autoFocus
              value={editValue}
              onChange={(e) => setEditValue(e.target.value)}
            />
            <p className="text-xs text-muted-foreground">
              Defina o valor exato atual do seu estoque (ex.: depois de comprar ou de produzir).
            </p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditing(null)}>
              Cancelar
            </Button>
            <Button onClick={handleSaveStock} disabled={savingId === editing?.id}>
              {savingId === editing?.id ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Check className="h-4 w-4" />
              )}
              Salvar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
