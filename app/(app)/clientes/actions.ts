"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { withUser } from "@/lib/auth-action";

export async function createCustomer(input: {
  name: string;
  whatsapp?: string | null;
  source?: string | null;
  notes?: string | null;
  address?: {
    street: string;
    number?: string | null;
    complement?: string | null;
    neighborhood?: string | null;
    city?: string | null;
    state?: string | null;
    zip?: string | null;
  } | null;
}) {
  let id = "";
  await withUser(async ({ supabase, userId }) => {
    const { data, error } = await supabase
      .from("customers")
      .insert({
        name: input.name,
        phone: input.whatsapp ?? null,
        source: input.source ?? null,
        notes: input.notes ?? null,
        user_id: userId,
      })
      .select("id")
      .single();
    if (error) throw error;
    id = data!.id;

    if (input.address && input.address.street.trim()) {
      const { error: addrErr } = await supabase.from("addresses").insert({
        customer_id: id,
        user_id: userId,
        label: "Principal",
        street: input.address.street,
        number: input.address.number ?? null,
        complement: input.address.complement ?? null,
        neighborhood: input.address.neighborhood ?? null,
        city: input.address.city ?? null,
        state: input.address.state ?? null,
        zip: input.address.zip ?? null,
        is_default: true,
      });
      if (addrErr) throw addrErr;
    }
  });
  revalidatePath("/clientes");
  redirect(`/clientes/${id}`);
}

export async function updateCustomer(
  id: string,
  input: {
    name: string;
    whatsapp?: string | null;
    source?: string | null;
    notes?: string | null;
  }
) {
  await withUser(async ({ supabase }) => {
    const { error } = await supabase
      .from("customers")
      .update({
        name: input.name,
        phone: input.whatsapp ?? null,
        source: input.source ?? null,
        notes: input.notes ?? null,
      })
      .eq("id", id);
    if (error) throw error;
  });
  revalidatePath(`/clientes/${id}`);
  revalidatePath("/clientes");
}

export async function deleteCustomer(id: string) {
  await withUser(async ({ supabase }) => {
    const { error } = await supabase.from("customers").delete().eq("id", id);
    if (error) throw error;
  });
  revalidatePath("/clientes");
  redirect("/clientes");
}

export async function savePet(input: {
  id?: string;
  customer_id: string;
  name: string;
  weight_kg?: number | null;
  breed?: string | null;
  restrictions?: string | null;
  notes?: string | null;
}) {
  await withUser(async ({ supabase, userId }) => {
    const payload = {
      customer_id: input.customer_id,
      name: input.name,
      weight_kg: input.weight_kg ?? null,
      breed: input.breed ?? null,
      restrictions: input.restrictions ?? null,
      notes: input.notes ?? null,
      user_id: userId,
    };
    if (input.id) {
      const { error } = await supabase.from("pets").update(payload).eq("id", input.id);
      if (error) throw error;
    } else {
      const { error } = await supabase.from("pets").insert(payload);
      if (error) throw error;
    }
  });
  revalidatePath(`/clientes/${input.customer_id}`);
}

export async function deletePet(input: { id: string; customer_id: string }) {
  await withUser(async ({ supabase }) => {
    const { error } = await supabase.from("pets").delete().eq("id", input.id);
    if (error) throw error;
  });
  revalidatePath(`/clientes/${input.customer_id}`);
}

export async function saveAddress(input: {
  id?: string;
  customer_id: string;
  label?: string | null;
  street: string;
  number?: string | null;
  complement?: string | null;
  neighborhood?: string | null;
  city?: string | null;
  state?: string | null;
  zip?: string | null;
  is_default?: boolean;
}) {
  await withUser(async ({ supabase, userId }) => {
    const payload = {
      customer_id: input.customer_id,
      label: input.label ?? null,
      street: input.street,
      number: input.number ?? null,
      complement: input.complement ?? null,
      neighborhood: input.neighborhood ?? null,
      city: input.city ?? null,
      state: input.state ?? null,
      zip: input.zip ?? null,
      is_default: input.is_default ?? false,
      user_id: userId,
    };
    if (input.id) {
      const { error } = await supabase.from("addresses").update(payload).eq("id", input.id);
      if (error) throw error;
    } else {
      const { error } = await supabase.from("addresses").insert(payload);
      if (error) throw error;
    }
  });
  revalidatePath(`/clientes/${input.customer_id}`);
}

export async function deleteAddress(input: { id: string; customer_id: string }) {
  await withUser(async ({ supabase }) => {
    const { error } = await supabase.from("addresses").delete().eq("id", input.id);
    if (error) throw error;
  });
  revalidatePath(`/clientes/${input.customer_id}`);
}
