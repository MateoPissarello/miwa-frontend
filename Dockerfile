# syntax=docker/dockerfile:1

# ===== 1) BUILDER =====
FROM public.ecr.aws/docker/library/node:20-bullseye-slim AS builder

# En build NO pongas NODE_ENV=production (necesitamos devDeps p/ TypeScript)
ENV NEXT_TELEMETRY_DISABLED=1
WORKDIR /app

# Instala deps con lockfile e INCLUYE devDependencies
COPY package.json package-lock.json ./
# --include=dev fuerza devDeps aunque alguna var de entorno diga production
RUN npm ci --include=dev

# Copia el resto y buildea
COPY . .
# Asegura que typescript exista (si tu package.json no lo trae en devDeps)
RUN npm ls typescript || npm i -D typescript@^5
RUN npm run build

# ===== 2) RUNNER =====
FROM public.ecr.aws/docker/library/node:20-bullseye-slim AS runner

ENV NODE_ENV=production \
    NEXT_TELEMETRY_DISABLED=1 \
    PORT=3000

WORKDIR /app

# Usuario no-root (requerido por Fargate)
RUN addgroup --system --gid 1001 nextjs \
 && adduser --system --uid 1001 --ingroup nextjs nextjs

# Instala SOLO deps de producción
COPY --from=builder /app/package.json /app/package-lock.json ./
RUN npm ci --omit=dev

# Copia artefactos de build
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next ./.next

# Permisos
RUN chown -R nextjs:nextjs /app
USER nextjs

EXPOSE 3000
CMD ["npm", "run", "start"]
