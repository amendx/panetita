"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { withUser } from "@/lib/auth-action";
import type {
  PricingStrategy,
  Recurrence,
  MeasureType,
  MeasureUnit,
  OrderStatus,
  PaymentMethod,
  DeliveryStatus,
  DeliveryType,
} from "@/types/database";

export interface NewOrderItemInput {
  recipe_size_id: string | null;
  combo_id: string | null;
  quantity: number;
  measure_type: MeasureType;
  measure_unit: MeasureUnit;
  unit_price: number;
  unit_cost: number;
}

export interface NewDeliveryInput {
  scheduled_date: string;
  scheduled_time?: string | null;
  delivery_type: DeliveryType;
  items: { item_index: number; quantity: number }[];
  notes?: string | null;
}

export interface NewPaymentInput {
  amount: number;
  method: PaymentMethod;
  due_date?: string | null;
  paid_at?: string | null;
  status: "pending" | "paid" | "overdue";
}

export interface NewOrderInput {
  customer_id: string;
  pet_id: string | null;
  address_id: string | null;
  recurrence: Recurrence;
  pricing_strategy: PricingStrategy;
  margin_pct: number | null;
  notes?: string | null;
  items: NewOrderItemInput[];
  deliveries: NewDeliveryInput[];
  payments: NewPaymentInput[];
}

export async function createOrder(input: NewOrderInput) {
  let newId = "";
  await withUser(async ({ supabase, userId }) => {
    const totals = input.items.reduce(
      (acc, i) => {
        const line_total = i.quantity * i.unit_price;
        const line_cost = i.quantity * i.unit_cost;
        return {
          total_price: acc.total_price + line_total,
          total_cost: acc.total_cost + line_cost,
        };
      },
      { total_price: 0, total_cost: 0 }
    );
    const profit = totals.total_price - totals.total_cost;

    const { data: order, error: orderErr } = await supabase
      .from("orders")
      .insert({
        user_id: userId,
        customer_id: input.customer_id,
        pet_id: input.pet_id,
        address_id: input.address_id,
        recurrence: input.recurrence,
        pricing_strategy: input.pricing_strategy,
        margin_pct: input.margin_pct,
        total_price: totals.total_price,
        total_cost: totals.total_cost,
        profit,
        notes: input.notes ?? null,
        status: "confirmed",
      })
      .select("id")
      .single();
    if (orderErr || !order) throw orderErr ?? new Error("Falha ao criar pedido");
    newId = order.id;

    const itemsPayload = input.items.map((i) => ({
      order_id: order.id,
      user_id: userId,
      recipe_size_id: i.recipe_size_id,
      combo_id: i.combo_id,
      quantity: i.quantity,
      measure_type: i.measure_type,
      measure_unit: i.measure_unit,
      unit_price: i.unit_price,
      unit_cost: i.unit_cost,
      line_total: i.quantity * i.unit_price,
      line_cost: i.quantity * i.unit_cost,
    }));
    const { data: insertedItems, error: itemsErr } = await supabase
      .from("order_items")
      .insert(itemsPayload)
      .select("id");
    if (itemsErr || !insertedItems) throw itemsErr ?? new Error("Falha ao criar itens");

    for (const d of input.deliveries) {
      const { data: deliv, error: delivErr } = await supabase
        .from("deliveries")
        .insert({
          order_id: order.id,
          user_id: userId,
          address_id: input.address_id,
          scheduled_date: d.scheduled_date,
          scheduled_time: d.scheduled_time ?? null,
          delivery_type: d.delivery_type,
          status: "scheduled",
          notes: d.notes ?? null,
        })
        .select("id")
        .single();
      if (delivErr || !deliv) throw delivErr ?? new Error("Falha ao criar entrega");

      const deliveryItems = d.items
        .filter((it) => it.quantity > 0)
        .map((it) => ({
          delivery_id: deliv.id,
          order_item_id: insertedItems[it.item_index].id,
          quantity: it.quantity,
          user_id: userId,
        }));
      if (deliveryItems.length > 0) {
        const { error } = await supabase.from("delivery_items").insert(deliveryItems);
        if (error) throw error;
      }
    }

    if (input.payments.length > 0) {
      const paymentsPayload = input.payments.map((p) => ({
        order_id: order.id,
        user_id: userId,
        amount: p.amount,
        method: p.method,
        due_date: p.due_date ?? null,
        paid_at: p.paid_at ?? null,
        status: p.status,
      }));
      const { error } = await supabase.from("payments").insert(paymentsPayload);
      if (error) throw error;
    }
  });
  revalidatePath("/pedidos");
  revalidatePath("/calendario");
  revalidatePath("/entregas");
  revalidatePath("/pagamentos");
  redirect(`/pedidos/${newId}`);
}

