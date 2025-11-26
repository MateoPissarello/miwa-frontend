"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { ApiError } from "@/lib/api/client";
import {
  downloadTranscriptionText,
  getTranscriptionStatus,
  listRecordingsWithStatus,
  RecordingWithStatus,
  startTranscription,
  TranscriptionStatus,
} from "@/lib/api/transcriptions";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { FileText, Loader2, Play, RefreshCcw } from "lucide-react";
import { useEffect, useMemo, useState } from "react";

const STATUS_COPY: Record<TranscriptionStatus, { label: string; tone: string }> = {
  INICIANDO_TRANSCRIPCION: {
    label: "Iniciando transcripción",
    tone: "bg-amber-100 text-amber-800",
  },
  EN_PROCESO: { label: "En proceso", tone: "bg-blue-100 text-blue-800" },
  TRANSCRIPCION_COMPLETADA: {
    label: "Completada",
    tone: "bg-emerald-100 text-emerald-800",
  },
  ERROR: { label: "Error", tone: "bg-red-100 text-red-700" },
};

function formatStatus(status?: TranscriptionStatus | null) {
  if (!status) return { label: "Sin transcribir", tone: "bg-gray-100 text-gray-700" };
  return STATUS_COPY[status] ?? { label: status, tone: "bg-gray-100 text-gray-700" };
}

function displayName(item: RecordingWithStatus) {
  return item.filename || item.key || item.recording_id;
}

