"use client";

import { Check, RotateCcw } from "lucide-react";
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
  return (
    <div className="flex justify-end gap-1">
      {status !== "paid" ? (
        <Button
          variant="ghost"
          size="sm"
          onClick={async () => {
            try {
              await updatePaymentStatus({ id: paymentId, status: "paid" });
              toast({ title: "Pagamento confirmado" });
            } catch (e) {
              toast({ title: "Erro", description: String(e), variant: "destructive" });
            }
          }}
        >
          <Check className="h-4 w-4" /> Marcar pago
        </Button>
      ) : (
        <Button
          variant="ghost"
          size="sm"
          onClick={async () => {
            try {
              await updatePaymentStatus({ id: paymentId, status: "pending" });
              toast({ title: "Marcado como pendente" });
            } catch (e) {
              toast({ title: "Erro", description: String(e), variant: "destructive" });
            }
          }}
        >
          <RotateCcw className="h-4 w-4" />
        </Button>
      )}
    </div>
  );
}
