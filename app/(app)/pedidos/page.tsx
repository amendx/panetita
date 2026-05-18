import Link from "next/link";
import { Plus, Receipt } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { NavButton } from "@/components/ui/nav-button";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { OrderRow } from "./order-row";
import { toISODate } from "@/lib/format";

export const dynamic = "force-dynamic";

export default async function PedidosPage() {
  const supabase = await createClient();
  const today = toISODate(new Date());
  const { data: orders } = await supabase
    .from("orders")
    .select(
      "id, recurrence, status, total_price, profit, created_at, customers(name), pets(name), deliveries(scheduled_date, delivery_type, status)"
    )
    .order("created_at", { ascending: false });

  type DeliveryLite = { scheduled_date: string; delivery_type: string; status: string };

  function nextDelivery(deliveries: DeliveryLite[] | null | undefined): DeliveryLite | null {
    if (!deliveries || deliveries.length === 0) return null;
    const active = deliveries.filter((d) => d.status !== "cancelled");
    if (active.length === 0) return null;
    // Próxima entrega não-entregue >= hoje, ou a mais próxima de hoje em geral.
    const upcoming = active
      .filter((d) => d.status !== "delivered" && d.scheduled_date >= today)
      .sort((a, b) => a.scheduled_date.localeCompare(b.scheduled_date))[0];
    if (upcoming) return upcoming;
    // Fallback: a mais recente
    return [...active].sort((a, b) => b.scheduled_date.localeCompare(a.scheduled_date))[0];
  }

  function deliveryTypeForOrder(deliveries: DeliveryLite[] | null | undefined): string | null {
    if (!deliveries || deliveries.length === 0) return null;
    const types = new Set(deliveries.map((d) => d.delivery_type));
    if (types.size === 1) return deliveries[0].delivery_type;
    return "mixed";
  }

  return (
    <div className="mx-auto max-w-6xl">
      <PageHeader
        title="Pedidos"
        actions={
          <NavButton href="/pedidos/novo" loaderLabel="Abrindo novo pedido...">
            <Plus className="h-4 w-4" /> Novo pedido
          </NavButton>
        }
      />

      {(orders?.length ?? 0) === 0 ? (
        <Card>
          <CardContent className="p-8 text-center text-muted-foreground">
            <Receipt className="mx-auto mb-3 h-10 w-10 opacity-50" />
            Nenhum pedido ainda.
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Tutor / Pet</TableHead>
                  <TableHead className="hidden sm:table-cell">Data da entrega</TableHead>
                  <TableHead>Entrega</TableHead>
                  <TableHead>Plano</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Total</TableHead>
                  <TableHead className="hidden text-right md:table-cell">Lucro</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {orders!.map((o) => {
                  // eslint-disable-next-line @typescript-eslint/no-explicit-any
                  const oAny = o as any;
                  const next = nextDelivery(oAny.deliveries);
                  const deliveryType = deliveryTypeForOrder(oAny.deliveries);
                  return (
                    <OrderRow
                      key={o.id}
                      id={o.id}
                      customerName={oAny.customers?.name ?? "—"}
                      petName={oAny.pets?.name ?? null}
                      nextDate={next?.scheduled_date ?? null}
                      deliveryType={deliveryType}
                      recurrence={o.recurrence}
                      status={o.status}
                      totalPrice={Number(o.total_price)}
                      profit={Number(o.profit)}
                    />
                  );
                })}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
