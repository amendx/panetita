"use client";

import { useMemo, useState } from "react";
import { Loader2, Plus, Pencil, Search, Trash2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardContent } from "@/components/ui/card";
import { useToast } from "@/components/ui/use-toast";
import { formatBRL, unitLabel } from "@/lib/format";
import { cn } from "@/lib/utils";
import { deleteIngredient } from "./actions";
import { IngredientForm } from "./ingredient-form";
import type { Ingredient } from "@/types/database";

type Filter = "all" | "no-price" | "in-stock" | "out-of-stock";

export function IngredientList({ ingredients }: { ingredients: Ingredient[] }) {
  const { toast } = useToast();
  const [editing, setEditing] = useState<Ingredient | null>(null);
  const [open, setOpen] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<Filter>("all");
  const [unitFilter, setUnitFilter] = useState<string>("all");

  // Coleta unidades disponíveis dinamicamente
  const availableUnits = useMemo(() => {
    const set = new Set(ingredients.map((i) => i.unit));
    return Array.from(set);
  }, [ingredients]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return ingredients.filter((i) => {
      // busca
      if (q && !i.name.toLowerCase().includes(q)) return false;
      // unidade
      if (unitFilter !== "all" && i.unit !== unitFilter) return false;
      // status
      const price = Number(i.price_per_unit ?? 0);
      const stock = Number(i.stock_quantity ?? 0);
      if (filter === "no-price" && price > 0) return false;
      if (filter === "in-stock" && stock <= 0) return false;
      if (filter === "out-of-stock" && stock > 0) return false;
      return true;
    });
  }, [ingredients, search, filter, unitFilter]);

  const counts = useMemo(() => {
    return {
      noPrice: ingredients.filter((i) => Number(i.price_per_unit ?? 0) === 0).length,
      inStock: ingredients.filter((i) => Number(i.stock_quantity ?? 0) > 0).length,
      outOfStock: ingredients.filter((i) => Number(i.stock_quantity ?? 0) === 0).length,
    };
  }, [ingredients]);

  async function handleDelete(id: string) {
    if (!confirm("Excluir este ingrediente?")) return;
    setDeletingId(id);
    try {
      await deleteIngredient(id);
      toast({ title: "Ingrediente excluído" });
    } catch (e) {
      toast({
        title: "Erro ao excluir",
        description: e instanceof Error ? e.message : "Tente novamente",
        variant: "destructive",
      });
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <>
      {/* Header de busca + filtros + botao */}
      <div className="mb-3 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative flex-1 max-w-md">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Buscar ingrediente..."
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
        <Button onClick={() => { setEditing(null); setOpen(true); }}>
          <Plus className="h-4 w-4" /> Novo ingrediente
        </Button>
      </div>

      {/* Filtros em chips */}
      <div className="mb-3 flex flex-wrap gap-2">
        <FilterChip
          label={`Todos (${ingredients.length})`}
          active={filter === "all"}
          onClick={() => setFilter("all")}
        />
        <FilterChip
          label={`Sem preço (${counts.noPrice})`}
          active={filter === "no-price"}
          onClick={() => setFilter("no-price")}
          tone={counts.noPrice > 0 ? "warning" : undefined}
        />
        <FilterChip
          label={`Em estoque (${counts.inStock})`}
          active={filter === "in-stock"}
          onClick={() => setFilter("in-stock")}
        />
        <FilterChip
          label={`Zerados (${counts.outOfStock})`}
          active={filter === "out-of-stock"}
          onClick={() => setFilter("out-of-stock")}
        />

        {availableUnits.length > 1 && (
          <>
            <span className="mx-1 self-center text-xs text-muted-foreground">·</span>
            <FilterChip
              label="Todas unidades"
              active={unitFilter === "all"}
              onClick={() => setUnitFilter("all")}
            />
            {availableUnits.map((u) => (
              <FilterChip
                key={u}
                label={unitLabel(u)}
                active={unitFilter === u}
                onClick={() => setUnitFilter(u)}
              />
            ))}
          </>
        )}
      </div>

      <Card>
        <CardContent className="p-0">
          {ingredients.length === 0 ? (
            <p className="p-8 text-center text-sm text-muted-foreground">
              Nenhum ingrediente cadastrado.
            </p>
          ) : filtered.length === 0 ? (
            <p className="p-8 text-center text-sm text-muted-foreground">
              Nenhum ingrediente bate com a busca/filtros.
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nome</TableHead>
                  <TableHead>Unidade</TableHead>
                  <TableHead className="text-right">Preço</TableHead>
                  <TableHead className="hidden text-right sm:table-cell">Estoque</TableHead>
                  <TableHead className="hidden md:table-cell">Observações</TableHead>
                  <TableHead className="w-24"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((i) => {
                  const isDeleting = deletingId === i.id;
                  const noPrice = Number(i.price_per_unit ?? 0) === 0;
                  const stock = Number(i.stock_quantity ?? 0);
                  return (
                    <TableRow key={i.id} className={isDeleting ? "opacity-50" : ""}>
                      <TableCell className="font-medium">{i.name}</TableCell>
                      <TableCell>{unitLabel(i.unit)}</TableCell>
                      <TableCell className="text-right tabular-nums">
                        {noPrice ? (
                          <span className="text-xs text-amber-700">sem preço</span>
                        ) : (
                          <>
                            {formatBRL(Number(i.price_per_unit))} / {unitLabel(i.unit)}
                          </>
                        )}
                      </TableCell>
                      <TableCell className="hidden text-right text-sm sm:table-cell">
                        {stock > 0 ? (
                          <span className="tabular-nums">
                            {stock} {unitLabel(i.unit)}
                          </span>
                        ) : (
                          <span className="text-xs text-muted-foreground">—</span>
                        )}
                      </TableCell>
                      <TableCell className="hidden text-muted-foreground md:table-cell">
                        {i.notes}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          size="icon"
                          disabled={isDeleting}
                          onClick={() => { setEditing(i); setOpen(true); }}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          disabled={isDeleting}
                          onClick={() => handleDelete(i.id)}
                        >
                          {isDeleting ? (
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
        </CardContent>
      </Card>

      <IngredientForm open={open} onOpenChange={setOpen} ingredient={editing} />
    </>
  );
}

function FilterChip({
  label,
  active,
  onClick,
  tone,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
  tone?: "warning";
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "rounded-full px-3 py-1.5 text-xs font-medium transition-colors",
        active
          ? "bg-primary text-primary-foreground"
          : tone === "warning"
          ? "bg-amber-100 text-amber-900 hover:bg-amber-200"
          : "bg-muted text-foreground hover:bg-muted/80"
      )}
    >
      {label}
    </button>
  );
}
