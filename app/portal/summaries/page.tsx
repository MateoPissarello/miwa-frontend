"use client";

import { useEffect, useMemo, useState, type ReactNode } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ApiError } from "@/lib/api/client";
import {
  getMeetingSummary,
  listMeetings,
  MeetingArtifact,
  MeetingRecord,
  MeetingSummaryResponse,
} from "@/lib/api/meetings";
import { getCurrentUserEmail } from "@/lib/auth/user";

function inferArtifactLabel(artifact: MeetingArtifact): string {
  return (
    artifact.basename ||
    artifact.s3_key ||
    (typeof artifact === "object" && "filename" in artifact
      ? String((artifact as any).filename)
      : "Artefacto")
  );
}

function isSummaryArtifact(artifact: MeetingArtifact): boolean {
  const type = String(
    artifact.artifact_type || artifact.type || artifact.kind || "",
  ).toLowerCase();
  if (type.includes("summary")) return true;
  const status = String(artifact.status || "").toUpperCase();
  if (status === "SUMMARIZED") return true;
  const contentType = (artifact.content_type || "").toLowerCase();
  if (contentType.includes("json")) return true;
  const name = inferArtifactLabel(artifact).toLowerCase();
  return name.endsWith(".json") || name.includes("summary");
}

function isRecordingArtifact(artifact: MeetingArtifact): boolean {
  const type = String(
    artifact.artifact_type || artifact.type || artifact.kind || "",
  ).toLowerCase();
  if (type.includes("recording")) return true;
  const contentType = (artifact.content_type || "").toLowerCase();
  if (contentType.startsWith("audio") || contentType.startsWith("video")) {
    return true;
  }
  const name = inferArtifactLabel(artifact).toLowerCase();
  return (
    name.endsWith(".mp3") ||
    name.endsWith(".mp4") ||
    name.endsWith(".wav") ||
    name.endsWith(".m4a") ||
    name.endsWith(".mov") ||
    name.endsWith(".webm")
  );
}

function getSummaryArtifacts(meeting: MeetingRecord): MeetingArtifact[] {
  return (meeting.artifacts || []).filter((artifact) => isSummaryArtifact(artifact));
}

function getRecordingArtifact(meeting: MeetingRecord): MeetingArtifact | undefined {
  return (meeting.artifacts || []).find((artifact) => isRecordingArtifact(artifact));
}

function statusTone(status?: string): string {
  const normalized = String(status || "").toUpperCase();
  switch (normalized) {
    case "SUMMARIZED":
    case "DONE":
    case "COMPLETED":
      return "bg-teal-50 text-teal-700 border border-teal-100";
    case "PROCESSING":
    case "TRANSCRIBING":
    case "ANALYZING":
      return "bg-amber-50 text-amber-700 border border-amber-100";
    case "FAILED":
    case "ERROR":
      return "bg-red-50 text-red-700 border border-red-100";
    default:
      return "bg-gray-100 text-gray-600 border border-gray-200";
  }
}

