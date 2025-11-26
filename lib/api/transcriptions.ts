// lib/api/transcriptions.ts
import { apiFetch } from "./client";

export type TranscriptionStatus =
  | "INICIANDO_TRANSCRIPCION"
  | "EN_PROCESO"
  | "TRANSCRIPCION_COMPLETADA"
  | "ERROR"
  | string;

export interface RecordingWithStatus {
  recording_id: string;
  filename?: string;
  key?: string;
  status?: TranscriptionStatus | null;
  transcript_exists?: boolean;
  object_exists?: boolean;
  updated_at?: string | null;
}

export interface StatusResponse {
  status: TranscriptionStatus;
  updated_at?: string | null;
}

export async function listRecordingsWithStatus(): Promise<RecordingWithStatus[]> {
  return apiFetch<RecordingWithStatus[]>("/recordings");
}

export async function startTranscription(
  recordingId: string
): Promise<StatusResponse> {
  return apiFetch<StatusResponse>(`/transcriptions/${recordingId}/start`, {
    method: "POST",
  });
}

export async function getTranscriptionStatus(
  recordingId: string
): Promise<StatusResponse> {
  return apiFetch<StatusResponse>(`/transcriptions/${recordingId}/status`, {
    method: "GET",
  });
}

export async function downloadTranscriptionText(
  recordingId: string
): Promise<string> {
  return apiFetch<string>(`/transcriptions/${recordingId}`, { method: "GET" });
}
