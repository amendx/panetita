"use client";

import { useState } from "react";
import { Loader2, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/components/ui/use-toast";
import { isRedirectError } from "@/lib/is-redirect-error";
import { deleteOrder, updateOrderStatus } from "../actions";
import { statusLabel } from "@/lib/format";
import type { OrderStatus } from "@/types/database";

export function OrderActions({ orderId, status }: { orderId: string; status: OrderStatus }) {
  const { toast } = useToast();
  const [updatingStatus, setUpdatingStatus] = useState(false);
  const [deleting, setDeleting] = useState(false);

  return (
    <div className="flex items-center gap-2">
      <div className="relative">
        <Select
          value={status}
          disabled={updatingStatus}
          onValueChange={async (v) => {
            setUpdatingStatus(true);
            try {
              await updateOrderStatus(orderId, v as OrderStatus);
              toast({ title: "Status do pedido atualizado" });
            } catch (e) {
              toast({
                title: "Erro ao atualizar status",
                description: e instanceof Error ? e.message : String(e),
                variant: "destructive",
              });
            } finally {
              setUpdatingStatus(false);
            }
          }}
        >
          <SelectTrigger className="w-40">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {(["draft", "confirmed", "delivered", "cancelled"] as OrderStatus[]).map((s) => (
              <SelectItem key={s} value={s}>
                {statusLabel(s)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {updatingStatus && (
          <Loader2 className="pointer-events-none absolute right-9 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin text-muted-foreground" />
        )}
      </div>
      <Button
        variant="ghost"
        size="icon"
        disabled={deleting}
        onClick={async () => {
          if (!confirm("Excluir este pedido? A ação não pode ser desfeita.")) return;
          setDeleting(true);
          try {
            await deleteOrder(orderId);
            toast({ title: "Pedido excluído" });
          } catch (e) {
            if (isRedirectError(e)) throw e;
            toast({
              title: "Erro ao excluir pedido",
              description: e instanceof Error ? e.message : String(e),
              variant: "destructive",
            });
            setDeleting(false);
          }
        }}
      >
        {deleting ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <Trash2 className="h-4 w-4 text-destructive" />
        )}
      </Button>
    </div>
  );
}
