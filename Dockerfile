# syntax=docker/dockerfile:1

# Builder stage: install dependencies and build the Next.js application
FROM node:20-bullseye-slim AS builder

ENV NODE_ENV=production \
    NEXT_TELEMETRY_DISABLED=1

WORKDIR /app

# Install dependencies based on lockfile for reproducible builds
COPY package.json package-lock.json ./
RUN npm ci

# Copy the rest of the project files and build the app
COPY . .
RUN npm run build

# Runner stage: create a lean image for production
FROM node:20-bullseye-slim AS runner

ENV NODE_ENV=production \
    NEXT_TELEMETRY_DISABLED=1 \
    PORT=3000

WORKDIR /app

# Create a non-root user to satisfy Fargate requirements
RUN addgroup --system --gid 1001 nextjs \
    && adduser --system --uid 1001 --ingroup nextjs nextjs

# Copy only the files required to run the production build
COPY --from=builder /app/package.json /app/package-lock.json ./
RUN npm ci --omit=dev

COPY --from=builder /app/public ./public
COPY --from=builder /app/.next ./.next

# Ensure the non-root user owns the application files
RUN chown -R nextjs:nextjs /app
USER nextjs

EXPOSE 3000

CMD ["npm", "run", "start"]
