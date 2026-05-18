import Link from "next/link";
import { addDays, startOfMonth, endOfMonth, format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { createClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/layout/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatBRL, formatDate, recurrenceLabel, toISODate } from "@/lib/format";

export const dynamic = "force-dynamic";

export default async function RelatoriosPage({
  searchParams,
}: {
  searchParams: Promise<{ period?: string }>;
}) {
  const { period = "month" } = await searchParams;
  const today = new Date();

  let start: Date;
  let end: Date;
  if (period === "month") {
    start = startOfMonth(today);
    end = endOfMonth(today);
  } else if (period === "30d") {
    start = addDays(today, -30);
    end = today;
  } else {
    start = addDays(today, -90);
    end = today;
  }

  const supabase = await createClient();
  const { data: orders } = await supabase
    .from("orders")
    .select(
      "id, recurrence, total_price, total_cost, profit, created_at, customers(name), payments(amount, status)"
    )
    .gte("created_at", toISODate(start))
    .lte("created_at", toISODate(addDays(end, 1)))
    .neq("status", "cancelled")
    .order("created_at", { ascending: false });

  /* eslint-disable @typescript-eslint/no-explicit-any */
  function totalsForOrder(o: any) {
    const total = Number(o.total_price);
    const cost = Number(o.total_cost);
    const profit = Number(o.profit);
    const paid = (o.payments ?? [])
      .filter((p: any) => p.status === "paid")
      .reduce((a: number, p: any) => a + Number(p.amount), 0);
    const isFullyPaid = paid + 0.01 >= total && total > 0;
    return { total, cost, profit, paid, isFullyPaid };
  }

  const estimatedRevenue = (orders ?? []).reduce(
    (a, o) => a + totalsForOrder(o as any).total,
    0
  );
  const paidRevenue = (orders ?? []).reduce(
    (a, o) => a + totalsForOrder(o as any).paid,
    0
  );
  const totalCost = (orders ?? []).reduce(
    (a, o) => a + totalsForOrder(o as any).cost,
    0
  );
  // Lucro só é "realizado" para pedidos quitados. Para o estimado, usa o profit do pedido.
  const estimatedProfit = (orders ?? []).reduce(
    (a, o) => a + totalsForOrder(o as any).profit,
    0
  );
  const paidProfit = (orders ?? []).reduce((a, o) => {
    const t = totalsForOrder(o as any);
    return a + (t.isFullyPaid ? t.profit : 0);
  }, 0);
  const margin = estimatedRevenue > 0 ? (estimatedProfit / estimatedRevenue) * 100 : 0;

  // Top customers (estimado)
  const byCustomer = new Map<string, { name: string; revenue: number; orders: number }>();
  for (const o of orders ?? []) {
    // @ts-expect-error nested
    const name = o.customers?.name ?? "—";
    const cur = byCustomer.get(name) ?? { name, revenue: 0, orders: 0 };
    cur.revenue += Number(o.total_price);
    cur.orders += 1;
    byCustomer.set(name, cur);
  }
  const top = Array.from(byCustomer.values())
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, 5);

  const paidPct = estimatedRevenue > 0 ? (paidRevenue / estimatedRevenue) * 100 : 0;

  return (
    <div className="mx-auto max-w-5xl">
      <PageHeader
        title="Relatórios"
        description={`Período: ${format(start, "MMMM 'de' yyyy", { locale: ptBR })}`}
      />

      <div className="mb-4 flex flex-wrap gap-2">
        <FilterLink current={period} value="month" label="Mês atual" />
        <FilterLink current={period} value="30d" label="Últimos 30 dias" />
        <FilterLink current={period} value="90d" label="Últimos 90 dias" />
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardContent className="p-4">
            <div className="text-xs text-muted-foreground">Faturamento estimado</div>
            <div className="text-xl font-bold">{formatBRL(estimatedRevenue)}</div>
            <div className="mt-1 text-xs text-muted-foreground">
              Soma do total de todos os pedidos do período
            </div>
          </CardContent>
        </Card>
        <Card className="border-emerald-300/60">
          <CardContent className="p-4">
            <div className="text-xs text-muted-foreground">Faturamento recebido</div>
            <div className="text-xl font-bold text-emerald-700">{formatBRL(paidRevenue)}</div>
            <div className="mt-1 text-xs text-muted-foreground">
              Apenas pagamentos marcados como pagos · {paidPct.toFixed(0)}% do estimado
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-xs text-muted-foreground">Pendente a receber</div>
            <div className="text-xl font-bold text-amber-700">
              {formatBRL(Math.max(estimatedRevenue - paidRevenue, 0))}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-xs text-muted-foreground">Custo total</div>
            <div className="text-xl font-bold">{formatBRL(totalCost)}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-xs text-muted-foreground">Lucro estimado</div>
            <div className="text-xl font-bold text-emerald-700">
              {formatBRL(estimatedProfit)}
            </div>
            <div className="mt-1 text-xs text-muted-foreground">
              Margem média: {margin.toFixed(1)}%
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-xs text-muted-foreground">Lucro realizado</div>
            <div className="text-xl font-bold text-emerald-700">{formatBRL(paidProfit)}</div>
            <div className="mt-1 text-xs text-muted-foreground">
              Apenas pedidos totalmente pagos
            </div>
          </CardContent>
        </Card>
      </div>

      {top.length > 0 && (
        <Card className="mt-6">
          <CardHeader>
            <CardTitle className="text-base">Top clientes</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Cliente</TableHead>
                  <TableHead className="text-right">Pedidos</TableHead>
                  <TableHead className="text-right">Faturamento</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {top.map((t) => (
                  <TableRow key={t.name}>
                    <TableCell className="font-medium">{t.name}</TableCell>
                    <TableCell className="text-right">{t.orders}</TableCell>
                    <TableCell className="text-right tabular-nums">
                      {formatBRL(t.revenue)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      <Card className="mt-6">
        <CardHeader>
          <CardTitle className="text-base">Pedidos do período</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {(orders?.length ?? 0) === 0 ? (
            <p className="p-4 text-sm text-muted-foreground">Sem pedidos.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Data</TableHead>
                  <TableHead>Cliente</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead className="text-right">Total</TableHead>
                  <TableHead className="text-right">Recebido</TableHead>
                  <TableHead className="text-right">Lucro</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {orders!.map((o) => {
                  const t = totalsForOrder(o as any);
                  return (
                    <TableRow key={o.id}>
                      <TableCell>{formatDate(o.created_at)}</TableCell>
                      <TableCell>
                        {/* @ts-expect-error nested */}
                        {o.customers?.name ?? "—"}
                      </TableCell>
                      <TableCell>{recurrenceLabel(o.recurrence)}</TableCell>
                      <TableCell className="text-right tabular-nums">
                        {formatBRL(t.total)}
                      </TableCell>
                      <TableCell className="text-right tabular-nums">
                        <span className={t.isFullyPaid ? "text-emerald-700" : "text-amber-700"}>
                          {formatBRL(t.paid)}
                        </span>
                      </TableCell>
                      <TableCell className="text-right tabular-nums text-emerald-700">
                        {formatBRL(t.profit)}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
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
