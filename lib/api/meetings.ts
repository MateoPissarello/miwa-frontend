// lib/api/meetings.ts
import { apiFetch } from "./client";

export interface MeetingArtifact {
  basename?: string;
  s3_key?: string;
  signed_url?: string;
  content_type?: string | null;
  status?: string;
  type?: string;
  artifact_type?: string;
  kind?: string;
  [key: string]: unknown;
}

export interface MeetingRecord {
  meeting_name: string;
  meeting_date: string;
  status?: string;
  user_email?: string;
  artifacts?: MeetingArtifact[];
  [key: string]: unknown;
}

export interface UploadUrlRequest {
  meeting_name: string;
  meeting_date: string;
  filename: string;
  expires_sec?: number;
  content_type?: string;
}

export interface UploadUrlResponse {
  upload_url?: string;
  url?: string;
  signed_url?: string;
  key?: string;
  s3_key?: string;
  object_key?: string;
  [key: string]: unknown;
}

export interface ListMeetingsParams {
  user_email: string;
  from_date?: string;
  to_date?: string;
  meeting_name?: string;
  status?: string;
  page?: number;
  page_size?: number;
}

export type ListMeetingsResponse = MeetingRecord[];

function buildQuery(params: Record<string, unknown>): string {
  const search = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value === undefined || value === null || value === "") return;
    search.append(key, String(value));
  });
  const query = search.toString();
  return query ? `?${query}` : "";
}

export async function createMeetingUploadUrl(
  body: UploadUrlRequest,
): Promise<UploadUrlResponse> {
  return apiFetch<UploadUrlResponse>("/api/v1/meetings/upload-url", {
    method: "POST",
    body: JSON.stringify(body),
  });
}

export async function listMeetings(
  params: ListMeetingsParams,
): Promise<ListMeetingsResponse> {
  const query = buildQuery(params);
  const raw = await apiFetch<unknown>(`/api/v1/meetings${query}`, { method: "GET" });

  if (Array.isArray(raw)) {
    return raw as MeetingRecord[];
  }

  if (raw && typeof raw === "object" && Array.isArray((raw as any).items)) {
    return (raw as any).items as MeetingRecord[];
  }

  return [];
}

export interface MeetingSummaryRequest {
  user_email: string;
  meeting_name: string;
  meeting_date: string;
  basename: string;
}

export type MeetingSummaryResponse = unknown;

export async function getMeetingSummary(
  params: MeetingSummaryRequest,
): Promise<MeetingSummaryResponse> {
  const { user_email, meeting_name, meeting_date, basename } = params;
  const path = `/api/v1/meetings/${encodeURIComponent(user_email)}/${encodeURIComponent(
    meeting_name,
  )}/${encodeURIComponent(meeting_date)}/${encodeURIComponent(basename)}/summary`;
  return apiFetch<MeetingSummaryResponse>(path, { method: "GET" });
}
