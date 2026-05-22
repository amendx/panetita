import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Trash2 } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  deliveryTypeShort,
  formatBRL,
  formatDate,
  formatDateTime,
  paymentMethodLabel,
  pricingStrategyLabel,
  recurrenceLabel,
  statusLabel,
  unitLabel,
} from "@/lib/format";
import { OrderActions } from "./order-actions";
import { DeliveryRowActions } from "./delivery-row-actions";
import { PaymentManager } from "./payment-manager";
import { NotifyTutorButton } from "./notify-tutor-button";

export const dynamic = "force-dynamic";

export default async function PedidoDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: order } = await supabase
    .from("orders")
    .select(
      `
      *,
      customers(id, name, phone),
      pets(id, name, weight_kg, restrictions),
      addresses(id, label, street, number, complement, neighborhood, city, state),
      order_items(
        id, quantity, measure_type, measure_unit, unit_price, unit_cost, line_total, line_cost,
        recipe_size_id, combo_id,
        recipe_sizes(id, size_label, recipes(name)),
        combos(id, name, combo_items(quantity, recipe_sizes(size_label, recipes(name))))
      ),
      deliveries(id, scheduled_date, scheduled_time, status, delivery_type, notes, delivered_at, delivery_items(id, order_item_id, quantity)),
      payments(id, amount, method, due_date, paid_at, status, notes)
    `
    )
    .eq("id", id)
    .single();

  if (!order) notFound();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const o = order as any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const deliveries = (o.deliveries ?? []).sort((a: any, b: any) =>
    a.scheduled_date.localeCompare(b.scheduled_date)
  );
  const payments = o.payments ?? [];
  const items = o.order_items ?? [];
  const customer = o.customers;
  const pet = o.pets;
  const address = o.addresses;

  // Texto pra montar a mensagem de WhatsApp
  const itemsForMessage = items.map((it: any) => {
    const label = it.recipe_sizes
      ? `${it.recipe_sizes.recipes.name} · ${it.recipe_sizes.size_label}`
      : it.combos?.name ?? "—";
    return `• ${it.quantity}× ${label}`;
  });
  const firstScheduled = deliveries[0];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const amountDue = payments.reduce((acc: number, p: any) => {
    return p.status === "paid" ? acc : acc + Number(p.amount ?? 0);
  }, 0);

  return (
    <div className="mx-auto max-w-5xl">
      <Button asChild variant="ghost" size="sm" className="mb-3">
        <Link href="/pedidos">
          <ArrowLeft className="h-4 w-4" /> Voltar
        </Link>
      </Button>
      <PageHeader
        title={pet ? `Pedido — ${customer?.name ?? "—"} (🐾 ${pet.name})` : `Pedido de ${customer?.name ?? "—"}`}
        description={`${recurrenceLabel(o.recurrence)} · ${pricingStrategyLabel(o.pricing_strategy)} · ${statusLabel(o.status)}`}
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <NotifyTutorButton
              tutorName={customer?.name ?? "Cliente"}
              tutorPhone={customer?.phone ?? null}
              petName={pet?.name ?? null}
              orderTotal={Number(o.total_price)}
              amountDue={amountDue}
              itemLines={itemsForMessage}
              nextDeliveryDate={firstScheduled?.scheduled_date ?? null}
              nextDeliveryTime={firstScheduled?.scheduled_time ?? null}
              nextDeliveryType={firstScheduled?.delivery_type ?? null}
              addressSummary={
                address
                  ? `${address.street}${address.number ? `, ${address.number}` : ""}`
                  : null
              }
            />
            <OrderActions orderId={o.id} status={o.status} />
          </div>
        }
      />

      <div className="grid gap-4 lg:grid-cols-3">
        <Card>
          <CardContent className="p-4">
            <div className="text-xs text-muted-foreground">Total</div>
            <div className="text-xl font-bold">{formatBRL(Number(o.total_price))}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-xs text-muted-foreground">Custo</div>
            <div className="text-xl font-bold">{formatBRL(Number(o.total_cost))}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-xs text-muted-foreground">Lucro</div>
            <div className="text-xl font-bold text-emerald-700">
              {formatBRL(Number(o.profit))}
            </div>
          </CardContent>
        </Card>
      </div>

      {pet?.restrictions && (
        <div className="mt-4 flex items-start gap-3 rounded-lg border-2 border-amber-400 bg-amber-50 p-4">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-amber-200 text-lg">
            ⚠️
          </div>
          <div className="min-w-0 flex-1">
            <div className="text-sm font-bold text-amber-900">
              Atenção: restrição alimentar de {pet.name}
            </div>
            <p className="mt-0.5 text-sm text-amber-900 whitespace-pre-line">
              {pet.restrictions}
            </p>
          </div>
        </div>
      )}

      {address && (
        <Card className="mt-4">
          <CardHeader>
            <CardTitle className="text-base">Endereço de entrega</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            {address.street}
            {address.number && `, ${address.number}`}
            {address.complement && ` — ${address.complement}`}
            {address.neighborhood && ` · ${address.neighborhood}`}
            {address.city && ` · ${address.city}/${address.state ?? ""}`}
          </CardContent>
        </Card>
      )}

      <Card className="mt-4">
        <CardHeader>
          <CardTitle className="text-base">Itens</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Item</TableHead>
                <TableHead>Quantidade</TableHead>
                <TableHead className="text-right">Preço un.</TableHead>
                <TableHead className="text-right">Total</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
              {items.map((it: any) => {
                const name = it.recipe_sizes
                  ? `${it.recipe_sizes.recipes.name} · ${it.recipe_sizes.size_label}`
                  : it.combos?.name ?? "—";
                const comboCompo: string | null = it.combos?.combo_items?.length
                  ? it.combos.combo_items
                      // eslint-disable-next-line @typescript-eslint/no-explicit-any
                      .map(
                        // eslint-disable-next-line @typescript-eslint/no-explicit-any
                        (ci: any) =>
                          `${ci.recipe_sizes.recipes.name} ${ci.recipe_sizes.size_label}${
                            ci.quantity > 1 ? ` ×${ci.quantity}` : ""
                          }`
                      )
                      .join(" + ")
                  : null;
                return (
                  <TableRow key={it.id}>
                    <TableCell>
                      <div className="font-medium">{name}</div>
                      {comboCompo && (
                        <div className="mt-0.5 text-xs text-muted-foreground">
                          Contém: {comboCompo}
                        </div>
                      )}
                    </TableCell>
                    <TableCell>
                      {it.quantity} {unitLabel(it.measure_unit)}
                    </TableCell>
                    <TableCell className="text-right tabular-nums">
                      {formatBRL(Number(it.unit_price))}
                    </TableCell>
                    <TableCell className="text-right font-semibold tabular-nums">
                      {formatBRL(Number(it.line_total))}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Card className="mt-4">
        <CardHeader>
          <CardTitle className="text-base">Entregas</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Data da entrega</TableHead>
                <TableHead>Entrega</TableHead>
                <TableHead>Itens</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="w-44 text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
              {deliveries.map((d: any) => {
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                const itemsText = d.delivery_items
                  .map((di: any) => {
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    const oi = items.find((x: any) => x.id === di.order_item_id);
                    const label = oi?.recipe_sizes
                      ? `${oi.recipe_sizes.recipes.name} ${oi.recipe_sizes.size_label}`
                      : oi?.combos?.name ?? "—";
                    return `${di.quantity}× ${label}`;
                  })
                  .join(", ");
                return (
                  <TableRow key={d.id}>
                    <TableCell>
                      {formatDate(d.scheduled_date)}
                      {d.scheduled_time && ` · ${d.scheduled_time.slice(0, 5)}`}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">
                        {deliveryTypeShort(d.delivery_type ?? "uber_99")}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">{itemsText || "—"}</TableCell>
                    <TableCell>
                      <Badge variant={d.status === "delivered" ? "success" : "secondary"}>
                        {statusLabel(d.status)}
                      </Badge>
                      {d.status === "delivered" && d.delivered_at && (
                        <div className="mt-1 text-[11px] text-muted-foreground">
                          Entregue em {formatDateTime(d.delivered_at)}
                        </div>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <DeliveryRowActions
                        deliveryId={d.id}
                        status={d.status}
                        scheduledDate={d.scheduled_date}
                        scheduledTime={d.scheduled_time}
                        deliveryType={d.delivery_type ?? "uber_99"}
                        notes={d.notes ?? null}
                        customerName={customer?.name ?? "Cliente"}
                        addressSummary={
                          address
                            ? `${address.street}${address.number ? `, ${address.number}` : ""}`
                            : undefined
                        }
                        itemsText={itemsText}
                      />
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Card className="mt-4">
        <CardHeader>
          <CardTitle className="text-base">Pagamentos</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <PaymentManager
            orderId={o.id}
            orderTotal={Number(o.total_price)}
            payments={payments as never[]}
          />
        </CardContent>
      </Card>

      {o.notes && (
        <Card className="mt-4">
          <CardHeader>
            <CardTitle className="text-base">Observações</CardTitle>
          </CardHeader>
          <CardContent className="text-sm whitespace-pre-line">{o.notes}</CardContent>
        </Card>
      )}
    </div>
  );
}
