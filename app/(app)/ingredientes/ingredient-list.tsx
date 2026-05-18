"use client";

import { useState } from "react";
import { Loader2, Plus, Pencil, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
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
import { deleteIngredient } from "./actions";
import { IngredientForm } from "./ingredient-form";
import type { Ingredient } from "@/types/database";

export function IngredientList({ ingredients }: { ingredients: Ingredient[] }) {
  const { toast } = useToast();
  const [editing, setEditing] = useState<Ingredient | null>(null);
  const [open, setOpen] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

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
      <div className="mb-3 flex justify-end">
        <Button onClick={() => { setEditing(null); setOpen(true); }}>
          <Plus className="h-4 w-4" /> Novo ingrediente
        </Button>
      </div>

      <Card>
        <CardContent className="p-0">
          {ingredients.length === 0 ? (
            <p className="p-8 text-center text-sm text-muted-foreground">
              Nenhum ingrediente cadastrado.
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nome</TableHead>
                  <TableHead>Unidade</TableHead>
                  <TableHead className="text-right">Preço</TableHead>
                  <TableHead className="hidden sm:table-cell">Observações</TableHead>
                  <TableHead className="w-24"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {ingredients.map((i) => {
                  const isDeleting = deletingId === i.id;
                  return (
                    <TableRow key={i.id} className={isDeleting ? "opacity-50" : ""}>
                      <TableCell className="font-medium">{i.name}</TableCell>
                      <TableCell>{unitLabel(i.unit)}</TableCell>
                      <TableCell className="text-right tabular-nums">
                        {formatBRL(Number(i.price_per_unit))} / {unitLabel(i.unit)}
                      </TableCell>
                      <TableCell className="hidden text-muted-foreground sm:table-cell">
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