function StatusBadge({ status }: { status?: string }) {
  const label = status || "Pendiente";
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium ${statusTone(
        status,
      )}`}
    >
      {label}
    </span>
  );
}

function renderListSection(title: string, items: unknown): ReactNode {
  if (!Array.isArray(items) || items.length === 0) return null;
  return (
    <div className="space-y-2">
      <h4 className="text-sm font-semibold text-gray-900">{title}</h4>
      <ul className="list-disc space-y-1 pl-5 text-sm text-gray-700">
        {items.map((item, index) => (
          <li key={`${title}-${index}`}>
            {typeof item === "string" ? item : JSON.stringify(item)}
          </li>
        ))}
      </ul>
    </div>
  );
}

function SummaryContent({ data }: { data: MeetingSummaryResponse }) {
  if (data == null) return null;
  if (typeof data === "string") {
    return (
      <p className="leading-relaxed whitespace-pre-wrap text-sm text-gray-700">
        {data}
      </p>
    );
  }
  if (Array.isArray(data)) {
    return (
      <div className="space-y-4 text-sm text-gray-700">
        {renderListSection("Resumen", data)}
      </div>
    );
  }

  if (typeof data === "object") {
    const record = data as Record<string, unknown>;
    const summaryText =
      typeof record.summary === "string" ? record.summary : undefined;
    const highlights = record.highlights;
    const decisions = record.decisions;
    const actionItems = record.action_items ?? record.actions;
    const followUps = record.follow_ups ?? record.next_steps;

    const renderedSections = [
      summaryText ? (
        <div key="summary" className="space-y-2">
          <h4 className="text-sm font-semibold text-gray-900">
            Resumen general
          </h4>
          <p className="leading-relaxed whitespace-pre-wrap text-sm text-gray-700">
            {summaryText}
          </p>
        </div>
      ) : null,
      renderListSection("Puntos clave", highlights),
      renderListSection("Decisiones", decisions),
      renderListSection("Acciones", actionItems),
      renderListSection("Próximos pasos", followUps),
    ].filter(Boolean);

    const knownKeys = new Set([
      "summary",
      "highlights",
      "decisions",
      "action_items",
      "actions",
      "follow_ups",
      "next_steps",
    ]);

    const remainingEntries = Object.entries(record).filter(
      ([key]) => !knownKeys.has(key),
    );

    return (
      <div className="space-y-4 text-sm text-gray-700">
        {renderedSections}
        {remainingEntries.length > 0 && (
          <div className="space-y-2">
            <h4 className="text-sm font-semibold text-gray-900">
              Detalles adicionales
            </h4>
            <pre className="overflow-x-auto rounded-md bg-gray-50 p-3 text-xs text-gray-700">
              {JSON.stringify(Object.fromEntries(remainingEntries), null, 2)}
            </pre>
          </div>
        )}
      </div>
    );
  }

  return (
    <pre className="overflow-x-auto rounded-md bg-gray-50 p-3 text-xs text-gray-700">
      {JSON.stringify(data, null, 2)}
    </pre>
  );
}

export default function MeetingSummariesPage() {
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [meetings, setMeetings] = useState<MeetingRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState<
    null | { type: "ok" | "error"; text: string }
  >(null);

  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedMeeting, setSelectedMeeting] = useState<MeetingRecord | null>(
    null,
  );
  const [selectedArtifact, setSelectedArtifact] = useState<MeetingArtifact | null>(
    null,
  );
  const [summaryData, setSummaryData] = useState<MeetingSummaryResponse | null>(
    null,
  );
  const [summaryLoading, setSummaryLoading] = useState(false);
  const [summaryError, setSummaryError] = useState<string | null>(null);

  useEffect(() => {
    setUserEmail(getCurrentUserEmail());
  }, []);

  useEffect(() => {
    if (!userEmail) return;
    (async () => {
      try {
        setLoading(true);
        const data = await listMeetings({ user_email: userEmail });
        setMeetings(data);
        setMessage(null);
      } catch (error) {
        const text =
          error instanceof ApiError
            ? error.message
            : "Error obteniendo el historial de reuniones";
        setMessage({ type: "error", text });
      } finally {
        setLoading(false);
      }
    })();
  }, [userEmail]);

  const rows = useMemo(() => {
    return meetings.map((meeting) => {
      const summaries = getSummaryArtifacts(meeting);
      const recording = getRecordingArtifact(meeting);
      return { meeting, summaries, recording };
    });
  }, [meetings]);

  async function openSummary(meeting: MeetingRecord, artifact: MeetingArtifact) {
    try {
      const email = meeting.user_email || userEmail;
      if (!email) {
        setSummaryError("No se encontró el email del usuario.");
        return;
      }
      if (!artifact.basename) {
        setSummaryError("El artefacto no indica un identificador válido.");
        return;
      }
      setDialogOpen(true);
      setSelectedMeeting(meeting);
      setSelectedArtifact(artifact);
      setSummaryLoading(true);
      setSummaryError(null);
      setSummaryData(null);
      const data = await getMeetingSummary({
        user_email: email,
        meeting_name: meeting.meeting_name,
        meeting_date: meeting.meeting_date,
        basename: artifact.basename,
      });
      setSummaryData(data);
    } catch (error) {
      const text =
        error instanceof ApiError
          ? error.message
          : error instanceof Error
          ? error.message
          : "No se pudo obtener el resumen.";
      setSummaryError(text);
    } finally {
      setSummaryLoading(false);
    }
  }

  function closeDialog() {
    setDialogOpen(false);
    setSummaryData(null);
    setSummaryError(null);
    setSelectedMeeting(null);
    setSelectedArtifact(null);
  }

  return (
    <div className="space-y-8">
      <div className="space-y-2">
        <h2 className="text-2xl font-bold text-gray-900">Resúmenes de reuniones</h2>
        <p className="text-gray-600 max-w-2xl">
          Consulta el estado de procesamiento de tus reuniones grabadas y accede
          a los resúmenes generados automáticamente por MIWA.
        </p>
      </div>

      {message && (
        <div
          className={`rounded border px-4 py-2 text-sm ${
            message.type === "ok"
              ? "border-green-200 bg-green-50 text-green-700"
              : "border-red-200 bg-red-50 text-red-700"
          }`}
        >
          {message.text}
        </div>
      )}

      {!userEmail && (
        <div className="rounded border border-red-200 bg-red-50 px-4 py-2 text-sm text-red-700">
          No se pudo determinar el email del usuario autenticado.
        </div>
      )}

      <Card className="border-gray-200">
        <CardHeader className="border-b border-gray-100 pb-4">
          <CardTitle className="text-lg font-semibold text-gray-900">
            Historial de reuniones
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <div className="p-6 text-sm text-gray-500">Cargando…</div>
          ) : rows.length === 0 ? (
            <div className="p-6 text-sm text-gray-500">
              Aún no hay reuniones registradas.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                      Nombre de reunión
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                      Archivo grabación
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                      Estado de procesamiento
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                      Ver resumen
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 bg-white">
                  {rows.map(({ meeting, summaries, recording }) => {
                    const summaryArtifact = summaries[0];
                    const status = summaryArtifact?.status || meeting.status;
                    return (
                      <tr
                        key={`summary-${
                          meeting.user_email || userEmail || "anon"
                        }-${meeting.meeting_name}-${meeting.meeting_date}`}
                        className="transition-colors hover:bg-teal-50/40"
                      >
                        <td className="whitespace-nowrap px-6 py-4 text-sm font-medium text-gray-900">
                          {meeting.meeting_name ||
                            inferArtifactLabel(
                              recording ??
                                summaries[0] ??
                                ({}) as MeetingArtifact,
                            )}
                        </td>
                        <td className="whitespace-nowrap px-6 py-4 text-sm text-teal-700 break-all">
                          {recording
                            ? inferArtifactLabel(recording)
                            : summaryArtifact
                            ? inferArtifactLabel(summaryArtifact)
                            : "—"}
                        </td>
                        <td className="whitespace-nowrap px-6 py-4 text-sm">
                          <StatusBadge status={status} />
                        </td>
                        <td className="whitespace-nowrap px-6 py-4 text-sm">
                          <Button
                            variant="ghost"
                            className="text-teal-700 hover:bg-teal-50"
                            disabled={!summaryArtifact || summaryLoading}
                            onClick={() =>
                              summaryArtifact && openSummary(meeting, summaryArtifact)
                            }
                          >
                            Ver resumen
                          </Button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={dialogOpen} onOpenChange={(open) => { if (!open) closeDialog(); }}>
        <DialogContent aria-describedby={undefined} className="max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-xl text-gray-900">
              {selectedMeeting?.meeting_name ?? "Resumen de reunión"}
            </DialogTitle>
            <DialogDescription className="text-sm text-gray-600">
              {selectedMeeting
                ? `Resumen del artefacto ${
                    selectedArtifact ? inferArtifactLabel(selectedArtifact) : ""
                  } generado para la reunión del ${selectedMeeting.meeting_date}.`
                : "Selecciona una reunión para ver el resumen."}
            </DialogDescription>
          </DialogHeader>

          {summaryLoading && (
            <div className="rounded border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-600">
              Cargando resumen…
            </div>
          )}

          {summaryError && (
            <div className="rounded border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
              {summaryError}
            </div>
          )}

          {!summaryLoading && !summaryError && summaryData && (
            <SummaryContent data={summaryData} />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
