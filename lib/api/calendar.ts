// lib/api/calendar.ts
import { apiFetch } from "@/lib/api/client";

export type CalendarEvent = {
  id: string;
  summary?: string; // <- opcional (el backend puede mandarlo vacío)
  description?: string;
  location?: string;
  start: string; // RFC3339 o YYYY-MM-DD
  end: string;
  all_day?: boolean;
  hangoutLink?: string;
  htmlLink?: string;
};

export async function listEventsWeek(
  dateISO: string
): Promise<CalendarEvent[]> {
  const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
  const qs = new URLSearchParams({ view: "week", date: dateISO, tz });

  const res = await apiFetch<{
    items: CalendarEvent[];
    nextPageToken?: string;
  }>(`/calendar/events?${qs.toString()}`);

  // Desenvuelve y tolera undefined
  return res?.items ?? [];
}

export async function createEvent(payload: {
  summary: string;
  start: string; // "YYYY-MM-DDTHH:mm" local
  end: string; // "YYYY-MM-DDTHH:mm" local
  timezone: string;
  description?: string;
  location?: string;
  all_day?: boolean;
  create_meet?: boolean;
}) {
  return apiFetch("/calendar/events", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function deleteEvent(eventId: string) {
  return apiFetch(`/calendar/events/${eventId}`, { method: "DELETE" });
}

export async function getGoogleAuthUrl(): Promise<string> {
  const data = await apiFetch<{ url: string }>("/integrations/google/auth-url");
  return data.url;
}
