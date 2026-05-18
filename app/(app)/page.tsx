import Link from "next/link";
import { addDays } from "date-fns";
import { createClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/layout/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatBRL, formatDate, statusLabel, toISODate } from "@/lib/format";
import { CalendarDays, Plus, Receipt, ShoppingCart, Truck, Wallet } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const supabase = await createClient();
  const today = new Date();
  const horizon = addDays(today, 14);

  const [{ data: upcoming }, { data: pending }, { data: monthOrders }] = await Promise.all([
    supabase
      .from("deliveries")
      .select("id, scheduled_date, scheduled_time, status, order_id, orders(customer_id, customers(name))")
      .gte("scheduled_date", toISODate(today))
      .lte("scheduled_date", toISODate(horizon))
      .neq("status", "cancelled")
      .order("scheduled_date", { ascending: true })
      .limit(10),
    supabase
      .from("payments")
      .select("id, amount, due_date, status, order_id, orders(customer_id, customers(name))")
      .neq("status", "paid")
      .order("due_date", { ascending: true })
      .limit(5),
    supabase
      .from("orders")
      .select("total_price, profit")
      .gte("created_at", toISODate(addDays(today, -30))),
  ]);

  const revenue30 = (monthOrders ?? []).reduce((a, o) => a + Number(o.total_price), 0);
  const profit30 = (monthOrders ?? []).reduce((a, o) => a + Number(o.profit), 0);

  return (
    <div className="mx-auto max-w-6xl">
      <PageHeader
        title="Início"
        description="Visão geral dos próximos 14 dias"
        actions={
          <Button asChild>
            <Link href="/pedidos/novo">
              <Plus className="h-4 w-4" /> Novo pedido
            </Link>
          </Button>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard icon={<Truck className="h-5 w-5" />} label="Entregas (14 dias)" value={String(upcoming?.length ?? 0)} />
        <StatCard icon={<Wallet className="h-5 w-5" />} label="Pagamentos pendentes" value={String(pending?.length ?? 0)} />
        <StatCard icon={<Receipt className="h-5 w-5" />} label="Faturamento (30d)" value={formatBRL(revenue30)} />
        <StatCard icon={<ShoppingCart className="h-5 w-5" />} label="Lucro (30d)" value={formatBRL(profit30)} />
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="flex items-center gap-2 text-base">
              <CalendarDays className="h-4 w-4" /> Próximas entregas
            </CardTitle>
            <Button asChild variant="ghost" size="sm">
              <Link href="/calendario">Ver calendário</Link>
            </Button>
          </CardHeader>
          <CardContent>
            {(upcoming?.length ?? 0) === 0 ? (
              <p className="text-sm text-muted-foreground">Nenhuma entrega programada.</p>
            ) : (
              <ul className="divide-y">
                {upcoming!.map((d) => (
                  <li key={d.id} className="flex items-center justify-between py-2">
                    <div>
                      <div className="text-sm font-medium">
                        {/* @ts-expect-error nested */}
                        {d.orders?.customers?.name ?? "Cliente"}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {formatDate(d.scheduled_date)}
                        {d.scheduled_time && ` · ${d.scheduled_time.slice(0, 5)}`}
                      </div>
                    </div>
                    <Badge variant={d.status === "delivered" ? "success" : "outline"}>
                      {statusLabel(d.status)}
                    </Badge>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="flex items-center gap-2 text-base">
              <Wallet className="h-4 w-4" /> Pagamentos a receber
            </CardTitle>
            <Button asChild variant="ghost" size="sm">
              <Link href="/pagamentos">Ver todos</Link>
            </Button>
          </CardHeader>
          <CardContent>
            {(pending?.length ?? 0) === 0 ? (
              <p className="text-sm text-muted-foreground">Nenhum pagamento pendente.</p>
            ) : (
              <ul className="divide-y">
                {pending!.map((p) => (
                  <li key={p.id} className="flex items-center justify-between py-2">
                    <div>
                      <div className="text-sm font-medium">
                        {/* @ts-expect-error nested */}
                        {p.orders?.customers?.name ?? "Cliente"}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {p.due_date ? `Vence ${formatDate(p.due_date)}` : "Sem vencimento"}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-semibold">{formatBRL(Number(p.amount))}</div>
                      <Badge
                        variant={p.status === "overdue" ? "destructive" : "warning"}
                        className="mt-1"
                      >
                        {statusLabel(p.status)}
                      </Badge>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function StatCard({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <Card>
      <CardContent className="flex items-center gap-3 p-4">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
          {icon}
        </div>
        <div>
          <div className="text-xs text-muted-foreground">{label}</div>
          <div className="text-lg font-semibold">{value}</div>
        </div>
      </CardContent>
    </Card>
  );
}
