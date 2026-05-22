"use client";

import { useState } from "react";
import Link from "next/link";
import { Loader2 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/components/ui/use-toast";
import { isRedirectError } from "@/lib/is-redirect-error";
import { createRecipe } from "../actions";

export interface PetOption {
  id: string;
  name: string;
  customer_name: string | null;
}

const NONE = "__none";

export function NewRecipeForm({
  pets,
  presetPetId,
}: {
  pets: PetOption[];
  presetPetId: string | null;
}) {
  const { toast } = useToast();
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [petId, setPetId] = useState<string>(presetPetId ?? NONE);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    setSubmitting(true);
    try {
      await createRecipe({
        name: name.trim(),
        description: description.trim() || undefined,
        pet_id: petId === NONE ? null : petId,
      });
      // createRecipe redireciona para /receitas/[id] — não precisa de setSubmitting(false)
    } catch (e) {
      if (isRedirectError(e)) throw e;
      toast({
        title: "Erro ao criar receita",
        description: e instanceof Error ? e.message : String(e),
        variant: "destructive",
      });
      setSubmitting(false);
    }
  }

  const canSubmit = name.trim().length > 0 && !submitting;
  const selectedPet = pets.find((p) => p.id === petId);

  return (
    <Card>
      <CardContent className="p-6">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="name">Nome</Label>
            <Input
              id="name"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ex: Panelinha de Cordeiro"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="description">Descrição</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="pet">Pet (opcional)</Label>
            <Select value={petId} onValueChange={setPetId}>
              <SelectTrigger id="pet">
                <SelectValue placeholder="Receita genérica (qualquer pet)" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={NONE}>Receita genérica (qualquer pet)</SelectItem>
                {pets.map((p) => (
                  <SelectItem key={p.id} value={p.id}>
                    🎯 {p.name}
                    {p.customer_name ? ` — ${p.customer_name}` : ""}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">
              {selectedPet
                ? `Esta receita será marcada como sob medida para ${selectedPet.name}. Você ainda pode usá-la em pedidos de outros pets — a UI só vai avisar.`
                : "Deixe em branco se a receita serve qualquer pet."}
            </p>
          </div>
          <div className="flex flex-col items-end gap-1">
            <div className="flex gap-2">
              <Button asChild type="button" variant="outline" disabled={submitting}>
                <Link href="/receitas">Cancelar</Link>
              </Button>
              <Button type="submit" disabled={!canSubmit}>
                {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
                {submitting ? "Criando..." : "Criar receita"}
              </Button>
            </div>
            {!name.trim() && (
              <span className="text-xs text-muted-foreground">Informe o nome da receita</span>
            )}
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
