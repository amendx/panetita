"use client";

import { useState } from "react";
import { Check, Loader2, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import { updatePaymentStatus } from "../actions";

export function PaymentRowActions({
  paymentId,
  status,
}: {
  paymentId: string;
  status: "pending" | "paid" | "overdue";
}) {
  const { toast } = useToast();
  const [pending, setPending] = useState(false);

  async function run(newStatus: "paid" | "pending", successMsg: string) {
    setPending(true);
    try {
      await updatePaymentStatus({ id: paymentId, status: newStatus });
      toast({ title: successMsg });
    } catch (e) {
      toast({
        title: "Erro ao atualizar pagamento",
        description: e instanceof Error ? e.message : String(e),
        variant: "destructive",
      });
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="flex justify-end gap-1">
      {status !== "paid" ? (
        <Button
          variant="ghost"
          size="sm"
          disabled={pending}
          onClick={() => run("paid", "Pagamento confirmado")}
        >
          {pending ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Check className="h-4 w-4" />
          )}
          {pending ? "Salvando..." : "Marcar pago"}
        </Button>
      ) : (
        <Button
          variant="ghost"
          size="sm"
          disabled={pending}
          onClick={() => run("pending", "Marcado como pendente")}
        >
          {pending ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <RotateCcw className="h-4 w-4" />
          )}
        </Button>
      )}
    </div>
  );
}
