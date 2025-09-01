// components/VerifyEmailForm.tsx
"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { confirmEmail, resendCode } from "@/lib/api/auth";
import { ApiError } from "@/lib/api/client";

interface Props {
  email: string;
  onSuccessRedirect?: string; // default -> "/login"
}

export default function VerifyEmailForm({
  email,
  onSuccessRedirect = "/login",
}: Props) {
  const router = useRouter();
  const [code, setCode] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [msg, setMsg] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Si no llegó el email en la URL, volvemos al signup
  useEffect(() => {
    if (!email) router.replace("/signup");
  }, [email, router]);

  // Auto-enviar cuando se completen 6 dígitos
  useEffect(() => {
    if (code.length === 6 && !isLoading) {
      void handleConfirm(); // fire-and-forget
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [code]);

  async function handleConfirm(e?: React.FormEvent) {
    e?.preventDefault();
    if (!email || code.length !== 6) return;

    setIsLoading(true);
    setErr(null);
    setMsg(null);
    try {
      await confirmEmail({ email, code }); // <- tu contrato: { email, code }
      router.push(`${onSuccessRedirect}?email=${encodeURIComponent(email)}`);
    } catch (e: any) {
      setErr(e instanceof ApiError ? e.message : "Error verificando el código.");
      // selecciona el input para reintento rápido
      inputRef.current?.focus();
      inputRef.current?.select();
    } finally {
      setIsLoading(false);
    }
  }

  async function handleResend() {
    if (!email) return;
    setIsLoading(true);
    setErr(null);
    setMsg(null);
    try {
      await resendCode({ email });
      setMsg("Código reenviado. Revisa tu correo.");
    } catch (e: any) {
      setErr(e instanceof ApiError ? e.message : "No se pudo reenviar el código.");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-white flex items-center justify-center p-4">
      <Card className="w-full max-w-md border-0 shadow-none">
        <CardHeader className="text-center pb-8">
          <h1 className="text-4xl font-black tracking-wider text-gray-900 mb-2">MIWA</h1>
          <p className="text-sm text-gray-500 font-light">Verify your email</p>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="text-center space-y-2">
            <p className="text-sm text-gray-700">
              Hemos enviado un código de 6 dígitos a <b>{email}</b>.
            </p>
            <p className="text-xs text-gray-500">Ingresa el código para confirmar tu cuenta.</p>
          </div>

          <form onSubmit={handleConfirm} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="code" className="text-sm font-normal text-gray-700">
                Verification Code
              </Label>
              <Input
                ref={inputRef}
                id="code"
                type="text"
                inputMode="numeric"
                maxLength={6}
                placeholder="Enter 6-digit code"
                value={code}
                onChange={(e) =>
                  setCode(e.target.value.replace(/\D/g, "").slice(0, 6))
                }
                onPaste={(e) => {
                  const text = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
                  setCode(text);
                  e.preventDefault();
                }}
                className="border-gray-200 focus:border-teal-500 focus:ring-teal-500 h-12 rounded-lg text-center text-lg tracking-widest"
                required
              />
            </div>

            {err && <div className="text-red-500 text-sm text-center">{err}</div>}
            {msg && <div className="text-green-600 text-sm text-center">{msg}</div>}

            <Button
              type="submit"
              disabled={isLoading || code.length !== 6}
              className="w-full bg-teal-600 hover:bg-teal-700 text-white h-12 rounded-lg font-medium disabled:opacity-50"
            >
              {isLoading ? "Validating..." : "Validate"}
            </Button>
          </form>

          <div className="text-center">
            <p className="text-sm text-gray-600">
              ¿No recibiste el código?{" "}
              <button
                onClick={handleResend}
                disabled={isLoading}
                className="text-teal-600 hover:text-teal-700 font-medium"
              >
                Reenviar código
              </button>
            </p>
            <p className="text-xs text-gray-500 mt-2">
              ¿Ingresaste mal el correo?{" "}
              <a href="/signup" className="underline">Volver al registro</a>
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
