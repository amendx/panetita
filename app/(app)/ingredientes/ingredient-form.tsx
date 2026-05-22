"use client";

import { useState, useEffect } from "react";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { CurrencyInput } from "@/components/ui/currency-input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/components/ui/use-toast";
import { saveIngredient } from "./actions";
import type { Ingredient, IngredientUnit } from "@/types/database";

const UNITS: { value: IngredientUnit; label: string }[] = [
  { value: "g", label: "Grama (g)" },
  { value: "kg", label: "Quilograma (kg)" },
  { value: "un", label: "Unidade (un)" },
  { value: "ml", label: "Mililitro (ml)" },
  { value: "l", label: "Litro (L)" },
];

export function IngredientForm({
  open,
  onOpenChange,
  ingredient,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  ingredient: Ingredient | null;
}) {
  const { toast } = useToast();
  const [name, setName] = useState("");
  const [unit, setUnit] = useState<IngredientUnit>("kg");
  const [price, setPrice] = useState<number>(0);
  const [lossKind, setLossKind] = useState<"none" | "loss" | "gain">("none");
  const [lossAbs, setLossAbs] = useState("0");
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open) {
      setName(ingredient?.name ?? "");
      setUnit((ingredient?.unit as IngredientUnit) ?? "kg");
      setPrice(ingredient ? Number(ingredient.price_per_unit) : 0);
      const initial = Number(ingredient?.loss_pct ?? 0);
      if (initial > 0) {
        setLossKind("loss");
        setLossAbs(String(initial));
      } else if (initial < 0) {
        setLossKind("gain");
        setLossAbs(String(Math.abs(initial)));
      } else {
        setLossKind("none");
        setLossAbs("0");
      }
      setNotes(ingredient?.notes ?? "");
    }
  }, [open, ingredient]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      const absValue = Math.abs(parseFloat(lossAbs.replace(",", ".")) || 0);
      const signedLoss =
        lossKind === "loss" ? absValue : lossKind === "gain" ? -absValue : 0;
      await saveIngredient({
        id: ingredient?.id,
        name,
        unit,
        price_per_unit: price,
        loss_pct: signedLoss,
        notes: notes || null,
      });
      toast({ title: ingredient ? "Ingrediente atualizado" : "Ingrediente criado" });
      onOpenChange(false);
    } catch (e) {
      toast({
        title: "Erro ao salvar",
        description: e instanceof Error ? e.message : "Tente novamente",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{ingredient ? "Editar ingrediente" : "Novo ingrediente"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="name">Nome</Label>
            <Input
              id="name"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ex: Cordeiro moído"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="unit">Unidade</Label>
              <Select value={unit} onValueChange={(v) => setUnit(v as IngredientUnit)}>
                <SelectTrigger id="unit">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {UNITS.map((u) => (
                    <SelectItem key={u.value} value={u.value}>
                      {u.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="price">Preço por unidade</Label>
              <CurrencyInput id="price" value={price} onChange={setPrice} />
            </div>
          </div>
          <div className="space-y-2">
            <Label>Comportamento no preparo</Label>
            <div className="grid grid-cols-3 gap-2">
              <KindButton
                active={lossKind === "none"}
                onClick={() => setLossKind("none")}
                icon="⚪"
                label="Não muda"
              />
              <KindButton
                active={lossKind === "loss"}
                onClick={() => setLossKind("loss")}
                icon="📉"
                label="Perde"
                tone="warning"
              />
              <KindButton
                active={lossKind === "gain"}
                onClick={() => setLossKind("gain")}
                icon="📈"
                label="Rende mais"
                tone="success"
              />
            </div>

            {lossKind !== "none" && (
              <div>
                <Label htmlFor="loss-abs" className="text-xs">
                  Quanto?
                </Label>
                <div className="flex items-center gap-2">
                  <Input
                    id="loss-abs"
                    inputMode="decimal"
                    value={lossAbs}
                    onChange={(e) =>
                      setLossAbs(e.target.value.replace(/-/g, ""))
                    }
                    placeholder="30"
                  />
                  <span className="text-sm text-muted-foreground">%</span>
                </div>
                <p className="mt-1 text-xs text-muted-foreground">
                  {lossKind === "loss" ? (
                    <>
                      💡 Ex.: frango <strong>perde 30%</strong> — pra usar 100g na receita,
                      compra 130g.
                    </>
                  ) : (
                    <>
                      💡 Ex.: arroz <strong>rende 50%</strong> — 500g crus viram 1kg
                      cozido.
                    </>
                  )}
                </p>
              </div>
            )}
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="notes">Observações</Label>
            <Textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Marca, fornecedor, etc."
            />
          </div>
          <DialogFooter className="gap-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={saving || !name.trim()}>
              {saving && <Loader2 className="h-4 w-4 animate-spin" />}
              {saving ? "Salvando..." : "Salvar"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function KindButton({
  active,
  onClick,
  icon,
  label,
  tone,
}: {
  active: boolean;
  onClick: () => void;
  icon: string;
  label: string;
  tone?: "warning" | "success";
}) {
  const inactiveTone =
    tone === "warning"
      ? "hover:border-amber-300 hover:bg-amber-50"
      : tone === "success"
      ? "hover:border-emerald-300 hover:bg-emerald-50"
      : "hover:border-primary/40";
  const activeTone =
    tone === "warning"
      ? "border-amber-400 bg-amber-100/70 text-amber-900"
      : tone === "success"
      ? "border-emerald-400 bg-emerald-100/70 text-emerald-900"
      : "border-primary bg-primary/10 text-primary";
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex flex-col items-center gap-1 rounded-md border-2 p-2 text-xs font-medium transition-colors ${
        active ? activeTone : `border-border bg-card ${inactiveTone}`
      }`}
    >
      <span className="text-base">{icon}</span>
      <span>{label}</span>
    </button>
  );
}
