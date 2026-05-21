import Link from "next/link";
import { addDays } from "date-fns";
import { createClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/layout/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { NavButton } from "@/components/ui/nav-button";
import { formatBRL, formatDate, statusLabel, toISODate, unitLabel } from "@/lib/format";
import {
  AlertTriangle,
  CalendarDays,
  PackageOpen,
  PawPrint,
  Plus,
  Receipt,
  ShoppingCart,
  Truck,
  TrendingUp,
  Wallet,
} from "lucide-react";
import { aggregateIngredients, type DeliveryAggregateInput } from "@/lib/shopping-list";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const supabase = await createClient();
  const today = new Date();
  const horizon14 = addDays(today, 14);
  const horizon7 = addDays(today, 7);

  const [
    { data: upcoming },
    { data: pending },
    { data: monthOrders },
    { data: ingredients },
    { data: deliveriesFor7 },
  ] = await Promise.all([
    supabase
      .from("deliveries")
      .select(
        "id, scheduled_date, scheduled_time, status, order_id, orders(customer_id, customers(name), pets(name))"
      )
      .gte("scheduled_date", toISODate(today))
      .lte("scheduled_date", toISODate(horizon14))
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
    supabase
      .from("ingredients")
      .select("id, name, unit, stock_quantity, price_per_unit")
      .order("name"),
    // Entregas dos proximos 7 dias para calcular demanda de ingredientes
    supabase
      .from("deliveries")
      .select(
        `scheduled_date,
         delivery_items(quantity, order_items(
           recipe_sizes(id, size_label, recipe_id, recipes(name),
             recipe_size_ingredients(id, quantity, unit, ingredient_id,
               ingredients(id, name, unit, price_per_unit, loss_pct))),
           combos(id, combo_items(quantity, recipe_sizes(id, size_label, recipe_id, recipes(name),
             recipe_size_ingredients(id, quantity, unit, ingredient_id,
               ingredients(id, name, unit, price_per_unit, loss_pct))))))
         )`
      )
      .gte("scheduled_date", toISODate(today))
      .lte("scheduled_date", toISODate(horizon7))
      .neq("status", "cancelled"),
  ]);

  const revenue30 = (monthOrders ?? []).reduce((a, o) => a + Number(o.total_price), 0);
  const profit30 = (monthOrders ?? []).reduce((a, o) => a + Number(o.profit), 0);

  // ====== Calculo de demanda de ingredientes (proximos 7 dias) ======
  /* eslint-disable @typescript-eslint/no-explicit-any */
  function convertSize(s: any) {
    return {
      id: s.id,
      user_id: "",
      recipe_id: s.recipe_id,
      size_label: s.size_label,
      fixed_price: s.fixed_price ?? null,
      notes: null,
      ingredients: (s.recipe_size_ingredients ?? []).map((r: any) => ({
        id: r.id,
        user_id: "",
        recipe_size_id: s.id,
        ingredient_id: r.ingredient_id,
        quantity: Number(r.quantity),
        unit: r.unit,
        ingredient: {
          id: r.ingredients.id,
          user_id: "",
          name: r.ingredients.name,
          unit: r.ingredients.unit,
          price_per_unit: Number(r.ingredients.price_per_unit),
        loss_pct: Number(r.ingredients.loss_pct ?? 0),
          stock_quantity: 0,
          notes: null,
          created_at: "",
        },
      })),
    };
  }

  const aggregateInputs: DeliveryAggregateInput[] = [];
  for (const d of (deliveriesFor7 ?? []) as any[]) {
    for (const di of d.delivery_items ?? []) {
      const oi = di.order_items;
      if (oi?.recipe_sizes) {
        aggregateInputs.push({
          recipe_size: convertSize(oi.recipe_sizes),
          quantity: Number(di.quantity),
        });
      }
      if (oi?.combos) {
        for (const ci of oi.combos.combo_items ?? []) {
          aggregateInputs.push({
            recipe_size: convertSize(ci.recipe_sizes),
            quantity: Number(di.quantity) * Number(ci.quantity),
          });
        }
      }
    }
  }
  const demand7 = aggregateIngredients(aggregateInputs);
  const stockMap = new Map<string, number>(
    (ingredients ?? []).map((i) => [i.id, Number(i.stock_quantity ?? 0)])
  );

  // Identifica ingredientes em alerta nos proximos 7 dias
  const alerts: Array<{
    id: string;
    name: string;
    unit: string;
    need: number;
    stock: number;
    missing: number;
  }> = [];
  for (const line of demand7) {
    const stock = stockMap.get(line.ingredient.id) ?? 0;
    const missing = line.totalQuantity - stock;
    if (missing > 0) {
      alerts.push({
        id: line.ingredient.id,
        name: line.ingredient.name,
        unit: line.unit,
        need: line.totalQuantity,
        stock,
        missing,
      });
    }
  }
  alerts.sort((a, b) => b.missing - a.missing);
  const topAlerts = alerts.slice(0, 5);

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <PageHeader
        title="Início"
        description="Visão geral dos próximos 14 dias"
        actions={
          <NavButton href="/pedidos/novo" loaderLabel="Abrindo novo pedido...">
            <Plus className="h-4 w-4" /> Novo pedido
          </NavButton>
        }
      />

      {/* Alerta de estoque baixo — visivel no topo se houver itens */}
      {topAlerts.length > 0 && (
        <Card className="border-amber-400 bg-amber-50/60">
          <CardContent className="p-4">
            <div className="mb-3 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-amber-200">
                  <AlertTriangle className="h-5 w-5 text-amber-700" />
                </div>
                <div>
                  <div className="text-sm font-bold text-amber-900">
                    Ingredientes em alerta (próximos 7 dias)
                  </div>
                  <div className="text-xs text-amber-800">
                    {alerts.length} {alerts.length === 1 ? "ingrediente" : "ingredientes"} sem
                    estoque suficiente
                  </div>
                </div>
              </div>
              <Button asChild variant="outline" size="sm" className="border-amber-400">
                <Link href="/estoque">Ver estoque</Link>
              </Button>
            </div>
            <div className="grid gap-2 sm:grid-cols-2">
              {topAlerts.map((a) => (
                <div
                  key={a.id}
                  className="flex items-center justify-between rounded-md bg-white/70 px-3 py-2 text-sm"
                >
                  <span className="font-medium truncate">{a.name}</span>
                  <span className="ml-2 shrink-0 text-xs font-medium text-amber-800 tabular-nums">
                    faltam {a.missing.toFixed(a.missing % 1 === 0 ? 0 : 1)} {unitLabel(a.unit)}
                  </span>
                </div>
              ))}
            </div>
            {alerts.length > topAlerts.length && (
              <Link
                href="/compras"
                className="mt-2 inline-block text-xs font-medium text-amber-800 underline"
              >
                + {alerts.length - topAlerts.length} mais — ver lista de compras
              </Link>
            )}
          </CardContent>
        </Card>
      )}

      {/* Stats */}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          icon={<Truck className="h-5 w-5" />}
          label="Entregas (14 dias)"
          value={String(upcoming?.length ?? 0)}
        />
        <StatCard
          icon={<Wallet className="h-5 w-5" />}
          label="Pagamentos pendentes"
          value={String(pending?.length ?? 0)}
          tone={(pending?.length ?? 0) > 0 ? "warning" : undefined}
        />
        <StatCard
          icon={<Receipt className="h-5 w-5" />}
          label="Faturamento (30d)"
          value={formatBRL(revenue30)}
        />
        <StatCard
          icon={<TrendingUp className="h-5 w-5" />}
          label="Lucro (30d)"
          value={formatBRL(profit30)}
          tone="success"
        />
      </div>

      {/* Listas lado a lado */}
      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="flex items-center gap-2 text-base">
              <CalendarDays className="h-4 w-4 text-primary" /> Próximas entregas
            </CardTitle>
            <Button asChild variant="ghost" size="sm">
              <Link href="/calendario">Ver calendário</Link>
            </Button>
          </CardHeader>
          <CardContent className="p-0">
            {(upcoming?.length ?? 0) === 0 ? (
              <p className="p-6 text-center text-sm text-muted-foreground">
                Nenhuma entrega programada nos próximos 14 dias.
              </p>
            ) : (
              <ul className="divide-y">
                {upcoming!.map((d) => {
                  // eslint-disable-next-line @typescript-eslint/no-explicit-any
                  const dany = d as any;
                  const tutorName = dany.orders?.customers?.name ?? "Cliente";
                  const petName = dany.orders?.pets?.name as string | undefined;
                  return (
                    <li key={d.id}>
                      <Link
                        href={`/pedidos/${dany.orders?.id ?? ""}`}
                        className="flex items-center justify-between gap-3 px-4 py-3 hover:bg-muted/50"
                      >
                        <div className="min-w-0">
                          <div className="truncate text-sm font-medium">
                            {tutorName}
                            {petName && (
                              <span className="ml-1 text-muted-foreground">
                                · 🐾 {petName}
                              </span>
                            )}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {formatDate(d.scheduled_date)}
                            {d.scheduled_time && ` · ${d.scheduled_time.slice(0, 5)}`}
                          </div>
                        </div>
                        <Badge variant={d.status === "delivered" ? "success" : "outline"}>
                          {statusLabel(d.status)}
                        </Badge>
                      </Link>
                    </li>
                  );
                })}
              </ul>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="flex items-center gap-2 text-base">
              <Wallet className="h-4 w-4 text-primary" /> A receber
            </CardTitle>
            <Button asChild variant="ghost" size="sm">
              <Link href="/pagamentos">Ver todos</Link>
            </Button>
          </CardHeader>
          <CardContent className="p-0">
            {(pending?.length ?? 0) === 0 ? (
              <p className="p-6 text-center text-sm text-muted-foreground">
                🎉 Tudo em dia! Nenhum pagamento pendente.
              </p>
            ) : (
              <ul className="divide-y">
                {pending!.map((p) => (
                  <li key={p.id}>
                    {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                    <Link
                      href={`/pedidos/${(p as any).orders?.id ?? ""}`}
                      className="flex items-center justify-between gap-3 px-4 py-3 hover:bg-muted/50"
                    >
                      <div className="min-w-0">
                        <div className="truncate text-sm font-medium">
                          {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                          {(p as any).orders?.customers?.name ?? "Cliente"}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {p.due_date ? `Vence ${formatDate(p.due_date)}` : "Sem vencimento"}
                        </div>
                      </div>
                      <div className="text-right shrink-0">
                        <div className="text-sm font-semibold tabular-nums">
                          {formatBRL(Number(p.amount))}
                        </div>
                        <Badge
                          variant={p.status === "overdue" ? "destructive" : "warning"}
                          className="mt-1"
                        >
                          {statusLabel(p.status)}
                        </Badge>
                      </div>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Atalhos rapidos */}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <QuickAction
          href="/clientes/novo"
          icon={<PawPrint className="h-4 w-4" />}
          label="Novo cliente"
        />
        <QuickAction
          href="/estoque"
          icon={<PackageOpen className="h-4 w-4" />}
          label="Atualizar estoque"
        />
        <QuickAction
          href="/compras"
          icon={<ShoppingCart className="h-4 w-4" />}
          label="Lista de compras"
        />
        <QuickAction
          href="/relatorios"
          icon={<TrendingUp className="h-4 w-4" />}
          label="Ver relatórios"
        />
      </div>
    </div>
  );
}

function StatCard({
  icon,
  label,
  value,
  tone,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  tone?: "success" | "warning";
}) {
  const iconClass =
    tone === "success"
      ? "bg-emerald-100 text-emerald-700"
      : tone === "warning"
      ? "bg-amber-100 text-amber-700"
      : "bg-primary/10 text-primary";
  const valueClass =
    tone === "success" ? "text-emerald-700" : tone === "warning" ? "text-amber-700" : "";
  return (
    <Card>
      <CardContent className="flex items-center gap-3 p-4">
        <div
          className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-lg ${iconClass}`}
        >
          {icon}
        </div>
        <div className="min-w-0">
          <div className="truncate text-xs text-muted-foreground">{label}</div>
          <div className={`text-lg font-bold tabular-nums ${valueClass}`}>{value}</div>
        </div>
      </CardContent>
    </Card>
  );
}

function QuickAction({
  href,
  icon,
  label,
}: {
  href: string;
  icon: React.ReactNode;
  label: string;
}) {
  return (
    <Link href={href}>
      <Card className="transition-all hover:border-primary/40 hover:shadow-sm">
        <CardContent className="flex items-center gap-2 p-3 text-sm">
          <span className="flex h-8 w-8 items-center justify-center rounded-md bg-primary/10 text-primary">
            {icon}
          </span>
          <span className="font-medium">{label}</span>
        </CardContent>
      </Card>
    </Link>
  );
}
