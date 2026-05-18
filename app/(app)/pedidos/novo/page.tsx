import { createClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/layout/page-header";
import { OrderWizard, type OrderWizardData } from "./order-wizard";

export const dynamic = "force-dynamic";

export default async function NovoPedidoPage({
  searchParams,
}: {
  searchParams: Promise<{ cliente?: string }>;
}) {
  const { cliente } = await searchParams;
  const supabase = await createClient();

  const [{ data: customers }, { data: sizes }, { data: combos }] = await Promise.all([
    supabase
      .from("customers")
      .select("id, name, addresses(id, label, street, number, is_default)")
      .order("name"),
    supabase
      .from("recipe_sizes")
      .select(
        "id, size_label, fixed_price, recipe_id, recipes(name), recipe_size_ingredients(id, quantity, unit, ingredient_id, ingredients(id, name, unit, price_per_unit))"
      )
      .order("size_label"),
    supabase
      .from("combos")
      .select(
        "id, name, fixed_price, discount_pct, combo_items(id, quantity, recipe_size_id, recipe_sizes(id, size_label, fixed_price, recipe_id, recipes(name), recipe_size_ingredients(id, quantity, unit, ingredient_id, ingredients(id, name, unit, price_per_unit))))"
      )
      .order("name"),
  ]);

  const data: OrderWizardData = {
    customers: (customers ?? []) as never[],
    sizes: (sizes ?? []) as never[],
    combos: (combos ?? []) as never[],
    initialCustomerId: cliente ?? null,
  };

  return (
    <div className="mx-auto max-w-5xl">
      <PageHeader title="Novo pedido" description="Cliente, itens, entregas e pagamento" />
      <OrderWizard data={data} />
    </div>
  );
}
