"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { mfaChallenge } from "@/lib/api/auth";
import { ApiError } from "@/lib/api/client";
import { setRefreshToken, setToken } from "@/lib/api/token";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";

export default function MfaCodeForm({
  session,
  email,
  onSuccessRedirect = "/portal",
}: {
  session: string;
  email: string;
  onSuccessRedirect?: string;
}) {
  const router = useRouter();
  const [code, setCode] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!session || !email) router.replace("/login");
  }, [session, email, router]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!session || !email || code.length !== 6) return;

    setIsLoading(true);
    setErr(null);
    try {
      const res = await mfaChallenge({ session, email, code });
      if (res.status === "OK") {
        setToken(res.tokens.AccessToken);
        if (res.tokens.RefreshToken) {
          setRefreshToken(res.tokens.RefreshToken);
        }
        router.replace(onSuccessRedirect);
      } else {
        setErr("No se pudo completar la autenticación MFA.");
      }
    } catch (e: any) {
      setErr(e instanceof ApiError ? e.message : "Código inválido.");
      inputRef.current?.focus();
      inputRef.current?.select();
    } finally {
      setIsLoading(false);
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
            Two-Factor Authentication
          </p>
        </CardHeader>
        <CardContent className="space-y-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label
                htmlFor="code"
                className="text-sm font-normal text-gray-700"
              >
                Authentication Code
              </Label>
              <Input
                ref={inputRef}
                id="code"
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
              disabled={isLoading || code.length !== 6}
              className="w-full bg-teal-600 hover:bg-teal-700 text-white h-12 rounded-lg font-medium disabled:opacity-50"
            >
              {isLoading ? "Validando..." : "Validar"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
