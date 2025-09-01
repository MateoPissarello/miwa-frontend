"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { mfaSetupBegin, mfaSetupVerify } from "@/lib/api/auth";
import { ApiError } from "@/lib/api/client";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import { setToken } from "@/lib/api/token";   

interface Props {
  session: string;
  email: string;
  onSuccessRedirect?: string; // "/portal"
}

export default function SetupTotpForm({
  session,
  email,
  onSuccessRedirect = "/portal",
}: Props) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [info, setInfo] = useState<{
    secret: string;
    otpauth: string;
    session: string;
  } | null>(null);
  const [code, setCode] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  // cargar secreto/otpauth al montar
  useEffect(() => {
    if (!session || !email) {
      router.replace("/login");
      return;
    }
    (async () => {
      setLoading(true);
      setErr(null);
      try {
        const resp = await mfaSetupBegin({ session, email });
        setInfo(resp); // resp.session puede ser nuevo, úsalo en verify
      } catch (e: any) {
        setErr(
          e instanceof ApiError
            ? e.message
            : "No se pudo iniciar el setup de MFA."
        );
      } finally {
        setLoading(false);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session, email]);

  const qrUrl = useMemo(() => {
    const data = info?.otpauth ?? "";
    return data
      ? `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(
          data
        )}`
      : "";
  }, [info]);

  async function handleVerify(e: React.FormEvent) {
    e.preventDefault();
    if (!info?.session || !email || code.length !== 6) return;

    setLoading(true);
    setErr(null);
    try {
      const res = await mfaSetupVerify({ session: info.session, email, code });
      if (res.status === "OK") {
        setToken(res.tokens.access_token);
        router.replace(onSuccessRedirect);
      } else {
        setErr("No se pudo completar el setup de MFA.");
      }
    } catch (e: any) {
      setErr(e instanceof ApiError ? e.message : "Código inválido o expirado.");
      inputRef.current?.focus();
      inputRef.current?.select();
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-white flex items-center justify-center p-4">
      <Card className="w-full max-w-md border-0 shadow-none">
        <CardHeader className="text-center pb-8">
          <h1 className="text-4xl font-black tracking-wider text-gray-900 mb-2">
            MIWA
          </h1>
          <p className="text-sm text-gray-500 font-light">
            Setup Two-Factor Authentication
          </p>
        </CardHeader>
        <CardContent className="space-y-6">
          {!info ? (
            <p className="text-center text-sm text-gray-500">
              {loading
                ? "Generando código..."
                : err || "No se pudo iniciar el setup."}
            </p>
          ) : (
            <>
              <div className="text-center space-y-4">
                <p className="text-gray-700 text-sm">
                  Escanea este QR con tu app autenticadora (Google
                  Authenticator, Authy, etc.).
                </p>
                <div className="flex justify-center">
                  <div className="p-4 bg-white border-2 border-gray-200 rounded-lg">
                    {/* imagen simple, puedes cambiar por lib de QR local si prefieres */}
                    <img src={qrUrl} alt="TOTP QR Code" className="w-48 h-48" />
                  </div>
                </div>
                <p className="text-gray-400 text-xs">
                  o usa esta clave manual:
                </p>
                <p className="text-xs font-mono text-gray-600 bg-gray-50 p-2 rounded">
                  {info.secret}
                </p>
                <p className="text-gray-500 text-xs">
                  Luego ingresa el código de 6 dígitos:
                </p>
              </div>

              <form onSubmit={handleVerify} className="space-y-4">
                <div className="space-y-2">
                  <Label
                    htmlFor="totp-code"
                    className="text-sm font-normal text-gray-700"
                  >
                    Authentication Code
                  </Label>
                  <Input
                    ref={inputRef}
                    id="totp-code"
                    type="text"
                    inputMode="numeric"
                    maxLength={6}
                    placeholder="123456"
                    value={code}
                    onChange={(e) =>
                      setCode(e.target.value.replace(/\D/g, "").slice(0, 6))
                    }
                    className="border-gray-200 focus:border-teal-500 focus:ring-teal-500 h-12 rounded-lg text-center text-lg tracking-widest"
                    required
                  />
                </div>

                {err && (
                  <div className="text-red-500 text-sm text-center">{err}</div>
                )}

                <Button
                  type="submit"
                  disabled={loading || code.length !== 6}
                  className="w-full bg-teal-600 hover:bg-teal-700 text-white h-12 rounded-lg font-medium disabled:opacity-50"
                >
                  {loading ? "Validando..." : "Validar y continuar"}
                </Button>
              </form>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
