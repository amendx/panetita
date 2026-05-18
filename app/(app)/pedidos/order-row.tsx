"use client";

import { useRouter } from "next/navigation";
import { TableCell, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import {
  deliveryTypeShort,
  formatBRL,
  formatDate,
  recurrenceLabel,
  statusLabel,
} from "@/lib/format";

export function OrderRow({
  id,
  customerName,
  petName,
  nextDate,
  deliveryType,
  recurrence,
  status,
  totalPrice,
  profit,
}: {
  id: string;
  customerName: string;
  petName: string | null;
  nextDate: string | null;
  deliveryType: string | null;
  recurrence: string;
  status: string;
  totalPrice: number;
  profit: number;
}) {
  const router = useRouter();
  return (
    <TableRow
      className="cursor-pointer transition-colors hover:bg-muted/60"
      onClick={() => router.push(`/pedidos/${id}`)}
    >
      <TableCell>
        <div className="font-medium">{customerName}</div>
        {petName && (
          <div className="text-xs text-muted-foreground">🐾 {petName}</div>
        )}
      </TableCell>
      <TableCell className="hidden text-sm sm:table-cell">
        {nextDate ? formatDate(nextDate) : <span className="text-muted-foreground">—</span>}
      </TableCell>
      <TableCell>
        {deliveryType ? (
          <Badge variant="outline">
            {deliveryType === "mixed" ? "Misto" : deliveryTypeShort(deliveryType)}
          </Badge>
        ) : (
          <span className="text-xs text-muted-foreground">—</span>
        )}
      </TableCell>
      <TableCell>{recurrenceLabel(recurrence)}</TableCell>
      <TableCell>
        <Badge
          variant={
            status === "delivered"
              ? "success"
              : status === "cancelled"
              ? "destructive"
              : "secondary"
          }
        >
          {statusLabel(status)}
        </Badge>
      </TableCell>
      <TableCell className="text-right font-semibold tabular-nums">
        {formatBRL(totalPrice)}
      </TableCell>
      <TableCell className="hidden text-right tabular-nums text-emerald-700 md:table-cell">
        {formatBRL(profit)}
      </TableCell>
    </TableRow>
  );
}
