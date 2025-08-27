// lib/api/auth.ts
import { apiFetch } from "./client";
import { clearToken, setToken } from "./token";

interface LoginResponse {
  access_token: string;
  token_type: string;
}

interface SignupPayload {
  first_name: string;
  last_name: string;
  email: string;
  password: string;
}

export async function login(email: string, password: string) {
  const data = await apiFetch<LoginResponse>("/auth/login", {
    method: "POST",
    body: JSON.stringify({ email, password }),
    skipAuth: true,
  });
  setToken(data.access_token);
  return data;
}

export async function adminLogin(email: string, password: string) {
  const data = await apiFetch<LoginResponse>("/auth/admin/login", {
    method: "POST",
    body: JSON.stringify({ email, password }),
    skipAuth: true,
  });
  setToken(data.access_token);
  return data;
}

export async function signup(payload: SignupPayload) {
  // Tu API devuelve 201 con el usuario creado (RetrieveUserBase)
  return apiFetch<unknown>("/auth/signup", {
    method: "POST",
    body: JSON.stringify(payload),
    skipAuth: true,
  });
}

export function logout() {
  clearToken();
}
