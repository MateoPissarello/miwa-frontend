// lib/api/users.ts
import { apiFetch } from "./client";

export interface ApiUser {
  user_id: number;
  first_name: string;
  last_name: string;
  email: string;
  role: string;
  last_login?: string;
}

export interface UpdateUserPayload {
  first_name?: string;
  last_name?: string;
  email?: string;
  role?: string;
  password?: string;
}

export interface CreateUserPayload {
  first_name: string;
  last_name: string;
  email: string;
  password: string;
  role?: string; // por si tu CreateUserBase lo soporta
}

export async function listUsers() {
  return apiFetch<ApiUser[]>("/auth/users", { method: "GET" });
}

export async function deleteUser(id: number) {
  return apiFetch<void>(`/auth/delete/${id}`, { method: "DELETE" });
}

export async function updateUser(id: number, payload: UpdateUserPayload) {
  // El backend responde 200 y retorna RetrieveUserBase
  return apiFetch<ApiUser>(`/auth/update/${id}`, {
    method: "PUT",
    body: JSON.stringify(payload),
  });
}

export async function createUser(payload: CreateUserPayload) {
  // Nota: apiFetch considera 201 como éxito (res.ok)
  return apiFetch<ApiUser>("/auth/signup", {
    method: "POST",
    body: JSON.stringify(payload),
    // si tu /signup es público puedes poner skipAuth: true, pero no estorba enviar el Bearer
  });
}
