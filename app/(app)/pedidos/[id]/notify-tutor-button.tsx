"use client";

import { MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import { openWhatsapp, normalizeBrPhone } from "@/lib/whatsapp";
import { formatBRL, formatDate, deliveryTypeLabel } from "@/lib/format";

interface Props {
  tutorName: string;
  tutorPhone: string | null;
  petName: string | null;
  orderTotal: number;
  amountDue: number;
  itemLines: string[];
  nextDeliveryDate: string | null;
  nextDeliveryTime: string | null;
  nextDeliveryType: string | null;
  addressSummary: string | null;
}

export function NotifyTutorButton({
  tutorName,
  tutorPhone,
  petName,
  orderTotal,
  amountDue,
  itemLines,
  nextDeliveryDate,
  nextDeliveryTime,
  nextDeliveryType,
  addressSummary,
}: Props) {
  const { toast } = useToast();
  const isPaid = amountDue <= 0 && orderTotal > 0;

  function buildMessage(): string {
    const lines: string[] = [];
    lines.push(`Oi ${tutorName.split(" ")[0]}! 🐶`);
    if (isPaid) {
      lines.push(
        petName
          ? `O pedido do(a) ${petName} está pago e prontinho pra entrega! 🎉`
          : "Seu pedido está pago e prontinho pra entrega! 🎉"
      );
    } else if (petName) {
      lines.push(`A panelinha do(a) ${petName} está pronta!`);
    } else {
      lines.push("Sua panelinha está pronta!");
    }
    lines.push("");
    lines.push("*Pedido:*");
    for (const item of itemLines) lines.push(item);

    if (nextDeliveryDate) {
      lines.push("");
      const dt = formatDate(nextDeliveryDate);
      lines.push(`📅 *Entrega:* ${dt}`);
      if (nextDeliveryType) {
        lines.push(`🚚 *Modo:* ${deliveryTypeLabel(nextDeliveryType)}`);
      }
      if (nextDeliveryType === "uber_99" && addressSummary) {
        lines.push(`📍 Endereço: ${addressSummary}`);
      } else if (nextDeliveryType === "pickup") {
        lines.push("📍 Retirada na loja");
      }
      if (nextDeliveryTime) {
        const hhmm = nextDeliveryTime.slice(0, 5);
        lines.push(`⏰ Podemos confirmar a entrega às ${hhmm}?`);
      } else {
        lines.push("⏰ Podemos combinar um horário?");
      }
    }

    if (!isPaid && amountDue > 0) {
      lines.push("");
      lines.push(`💰 *Total:* ${formatBRL(amountDue)}`);
      lines.push("Pode pagar via *PIX* — me chama por aqui que te passo a chave 🩷");
    }

    lines.push("");
    lines.push("Qualquer dúvida me chama por aqui! 🐾");

    return lines.join("\n");
  }

  function handleClick() {
    if (!tutorPhone) {
      toast({
        title: "Tutor sem WhatsApp cadastrado",
        description: "Adicione o número na tela do cliente para usar este botão.",
        variant: "destructive",
      });
      return;
    }
    if (!normalizeBrPhone(tutorPhone)) {
      toast({
        title: "Número inválido",
        description: "Confira o WhatsApp do tutor.",
        variant: "destructive",
      });
      return;
    }
    openWhatsapp(tutorPhone, buildMessage());
  }

  return (
    <Button onClick={handleClick} variant="default" className="bg-emerald-600 hover:bg-emerald-700">
      <MessageCircle className="h-4 w-4" />
      Avisar tutor
    </Button>
  );
}
