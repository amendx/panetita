import { createClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/layout/page-header";
import { ComboManager } from "./combo-manager";

export const dynamic = "force-dynamic";

export default async function CombosPage() {
  const supabase = await createClient();

  const [{ data: combos }, { data: sizes }] = await Promise.all([
    supabase
      .from("combos")
      .select(
        "*, combo_items(id, recipe_size_id, quantity, recipe_sizes(id, size_label, fixed_price, recipe_id, recipes(name), recipe_size_ingredients(id, quantity, unit, ingredient_id, ingredients(id, name, unit, price_per_unit))))"
      )
      .order("name"),
    supabase
      .from("recipe_sizes")
      .select("id, size_label, fixed_price, recipe_id, recipes(name)")
      .order("size_label"),
  ]);

  return (
    <div className="mx-auto max-w-5xl">
      <PageHeader
        title="Combos"
        description="Agrupe tamanhos de receitas e aplique um desconto sobre a soma dos preços."
      />
      <ComboManager combos={(combos ?? []) as never[]} sizes={(sizes ?? []) as never[]} />
    </div>
  );
}
