// lib/api/client.ts
import { getToken, clearToken } from "./token";
const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

export class ApiError extends Error { status: number; constructor(s: number, m: string){ super(m); this.status=s; } }

type Options = RequestInit & { skipAuth?: boolean; redirectOn401?: boolean };

export async function apiFetch<T = unknown>(endpoint: string, options: Options = {}): Promise<T> {
  const token = options.skipAuth ? null : getToken();
  const isFormData = typeof FormData !== "undefined" && options.body instanceof FormData;

  const res = await fetch(`${API_URL}${endpoint}`, {
    ...options,
    headers: {
      // ❗️no pongas Content-Type si envías FormData
      ...(isFormData ? {} : { "Content-Type": "application/json" }),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(options.headers || {}),
    },
  });

  const text = await res.text();
  let data: any = null;
  try { data = text ? JSON.parse(text) : null; } catch { data = text || null; }

  if (!res.ok) {
    const msg = typeof data?.detail === "string" ? data.detail : data?.message ?? `Error ${res.status}`;
    if (res.status === 401 && options.redirectOn401 !== false) {
      clearToken();
      if (typeof window !== "undefined") window.location.replace("/admin-login");
    }
    throw new ApiError(res.status, msg);
  }
  return data as T;
}
