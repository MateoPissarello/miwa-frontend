// lib/api/s3.ts
import { apiFetch } from "./client";

export interface S3Item {
  key: string;
  name: string;
}

export type PresignSetupReq = {
  email: string;
  filename: string;
  content_type: string;
};

export type PresignSetupResp = {
  put_url: string;
  get_url: string; // presigned GET (lectura)
  key: string;
};

export async function presignSetup(body: PresignSetupReq) {
  return apiFetch<PresignSetupResp>("/s3/presign-setup", {
    method: "POST",
    body: JSON.stringify(body),
  });
}

export async function uploadPictureForSignup(email: string, file: File) {
  // 1) pedir presign
  const { put_url, get_url, key } = await presignSetup({
    email,
    filename: file.name,
    content_type: file.type || "application/octet-stream",
  });

  // 2) subir con PUT a S3
  const putRes = await fetch(put_url, {
    method: "PUT",
    headers: { "Content-Type": file.type || "application/octet-stream" },
    body: file,
  });
  if (!putRes.ok) {
    const msg = await putRes.text().catch(() => "");
    throw new Error(msg || "Falló la subida a S3 (PUT presignado).");
  }

  // 3) devolver URL de lectura (o cámbiala si usas CDN público)
  return { url: get_url, key };
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
