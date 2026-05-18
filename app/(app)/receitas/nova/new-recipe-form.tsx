"use client";

import { useState } from "react";
import { Loader2 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import { createRecipe } from "../actions";

export function NewRecipeForm() {
  const { toast } = useToast();
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    setSubmitting(true);
    try {
      await createRecipe({
        name: name.trim(),
        description: description.trim() || undefined,
      });
      // createRecipe redireciona para /receitas/[id] — não precisa de setSubmitting(false)
    } catch (e) {
      toast({
        title: "Erro ao criar receita",
        description: e instanceof Error ? e.message : String(e),
        variant: "destructive",
      });
      setSubmitting(false);
    }
  }

  const canSubmit = name.trim().length > 0 && !submitting;

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
          <div className="flex flex-col items-end gap-1">
            <Button type="submit" disabled={!canSubmit}>
              {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
              {submitting ? "Criando..." : "Criar receita"}
            </Button>
            {!name.trim() && (
              <span className="text-xs text-muted-foreground">Informe o nome da receita</span>
            )}
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
