"use client";

import "react-big-calendar/lib/css/react-big-calendar.css";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Calendar, dateFnsLocalizer, type View } from "react-big-calendar";
import { format, parse, startOfWeek, getDay, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Card, CardContent } from "@/components/ui/card";

const locales = { "pt-BR": ptBR };
const localizer = dateFnsLocalizer({ format, parse, startOfWeek, getDay, locales });

interface CalEvent {
  id: string;
  orderId: string;
  title: string;
  date: string;
  time: string | null;
  status: string;
}

export function DeliveryCalendar({ events }: { events: CalEvent[] }) {
  const router = useRouter();
  const [view, setView] = useState<View>("month");
  const [date, setDate] = useState(new Date());

  const mapped = useMemo(
    () =>
      events.map((e) => {
        const start = parseISO(`${e.date}T${e.time ?? "10:00"}`);
        const end = new Date(start.getTime() + 30 * 60 * 1000);
        return {
          id: e.id,
          orderId: e.orderId,
          title: e.title,
          start,
          end,
          allDay: !e.time,
          resource: { status: e.status },
        };
      }),
    [events]
  );

  return (
    <Card>
      <CardContent className="p-4">
        <div className="h-[70vh] min-h-[500px]">
          <Calendar
            localizer={localizer}
            events={mapped}
            view={view}
            onView={setView}
            date={date}
            onNavigate={setDate}
            culture="pt-BR"
            views={["month", "week", "day", "agenda"]}
            popup
            onSelectEvent={(ev) => router.push(`/pedidos/${(ev as { orderId: string }).orderId}`)}
            messages={{
              today: "Hoje",
              previous: "Anterior",
              next: "Próximo",
              month: "Mês",
              week: "Semana",
              day: "Dia",
              agenda: "Agenda",
              date: "Data",
              time: "Hora",
              event: "Entrega",
              noEventsInRange: "Sem entregas neste período.",
              showMore: (count) => `+ ${count} mais`,
            }}
            eventPropGetter={(ev) => {
              const r = (ev as { resource?: { status: string } }).resource;
              const status = r?.status;
              const bg =
                status === "delivered"
                  ? "#059669"
                  : status === "cancelled"
                  ? "#9ca3af"
                  : "hsl(var(--primary))";
              return { style: { backgroundColor: bg, borderRadius: 6 } };
            }}
          />
        </div>
      </CardContent>
    </Card>
  );
}
