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
  const { put_url, get_url, key } = await presignSetup({
    email,
    filename: file.name,
    content_type: file.type || "application/octet-stream",
  });

  const putRes = await fetch(put_url, {
    method: "PUT",
    headers: { "Content-Type": file.type || "application/octet-stream" },
    body: file,
  });
  if (!putRes.ok) {
    const msg = await putRes.text().catch(() => "");
    throw new Error(msg || "Falló la subida a S3 (PUT presignado).");
  }

  return { url: get_url, key };
}
