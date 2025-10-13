// components/LoginForm.tsx
"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { adminLogin, login } from "@/lib/api/auth";
import { ApiError } from "@/lib/api/client";
import { setToken } from "@/lib/api/token";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";

type Mode = "user" | "admin";

interface LoginFormProps {
  mode?: Mode; // "user" (default) | "admin"
  title?: string;
  onSuccessRedirect?: string; // ej: "/portal"
  defaultEmail?: string;
  justVerified?: boolean; // mostrar banner “correo verificado”
}

export function LoginForm({
  mode = "user",
  title = "Login",
  onSuccessRedirect,
  defaultEmail = "",
  justVerified = false,
}: LoginFormProps) {
  const router = useRouter();
  const [email, setEmail] = useState(defaultEmail);
  const [password, setPassword] = useState("");
  const passwordRef = useRef<HTMLInputElement>(null);

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<null | {
    type: "ok" | "error";
    text: string;
  }>(null);

  useEffect(() => {
    if (defaultEmail) passwordRef.current?.focus();
  }, [defaultEmail]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setMessage(null);
    setLoading(true);

    try {
      if (mode === "admin") {
        // Tu adminLogin puede seguir igual
        await adminLogin(email, password);
        setMessage({ type: "ok", text: "Login exitoso." });
        if (onSuccessRedirect) router.replace(onSuccessRedirect);
        return;
      }

      // USER: ahora esperamos un objeto {status, session?, tokens?}
      const res = await login({ email, password });

      if (res.status === "OK") {
        setToken(res.tokens.AccessToken);
        setMessage({ type: "ok", text: "Login exitoso." });
        if (onSuccessRedirect) router.replace(onSuccessRedirect);
        return;
      }

      if (res.status === "MFA_SETUP") {
        // redirige a la pantalla de setup TOTP
        router.replace(
          `/signup/setup-totp?session=${encodeURIComponent(
            res.session || ""
          )}&email=${encodeURIComponent(email)}`
        );
        return;
      }

      if (res.status === "SOFTWARE_TOKEN_MFA") {
        // redirige a la pantalla para introducir el TOTP
        router.replace(
          `/login/mfa?session=${encodeURIComponent(
            res.session || ""
          )}&email=${encodeURIComponent(email)}`
        );
        return;
      }

      // fallback si viene algo inesperado
      setMessage({ type: "error", text: "No se pudo iniciar sesión." });
    } catch (err: any) {
      if (err instanceof ApiError) {
        setMessage({
          type: "error",
          text: err.message || "Error al iniciar sesión.",
        });
      } else {
        setMessage({
          type: "error",
          text: "No se pudo conectar con el servidor.",
        });
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-white flex items-center justify-center p-4">
      <Card className="w-full max-w-md border-0 shadow-none">
        <CardHeader className="text-center pb-8">
          <h1 className="text-4xl font-black tracking-wider text-gray-900 mb-2">
            {title}
          </h1>
          <p className="text-sm text-gray-500 font-light">Welcome back</p>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* Banner opcional si viene de verify-email */}
          {justVerified && (
            <div className="text-sm text-green-700 bg-green-50 border border-green-200 px-3 py-2 rounded">
              Correo verificado. Ahora inicia sesión.
            </div>
          )}

          <form className="space-y-6" onSubmit={onSubmit}>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label
                  htmlFor="email"
                  className="text-sm font-normal text-gray-700"
                >
                  Email
                </Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="Enter your email"
                  className="border-gray-200 focus:border-teal-500 focus:ring-teal-500 h-12 rounded-lg"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label
                  htmlFor="password"
                  className="text-sm font-normal text-gray-700"
                >
                  Password
                </Label>
                <Input
                  ref={passwordRef}
                  id="password"
                  type="password"
                  placeholder="Enter your password"
                  className="border-gray-200 focus:border-teal-500 focus:ring-teal-500 h-12 rounded-lg"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>
            </div>

            <Button
              type="submit"
              disabled={loading}
              className="w-full bg-teal-600 hover:bg-teal-700 text-white h-12 rounded-lg font-medium disabled:opacity-70"
            >
              {loading ? "Ingresando..." : "Sign In"}
            </Button>
          </form>

          {message && (
            <div
              className={`text-sm text-center px-3 py-2 rounded ${
                message.type === "ok"
                  ? "bg-green-50 text-green-700 border border-green-200"
                  : "bg-red-50 text-red-700 border border-red-200"
              }`}
            >
              {message.text}
            </div>
          )}

          <div className="text-center">
            <p className="text-sm text-gray-600">
              Don&apos;t have an account?{" "}
              <a
                href="/signup"
                className="text-teal-600 hover:text-teal-700 font-medium"
              >
                Sign up
              </a>
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
