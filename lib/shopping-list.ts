import { convertQuantity, type RecipeSizeWithIngredients } from "./pricing";
import type { Ingredient, IngredientUnit } from "@/types/database";

export interface ShoppingListLine {
  ingredient: Ingredient;
  totalQuantity: number;
  unit: IngredientUnit;
  totalCost: number;
}

export interface DeliveryAggregateInput {
  recipe_size: RecipeSizeWithIngredients;
  quantity: number; // qtd de porções desta receita-tamanho na entrega
}

/**
 * Aggregates the ingredient demand across many recipe-size×qty pairs.
 * Returns one line per ingredient, summed in the ingredient's own unit.
 */
export function aggregateIngredients(items: DeliveryAggregateInput[]): ShoppingListLine[] {
  const acc = new Map<string, ShoppingListLine>();

  for (const item of items) {
    for (const line of item.recipe_size.ingredients) {
      const totalQty = line.quantity * item.quantity;
      const ing = line.ingredient;
      const converted = convertQuantity(totalQty, line.unit, ing.unit);
      if (!Number.isFinite(converted)) continue;

      const existing = acc.get(ing.id);
      if (existing) {
        existing.totalQuantity += converted;
        existing.totalCost += converted * (ing.price_per_unit ?? 0);
      } else {
        acc.set(ing.id, {
          ingredient: ing,
          totalQuantity: converted,
          unit: ing.unit,
          totalCost: converted * (ing.price_per_unit ?? 0),
        });
      }
    }
  }

  return Array.from(acc.values()).sort((a, b) =>
    a.ingredient.name.localeCompare(b.ingredient.name, "pt-BR")
  );
}