export default function TranscriptionsPage() {
  const [records, setRecords] = useState<RecordingWithStatus[]>([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState<null | { type: "ok" | "error"; text: string }>(
    null
  );
  const [workingId, setWorkingId] = useState<string | null>(null);
  const [statusRefreshing, setStatusRefreshing] = useState<string | null>(null);
  const [filter, setFilter] = useState("");
  const [transcriptView, setTranscriptView] = useState<
    | { id: string; filename: string; text: string }
    | null
  >(null);
  const [readingId, setReadingId] = useState<string | null>(null);

  async function loadRecordings() {
    try {
      setLoading(true);
      const data = await listRecordingsWithStatus();
      setRecords(data);
      setMessage(null);
    } catch (e: any) {
      setMessage({
        type: "error",
        text:
          e instanceof ApiError
            ? e.message
            : "No pudimos cargar las grabaciones con su estado.",
      });
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadRecordings();
  }, []);

  const filtered = useMemo(() => {
    if (!filter) return records;
    return records.filter((r) => displayName(r).toLowerCase().includes(filter.toLowerCase()));
  }, [records, filter]);

  const updateStatusLocally = (recordingId: string, status: TranscriptionStatus) => {
    setRecords((prev) =>
      prev.map((r) => (r.recording_id === recordingId ? { ...r, status } : r))
    );
  };

  const handleStart = async (recordingId: string) => {
    try {
      setWorkingId(recordingId);
      const { status } = await startTranscription(recordingId);
      updateStatusLocally(recordingId, status);
      setMessage({ type: "ok", text: "Transcripción iniciada correctamente." });
    } catch (e: any) {
      setMessage({
        type: "error",
        text: e instanceof ApiError ? e.message : "No se pudo iniciar la transcripción.",
      });
    } finally {
      setWorkingId(null);
    }
  };

  const handleRefreshStatus = async (recordingId: string) => {
    try {
      setStatusRefreshing(recordingId);
      const { status } = await getTranscriptionStatus(recordingId);
      updateStatusLocally(recordingId, status);
      setMessage({ type: "ok", text: "Estado actualizado." });
    } catch (e: any) {
      setMessage({
        type: "error",
        text: e instanceof ApiError ? e.message : "No se pudo consultar el estado.",
      });
    } finally {
      setStatusRefreshing(null);
    }
  };

  const handleOpenTranscript = async (recording: RecordingWithStatus) => {
    try {
      setReadingId(recording.recording_id);
      const text = await downloadTranscriptionText(recording.recording_id);
      setTranscriptView({ id: recording.recording_id, filename: displayName(recording), text });
    } catch (e: any) {
      setMessage({
        type: "error",
        text:
          e instanceof ApiError
            ? e.message
            : "No se pudo recuperar la transcripción para este archivo.",
      });
    } finally {
      setReadingId(null);
    }
  };

  const canStart = (status?: TranscriptionStatus | null) =>
    !status || status === "ERROR";

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Transcripciones</h1>
          <p className="text-sm text-gray-500">
            Gestiona tus grabaciones, inicia transcripciones y revisa su progreso.
          </p>
        </div>
        <Button variant="outline" onClick={loadRecordings} disabled={loading}>
          <RefreshCcw className="h-4 w-4 mr-2" />
          Actualizar
        </Button>
      </div>

      {message && (
        <div
          className={`rounded-lg border px-4 py-3 text-sm ${
            message.type === "ok"
              ? "border-emerald-200 bg-emerald-50 text-emerald-800"
              : "border-red-200 bg-red-50 text-red-700"
          }`}
        >
          {message.text}
        </div>
      )}

      <Card>
        <CardHeader className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <CardTitle className="flex items-center gap-2 text-lg">
            <FileText className="h-5 w-5 text-teal-600" />
            Grabaciones con transcripción
          </CardTitle>
          <div className="flex w-full items-center gap-3 sm:w-auto">
            <Input
              placeholder="Buscar por nombre de archivo"
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              className="w-full sm:w-64"
            />
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <Loader2 className="h-4 w-4 animate-spin" />
              Cargando grabaciones…
            </div>
          ) : filtered.length === 0 ? (
            <div className="rounded-lg border border-dashed border-gray-300 p-6 text-center text-sm text-gray-600">
              No hay grabaciones disponibles para transcribir.
            </div>
          ) : (
            <div className="space-y-3">
              {filtered.map((item) => {
                const statusInfo = formatStatus(item.status);
                const parsedDate = item.updated_at
                  ? new Date(item.updated_at)
                  : null;
                const lastUpdated =
                  parsedDate && !Number.isNaN(parsedDate.getTime())
                    ? format(parsedDate, "dd LLL yyyy HH:mm", { locale: es })
                    : null;
                return (
                  <div
                    key={item.recording_id}
                    className="flex flex-col gap-3 rounded-lg border border-gray-200 p-4 sm:flex-row sm:items-center sm:justify-between"
                  >
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 text-sm font-medium text-gray-900 break-all">
                        {displayName(item)}
                        {item.object_exists === false && (
                          <span className="rounded-full bg-red-100 px-2 py-0.5 text-[11px] font-semibold uppercase text-red-700">
                            archivo no encontrado
                          </span>
                        )}
                        {item.transcript_exists && (
                          <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[11px] font-semibold uppercase text-emerald-700">
                            TXT disponible
                          </span>
                        )}
                      </div>
                      <div className="flex flex-wrap items-center gap-2 text-xs text-gray-500">
                        <span className={`rounded-full px-2 py-1 font-medium ${statusInfo.tone}`}>
                          {statusInfo.label}
                        </span>
                        {lastUpdated && <span>Actualizado: {lastUpdated}</span>}
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleRefreshStatus(item.recording_id)}
                        disabled={statusRefreshing === item.recording_id}
                        className="border-gray-300 text-gray-700"
                      >
                        {statusRefreshing === item.recording_id ? (
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        ) : (
                          <RefreshCcw className="mr-2 h-4 w-4" />
                        )}
                        Estado
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleStart(item.recording_id)}
                        disabled={workingId === item.recording_id || !canStart(item.status)}
                        className="border-teal-600 text-teal-700 hover:bg-teal-50 disabled:opacity-60"
                      >
                        {workingId === item.recording_id ? (
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        ) : (
                          <Play className="mr-2 h-4 w-4" />
                        )}
                        Iniciar transcripción
                      </Button>
                      <Button
                        size="sm"
                        onClick={() => handleOpenTranscript(item)}
                        disabled={item.status !== "TRANSCRIPCION_COMPLETADA" || readingId === item.recording_id}
                        className="bg-teal-600 text-white hover:bg-teal-700 disabled:bg-gray-200 disabled:text-gray-500"
                      >
                        {readingId === item.recording_id ? (
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        ) : (
                          <FileText className="mr-2 h-4 w-4" />
                        )}
                        Ver transcripción
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {transcriptView && (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-3xl rounded-lg bg-white shadow-xl">
            <div className="flex items-center justify-between border-b px-6 py-4">
              <div>
                <p className="text-xs uppercase tracking-widest text-gray-500">Transcripción</p>
                <h3 className="text-lg font-semibold text-gray-900 break-all">
                  {transcriptView.filename}
                </h3>
              </div>
              <Button variant="ghost" onClick={() => setTranscriptView(null)}>
                Cerrar
              </Button>
            </div>
            <div className="max-h-[60vh] overflow-auto p-6">
              <Textarea
                value={transcriptView.text}
                readOnly
                className="min-h-[320px] whitespace-pre-wrap"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
