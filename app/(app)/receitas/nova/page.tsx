import { createClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/layout/page-header";
import { NewRecipeForm, type PetOption } from "./new-recipe-form";

export const dynamic = "force-dynamic";

export default async function NovaReceitaPage({
  searchParams,
}: {
  searchParams: Promise<{ pet?: string }>;
}) {
  const { pet: presetPetId } = await searchParams;
  const supabase = await createClient();
  const { data: pets } = await supabase
    .from("pets")
    .select("id, name, customers(name)")
    .order("name");

  const petOptions: PetOption[] = (pets ?? []).map((p) => ({
    id: p.id,
    name: p.name,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    customer_name: (p.customers as any)?.name ?? null,
  }));

  return (
    <div className="mx-auto max-w-xl">
      <PageHeader
        title="Nova receita"
        description="Você adicionará os tamanhos e ingredientes no próximo passo."
      />
      <NewRecipeForm pets={petOptions} presetPetId={presetPetId ?? null} />
    </div>
  );
}