export async function updateOrderStatus(id: string, status: OrderStatus) {
  await withUser(async ({ supabase }) => {
    const { error } = await supabase.from("orders").update({ status }).eq("id", id);
    if (error) throw error;
  });
  revalidatePath(`/pedidos/${id}`);
  revalidatePath("/pedidos");
}

export async function deleteOrder(id: string) {
  await withUser(async ({ supabase }) => {
    const { error } = await supabase.from("orders").delete().eq("id", id);
    if (error) throw error;
  });
  revalidatePath("/pedidos");
  revalidatePath("/calendario");
  redirect("/pedidos");
}

export async function updateDeliveryStatus(input: {
  id: string;
  status: DeliveryStatus;
  scheduled_date?: string;
  scheduled_time?: string | null;
  delivery_type?: DeliveryType;
}) {
  await withUser(async ({ supabase }) => {
    const patch: Record<string, unknown> = { status: input.status };
    if (input.status === "delivered") patch.delivered_at = new Date().toISOString();
    if (input.scheduled_date) patch.scheduled_date = input.scheduled_date;
    if (input.scheduled_time !== undefined) patch.scheduled_time = input.scheduled_time;
    if (input.delivery_type) patch.delivery_type = input.delivery_type;
    const { error } = await supabase.from("deliveries").update(patch).eq("id", input.id);
    if (error) throw error;
  });
  revalidatePath("/entregas");
  revalidatePath("/calendario");
  revalidatePath("/pedidos");
}

export async function updateDelivery(input: {
  id: string;
  scheduled_date: string;
  scheduled_time?: string | null;
  delivery_type: DeliveryType;
  notes?: string | null;
}) {
  await withUser(async ({ supabase }) => {
    const { error } = await supabase
      .from("deliveries")
      .update({
        scheduled_date: input.scheduled_date,
        scheduled_time: input.scheduled_time ?? null,
        delivery_type: input.delivery_type,
        notes: input.notes ?? null,
      })
      .eq("id", input.id);
    if (error) throw error;
  });
  revalidatePath("/entregas");
  revalidatePath("/calendario");
  revalidatePath("/pedidos");
}

export async function updatePaymentStatus(input: {
  id: string;
  status: "pending" | "paid" | "overdue";
  method?: PaymentMethod;
  paid_at?: string | null;
}) {
  await withUser(async ({ supabase }) => {
    const patch: Record<string, unknown> = { status: input.status };
    if (input.status === "paid") {
      patch.paid_at = input.paid_at ?? new Date().toISOString();
    } else if (input.status === "pending") {
      patch.paid_at = null;
    }
    if (input.method) patch.method = input.method;
    const { error } = await supabase.from("payments").update(patch).eq("id", input.id);
    if (error) throw error;
  });
  revalidatePath("/pagamentos");
  revalidatePath("/pedidos");
}

export async function addPayment(input: {
  order_id: string;
  amount: number;
  method: PaymentMethod;
  due_date?: string | null;
  status: "pending" | "paid";
  notes?: string | null;
}) {
  await withUser(async ({ supabase, userId }) => {
    const { error } = await supabase.from("payments").insert({
      order_id: input.order_id,
      user_id: userId,
      amount: input.amount,
      method: input.method,
      due_date: input.due_date ?? null,
      status: input.status,
      paid_at: input.status === "paid" ? new Date().toISOString() : null,
      notes: input.notes ?? null,
    });
    if (error) throw error;
  });
  revalidatePath("/pagamentos");
  revalidatePath("/pedidos");
}

export async function updatePayment(input: {
  id: string;
  amount: number;
  method: PaymentMethod;
  due_date?: string | null;
  status: "pending" | "paid";
  notes?: string | null;
}) {
  await withUser(async ({ supabase }) => {
    const patch: Record<string, unknown> = {
      amount: input.amount,
      method: input.method,
      due_date: input.due_date ?? null,
      status: input.status,
      notes: input.notes ?? null,
    };
    if (input.status === "paid") {
      patch.paid_at = new Date().toISOString();
    } else {
      patch.paid_at = null;
    }
    const { error } = await supabase.from("payments").update(patch).eq("id", input.id);
    if (error) throw error;
  });
  revalidatePath("/pagamentos");
  revalidatePath("/pedidos");
}

export async function deletePayment(id: string) {
  await withUser(async ({ supabase }) => {
    const { error } = await supabase.from("payments").delete().eq("id", id);
    if (error) throw error;
  });
  revalidatePath("/pagamentos");
  revalidatePath("/pedidos");
}
