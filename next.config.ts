import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone", // ideal para Docker
  reactStrictMode: true,
  poweredByHeader: false,
  compress: true,
  images: { unoptimized: true }, // evita sharp nativo en contenedores mínimos

  // En CI: no rompas por ESLint (Typescript sí debe fallar si hay errores)
  eslint: { ignoreDuringBuilds: true },
  typescript: { ignoreBuildErrors: false },
};

export default nextConfig;
