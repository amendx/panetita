import type {
  Ingredient,
  IngredientUnit,
  PricingStrategy,
  ProfitCalcMode,
  Recurrence,
  RecipeSize,
  RecipeSizeIngredient,
  Combo,
  ComboItem,
} from "@/types/database";

/**
 * Calcula o preço a partir do custo e da porcentagem informada,
 * respeitando o modo escolhido pelo usuário:
 *   - margin: a % é sobre o PREÇO final. preço = custo / (1 - p)
 *   - markup: a % é sobre o CUSTO.       preço = custo * (1 + p)
 */
export function priceFromCostPct(
  cost: number,
  pct: number,
  mode: ProfitCalcMode
): number {
  if (cost <= 0) return 0;
  const p = (pct || 0) / 100;
  if (mode === "markup") return cost * (1 + p);
  if (p >= 1) return cost;
  return cost / (1 - p);
}

/**
 * Calcula a porcentagem que liga custo→preço no modo escolhido.
 *   - margin: ((preço - custo) / preço) * 100
 *   - markup: ((preço - custo) / custo) * 100
 */
export function pctFromCostPrice(
  cost: number,
  price: number,
  mode: ProfitCalcMode
): number {
  if (price <= 0) return 0;
  if (mode === "markup") return cost > 0 ? ((price - cost) / cost) * 100 : 0;
  return ((price - cost) / price) * 100;
}

export const profitModeLabel = (mode: ProfitCalcMode): string =>
  mode === "markup" ? "Markup" : "Margem";

/**
 * Devolve o preço unitário cadastrado adequado à recorrência do pedido.
 * Mensal usa `fixed_price_monthly` (que tem o desconto); o resto usa `fixed_price`.
 */
export function recipeSizeUnitPriceFor(
  size: { fixed_price: number | null; fixed_price_monthly?: number | null },
  recurrence: Recurrence
): number | null {
  if (recurrence === "monthly") {
    const monthly = size.fixed_price_monthly;
    if (monthly != null && Number(monthly) > 0) return Number(monthly);
  }
  return size.fixed_price != null ? Number(size.fixed_price) : null;
}

/**
 * Desconto em % do preço mensal em relação ao semanal (positivo = desconto).
 * Retorna null se faltar algum dos preços.
 */
export function monthlyDiscountPct(size: {
  fixed_price: number | null;
  fixed_price_monthly?: number | null;
}): number | null {
  const w = size.fixed_price != null ? Number(size.fixed_price) : null;
  const m =
    size.fixed_price_monthly != null ? Number(size.fixed_price_monthly) : null;
  if (w == null || m == null || w <= 0) return null;
  return ((w - m) / w) * 100;
}

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
  profitMode?: ProfitCalcMode;
}): number {
  const { strategy, basePrice, unitCost, marginPct, overridePrice, profitMode } = opts;

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
  // strategy === "margin": usa o modo escolhido pelo usuário.
  return priceFromCostPct(unitCost, marginPct ?? 0, profitMode ?? "margin");
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
