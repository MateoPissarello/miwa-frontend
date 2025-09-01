"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  CalendarEvent,
  createEvent,
  deleteEvent,
  getGoogleAuthUrl,
  listEventsWeek,
} from "@/lib/api/calendar";
import {
  addDays,
  addWeeks,
  endOfWeek,
  format,
  isSameDay,
  startOfWeek,
} from "date-fns";
import { es } from "date-fns/locale";
import { ChevronLeft, ChevronRight, Plus, Trash2 } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

type DayMap = Record<string, CalendarEvent[]>; // key = yyyy-MM-dd

// Fecha local "YYYY-MM-DD" (no UTC)
function toLocalDate(d: Date) {
  return format(d, "yyyy-MM-dd");
}

function fromDateAndTime(dateISO: string, timeHHmm: string) {
  return `${dateISO}T${timeHHmm}`;
}

export default function CalendarWeekPage() {
  const [anchor, setAnchor] = useState(new Date()); // cualquier día dentro de la semana
  const [loading, setLoading] = useState(false);
  const [needsConnect, setNeedsConnect] = useState(false);
  const [dayMap, setDayMap] = useState<DayMap>({});
  const [selectedDay, setSelectedDay] = useState<string | null>(null);

  // create modal state
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [startTime, setStartTime] = useState("09:00");
  const [endTime, setEndTime] = useState("10:00");
  const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;

  // banners (connected/error) desde callback
  const search = useSearchParams();
  const router = useRouter();
  const connected = search.get("connected") === "1";
  const cbError = search.get("error");

  useEffect(() => {
    if (connected || cbError) {
      const url = new URL(window.location.href);
      url.searchParams.delete("connected");
      url.searchParams.delete("error");
      router.replace(url.pathname, { scroll: false });
    }
  }, [connected, cbError, router]);

  // rango semanal (L–D)
  const weekDays = useMemo(() => {
    const start = startOfWeek(anchor, { weekStartsOn: 1 });
    const days: Date[] = [];
    for (let i = 0; i < 7; i++) days.push(addDays(start, i));
    return days;
  }, [anchor]);

  async function loadWeek() {
    setLoading(true);
    try {
      // pedir la semana del LUNES visible
      const weekStart = startOfWeek(anchor, { weekStartsOn: 1 });
      const items = await listEventsWeek(format(weekStart, "yyyy-MM-dd")); // <- array plano

      // agrupar por día local
      const map: DayMap = {};
      for (const d of weekDays) map[toLocalDate(d)] = [];

      for (const ev of items) {
        // Si viene all_day con "YYYY-MM-DD", úsalo; si viene con RFC3339, conviértelo a local
        const k =
          ev.start.length === 10 ? ev.start : toLocalDate(new Date(ev.start));
        if (!map[k]) map[k] = [];
        map[k].push(ev);
      }

      // ordenar eventos por hora de inicio dentro de cada día
      for (const k of Object.keys(map)) {
        map[k].sort(
          (a, b) => new Date(a.start).getTime() - new Date(b.start).getTime()
        );
      }

      setDayMap(map);
      setNeedsConnect(false);
    } catch (e: any) {
      if (e?.status === 409) setNeedsConnect(true);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadWeek();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [anchor]);

  function prevWeek() {
    setAnchor(addWeeks(anchor, -1));
  }
  function nextWeek() {
    setAnchor(addWeeks(anchor, 1));
  }
  function thisWeek() {
    setAnchor(new Date());
  }

  function openCreate(day: Date) {
    const dateISO = toLocalDate(day);
    setSelectedDay(dateISO);
    setStartTime("09:00");
    setEndTime("10:00");
    setTitle("");
    setOpen(true);
  }

  async function submitCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedDay) return;
    await createEvent({
      summary: title,
      start: fromDateAndTime(selectedDay, startTime),
      end: fromDateAndTime(selectedDay, endTime),
      timezone: tz,
    });
    setOpen(false);
    await loadWeek();
  }

  async function onDelete(id: string) {
    await deleteEvent(id);
    loadWeek();
  }

  async function connectGoogle() {
    const url = await getGoogleAuthUrl();
    window.location.href = url;
  }

  return (
    <div className="space-y-4">
      {connected && (
        <div className="rounded-lg border border-teal-200 bg-teal-50 p-3 text-sm text-teal-900">
          ¡Cuenta de Google conectada! Ya puedes usar tu calendario.
        </div>
      )}
      {cbError && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          Error conectando Google: {decodeURIComponent(cbError)}
        </div>
      )}

      <Card className="border-0 shadow-none">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold tracking-tight">Calendario</h1>
              <p className="text-sm text-gray-500">Semana a semana</p>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="ghost" onClick={prevWeek}>
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <div className="text-sm font-medium">
                {format(startOfWeek(anchor, { weekStartsOn: 1 }), "d LLL", {
                  locale: es,
                })}{" "}
                –{" "}
                {format(endOfWeek(anchor, { weekStartsOn: 1 }), "d LLL yyyy", {
                  locale: es,
                })}
              </div>
              <Button variant="ghost" onClick={nextWeek}>
                <ChevronRight className="h-4 w-4" />
              </Button>
              <Button
                className="bg-teal-600 hover:bg-teal-700 text-white"
                onClick={thisWeek}
              >
                Hoy
              </Button>
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-4 h-[calc(100vh-220px)] flex flex-col pb-0">
          {needsConnect && (
            <div className="rounded-lg border border-teal-200 bg-teal-50 p-4 flex items-center justify-between">
              <div>
                <p className="text-sm text-teal-900 font-medium">
                  Conecta tu Google Calendar
                </p>
                <p className="text-xs text-teal-700">
                  Necesitamos tu autorización para sincronizar tus eventos.
                </p>
              </div>
              <Button
                onClick={connectGoogle}
                className="bg-teal-600 hover:bg-teal-700"
              >
                Conectar
              </Button>
            </div>
          )}

          {!needsConnect && (
            <>
              {/* Encabezados de días */}
              <div className="grid grid-cols-7 gap-2 px-1">
                {weekDays.map((d) => (
                  <div key={d.toISOString()} className="text-center">
                    <div className="text-xs text-gray-500">
                      {format(d, "EEE", { locale: es })}
                    </div>
                    <div
                      className={`text-sm font-semibold ${
                        isSameDay(d, new Date())
                          ? "text-teal-700"
                          : "text-gray-900"
                      }`}
                    >
                      {format(d, "d", { locale: es })}
                    </div>
                  </div>
                ))}
              </div>

              {/* Celdas de semana */}
              <div className="grid grid-cols-7 gap-2 flex-1 overflow-auto">
                {weekDays.map((d) => {
                  const key = toLocalDate(d);
                  const events = dayMap[key] || [];
                  return (
                    <div
                      key={key}
                      className="bg-white border border-gray-200 rounded-lg p-2 h-full flex flex-col min-h-0"
                    >
                      {/* botón crear */}
                      <button
                        onClick={() => openCreate(d)}
                        className="mb-2 inline-flex items-center gap-1 self-end text-xs text-teal-700 hover:text-teal-800"
                        title="Crear evento"
                      >
                        <Plus className="h-3 w-3" /> nuevo
                      </button>

                      {/* listado del día */}
                      <div className="space-y-2 overflow-y-auto min-h-0">
                        {events.length === 0 && (
                          <div className="text-xs text-gray-400 text-center mt-6 select-none">
                            (sin eventos)
                          </div>
                        )}
                        {events.map((ev) => (
                          <div
                            key={ev.id}
                            className="group border border-gray-200 rounded-md p-2 hover:bg-gray-50"
                          >
                            <div className="flex items-start justify-between gap-2">
                              <div className="min-w-0">
                                <div className="text-sm font-medium text-gray-900 truncate">
                                  {ev.summary || "(sin título)"}
                                </div>
                                <div className="text-xs text-gray-500">
                                  {format(new Date(ev.start), "HH:mm", {
                                    locale: es,
                                  })}{" "}
                                  –{" "}
                                  {format(new Date(ev.end), "HH:mm", {
                                    locale: es,
                                  })}
                                </div>
                                {ev.hangoutLink && (
                                  <a
                                    href={ev.hangoutLink}
                                    target="_blank"
                                    className="text-[11px] text-teal-700 hover:text-teal-800"
                                  >
                                    Meet
                                  </a>
                                )}
                              </div>

                              <Button
                                variant="ghost"
                                size="icon"
                                className="opacity-0 group-hover:opacity-100 transition-opacity"
                                onClick={() => onDelete(ev.id)}
                                title="Eliminar"
                              >
                                <Trash2 className="h-4 w-4 text-red-600" />
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>

              {loading && <p className="text-sm text-gray-500"></p>}
            </>
          )}
        </CardContent>
      </Card>

      {/* Modal de creación rápida */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Crear evento</DialogTitle>
            <DialogDescription>
              {selectedDay
                ? `Para el ${selectedDay} (${tz})`
                : "Selecciona un día en el calendario"}
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={submitCreate} className="space-y-4">
            <div>
              <Label htmlFor="t">Título</Label>
              <Input
                id="t"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Reunión"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label htmlFor="s">Inicio</Label>
                <Input
                  id="s"
                  type="time"
                  value={startTime}
                  onChange={(e) => setStartTime(e.target.value)}
                  required
                />
              </div>
              <div>
                <Label htmlFor="e">Fin</Label>
                <Input
                  id="e"
                  type="time"
                  value={endTime}
                  onChange={(e) => setEndTime(e.target.value)}
                  required
                />
              </div>
            </div>

            <DialogFooter className="flex justify-end gap-2">
              <DialogClose asChild>
                <Button type="button" variant="ghost">
                  Cancelar
                </Button>
              </DialogClose>
              <Button
                type="submit"
                className="bg-teal-600 hover:bg-teal-700 text-white"
              >
                Crear
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
