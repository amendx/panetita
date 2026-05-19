"use client";

import { useState } from "react";
import { Check, Loader2, Pencil, Plus, RotateCcw, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { CurrencyInput } from "@/components/ui/currency-input";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useToast } from "@/components/ui/use-toast";
import {
  addPayment,
  deletePayment,
  updatePayment,
  updatePaymentStatus,
} from "../actions";
import {
  formatBRL,
  formatDate,
  paymentMethodLabel,
  statusLabel,
} from "@/lib/format";
import type { PaymentMethod } from "@/types/database";

interface PaymentRow {
  id: string;
  amount: number;
  method: string;
  due_date: string | null;
  paid_at: string | null;
  status: "pending" | "paid" | "overdue";
  notes: string | null;
}

interface FormState {
  amount: number;
  method: PaymentMethod;
  due_date: string;
  status: "pending" | "paid";
  notes: string;
}

const emptyForm: FormState = {
  amount: 0,
  method: "pix",
  due_date: "",
  status: "pending",
  notes: "",
};

export function PaymentManager({
  orderId,
  payments,
  orderTotal,
}: {
  orderId: string;
  payments: PaymentRow[];
  orderTotal: number;
}) {
  const { toast } = useToast();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<PaymentRow | null>(null);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [saving, setSaving] = useState(false);
  const [statusLoadingId, setStatusLoadingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const paidSum = payments
    .filter((p) => p.status === "paid")
    .reduce((a, p) => a + Number(p.amount), 0);
  const pendingSum = payments
    .filter((p) => p.status !== "paid")
    .reduce((a, p) => a + Number(p.amount), 0);
  const registeredSum = paidSum + pendingSum;
  const diff = orderTotal - registeredSum;
  const remainingToCharge = orderTotal - paidSum;

  function openAdd() {
    setEditing(null);
    // pre-preenche com o que falta cobrar (se positivo)
    setForm({
      ...emptyForm,
      amount: diff > 0 ? Number(diff.toFixed(2)) : 0,
    });
    setDialogOpen(true);
  }

  function openEdit(p: PaymentRow) {
    setEditing(p);
    setForm({
      amount: Number(p.amount),
      method: p.method as PaymentMethod,
      due_date: p.due_date ?? "",
      status: p.status === "overdue" ? "pending" : (p.status as "pending" | "paid"),
      notes: p.notes ?? "",
    });
    setDialogOpen(true);
  }

  async function handleSave() {
    if (form.amount <= 0) {
      toast({ title: "Valor deve ser maior que zero", variant: "destructive" });
      return;
    }
    setSaving(true);
    try {
      if (editing) {
        await updatePayment({
          id: editing.id,
          amount: form.amount,
          method: form.method,
          due_date: form.due_date || null,
          status: form.status,
          notes: form.notes || null,
        });
        toast({ title: "Pagamento atualizado" });
      } else {
        await addPayment({
          order_id: orderId,
          amount: form.amount,
          method: form.method,
          due_date: form.due_date || null,
          status: form.status,
          notes: form.notes || null,
        });
        toast({ title: "Pagamento adicionado" });
      }
      setDialogOpen(false);
      setEditing(null);
      setForm(emptyForm);
    } catch (e) {
      toast({
        title: "Erro ao salvar pagamento",
        description: e instanceof Error ? e.message : String(e),
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  }

  async function handleQuickStatus(p: PaymentRow, newStatus: "paid" | "pending") {
    setStatusLoadingId(p.id);
    try {
      await updatePaymentStatus({ id: p.id, status: newStatus });
      toast({
        title: newStatus === "paid" ? "Pagamento confirmado" : "Marcado como pendente",
      });
    } catch (e) {
      toast({
        title: "Erro",
        description: e instanceof Error ? e.message : String(e),
        variant: "destructive",
      });
    } finally {
      setStatusLoadingId(null);
    }
  }

  async function handleDelete(p: PaymentRow) {
    if (!confirm(`Excluir pagamento de ${formatBRL(Number(p.amount))}?`)) return;
    setDeletingId(p.id);
    try {
      await deletePayment(p.id);
      toast({ title: "Pagamento excluído" });
    } catch (e) {
      toast({
        title: "Erro ao excluir",
        description: e instanceof Error ? e.message : String(e),
        variant: "destructive",
      });
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <>
      {/* Resumo + botao adicionar */}
      <div className="border-b p-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="grid grid-cols-3 gap-3 sm:flex sm:gap-6 text-sm">
            <div>
              <div className="text-[10px] uppercase tracking-wide text-muted-foreground">
                Total do pedido
              </div>
              <div className="font-bold tabular-nums">{formatBRL(orderTotal)}</div>
            </div>
            <div>
              <div className="text-[10px] uppercase tracking-wide text-emerald-700">
                Já recebido
              </div>
              <div className="font-bold tabular-nums text-emerald-700">
                {formatBRL(paidSum)}
              </div>
            </div>
            <div>
              <div className="text-[10px] uppercase tracking-wide text-amber-700">
                Falta cobrar
              </div>
              <div className="font-bold tabular-nums text-amber-700">
                {formatBRL(Math.max(remainingToCharge, 0))}
              </div>
            </div>
          </div>
          <Button onClick={openAdd} size="sm">
            <Plus className="h-4 w-4" /> Adicionar pagamento
          </Button>
        </div>
        {Math.abs(diff) > 0.01 && payments.length > 0 && (
          <div
            className={`mt-3 rounded-md border px-3 py-2 text-xs ${
              diff > 0
                ? "border-amber-300 bg-amber-50 text-amber-900"
                : "border-blue-300 bg-blue-50 text-blue-900"
            }`}
          >
            {diff > 0
              ? `⚠️ Os pagamentos registrados (${formatBRL(registeredSum)}) somam menos que o total do pedido. Faltam ${formatBRL(diff)}.`
              : `ℹ️ Os pagamentos registrados (${formatBRL(registeredSum)}) somam mais que o total (${formatBRL(orderTotal)}). Diferença: ${formatBRL(Math.abs(diff))}.`}
          </div>
        )}
      </div>

      {/* Lista */}
      {payments.length === 0 ? (
        <p className="p-6 text-center text-sm text-muted-foreground">
          Nenhum pagamento registrado.{" "}
          <button onClick={openAdd} className="text-primary underline">
            Adicionar agora
          </button>
        </p>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Valor</TableHead>
              <TableHead>Método</TableHead>
              <TableHead>Vencimento</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="w-44 text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {payments.map((p) => {
              const isStatusLoading = statusLoadingId === p.id;
              const isDeleting = deletingId === p.id;
              return (
                <TableRow key={p.id} className={isDeleting ? "opacity-50" : ""}>
                  <TableCell className="font-semibold tabular-nums">
                    {formatBRL(Number(p.amount))}
                  </TableCell>
                  <TableCell>{paymentMethodLabel(p.method)}</TableCell>
                  <TableCell>{p.due_date ? formatDate(p.due_date) : "—"}</TableCell>
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
                    <div className="flex justify-end gap-1">
                      {p.status !== "paid" ? (
                        <Button
                          variant="ghost"
                          size="sm"
                          disabled={isStatusLoading}
                          onClick={() => handleQuickStatus(p, "paid")}
                          title="Marcar como pago"
                        >
                          {isStatusLoading ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <Check className="h-4 w-4" />
                          )}
                        </Button>
                      ) : (
                        <Button
                          variant="ghost"
                          size="sm"
                          disabled={isStatusLoading}
                          onClick={() => handleQuickStatus(p, "pending")}
                          title="Marcar como pendente"
                        >
                          {isStatusLoading ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <RotateCcw className="h-4 w-4" />
                          )}
                        </Button>
                      )}
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => openEdit(p)}
                        title="Editar pagamento"
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        disabled={isDeleting}
                        onClick={() => handleDelete(p)}
                        title="Excluir pagamento"
                      >
                        {isDeleting ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Trash2 className="h-4 w-4 text-destructive" />
                        )}
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      )}

      {/* Dialog de criar / editar */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>
              {editing ? "Editar pagamento" : "Novo pagamento"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <Label>Valor</Label>
              <CurrencyInput
                value={form.amount}
                onChange={(v) => setForm({ ...form, amount: v })}
              />
              {!editing && remainingToCharge > 0 && form.amount !== remainingToCharge && (
                <button
                  type="button"
                  onClick={() => setForm({ ...form, amount: Number(remainingToCharge.toFixed(2)) })}
                  className="mt-1 text-xs text-primary underline"
                >
                  Preencher com {formatBRL(remainingToCharge)} (o que falta)
                </button>
              )}
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Método</Label>
                <Select
                  value={form.method}
                  onValueChange={(v) =>
                    setForm({ ...form, method: v as PaymentMethod })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pix">PIX</SelectItem>
                    <SelectItem value="cash">Dinheiro</SelectItem>
                    <SelectItem value="card">Cartão</SelectItem>
                    <SelectItem value="transfer">Transferência</SelectItem>
                    <SelectItem value="other">Outro</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Status</Label>
                <Select
                  value={form.status}
                  onValueChange={(v) =>
                    setForm({ ...form, status: v as "pending" | "paid" })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pending">Pendente</SelectItem>
                    <SelectItem value="paid">Pago</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div>
              <Label>Vencimento (opcional)</Label>
              <Input
                type="date"
                value={form.due_date}
                onChange={(e) => setForm({ ...form, due_date: e.target.value })}
              />
            </div>
            <div>
              <Label>Observações (opcional)</Label>
              <Textarea
                value={form.notes}
                onChange={(e) => setForm({ ...form, notes: e.target.value })}
                rows={2}
                placeholder="Ex: comprovante enviado por WhatsApp"
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDialogOpen(false)}
              disabled={saving}
            >
              Cancelar
            </Button>
            <Button onClick={handleSave} disabled={saving || form.amount <= 0}>
              {saving && <Loader2 className="h-4 w-4 animate-spin" />}
              {saving ? "Salvando..." : editing ? "Salvar" : "Adicionar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
