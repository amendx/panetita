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

const STATUS_COLORS: Record<string, string> = {
  scheduled: "hsl(var(--primary))",
  delivered: "#059669",
  cancelled: "#9ca3af",
};

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

  const counts = useMemo(() => {
    const c = { scheduled: 0, delivered: 0, cancelled: 0 };
    for (const e of events) {
      if (e.status === "scheduled") c.scheduled++;
      else if (e.status === "delivered") c.delivered++;
      else if (e.status === "cancelled") c.cancelled++;
    }
    return c;
  }, [events]);

  return (
    <Card>
      <CardContent className="p-4 md:p-6">
        {/* Legenda */}
        <div className="mb-4 flex flex-wrap items-center gap-3 text-xs">
          <LegendDot color={STATUS_COLORS.scheduled} label={`Agendadas (${counts.scheduled})`} />
          <LegendDot color={STATUS_COLORS.delivered} label={`Entregues (${counts.delivered})`} />
          <LegendDot color={STATUS_COLORS.cancelled} label={`Canceladas (${counts.cancelled})`} />
        </div>

        <div className="h-[70vh] min-h-[520px]">
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
              previous: "‹",
              next: "›",
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
            formats={{
              monthHeaderFormat: (d, _c, l) => l?.format(d, "MMMM 'de' yyyy", "pt-BR") ?? "",
              weekdayFormat: (d, _c, l) => l?.format(d, "EEE", "pt-BR") ?? "",
              dayHeaderFormat: (d, _c, l) =>
                l?.format(d, "EEEE, dd 'de' MMMM", "pt-BR") ?? "",
              dayRangeHeaderFormat: ({ start, end }, _c, l) =>
                `${l?.format(start, "dd MMM", "pt-BR")} – ${l?.format(end, "dd MMM", "pt-BR")}`,
              agendaDateFormat: (d, _c, l) => l?.format(d, "EEE, dd/MM", "pt-BR") ?? "",
              agendaTimeFormat: (d, _c, l) => l?.format(d, "HH:mm", "pt-BR") ?? "",
              eventTimeRangeFormat: ({ start }, _c, l) =>
                l?.format(start, "HH:mm", "pt-BR") ?? "",
            }}
            eventPropGetter={(ev) => {
              const r = (ev as { resource?: { status: string } }).resource;
              const status = r?.status ?? "scheduled";
              const bg = STATUS_COLORS[status] ?? STATUS_COLORS.scheduled;
              return { style: { backgroundColor: bg } };
            }}
          />
        </div>
      </CardContent>
    </Card>
  );
}

function LegendDot({ color, label }: { color: string; label: string }) {
  return (
    <span className="inline-flex items-center gap-1.5">
      <span
        className="inline-block h-2.5 w-2.5 rounded-full"
        style={{ backgroundColor: color }}
      />
      <span className="text-muted-foreground">{label}</span>
    </span>
  );
}
