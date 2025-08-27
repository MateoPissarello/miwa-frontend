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
  deleteRecording,
  getDownloadUrl,
  listRecordings,
  S3Item,
  uploadRecording,
} from "@/lib/api/s3";
import {
  ArrowLeft,
  Download,
  Menu,
  Trash2,
  Upload,
  User,
  Video,
} from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";

export default function RecordingsPage() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [items, setItems] = useState<S3Item[]>([]);
  const [loading, setLoading] = useState(true);
  const [msg, setMsg] = useState<null | { type: "ok" | "error"; text: string }>(
    null
  );
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);

  async function refresh() {
    try {
      setLoading(true);
      // si quieres filtrar por usuario: const prefix = `uploads/${email}/`

      const data = await listRecordings();
      console.log(data);
      setItems(data);
      setMsg(null);
    } catch (e: any) {
      setMsg({
        type: "error",
        text: e instanceof ApiError ? e.message : "Error listando archivos",
      });
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    refresh();
  }, []);

  function handlePick(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0] || null;
    setSelectedFile(f);
  }
  async function handleUpload() {
    if (!selectedFile) return;
    try {
      setUploading(true);
      await uploadRecording(selectedFile); // usa FormData con clave "file"
      setMsg({ type: "ok", text: "Archivo subido correctamente." });
      setSelectedFile(null);
      await refresh(); // recarga la lista
    } catch (e: any) {
      setMsg({
        type: "error",
        text: e instanceof ApiError ? e.message : "Error subiendo archivo",
      });
    } finally {
      setUploading(false);
    }
  }

  const onDownload = async (key: string) => {
    try {
      const url = await getDownloadUrl(key);
      window.open(url, "_blank");
    } catch (e: any) {
      setMsg({
        type: "error",
        text:
          e instanceof ApiError
            ? e.message
            : "Error generando link de descarga",
      });
    }
  };

  const onDelete = async (key: string) => {
    if (!confirm("¿Eliminar este archivo definitivamente?")) return;
    try {
      const ok = await deleteRecording(key);
      if (ok) {
        setItems((prev) => prev.filter((i) => i.key !== key));
        setMsg({ type: "ok", text: "Archivo eliminado." });
      } else {
        setMsg({ type: "error", text: "No se pudo eliminar el archivo." });
      }
    } catch (e: any) {
      setMsg({
        type: "error",
        text: e instanceof ApiError ? e.message : "Error eliminando archivo",
      });
    }
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Top Bar */}
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
                {/* Título accesible (oculto si quieres) */}
                <SheetHeader className="sr-only">
                  <SheetTitle>Sidebar</SheetTitle>
                </SheetHeader>
                <div className="flex h-full flex-col bg-white">
                  <div className="border-b border-gray-200 p-4">
                    <h2 className="text-lg font-semibold text-gray-900">
                      MIWA
                    </h2>
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

      {/* Mensajes */}
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

      {/* Main */}
      <main className="p-6">
        <div className="max-w-7xl mx-auto">
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              Meeting Recordings
            </h2>
            <p className="text-gray-600">
              Upload, manage and download your meeting recordings
            </p>
          </div>

          <Card className="mb-8">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Upload className="h-5 w-5 text-teal-600" />
                Upload New Recording
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-4 w-full">
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
                <p className="mt-2 text-xs text-gray-500 break-all">
                  Seleccionado: {selectedFile.name} •{" "}
                  {(selectedFile.size / (1024 * 1024)).toFixed(1)} MB
                </p>
              )}
            </CardContent>
          </Card>

          {/* Listado */}
          {loading ? (
            <div className="text-sm text-gray-500">Cargando…</div>
          ) : items.length === 0 ? (
            <div className="bg-gray-50 rounded-lg p-8 text-center">
              <div className="max-w-md mx-auto">
                <Video className="h-12 w-12 text-teal-600 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  No recordings yet
                </h3>
                <p className="text-gray-600 mb-4">
                  Upload your first recording using the button above
                </p>
              </div>
            </div>
          ) : (
            <Card>
              <CardHeader>
                <CardTitle>Your Recordings ({items.length})</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {items.map((it) => (
                    <div
                      key={it.key}
                      className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                    >
                      <div className="flex items-center gap-4">
                        <Video className="h-8 w-8 text-teal-600" />
                        <div>
                          <h4 className="font-medium text-gray-900 break-all">
                            {it.name}
                          </h4>
                          <p className="text-xs text-gray-500 break-all">
                            {it.key}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => onDownload(it.key)}
                          className="hover:bg-teal-50 hover:text-teal-700"
                          title="Download"
                        >
                          <Download className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => onDelete(it.key)}
                          className="hover:bg-red-50 hover:text-red-600"
                          title="Delete"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </main>
    </div>
  );
}
