import Link from "next/link";
import { addDays, startOfWeek, endOfWeek } from "date-fns";
import { Truck } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/layout/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { deliveryTypeShort, formatDate, recurrenceLabel, statusLabel, toISODate } from "@/lib/format";
import { DeliveryRowActions } from "../pedidos/[id]/delivery-row-actions";

export const dynamic = "force-dynamic";

export default async function EntregasPage({
  searchParams,
}: {
  searchParams: Promise<{ period?: string }>;
}) {
  const { period = "week" } = await searchParams;
  const today = new Date();

  let start: Date;
  let end: Date;
  if (period === "week") {
    start = startOfWeek(today, { weekStartsOn: 1 });
    end = endOfWeek(today, { weekStartsOn: 1 });
  } else if (period === "next") {
    start = today;
    end = addDays(today, 30);
  } else {
    start = addDays(today, -90);
    end = addDays(today, 90);
  }

  const supabase = await createClient();
  const { data: deliveries } = await supabase
    .from("deliveries")
    .select(
      `id, scheduled_date, scheduled_time, status, delivery_type, notes,
       orders(id, recurrence, customers(name)),
       addresses(street, number),
       delivery_items(quantity, order_items(recipe_sizes(size_label, recipes(name)), combos(name)))`
    )
    .gte("scheduled_date", toISODate(start))
    .lte("scheduled_date", toISODate(end))
    .order("scheduled_date");

  return (
    <div className="mx-auto max-w-6xl">
      <PageHeader title="Entregas" />

      <div className="mb-4 flex flex-wrap gap-2">
        <FilterLink current={period} value="week" label="Esta semana" />
        <FilterLink current={period} value="next" label="Próximos 30 dias" />
        <FilterLink current={period} value="all" label="Todas (±90 dias)" />
      </div>

      {(deliveries?.length ?? 0) === 0 ? (
        <Card>
          <CardContent className="p-8 text-center text-muted-foreground">
            <Truck className="mx-auto mb-3 h-10 w-10 opacity-50" />
            Nenhuma entrega no período.
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Data</TableHead>
                  <TableHead>Cliente</TableHead>
                  <TableHead>Entrega</TableHead>
                  <TableHead>Plano</TableHead>
                  <TableHead className="hidden md:table-cell">Itens</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="w-32 text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                {(deliveries as any[])!.map((d: any) => {
                  const customer = d.orders?.customers?.name ?? "—";
                  const orderId = d.orders?.id as string;
                  const recurrence = d.orders?.recurrence as string | undefined;
                  const street = d.addresses
                    ? `${d.addresses.street}${d.addresses.number ? `, ${d.addresses.number}` : ""}`
                    : undefined;
                  const itemsText = (d.delivery_items ?? [])
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    .map((di: any) => {
                      const oi = di.order_items;
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
                        {d.scheduled_time && (
                          <div className="text-xs text-muted-foreground">
                            {d.scheduled_time.slice(0, 5)}
                          </div>
                        )}
                      </TableCell>
                      <TableCell>
                        <Link href={`/pedidos/${orderId}`} className="font-medium hover:underline">
                          {customer}
                        </Link>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">
                          {deliveryTypeShort(d.delivery_type ?? "uber_99")}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {recurrence ? (
                          <Badge variant="outline">{recurrenceLabel(recurrence)}</Badge>
                        ) : (
                          <span className="text-xs text-muted-foreground">—</span>
                        )}
                      </TableCell>
                      <TableCell className="hidden text-sm text-muted-foreground md:table-cell">
                        {itemsText || "—"}
                      </TableCell>
                      <TableCell>
                        <Badge variant={d.status === "delivered" ? "success" : "secondary"}>
                          {statusLabel(d.status)}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <DeliveryRowActions
                          deliveryId={d.id}
                          status={d.status}
                          scheduledDate={d.scheduled_date}
                          scheduledTime={d.scheduled_time}
                          deliveryType={d.delivery_type ?? "uber_99"}
                          notes={d.notes ?? null}
                          customerName={customer}
                          addressSummary={street}
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
      )}
    </div>
  );
}

function FilterLink({
  current,
  value,
  label,
}: {
  current: string;
  value: string;
  label: string;
}) {
  const active = current === value;
  return (
    <Link
      href={`?period=${value}`}
      className={`rounded-full px-3 py-1.5 text-sm transition-colors ${
        active ? "bg-primary text-primary-foreground" : "bg-muted text-foreground hover:bg-muted/80"
      }`}
    >
      {label}
    </Link>
  );
}
