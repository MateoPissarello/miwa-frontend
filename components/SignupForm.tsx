// components/SignupForm.tsx
"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { signup } from "@/lib/api/auth";
import { ApiError } from "@/lib/api/client";
import { uploadPictureForSignup } from "@/lib/api/s3"; // <-- NUEVO
import { useRouter } from "next/navigation";
import { useState } from "react";

function normalizePhoneE164(raw: string) {
  const s = raw.trim();
  if (s.startsWith("+")) return s;
  if (/^\d+$/.test(s)) return `+${s}`;
  return s;
}

interface Props {
  title?: string;
  onSuccessRedirect?: string; // default: "/signup/verify-email"
}

export default function SignupForm({
  title = "Create your account",
  onSuccessRedirect = "/signup/verify-email",
}: Props) {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [nickname, setNickname] = useState("");
  const [address, setAddress] = useState("");
  const [birthdate, setBirthdate] = useState("");
  const [gender, setGender] = useState<string>("");

  const [phoneNumber, setPhoneNumber] = useState("");
  const [familyName, setFamilyName] = useState("");
  const [name, setName] = useState("");

  const [pictureFile, setPictureFile] = useState<File | null>(null);

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<null | {
    type: "ok" | "error";
    text: string;
  }>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setMessage(null);

    const emailTrim = email.trim();
    const passwordTrim = password.trim();

    if (!emailTrim || !passwordTrim)
      return setMessage({
        type: "error",
        text: "Email y contraseña son obligatorios.",
      });
    if (passwordTrim.length < 8)
      return setMessage({
        type: "error",
        text: "La contraseña debe tener al menos 8 caracteres.",
      });
    if (!birthdate)
      return setMessage({
        type: "error",
        text: "La fecha de nacimiento es obligatoria.",
      });
    if (!gender)
      return setMessage({ type: "error", text: "Selecciona un género." });

    setLoading(true);
    try {
      // 1) Subir foto (opcional) usando /s3/presign-setup (lib/api/s3)
      let pictureUrl: string | undefined;
      if (pictureFile) {
        const { url } = await uploadPictureForSignup(emailTrim, pictureFile);
        pictureUrl = url;
      }

      // 2) Hacer signup con todos los atributos
      const payload = {
        email: emailTrim,
        password: passwordTrim,
        nickname: nickname.trim(),
        address: address.trim(),
        birthdate,
        gender,
        picture: pictureUrl, // <- URL devuelta
        phone_number: normalizePhoneE164(phoneNumber),
        family_name: familyName.trim(),
        name: name.trim(),
        first_name: name.trim(),
        last_name: familyName.trim(),
      };

      await signup(payload);

      setMessage({
        type: "ok",
        text: "Cuenta creada. Revisa tu correo para confirmar el código.",
      });

      // limpiar
      setEmail("");
      setPassword("");
      setNickname("");
      setAddress("");
      setBirthdate("");
      setGender("");
      setPhoneNumber("");
      setFamilyName("");
      setName("");
      setPictureFile(null);

      if (onSuccessRedirect)
        router.replace(
          `${onSuccessRedirect}?email=${encodeURIComponent(payload.email)}`
        );
    } catch (err: any) {
      if (err instanceof ApiError)
        setMessage({
          type: "error",
          text: err.message || "Error creando la cuenta.",
        });
      else
        setMessage({
          type: "error",
          text: err?.message || "No se pudo conectar con el servidor.",
        });
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
          <form onSubmit={onSubmit} className="space-y-4">
            {/* Email */}
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
                required
                className="border-gray-200 focus:border-teal-500 focus:ring-teal-500 h-12 rounded-lg"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>

            {/* Password */}
            <div className="space-y-2">
              <Label
                htmlFor="password"
                className="text-sm font-normal text-gray-700"
              >
                Password
              </Label>
              <Input
                id="password"
                type="password"
                placeholder="Create a password"
                required
                className="border-gray-200 focus:border-teal-500 focus:ring-teal-500 h-12 rounded-lg"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>

            {/* Nickname */}
            <div className="space-y-2">
              <Label
                htmlFor="nickname"
                className="text-sm font-normal text-gray-700"
              >
                Nickname
              </Label>
              <Input
                id="nickname"
                type="text"
                placeholder="Choose a nickname"
                required
                className="border-gray-200 focus:border-teal-500 focus:ring-teal-500 h-12 rounded-lg"
                value={nickname}
                onChange={(e) => setNickname(e.target.value)}
              />
            </div>

            {/* Name (nombre) */}
            <div className="space-y-2">
              <Label
                htmlFor="name"
                className="text-sm font-normal text-gray-700"
              >
                Name
              </Label>
              <Input
                id="name"
                type="text"
                placeholder="Enter your first name"
                required
                className="border-gray-200 focus:border-teal-500 focus:ring-teal-500 h-12 rounded-lg"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>

            {/* Family Name (apellido) */}
            <div className="space-y-2">
              <Label
                htmlFor="family_name"
                className="text-sm font-normal text-gray-700"
              >
                Family Name
              </Label>
              <Input
                id="family_name"
                type="text"
                placeholder="Enter your last name"
                required
                className="border-gray-200 focus:border-teal-500 focus:ring-teal-500 h-12 rounded-lg"
                value={familyName}
                onChange={(e) => setFamilyName(e.target.value)}
              />
            </div>

            {/* Address */}
            <div className="space-y-2">
              <Label
                htmlFor="address"
                className="text-sm font-normal text-gray-700"
              >
                Address
              </Label>
              <Input
                id="address"
                type="text"
                placeholder="Enter your address"
                required
                className="border-gray-200 focus:border-teal-500 focus:ring-teal-500 h-12 rounded-lg"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
              />
            </div>

            {/* Birthdate */}
            <div className="space-y-2">
              <Label
                htmlFor="birthdate"
                className="text-sm font-normal text-gray-700"
              >
                Birth Date
              </Label>
              <Input
                id="birthdate"
                type="date"
                required
                className="border-gray-200 focus:border-teal-500 focus:ring-teal-500 h-12 rounded-lg"
                value={birthdate}
                onChange={(e) => setBirthdate(e.target.value)}
              />
            </div>

            {/* Gender */}
            <div className="space-y-2">
              <Label
                htmlFor="gender"
                className="text-sm font-normal text-gray-700"
              >
                Gender
              </Label>
              <Select value={gender} onValueChange={setGender} required>
                <SelectTrigger className="border-gray-200 focus:border-teal-500 focus:ring-teal-500 h-12 rounded-lg">
                  <SelectValue placeholder="Select your gender" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="male">Male</SelectItem>
                  <SelectItem value="female">Female</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                  <SelectItem value="prefer-not-to-say">
                    Prefer not to say
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Phone Number */}
            <div className="space-y-2">
              <Label
                htmlFor="phone_number"
                className="text-sm font-normal text-gray-700"
              >
                Phone Number
              </Label>
              <Input
                id="phone_number"
                type="tel"
                placeholder="+57 3001234567"
                required
                className="border-gray-200 focus:border-teal-500 focus:ring-teal-500 h-12 rounded-lg"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
              />
              <p className="text-xs text-gray-500">
                Formato recomendado: E.164 (ej. +573001234567)
              </p>
            </div>

            {/* Picture (file) */}
            <div className="space-y-2">
              <Label
                htmlFor="picture"
                className="text-sm font-normal text-gray-700"
              >
                Profile Picture
              </Label>
              <Input
                id="picture"
                type="file"
                accept="image/*"
                className="border-gray-200 focus:border-teal-500 focus:ring-teal-500 h-12 rounded-lg file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-teal-50 file:text-teal-700 hover:file:bg-teal-100"
                onChange={(e) => setPictureFile(e.target.files?.[0] ?? null)}
              />
              <p className="text-xs text-gray-500">
                Se subirá y se guardará la URL en tu perfil.
              </p>
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
