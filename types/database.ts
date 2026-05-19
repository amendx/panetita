export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type Recurrence = "single" | "weekly" | "biweekly" | "monthly" | "custom";
export type PricingStrategy = "fixed" | "fixed_editable" | "margin";
export type OrderStatus = "draft" | "confirmed" | "delivered" | "cancelled";
export type DeliveryStatus = "scheduled" | "delivered" | "cancelled";
export type DeliveryType = "uber_99" | "pickup";
export type PaymentStatus = "pending" | "paid" | "overdue";
export type PaymentMethod = "pix" | "cash" | "card" | "transfer" | "other";
export type IngredientUnit = "g" | "kg" | "un" | "ml" | "l";
export type MeasureType = "portion" | "weight";
export type MeasureUnit = "un" | "g" | "kg";
export type ProfitCalcMode = "margin" | "markup";

export interface UserSettings {
  user_id: string;
  profit_calc_mode: ProfitCalcMode;
  created_at: string;
  updated_at: string;
}

export interface Ingredient {
  id: string;
  user_id: string;
  name: string;
  unit: IngredientUnit;
  price_per_unit: number;
  stock_quantity: number;
  notes: string | null;
  created_at: string;
}

export interface Recipe {
  id: string;
  user_id: string;
  name: string;
  description: string | null;
  photo_url: string | null;
  created_at: string;
}

export interface RecipeSize {
  id: string;
  recipe_id: string;
  user_id: string;
  size_label: string;
  /** Preço unitário no plano semanal (ou avulso) */
  fixed_price: number | null;
  /** Preço unitário no plano mensal (com desconto). Pode estar ausente em mocks antigos. */
  fixed_price_monthly?: number | null;
  notes: string | null;
}

export interface RecipeSizeIngredient {
  id: string;
  recipe_size_id: string;
  user_id: string;
  ingredient_id: string;
  quantity: number;
  unit: IngredientUnit;
}

export interface Combo {
  id: string;
  user_id: string;
  name: string;
  description: string | null;
  fixed_price: number | null;
  discount_pct: number;
  created_at: string;
}

export interface ComboItem {
  id: string;
  combo_id: string;
  user_id: string;
  recipe_size_id: string;
  quantity: number;
}

export interface Customer {
  id: string;
  user_id: string;
  name: string;
  phone: string | null;
  email: string | null;
  source: string | null;
  notes: string | null;
  created_at: string;
}

export interface Pet {
  id: string;
  customer_id: string;
  user_id: string;
  name: string;
  weight_kg: number | null;
  breed: string | null;
  /** Restrições alimentares / avisos importantes que aparecem no pedido */
  restrictions: string | null;
  notes: string | null;
  photo_url: string | null;
}

export interface Address {
  id: string;
  customer_id: string;
  user_id: string;
  label: string | null;
  street: string;
  number: string | null;
  complement: string | null;
  neighborhood: string | null;
  city: string | null;
  state: string | null;
  zip: string | null;
  is_default: boolean;
}

export interface Order {
  id: string;
  user_id: string;
  customer_id: string;
  pet_id: string | null;
  address_id: string | null;
  recurrence: Recurrence;
  pricing_strategy: PricingStrategy;
  margin_pct: number | null;
  total_price: number;
  total_cost: number;
  profit: number;
  notes: string | null;
  status: OrderStatus;
  created_at: string;
}

export interface OrderItem {
  id: string;
  order_id: string;
  user_id: string;
  recipe_size_id: string | null;
  combo_id: string | null;
  quantity: number;
  measure_type: MeasureType;
  measure_unit: MeasureUnit;
  unit_price: number;
  unit_cost: number;
  line_total: number;
  line_cost: number;
}

export interface Delivery {
  id: string;
  order_id: string;
  user_id: string;
  address_id: string | null;
  scheduled_date: string;
  scheduled_time: string | null;
  status: DeliveryStatus;
  delivery_type: DeliveryType;
  delivered_at: string | null;
  notes: string | null;
}

export interface DeliveryItem {
  id: string;
  delivery_id: string;
  order_item_id: string;
  user_id: string;
  quantity: number;
}

export interface Payment {
  id: string;
  order_id: string;
  user_id: string;
  amount: number;
  method: PaymentMethod;
  paid_at: string | null;
  due_date: string | null;
  status: PaymentStatus;
  notes: string | null;
}

export interface BusinessSettings {
  id: string;
  monthly_rent: number;
  monthly_energy: number;
  monthly_marketing: number;
  monthly_mei: number;
  /** % do lucro bruto destinado ao fundo de reserva (default 3) */
  reserve_pct: number;
  /** Estimativa de panelinhas/mês — para diluir o custo fixo */
  estimated_units_per_month: number;
  updated_at: string;
}

type Row<T> = T;
type Insert<T> = Partial<T> & Record<string, unknown>;
type Update<T> = Partial<T> & Record<string, unknown>;

type TableDef<T> = { Row: Row<T>; Insert: Insert<T>; Update: Update<T>; Relationships: [] };

export interface Database {
  public: {
    Tables: {
      ingredients: TableDef<Ingredient>;
      recipes: TableDef<Recipe>;
      recipe_sizes: TableDef<RecipeSize>;
      recipe_size_ingredients: TableDef<RecipeSizeIngredient>;
      combos: TableDef<Combo>;
      combo_items: TableDef<ComboItem>;
      customers: TableDef<Customer>;
      pets: TableDef<Pet>;
      addresses: TableDef<Address>;
      orders: TableDef<Order>;
      order_items: TableDef<OrderItem>;
      deliveries: TableDef<Delivery>;
      delivery_items: TableDef<DeliveryItem>;
      payments: TableDef<Payment>;
      user_settings: TableDef<UserSettings>;
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
}
