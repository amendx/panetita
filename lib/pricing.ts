import type {
  Ingredient,
  IngredientUnit,
  PricingStrategy,
  RecipeSize,
  RecipeSizeIngredient,
  Combo,
  ComboItem,
} from "@/types/database";

const TO_BASE: Record<IngredientUnit, { base: "mass" | "volume" | "count"; factor: number }> = {
  g: { base: "mass", factor: 1 },
  kg: { base: "mass", factor: 1000 },
  un: { base: "count", factor: 1 },
  ml: { base: "volume", factor: 1 },
  l: { base: "volume", factor: 1000 },
};

/**
 * Converts an amount in `fromUnit` into the ingredient's `priceUnit`. Returns
 * NaN when units are incompatible (e.g. mass vs count).
 */
export function convertQuantity(
  quantity: number,
  fromUnit: IngredientUnit,
  toUnit: IngredientUnit
): number {
  const from = TO_BASE[fromUnit];
  const to = TO_BASE[toUnit];
  if (from.base !== to.base) return NaN;
  return (quantity * from.factor) / to.factor;
}

export function ingredientLineCost(
  ingredient: Ingredient,
  quantity: number,
  unit: IngredientUnit
): number {
  const converted = convertQuantity(quantity, unit, ingredient.unit);
  if (!Number.isFinite(converted)) return 0;
  return converted * (ingredient.price_per_unit ?? 0);
}

export interface RecipeSizeWithIngredients extends RecipeSize {
  ingredients: Array<RecipeSizeIngredient & { ingredient: Ingredient }>;
}

export function recipeSizeCost(size: RecipeSizeWithIngredients): number {
  return size.ingredients.reduce(
    (acc, line) => acc + ingredientLineCost(line.ingredient, line.quantity, line.unit),
    0
  );
}

export interface ComboWithItems extends Combo {
  items: Array<ComboItem & { recipe_size: RecipeSizeWithIngredients }>;
}

export function comboCost(combo: ComboWithItems): number {
  return combo.items.reduce(
    (acc, item) => acc + recipeSizeCost(item.recipe_size) * Number(item.quantity),
    0
  );
}

/**
 * Soma o preço de venda das receitas do combo (sem desconto).
 * Cada receita usa seu `fixed_price`; se vazio, cai pra custo × 2.
 */
export function comboItemsSubtotal(combo: ComboWithItems): number {
  return combo.items.reduce((acc, item) => {
    const fp = item.recipe_size.fixed_price;
    const itemPrice =
      fp != null && Number(fp) > 0 ? Number(fp) : recipeSizeCost(item.recipe_size) * 2;
    return acc + itemPrice * Number(item.quantity);
  }, 0);
}

/**
 * Preço final do combo = subtotal das receitas × (1 − desconto%).
 * Se houver `fixed_price` cadastrado, ele tem prioridade (modo legado/manual).
 */
export function comboCalculatedPrice(combo: ComboWithItems): number {
  if (combo.fixed_price != null && Number(combo.fixed_price) > 0) {
    return Number(combo.fixed_price);
  }
  const subtotal = comboItemsSubtotal(combo);
  const discount = Number(combo.discount_pct ?? 0);
  return subtotal * (1 - discount / 100);
}

/** Mantido para compatibilidade. Devolve o preço calculado. */
export function comboSuggestedPrice(combo: ComboWithItems): number {
  return comboCalculatedPrice(combo);
}

/**
 * Resolves the unit price of an order item given the chosen pricing strategy.
 */
export function resolveUnitPrice(opts: {
  strategy: PricingStrategy;
  basePrice: number | null;
  unitCost: number;
  marginPct: number | null;
  overridePrice?: number | null;
}): number {
  const { strategy, basePrice, unitCost, marginPct, overridePrice } = opts;

  if (strategy === "fixed") {
    // Sem preço cadastrado, sugere cost*2 (100% markup) para evitar total zerado.
    return basePrice ?? (unitCost > 0 ? unitCost * 2 : 0);
  }
  if (strategy === "fixed_editable") {
    if (overridePrice != null) return overridePrice;
    if (basePrice != null) return basePrice;
    // Sem preço cadastrado: sugere cost*2 como ponto de partida editável.
    return unitCost > 0 ? unitCost * 2 : 0;
  }
  // margin: price = cost / (1 - marginPct/100)
  const m = (marginPct ?? 0) / 100;
  if (m >= 1) return unitCost;
  return unitCost / (1 - m);
}

export interface OrderItemTotals {
  unit_price: number;
  unit_cost: number;
  line_total: number;
  line_cost: number;
}

export function orderItemTotals(opts: {
  quantity: number;
  unit_price: number;
  unit_cost: number;
}): OrderItemTotals {
  return {
    unit_price: opts.unit_price,
    unit_cost: opts.unit_cost,
    line_total: opts.quantity * opts.unit_price,
    line_cost: opts.quantity * opts.unit_cost,
  };
}

export interface OrderTotals {
  total_price: number;
  total_cost: number;
  profit: number;
  margin_pct: number;
}

export function orderTotals(items: { line_total: number; line_cost: number }[]): OrderTotals {
  const total_price = items.reduce((a, i) => a + i.line_total, 0);
  const total_cost = items.reduce((a, i) => a + i.line_cost, 0);
  const profit = total_price - total_cost;
  const margin_pct = total_price > 0 ? (profit / total_price) * 100 : 0;
  return { total_price, total_cost, profit, margin_pct };
}
