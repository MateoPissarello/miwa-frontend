// components/SignupForm.tsx
"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { signup } from "@/lib/api/auth";
import { ApiError } from "@/lib/api/client";

interface Props {
  title?: string;
  onSuccessRedirect?: string; // ej: "/login"
}

export default function SignupForm({
  title = "Create your account",
  onSuccessRedirect = "/login",
}: Props) {
  const router = useRouter();

  const [nombre, setNombre] = useState("");
  const [apellido, setApellido] = useState("");
  const [correo, setCorreo] = useState("");
  const [contrasena, setContrasena] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<null | {
    type: "ok" | "error";
    text: string;
  }>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setMessage(null);
    setLoading(true);

    try {
      await signup({
        // Ajusta los nombres si tu CreateUserBase usa otros campos
        first_name: nombre,
        last_name: apellido,
        email: correo,
        password: contrasena,
      });

      setMessage({ type: "ok", text: "Cuenta creada correctamente." });
      // Limpia el formulario
      setNombre("");
      setApellido("");
      setCorreo("");
      setContrasena("");

      // Redirige (opcional)
      if (onSuccessRedirect) router.replace(onSuccessRedirect);
    } catch (err: any) {
      if (err instanceof ApiError) {
        setMessage({
          type: "error",
          text: err.message || "Error creando la cuenta.",
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
            MIWA
          </h1>
          <p className="text-sm text-gray-500 font-light">{title}</p>
        </CardHeader>
        <CardContent className="space-y-6">
          <form className="space-y-6" onSubmit={onSubmit}>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label
                  htmlFor="nombre"
                  className="text-sm font-normal text-gray-700"
                >
                  Nombre
                </Label>
                <Input
                  id="nombre"
                  type="text"
                  placeholder="Ingresa tu nombre"
                  className="border-gray-200 focus:border-teal-500 focus:ring-teal-500 h-12 rounded-lg"
                  value={nombre}
                  onChange={(e) => setNombre(e.target.value)}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label
                  htmlFor="apellido"
                  className="text-sm font-normal text-gray-700"
                >
                  Apellido
                </Label>
                <Input
                  id="apellido"
                  type="text"
                  placeholder="Ingresa tu apellido"
                  className="border-gray-200 focus:border-teal-500 focus:ring-teal-500 h-12 rounded-lg"
                  value={apellido}
                  onChange={(e) => setApellido(e.target.value)}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label
                  htmlFor="correo"
                  className="text-sm font-normal text-gray-700"
                >
                  Correo
                </Label>
                <Input
                  id="correo"
                  type="email"
                  placeholder="Ingresa tu correo electrónico"
                  className="border-gray-200 focus:border-teal-500 focus:ring-teal-500 h-12 rounded-lg"
                  value={correo}
                  onChange={(e) => setCorreo(e.target.value)}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label
                  htmlFor="contrasena"
                  className="text-sm font-normal text-gray-700"
                >
                  Contraseña
                </Label>
                <Input
                  id="contrasena"
                  type="password"
                  placeholder="Crea una contraseña"
                  className="border-gray-200 focus:border-teal-500 focus:ring-teal-500 h-12 rounded-lg"
                  value={contrasena}
                  onChange={(e) => setContrasena(e.target.value)}
                  required
                />
              </div>
            </div>

            <Button
              type="submit"
              disabled={loading}
              className="w-full bg-teal-600 hover:bg-teal-700 text-white h-12 rounded-lg font-medium disabled:opacity-70"
            >
              {loading ? "Creando..." : "Crear Cuenta"}
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
              ¿Ya tienes una cuenta?{" "}
              <a
                href="/login"
                className="text-teal-600 hover:text-teal-700 font-medium"
              >
                Iniciar sesión
              </a>
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
