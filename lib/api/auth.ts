// lib/api/auth.ts
import type {
  LoginResponse,
  MfaChallengeResponse,
  MfaSetupBeginResponse,
  MfaSetupVerifyResponse,
} from "./auth.types";
import { apiFetch } from "./client";
import { clearToken, setToken } from "./token";

export interface AuthTokens {
  access_token: string;
  token_type: string;
  id_token?: string;
  refresh_token?: string;
  expires_in?: number;
}

interface SignupPayload {
  first_name: string;
  last_name: string;
  email: string;
  password: string;
}

interface ConfirmUserPayload {
  email: string;
  code: string;
}
export const login = (body: { email: string; password: string }) =>
  apiFetch<LoginResponse>("/cognito/auth/login", {
    method: "POST",
    body: JSON.stringify(body),
  });

export const adminLogin = (email: string, password: string) =>
  apiFetch<LoginResponse>("/auth/admin/login", {
    method: "POST",
    body: JSON.stringify({ email, password }),
  });

export async function signup(payload: SignupPayload) {
  // Tu API devuelve 201 con el usuario creado (RetrieveUserBase)
  return apiFetch<unknown>("/cognito/auth/signup", {
    method: "POST",
    body: JSON.stringify(payload),
    skipAuth: true,
  });
}

export const confirmEmail = (body: ConfirmUserPayload) =>
  apiFetch("/cognito/auth/confirm", {
    method: "POST",
    body: JSON.stringify(body),
  });

export function logout() {
  clearToken();
}

export const resendCode = (body: { email: string }) =>
  apiFetch("/cognito/auth/resend-code", {
    method: "POST",
    body: JSON.stringify(body),
  });

export const mfaSetupBegin = (body: { email: string; session: string }) =>
  apiFetch<MfaSetupBeginResponse>("/cognito/auth/mfa/setup/begin", {
    method: "POST",
    body: JSON.stringify(body),
  });

export const mfaSetupVerify = (body: {
  email: string;
  session: string;
  code: string;
}) =>
  apiFetch<MfaSetupVerifyResponse>("/cognito/auth/mfa/setup/verify", {
    method: "POST",
    body: JSON.stringify(body),
  });

export const mfaChallenge = (body: {
  email: string;
  session: string;
  code: string;
}) =>
  apiFetch<MfaChallengeResponse>("/cognito/auth/mfa/challenge", {
    method: "POST",
    body: JSON.stringify(body),
  });
