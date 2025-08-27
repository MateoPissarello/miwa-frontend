// lib/api/s3.ts
import { apiFetch } from "./client";

export interface S3Item {
  key: string;
  name: string;
}

export async function uploadRecording(file: File): Promise<string> {
  const fd = new FormData();
  fd.append("file", file); // clave debe llamarse "file"
  return apiFetch<string>("/s3/upload", { method: "POST", body: fd });
}

export async function listRecordings(prefix?: string): Promise<S3Item[]> {
  const q = prefix ? `?prefix=${encodeURIComponent(prefix)}` : "";
  const keys = await apiFetch<string[]>(`/s3/list${q}`, { method: "GET" });
  return keys.map((k) => ({ key: k, name: k.split("/").pop() || k }));
}

export async function deleteRecording(key: string): Promise<boolean> {
  return apiFetch<boolean>(`/s3/delete/${encodeURIComponent(key)}`, {
    method: "DELETE",
  });
}

export async function getDownloadUrl(
  key: string,
  expiresSeconds = 900
): Promise<string> {
  return apiFetch<string>(
    `/s3/download-url/${encodeURIComponent(
      key
    )}?expires_seconds=${expiresSeconds}`,
    { method: "GET" }
  );
}
