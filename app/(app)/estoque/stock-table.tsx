"use client";

import { useState } from "react";
import { Check, Loader2, Pencil, Plus, Minus, AlertTriangle, PackageCheck, Search, X } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
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
import { unitLabel } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { Ingredient } from "@/types/database";
import type { ShoppingListLine } from "@/lib/shopping-list";

type Horizon = { key: string; days: number; label: string };
type StatusKind = "urgent" | "warning" | "ok" | "empty";

function fmtQty(qty: number): string {
  return qty.toFixed(qty % 1 === 0 ? 0 : 2).replace(".", ",");
}

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
  const [filter, setFilter] = useState<"todos" | "alerta" | "ok" | "urgent" | "warning" | "empty">(
    "todos"
  );
  const [search, setSearch] = useState("");

  function demandFor(horizonKey: string, ingredientId: string): number {
    const lines = demandByHorizon[horizonKey] ?? [];
    const line = lines.find((l) => l.ingredient.id === ingredientId);
    return line ? line.totalQuantity : 0;
  }

  function statusFor(stock: number, demand7: number, demand30: number): StatusKind {
    if (demand7 - stock > 0) return "urgent";
    if (demand30 - stock > 0) return "warning";
    if (stock > 0) return "ok";
    return "empty";
  }

  async function handleAdjust(ing: Ingredient, delta: number) {
    setSavingId(ing.id);
    try {
      await adjustStock({ id: ing.id, delta });
      toast({ title: delta > 0 ? "+1 no estoque" : "−1 no estoque" });
    } catch (e) {
      toast({
        title: "Erro ao ajustar estoque",
        description: e instanceof Error ? e.message : String(e),
        variant: "destructive",
      });
    } finally {
      setSavingId(null);
    }
  }

  function openEdit(ing: Ingredient) {
    setEditing(ing);
    setEditValue(String(ing.stock_quantity ?? 0).replace(".", ","));
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
      toast({
        title: "Erro ao salvar estoque",
        description: e instanceof Error ? e.message : String(e),
        variant: "destructive",
      });
    } finally {
      setSavingId(null);
    }
  }

  // Aplica busca + filtro
  const q = search.trim().toLowerCase();
  const filtered = ingredients.filter((ing) => {
    if (q && !ing.name.toLowerCase().includes(q)) return false;
    if (filter === "todos") return true;
    const stock = Number(ing.stock_quantity ?? 0);
    const d7 = demandFor("d7", ing.id);
    const d30 = demandFor("d30", ing.id);
    const s = statusFor(stock, d7, d30);
    if (filter === "alerta") return s === "urgent" || s === "warning" || s === "empty";
    return s === filter;
  });

  // Contadores de resumo
  const counts = ingredients.reduce(
    (acc, ing) => {
      const stock = Number(ing.stock_quantity ?? 0);
      const d7 = demandFor("d7", ing.id);
      const d30 = demandFor("d30", ing.id);
      const s = statusFor(stock, d7, d30);
      acc[s] = (acc[s] ?? 0) + 1;
      return acc;
    },
    {} as Record<StatusKind, number>
  );

  return (
    <>
      {/* Resumo cards */}
      <div className="mb-4 grid grid-cols-2 gap-2 sm:grid-cols-4">
        <SummaryPill
          label="Em ordem"
          value={counts.ok ?? 0}
          tone="success"
          icon={<PackageCheck className="h-4 w-4" />}
        />
        <SummaryPill
          label="Repor logo"
          value={counts.warning ?? 0}
          tone="warning"
        />
        <SummaryPill
          label="Urgente"
          value={counts.urgent ?? 0}
          tone="destructive"
          icon={<AlertTriangle className="h-4 w-4" />}
        />
        <SummaryPill label="Sem estoque" value={counts.empty ?? 0} tone="muted" />
      </div>

      {/* Busca */}
      <div className="relative mb-3 max-w-md">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Buscar ingrediente no estoque..."
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

      {/* Filtros */}
      <div className="mb-3 flex flex-wrap gap-2">
        <FilterChip
          label={`Todos (${ingredients.length})`}
          active={filter === "todos"}
          onClick={() => setFilter("todos")}
        />
        <FilterChip
          label={`Precisa repor (${(counts.urgent ?? 0) + (counts.warning ?? 0) + (counts.empty ?? 0)})`}
          active={filter === "alerta"}
          onClick={() => setFilter("alerta")}
        />
        <FilterChip
          label={`🔴 Urgente (${counts.urgent ?? 0})`}
          active={filter === "urgent"}
          onClick={() => setFilter("urgent")}
        />
        <FilterChip
          label={`🟡 Repor logo (${counts.warning ?? 0})`}
          active={filter === "warning"}
          onClick={() => setFilter("warning")}
        />
        <FilterChip
          label={`🟢 OK (${counts.ok ?? 0})`}
          active={filter === "ok"}
          onClick={() => setFilter("ok")}
        />
        <FilterChip
          label={`⚪ Sem estoque (${counts.empty ?? 0})`}
          active={filter === "empty"}
          onClick={() => setFilter("empty")}
        />
      </div>

      {/* Lista de cards */}
      {filtered.length === 0 ? (
        <Card>
          <CardContent className="p-6 text-center text-sm text-muted-foreground">
            {filter === "alerta"
              ? "Tudo certo — nenhum ingrediente precisando repor 🎉"
              : "Nenhum ingrediente cadastrado."}
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {filtered.map((ing) => {
            const stock = Number(ing.stock_quantity ?? 0);
            const d7 = demandFor("d7", ing.id);
            const d30 = demandFor("d30", ing.id);
            const status = statusFor(stock, d7, d30);
            const shortfall7 = d7 - stock;
            const u = unitLabel(ing.unit);
            const busy = savingId === ing.id;

            return (
              <Card
                key={ing.id}
                className={cn(
                  "transition-opacity",
                  busy && "opacity-60",
                  status === "urgent" && "border-destructive/40",
                  status === "warning" && "border-amber-300"
                )}
              >
                <CardContent className="p-4">
                  {/* Linha 1: nome + status */}
                  <div className="mb-3 flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="truncate text-base font-semibold">{ing.name}</div>
                      <div className="text-xs text-muted-foreground">
                        Unidade: {u}
                      </div>
                    </div>
                    <StatusBadge status={status} shortfall={shortfall7} unit={u} />
                  </div>

                  {/* Linha 2: estoque grande + ajustes */}
                  <div className="flex items-center justify-between gap-3 rounded-lg bg-muted/40 p-3">
                    <div>
                      <div className="text-[11px] uppercase tracking-wide text-muted-foreground">
                        Estoque atual
                      </div>
                      <div className="mt-0.5 flex items-baseline gap-1">
                        <span className="text-2xl font-bold tabular-nums">
                          {fmtQty(stock)}
                        </span>
                        <span className="text-sm text-muted-foreground">{u}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Button
                        variant="outline"
                        size="icon"
                        className="h-10 w-10"
                        disabled={busy || stock <= 0}
                        onClick={() => handleAdjust(ing, -1)}
                        title={`Tirar 1 ${u} do estoque`}
                      >
                        <Minus className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="icon"
                        className="h-10 w-10"
                        disabled={busy}
                        onClick={() => handleAdjust(ing, 1)}
                        title={`Adicionar 1 ${u} ao estoque`}
                      >
                        <Plus className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="default"
                        size="sm"
                        className="h-10"
                        disabled={busy}
                        onClick={() => openEdit(ing)}
                      >
                        <Pencil className="h-4 w-4" /> Definir
                      </Button>
                    </div>
                  </div>

                  {/* Linha 3: demanda nos horizontes */}
                  <div className="mt-3 grid grid-cols-3 gap-2">
                    {horizons.map((h) => {
                      const need = demandFor(h.key, ing.id);
                      const diff = need - stock;
                      const has = need > 0;
                      return (
                        <div
                          key={h.key}
                          className="rounded-md border bg-background px-2 py-1.5"
                        >
                          <div className="text-[10px] uppercase tracking-wide text-muted-foreground">
                            {h.label}
                          </div>
                          {has ? (
                            <>
                              <div className="text-sm font-medium tabular-nums">
                                {fmtQty(need)} {u}
                              </div>
                              {diff > 0 ? (
                                <div className="mt-0.5 text-[11px] font-medium text-destructive">
                                  faltam {fmtQty(diff)}
                                </div>
                              ) : (
                                <div className="mt-0.5 text-[11px] text-emerald-700">
                                  ok ✓
                                </div>
                              )}
                            </>
                          ) : (
                            <div className="text-sm text-muted-foreground">—</div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Dialog de definir valor exato */}
      <Dialog open={!!editing} onOpenChange={(v) => !v && setEditing(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>
              {editing?.name}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-2">
            <Label>Quantidade em estoque ({editing ? unitLabel(editing.unit) : ""})</Label>
            <Input
              inputMode="decimal"
              autoFocus
              value={editValue}
              onChange={(e) => setEditValue(e.target.value)}
              onFocus={(e) => e.target.select()}
            />
            <p className="text-xs text-muted-foreground">
              Defina o valor atual (ex: depois de comprar ou produzir).
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

function SummaryPill({
  label,
  value,
  tone,
  icon,
}: {
  label: string;
  value: number;
  tone: "success" | "warning" | "destructive" | "muted";
  icon?: React.ReactNode;
}) {
  const tones: Record<string, string> = {
    success: "border-emerald-300 bg-emerald-50 text-emerald-900",
    warning: "border-amber-300 bg-amber-50 text-amber-900",
    destructive: "border-destructive/40 bg-destructive/5 text-destructive",
    muted: "border-border bg-muted/40 text-muted-foreground",
  };
  return (
    <div className={cn("rounded-lg border p-3", tones[tone])}>
      <div className="flex items-center gap-1.5 text-[11px] font-medium uppercase tracking-wide">
        {icon}
        {label}
      </div>
      <div className="mt-0.5 text-xl font-bold tabular-nums">{value}</div>
    </div>
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
        "rounded-full px-3 py-1.5 text-sm transition-colors",
        active
          ? "bg-primary text-primary-foreground"
          : "bg-muted text-foreground hover:bg-muted/80"
      )}
    >
      {label}
    </button>
  );
}

function StatusBadge({
  status,
  shortfall,
  unit,
}: {
  status: StatusKind;
  shortfall: number;
  unit: string;
}) {
  if (status === "urgent") {
    return (
      <Badge variant="destructive" className="shrink-0">
        Urgente
        {shortfall > 0 && (
          <span className="ml-1 opacity-90">· faltam {fmtQty(shortfall)} {unit}</span>
        )}
      </Badge>
    );
  }
  if (status === "warning") {
    return (
      <Badge variant="warning" className="shrink-0">
        Repor logo
      </Badge>
    );
  }
  if (status === "ok") {
    return (
      <Badge variant="success" className="shrink-0">
        OK
      </Badge>
    );
  }
  return (
    <Badge variant="outline" className="shrink-0">
      Sem estoque
    </Badge>
  );
}
