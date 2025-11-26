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

type RecordingsResponse =
  | RecordingWithStatus[]
  | { recordings?: RecordingWithStatus[]; items?: RecordingWithStatus[] };

export async function listRecordingsWithStatus(): Promise<RecordingWithStatus[]> {
  const data = await apiFetch<RecordingsResponse>("/recordings");

  if (Array.isArray(data)) return data;
  if (data?.recordings && Array.isArray(data.recordings)) return data.recordings;
  if (data?.items && Array.isArray(data.items)) return data.items;

  return [];
}

export async function startTranscription(
  recordingId: string
): Promise<StatusResponse> {
  const encodedId = encodeURIComponent(recordingId);

  return apiFetch<StatusResponse>(`/transcriptions/${encodedId}/start`, {
    method: "POST",
  });
}

export async function getTranscriptionStatus(
  recordingId: string
): Promise<StatusResponse> {
  const encodedId = encodeURIComponent(recordingId);

  return apiFetch<StatusResponse>(`/transcriptions/${encodedId}/status`, {
    method: "GET",
  });
}

export async function downloadTranscriptionText(
  recordingId: string
): Promise<string> {
  const encodedId = encodeURIComponent(recordingId);

  return apiFetch<string>(`/transcriptions/${encodedId}`, { method: "GET" });
}
