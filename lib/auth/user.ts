// lib/auth/user.ts
import { getToken } from "@/lib/api/token";

export interface TokenPayload {
  email?: string;
  [key: string]: unknown;
}

function decodeSegment(segment: string): string {
  const normalized = segment.replace(/-/g, "+").replace(/_/g, "/");
  const padded = normalized + "=".repeat((4 - (normalized.length % 4)) % 4);
  if (typeof window !== "undefined" && typeof window.atob === "function") {
    return window.atob(padded);
  }
  if (typeof globalThis.atob === "function") {
    return globalThis.atob(padded);
  }
  const globalBuffer = (globalThis as any).Buffer;
  if (globalBuffer?.from) {
    return globalBuffer.from(padded, "base64").toString("utf-8");
  }
  throw new Error("No base64 decoder available");
}

export function decodeAccessToken(): TokenPayload | null {
  try {
    const token = getToken();
    if (!token) return null;
    const [, payloadSegment] = token.split(".");
    if (!payloadSegment) return null;
    const payloadText = decodeSegment(payloadSegment);
    const payload = JSON.parse(payloadText) as TokenPayload;
    return payload;
  } catch (error) {
    console.warn("No se pudo decodificar el token de acceso", error);
    return null;
  }
}

export function getCurrentUserEmail(): string | null {
  const payload = decodeAccessToken();
  if (!payload) return null;
  const emailCandidate = payload.email ?? payload["username"];
  if (typeof emailCandidate === "string") return emailCandidate;
  return null;
}
