"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

const meetingSummaries = [
  {
    id: "sync-abril-01",
    name: "Sincronización semanal - 1 de abril",
    recordingFile: "sync-semanal-2024-04-01.mp4",
    status: "Completado" as const,
    summary:
      "El equipo revisó el avance de los objetivos trimestrales. Marketing confirmó el lanzamiento de la campaña el 15 de abril y producto se comprometió a entregar el prototipo final el día 10. Se acordó preparar material de apoyo para el directorio y agendar una sesión de pruebas con clientes beta.",
  },
  {
    id: "demo-clientes",
    name: "Demostración con clientes beta",
    recordingFile: "demo-clientes-beta.mp4",
    status: "Procesando" as const,
    summary:
      "La sesión incluyó una demostración completa del flujo de captura y análisis de reuniones. Se recopilaron preguntas sobre la integración con calendarios externos y se identificaron dos mejoras menores en la interfaz de descarga de resúmenes.",
  },
  {
    id: "retro-marzo",
    name: "Retrospectiva de marzo",
    recordingFile: "retro-marzo-2024.mp4",
    status: "Completado" as const,
    summary:
      "Se destacó la reducción en tiempos de respuesta del equipo de soporte y la adopción del nuevo pipeline de despliegue. Se definieron acciones para reforzar la comunicación interna y documentar mejores prácticas de soporte técnico.",
  },
  {
    id: "kickoff-q2",
    name: "Kick-off Q2",
    recordingFile: "kickoff-q2.mp4",
    status: "Pendiente" as const,
    summary:
      "La reunión inicial del trimestre está programada para revisar las métricas de Q1 y presentar las prioridades estratégicas. Una vez finalizado el procesamiento, el resumen incluirá los focos clave y responsables asignados.",
  },
];

type MeetingSummary = (typeof meetingSummaries)[number];

const statusStyles: Record<MeetingSummary["status"], string> = {
  Completado: "bg-teal-50 text-teal-700 border border-teal-100",
  Procesando: "bg-amber-50 text-amber-700 border border-amber-100",
  Pendiente: "bg-gray-100 text-gray-600 border border-gray-200",
};

function StatusBadge({ status }: { status: MeetingSummary["status"] }) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium ${statusStyles[status]}`}
    >
      {status}
    </span>
  );
}

export default function MeetingSummariesPage() {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedMeeting, setSelectedMeeting] = useState<MeetingSummary | null>(
    null
  );

  const hasSelectedSummary = Boolean(selectedMeeting);

  const handleOpenSummary = (meeting: MeetingSummary) => {
    setSelectedMeeting(meeting);
    setDialogOpen(true);
  };

  return (
    <div className="space-y-8">
      <div className="space-y-2">
        <h2 className="text-2xl font-bold text-gray-900">
          Resúmenes de reuniones
        </h2>
        <p className="text-gray-600 max-w-2xl">
          Consulta el estado de procesamiento de tus reuniones grabadas y accede a
          los resúmenes generados automáticamente por MIWA.
        </p>
      </div>

      <Card className="border-gray-200">
        <CardHeader className="border-b border-gray-100 pb-4">
          <CardTitle className="text-lg font-semibold text-gray-900">
            Historial de reuniones
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
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
                {meetingSummaries.map((meeting) => (
                  <tr key={meeting.id} className="hover:bg-teal-50/40 transition-colors">
                    <td className="whitespace-nowrap px-6 py-4 text-sm font-medium text-gray-900">
                      {meeting.name}
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 text-sm text-teal-700">
                      {meeting.recordingFile}
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 text-sm">
                      <StatusBadge status={meeting.status} />
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 text-sm">
                      <Button
                        variant="ghost"
                        className="text-teal-700 hover:bg-teal-50"
                        onClick={() => handleOpenSummary(meeting)}
                      >
                        Ver resumen
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      <Dialog
        open={dialogOpen}
        onOpenChange={(open) => {
          setDialogOpen(open);
          if (!open) {
            setSelectedMeeting(null);
          }
        }}
      >
        <DialogContent aria-describedby={undefined}>
          <DialogHeader>
            <DialogTitle className="text-xl text-gray-900">
              {selectedMeeting?.name ?? "Resumen de reunión"}
            </DialogTitle>
            <DialogDescription className="text-sm text-gray-600">
              {hasSelectedSummary
                ? "Resumen generado a partir de la transcripción de la reunión."
                : "Selecciona una reunión para ver el resumen."}
            </DialogDescription>
          </DialogHeader>
          {hasSelectedSummary && (
            <div className="space-y-4 text-sm text-gray-700">
              <div className="flex flex-wrap items-center gap-2 text-xs text-gray-500">
                <span className="font-medium text-gray-700">
                  Archivo:
                </span>
                <span>{selectedMeeting?.recordingFile}</span>
                <span aria-hidden="true">•</span>
                <StatusBadge status={selectedMeeting!.status} />
              </div>
              <p className="leading-relaxed">
                {selectedMeeting?.summary}
              </p>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
