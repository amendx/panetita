import { PageHeader } from "@/components/layout/page-header";
import { NewRecipeForm } from "./new-recipe-form";

export default function NovaReceitaPage() {
  return (
    <div className="mx-auto max-w-xl">
      <PageHeader
        title="Nova receita"
        description="Você adicionará os tamanhos e ingredientes no próximo passo."
      />
      <NewRecipeForm />
    </div>
  );
}
