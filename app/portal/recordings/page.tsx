"use client";

import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { ApiError } from "@/lib/api/client";
import {
  createMeetingUploadUrl,
  listMeetings,
  MeetingArtifact,
  MeetingRecord,
} from "@/lib/api/meetings";
import { getCurrentUserEmail } from "@/lib/auth/user";
import { ArrowLeft, Download, Menu, Upload, User, Video } from "lucide-react";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

type ArtifactRow = {
  meeting: MeetingRecord;
  artifact: MeetingArtifact;
};

function formatDate(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString();
}

function extractSignedUrl(artifact: MeetingArtifact): string | undefined {
  const candidateKeys = ["signed_url", "url", "download_url", "get_url", "read_url"];
  for (const key of candidateKeys) {
    const candidate = (artifact as Record<string, unknown>)[key];
    if (typeof candidate === "string" && candidate) {
      return candidate;
    }
  }
  return undefined;
}

function inferArtifactStatus(artifact: MeetingArtifact, meeting: MeetingRecord) {
  return artifact.status || meeting.status || "-";
}

function inferArtifactLabel(artifact: MeetingArtifact) {
  return artifact.basename || artifact.s3_key || "Grabación";
}

export default function RecordingsPage() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [meetings, setMeetings] = useState<MeetingRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [msg, setMsg] = useState<null | { type: "ok" | "error"; text: string }>(
    null,
  );
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [meetingName, setMeetingName] = useState("");
  const [meetingDate, setMeetingDate] = useState(
    () => new Date().toISOString().slice(0, 10),
  );
  const [uploading, setUploading] = useState(false);
  const [userEmail, setUserEmail] = useState<string | null>(null);

  useEffect(() => {
    setUserEmail(getCurrentUserEmail());
  }, []);

  useEffect(() => {
    if (!userEmail) return;
    refresh(userEmail);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userEmail]);

  const artifactRows = useMemo<ArtifactRow[]>(() => {
    const rows: ArtifactRow[] = [];
    meetings.forEach((meeting) => {
      (meeting.artifacts || []).forEach((artifact) => {
        rows.push({ meeting, artifact });
      });
    });
    return rows;
  }, [meetings]);

  async function refresh(email: string) {
    try {
      setLoading(true);
      setMsg(null);
      const data = await listMeetings({ user_email: email });
      setMeetings(data);
    } catch (e: any) {
      setMsg({
        type: "error",
        text: e instanceof ApiError ? e.message : "Error listando reuniones",
      });
    } finally {
      setLoading(false);
    }
  }

  function handlePick(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0] || null;
    setSelectedFile(f);
  }

  async function handleUpload() {
    if (!selectedFile) return;
    if (!meetingName.trim()) {
      setMsg({ type: "error", text: "Indica el nombre de la reunión." });
      return;
    }
    if (!meetingDate) {
      setMsg({ type: "error", text: "Indica la fecha de la reunión." });
      return;
    }

    try {
      setUploading(true);
      setMsg(null);
      const uploadResp = await createMeetingUploadUrl({
        meeting_name: meetingName.trim(),
        meeting_date: meetingDate,
        filename: selectedFile.name,
        content_type: selectedFile.type || "application/octet-stream",
      });

      const signedUrl =
        uploadResp.upload_url || uploadResp.signed_url || uploadResp.url;

      if (!signedUrl) {
        throw new Error("El backend no devolvió la URL firmada de carga.");
      }

      const putRes = await fetch(signedUrl, {
        method: "PUT",
        headers: {
          "Content-Type": selectedFile.type || "application/octet-stream",
        },
        body: selectedFile,
      });

      if (!putRes.ok) {
        const body = await putRes.text().catch(() => "");
        throw new Error(body || "Falló la subida a S3 (PUT presignado).");
      }

      setMsg({
        type: "ok",
        text: "Grabación enviada. El procesamiento puede tardar unos minutos.",
      });
      setSelectedFile(null);
      setMeetingName("");
      if (userEmail) await refresh(userEmail);
    } catch (e: any) {
      const text =
        e instanceof ApiError
          ? e.message
          : e?.message || "Error subiendo la grabación";
      setMsg({ type: "error", text });
    } finally {
      setUploading(false);
    }
  }

  const onDownload = (artifact: MeetingArtifact) => {
    const signedUrl = extractSignedUrl(artifact);
    if (!signedUrl) {
      setMsg({
        type: "error",
        text: "No hay un enlace de descarga disponible para este artefacto.",
      });
      return;
    }
    window.open(signedUrl, "_blank", "noopener,noreferrer");
  };

  return (
    <div className="min-h-screen bg-white">
      <header className="border-b border-gray-200 bg-white px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Sheet open={sidebarOpen} onOpenChange={setSidebarOpen}>
              <SheetTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="hover:bg-gray-100"
                >
                  <Menu className="h-5 w-5 text-gray-600" />
                </Button>
              </SheetTrigger>
              <SheetContent
                side="left"
                className="w-64 p-0"
                aria-label="Sidebar navigation"
              >
                <SheetHeader className="sr-only">
                  <SheetTitle>Sidebar</SheetTitle>
                </SheetHeader>
                <div className="flex h-full flex-col bg-white">
                  <div className="border-b border-gray-200 p-4">
                    <h2 className="text-lg font-semibold text-gray-900">MIWA</h2>
                  </div>
                  <nav className="flex-1 p-4">
                    <div className="space-y-2">
                      <Link href="/portal/recordings">
                        <Button
                          variant="ghost"
                          className="w-full justify-start bg-teal-50 text-teal-700"
                        >
                          <Video className="mr-3 h-4 w-4" />
                          Meeting Recordings
                        </Button>
                      </Link>
                    </div>
                  </nav>
                </div>
              </SheetContent>
            </Sheet>

            <Link href="/portal">
              <Button variant="ghost" size="icon" className="hover:bg-gray-100">
                <ArrowLeft className="h-5 w-5 text-gray-600" />
              </Button>
            </Link>

            <h1 className="text-xl font-bold text-gray-900">MIWA</h1>
          </div>

          <Avatar className="h-8 w-8 cursor-pointer hover:ring-2 hover:ring-teal-500 hover:ring-offset-2 transition-all">
            <AvatarFallback className="bg-teal-100 text-teal-700">
              <User className="h-4 w-4" />
            </AvatarFallback>
          </Avatar>
        </div>
      </header>

      {msg && (
        <div
          className={`mx-6 mt-4 rounded border px-4 py-2 text-sm ${
            msg.type === "ok"
              ? "border-green-200 bg-green-50 text-green-700"
              : "border-red-200 bg-red-50 text-red-700"
          }`}
        >
          {msg.text}
        </div>
      )}

      <main className="p-6">
        <div className="max-w-7xl mx-auto">
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              Meeting Recordings
            </h2>
            <p className="text-gray-600">
              Sube tus grabaciones y consulta su estado de procesamiento.
            </p>
          </div>

          <Card className="mb-8">
            <CardHeader>
              <CardTitle className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <span className="flex items-center gap-2">
                  <Upload className="h-5 w-5 text-teal-600" />
                  Upload New Recording
                </span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">
                    Nombre de la reunión
                  </label>
                  <Input
                    value={meetingName}
                    onChange={(event) => setMeetingName(event.target.value)}
                    placeholder="Ej. Weekly sync"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">
                    Fecha
                  </label>
                  <Input
                    type="date"
                    value={meetingDate}
                    onChange={(event) => setMeetingDate(event.target.value)}
                  />
                </div>
              </div>

              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-4">
                <Input
                  type="file"
                  accept="audio/*,video/*"
                  onChange={handlePick}
                  className="flex-1"
                />
                <Button
                  onClick={handleUpload}
                  disabled={!selectedFile || uploading}
                  className="bg-teal-600 hover:bg-teal-700 text-white disabled:opacity-60"
                >
                  {uploading
                    ? "Uploading..."
                    : selectedFile
                    ? "Upload Recording"
                    : "Choose file"}
                </Button>
              </div>
              {selectedFile && (
                <p className="mt-1 text-xs text-gray-500 break-all">
                  Seleccionado: {selectedFile.name} •{" "}
                  {(selectedFile.size / (1024 * 1024)).toFixed(1)} MB
                </p>
              )}
            </CardContent>
          </Card>

          {!userEmail ? (
            <div className="text-sm text-red-600">
              No se pudo obtener el email del usuario autenticado.
            </div>
          ) : loading ? (
            <div className="text-sm text-gray-500">Cargando…</div>
          ) : artifactRows.length === 0 ? (
            <div className="bg-gray-50 rounded-lg p-8 text-center">
              <div className="max-w-md mx-auto">
                <Video className="h-12 w-12 text-teal-600 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  No recordings yet
                </h3>
                <p className="text-gray-600 mb-4">
                  Upload your first recording using the form above.
                </p>
              </div>
            </div>
          ) : (
            <Card>
              <CardHeader>
                <CardTitle>Tu historial de grabaciones ({artifactRows.length})</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {artifactRows.map(({ meeting, artifact }, index) => {
                    const rowKey =
                      [
                        meeting.user_email,
                        meeting.meeting_name,
                        meeting.meeting_date,
                        artifact.basename || artifact.s3_key || index,
                      ]
                        .filter(Boolean)
                        .join("::") || `${index}`;
                    return (
                      <div
                        key={rowKey}
                        className="flex flex-col gap-4 rounded-lg border border-gray-200 p-4 transition-colors hover:bg-gray-50 md:flex-row md:items-center md:justify-between"
                      >
                        <div className="space-y-1">
                          <h4 className="font-medium text-gray-900 break-all">
                            {meeting.meeting_name || inferArtifactLabel(artifact)}
                          </h4>
                          <p className="text-xs text-gray-500">
                            {meeting.meeting_date
                              ? formatDate(meeting.meeting_date)
                              : ""}
                          </p>
                          <p className="text-xs text-gray-500 break-all">
                            Archivo: {inferArtifactLabel(artifact)}
                          </p>
                          <p className="text-xs text-gray-500">
                            Estado: {inferArtifactStatus(artifact, meeting)}
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => onDownload(artifact)}
                            className="hover:bg-teal-50 hover:text-teal-700"
                            title="Download"
                          >
                            <Download className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </main>
    </div>
  );
}
