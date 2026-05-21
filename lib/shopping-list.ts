import { convertQuantity, lossFactor, type RecipeSizeWithIngredients } from "./pricing";
import type { Ingredient, IngredientUnit } from "@/types/database";

export interface ShoppingListLine {
  ingredient: Ingredient;
  /** Quantidade necessária PARA COMPRAR (já com perda aplicada). */
  totalQuantity: number;
  /** Quantidade líquida da receita (sem perda) — útil pra ver o "puro". */
  totalQuantityNet: number;
  unit: IngredientUnit;
  totalCost: number;
}

export interface DeliveryAggregateInput {
  recipe_size: RecipeSizeWithIngredients;
  quantity: number; // qtd de porções desta receita-tamanho na entrega
}

/**
 * Agrega demanda de ingredientes para várias entregas/quantidades.
 * Aplica a % de perda do ingrediente — o `totalQuantity` reflete o
 * que precisa ser COMPRADO (raw), não o que vai pro prato.
 */
export function aggregateIngredients(items: DeliveryAggregateInput[]): ShoppingListLine[] {
  const acc = new Map<string, ShoppingListLine>();

  for (const item of items) {
    for (const line of item.recipe_size.ingredients) {
      const totalQty = line.quantity * item.quantity;
      const ing = line.ingredient;
      const converted = convertQuantity(totalQty, line.unit, ing.unit);
      if (!Number.isFinite(converted)) continue;

      const factor = lossFactor(ing);
      const rawQty = converted * factor;

      const existing = acc.get(ing.id);
      if (existing) {
        existing.totalQuantity += rawQty;
        existing.totalQuantityNet += converted;
        existing.totalCost += rawQty * (ing.price_per_unit ?? 0);
      } else {
        acc.set(ing.id, {
          ingredient: ing,
          totalQuantity: rawQty,
          totalQuantityNet: converted,
          unit: ing.unit,
          totalCost: rawQty * (ing.price_per_unit ?? 0),
        });
      }
    }
  }

  return Array.from(acc.values()).sort((a, b) =>
    a.ingredient.name.localeCompare(b.ingredient.name, "pt-BR")
  );
}
