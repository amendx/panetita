import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { CustomerEditor } from "./customer-editor";
import type { Address, Customer, Pet } from "@/types/database";

export const dynamic = "force-dynamic";

export default async function ClienteDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();

  const [{ data: customer }, { data: pets }, { data: addresses }, { data: orders }] =
    await Promise.all([
      supabase.from("customers").select("*").eq("id", id).single(),
      supabase.from("pets").select("*").eq("customer_id", id).order("name"),
      supabase.from("addresses").select("*").eq("customer_id", id).order("is_default", { ascending: false }),
      supabase
        .from("orders")
        .select("id, recurrence, status, total_price, created_at")
        .eq("customer_id", id)
        .order("created_at", { ascending: false })
        .limit(20),
    ]);

  if (!customer) notFound();

  return (
    <div className="mx-auto max-w-4xl">
      <Button asChild variant="ghost" size="sm" className="mb-3">
        <Link href="/clientes">
          <ArrowLeft className="h-4 w-4" /> Voltar
        </Link>
      </Button>
      <PageHeader title={customer.name} description={customer.phone ?? customer.source ?? undefined} />
      <CustomerEditor
        customer={customer as Customer}
        pets={(pets ?? []) as Pet[]}
        addresses={(addresses ?? []) as Address[]}
        orders={orders ?? []}
      />
    </div>
  );
}
