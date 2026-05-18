"use client";

import { useState } from "react";
import { CalendarPlus, Check, Download, Loader2, Pencil } from "lucide-react";
import { parseISO } from "date-fns";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useToast } from "@/components/ui/use-toast";
import { updateDelivery, updateDeliveryStatus } from "../actions";
import { buildIcs, downloadIcs, googleCalendarUrl } from "@/lib/ics";
import type { DeliveryStatus, DeliveryType } from "@/types/database";

export function DeliveryRowActions({
  deliveryId,
  status,
  scheduledDate,
  scheduledTime,
  deliveryType,
  notes,
  customerName,
  addressSummary,
  itemsText,
}: {
  deliveryId: string;
  status: DeliveryStatus;
  scheduledDate: string;
  scheduledTime: string | null;
  deliveryType: DeliveryType;
  notes: string | null;
  customerName: string;
  addressSummary?: string;
  itemsText?: string;
}) {
  const { toast } = useToast();
  const [editOpen, setEditOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [date, setDate] = useState(scheduledDate);
  const [time, setTime] = useState(scheduledTime ?? "");
  const [type, setType] = useState<DeliveryType>(deliveryType ?? "uber_99");
  const [noteText, setNoteText] = useState(notes ?? "");

  const start = parseISO(`${scheduledDate}T${scheduledTime ?? "10:00"}`);
  const event = {
    uid: `panetita-${deliveryId}`,
    title: `Entrega Panetita — ${customerName}`,
    description: itemsText ?? "",
    location: addressSummary,
    start,
    durationMinutes: 30,
  };

  function openEdit() {
    setDate(scheduledDate);
    setTime(scheduledTime ?? "");
    setType(deliveryType ?? "uber_99");
    setNoteText(notes ?? "");
    setEditOpen(true);
  }

  async function handleSave() {
    setSaving(true);
    try {
      await updateDelivery({
        id: deliveryId,
        scheduled_date: date,
        scheduled_time: time || null,
        delivery_type: type,
        notes: noteText || null,
      });
      toast({ title: "Entrega atualizada" });
      setEditOpen(false);
    } catch (e) {
      toast({ title: "Erro", description: String(e), variant: "destructive" });
    } finally {
      setSaving(false);
    }
  }

  return (
    <>
      <div className="flex justify-end gap-1">
        <Button variant="ghost" size="icon" title="Editar entrega" onClick={openEdit}>
          <Pencil className="h-4 w-4" />
        </Button>
        {status !== "delivered" && (
          <Button
            variant="ghost"
            size="icon"
            title="Marcar como entregue"
            onClick={async () => {
              try {
                await updateDeliveryStatus({ id: deliveryId, status: "delivered" });
                toast({ title: "Entrega confirmada" });
              } catch (e) {
                toast({ title: "Erro", description: String(e), variant: "destructive" });
              }
            }}
          >
            <Check className="h-4 w-4" />
          </Button>
        )}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" title="Calendário">
              <CalendarPlus className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem asChild>
              <a href={googleCalendarUrl(event)} target="_blank" rel="noopener noreferrer">
                <CalendarPlus className="h-4 w-4" /> Adicionar ao Google Calendar
              </a>
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => downloadIcs(`entrega-${deliveryId}.ics`, buildIcs(event))}
            >
              <Download className="h-4 w-4" /> Baixar .ics
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Editar entrega</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Data da entrega</Label>
                <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
              </div>
              <div>
                <Label>Horário</Label>
                <Input
                  type="time"
                  value={time}
                  onChange={(e) => setTime(e.target.value)}
                  placeholder="--:--"
                />
              </div>
            </div>
            <div>
              <Label>Tipo de entrega</Label>
              <Select value={type} onValueChange={(v) => setType(v as DeliveryType)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="uber_99">Uber/99 — cliente paga</SelectItem>
                  <SelectItem value="pickup">Retirada na loja</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Observações</Label>
              <Textarea value={noteText} onChange={(e) => setNoteText(e.target.value)} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving && <Loader2 className="h-4 w-4 animate-spin" />}
              {saving ? "Salvando..." : "Salvar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
