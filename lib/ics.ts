import { format } from "date-fns";

export interface CalendarEventInput {
  uid: string;
  title: string;
  description?: string;
  location?: string;
  start: Date;
  durationMinutes?: number;
}

function toICSDate(d: Date): string {
  return format(d, "yyyyMMdd'T'HHmmss");
}

function escapeICS(s: string): string {
  return s.replace(/\\/g, "\\\\").replace(/\n/g, "\\n").replace(/,/g, "\\,").replace(/;/g, "\\;");
}

export function buildIcs(ev: CalendarEventInput): string {
  const duration = ev.durationMinutes ?? 30;
  const end = new Date(ev.start.getTime() + duration * 60 * 1000);
  const stamp = toICSDate(new Date());

  const lines = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Panetita//Panelinha da Tita//PT-BR",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    "BEGIN:VEVENT",
    `UID:${ev.uid}`,
    `DTSTAMP:${stamp}`,
    `DTSTART:${toICSDate(ev.start)}`,
    `DTEND:${toICSDate(end)}`,
    `SUMMARY:${escapeICS(ev.title)}`,
    ev.description ? `DESCRIPTION:${escapeICS(ev.description)}` : "",
    ev.location ? `LOCATION:${escapeICS(ev.location)}` : "",
    "END:VEVENT",
    "END:VCALENDAR",
  ].filter(Boolean);

  return lines.join("\r\n");
}

export function googleCalendarUrl(ev: CalendarEventInput): string {
  const duration = ev.durationMinutes ?? 30;
  const end = new Date(ev.start.getTime() + duration * 60 * 1000);
  const fmt = (d: Date) => format(d, "yyyyMMdd'T'HHmmss");

  const params = new URLSearchParams({
    action: "TEMPLATE",
    text: ev.title,
    dates: `${fmt(ev.start)}/${fmt(end)}`,
  });
  if (ev.description) params.set("details", ev.description);
  if (ev.location) params.set("location", ev.location);

  return `https://calendar.google.com/calendar/render?${params.toString()}`;
}

export function downloadIcs(filename: string, content: string): void {
  const blob = new Blob([content], { type: "text/calendar;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename.endsWith(".ics") ? filename : `${filename}.ics`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
