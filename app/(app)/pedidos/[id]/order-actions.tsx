"use client";

import { Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/components/ui/use-toast";
import { deleteOrder, updateOrderStatus } from "../actions";
import { statusLabel } from "@/lib/format";
import type { OrderStatus } from "@/types/database";

export function OrderActions({ orderId, status }: { orderId: string; status: OrderStatus }) {
  const { toast } = useToast();
  return (
    <div className="flex gap-2">
      <Select
        value={status}
        onValueChange={async (v) => {
          try {
            await updateOrderStatus(orderId, v as OrderStatus);
            toast({ title: "Status atualizado" });
          } catch (e) {
            toast({ title: "Erro", description: String(e), variant: "destructive" });
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
      <Button
        variant="ghost"
        size="icon"
        onClick={async () => {
          if (!confirm("Excluir este pedido?")) return;
          try {
            await deleteOrder(orderId);
          } catch (e) {
            toast({ title: "Erro", description: String(e), variant: "destructive" });
          }
        }}
      >
        <Trash2 className="h-4 w-4 text-destructive" />
      </Button>
    </div>
  );
}
