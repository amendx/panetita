import { PageHeader } from "@/components/layout/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { createRecipe } from "../actions";

export default function NovaReceitaPage() {
  async function handle(formData: FormData) {
    "use server";
    await createRecipe({
      name: String(formData.get("name") ?? "").trim(),
      description: String(formData.get("description") ?? "").trim() || undefined,
    });
  }

  return (
    <div className="mx-auto max-w-xl">
      <PageHeader title="Nova receita" description="Você adicionará os tamanhos e ingredientes no próximo passo." />
      <Card>
        <CardContent className="p-6">
          <form action={handle} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="name">Nome</Label>
              <Input id="name" name="name" required placeholder="Ex: Panelinha de Cordeiro" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="description">Descrição</Label>
              <Textarea id="description" name="description" rows={3} />
            </div>
            <div className="flex justify-end">
              <Button type="submit">Criar receita</Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
