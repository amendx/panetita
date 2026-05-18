import Link from "next/link";
import { Plus, ChefHat } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { RecipesTable, type RecipeRow } from "./recipes-table";

export const dynamic = "force-dynamic";

export default async function ReceitasPage() {
  const supabase = await createClient();
  const { data: recipes } = await supabase
    .from("recipes")
    .select(
      `id, name, description,
       recipe_sizes(
         id, size_label, fixed_price,
         recipe_size_ingredients(
           id, quantity, unit, ingredient_id,
           ingredients(id, name, unit, price_per_unit)
         )
       )`
    )
    .order("name", { ascending: true });

  return (
    <div className="mx-auto max-w-6xl">
      <PageHeader
        title="Receitas"
        description="Suas panelinhas e tamanhos disponíveis"
        actions={
          <Button asChild>
            <Link href="/receitas/nova">
              <Plus className="h-4 w-4" /> Nova receita
            </Link>
          </Button>
        }
      />

      {(recipes?.length ?? 0) === 0 ? (
        <Card>
          <CardContent className="p-8 text-center text-muted-foreground">
            <ChefHat className="mx-auto mb-3 h-10 w-10 opacity-50" />
            Nenhuma receita cadastrada ainda.
          </CardContent>
        </Card>
      ) : (
        <RecipesTable recipes={(recipes ?? []) as unknown as RecipeRow[]} />
      )}
    </div>
  );
}
