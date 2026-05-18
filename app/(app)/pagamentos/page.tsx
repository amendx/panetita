import Link from "next/link";
import { Wallet } from "lucide-react";
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
import { formatBRL, formatDate, paymentMethodLabel, statusLabel } from "@/lib/format";
import { PaymentRowActions } from "../pedidos/[id]/payment-row-actions";

export const dynamic = "force-dynamic";

export default async function PagamentosPage({
  searchParams,
}: {
  searchParams: Promise<{ filter?: string }>;
}) {
  const { filter = "pending" } = await searchParams;
  const supabase = await createClient();

  let q = supabase
    .from("payments")
    .select("id, amount, method, due_date, paid_at, status, orders(id, customers(name))")
    .order("due_date", { ascending: true, nullsFirst: false });

  if (filter === "pending") q = q.in("status", ["pending", "overdue"]);
  if (filter === "paid") q = q.eq("status", "paid");

  const { data: payments } = await q;

  const totalPending = (payments ?? [])
    .filter((p) => p.status !== "paid")
    .reduce((a, p) => a + Number(p.amount), 0);

  return (
    <div className="mx-auto max-w-5xl">
      <PageHeader title="Pagamentos" description={`Pendente: ${formatBRL(totalPending)}`} />

      <div className="mb-4 flex flex-wrap gap-2">
        <FilterLink current={filter} value="pending" label="Pendentes" />
        <FilterLink current={filter} value="paid" label="Pagos" />
        <FilterLink current={filter} value="all" label="Todos" />
      </div>

      {(payments?.length ?? 0) === 0 ? (
        <Card>
          <CardContent className="p-8 text-center text-muted-foreground">
            <Wallet className="mx-auto mb-3 h-10 w-10 opacity-50" />
            Nenhum pagamento.
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Cliente</TableHead>
                  <TableHead>Vencimento</TableHead>
                  <TableHead>Método</TableHead>
                  <TableHead className="text-right">Valor</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="w-40 text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {payments!.map((p) => (
                  <TableRow key={p.id}>
                    <TableCell>
                      <Link
                        // @ts-expect-error nested
                        href={`/pedidos/${p.orders?.id}`}
                        className="font-medium hover:underline"
                      >
                        {/* @ts-expect-error nested */}
                        {p.orders?.customers?.name ?? "—"}
                      </Link>
                    </TableCell>
                    <TableCell>{p.due_date ? formatDate(p.due_date) : "—"}</TableCell>
                    <TableCell>{paymentMethodLabel(p.method)}</TableCell>
                    <TableCell className="text-right font-semibold tabular-nums">
                      {formatBRL(Number(p.amount))}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          p.status === "paid"
                            ? "success"
                            : p.status === "overdue"
                            ? "destructive"
                            : "warning"
                        }
                      >
                        {statusLabel(p.status)}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <PaymentRowActions paymentId={p.id} status={p.status} />
                    </TableCell>
                  </TableRow>
                ))}
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
      href={`?filter=${value}`}
      className={`rounded-full px-3 py-1.5 text-sm transition-colors ${
        active ? "bg-primary text-primary-foreground" : "bg-muted text-foreground hover:bg-muted/80"
      }`}
    >
      {label}
    </Link>
  );
}
