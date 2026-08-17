# ─── Stage 1: Build ───────────────────────────────────────────────────────────
FROM node:22-alpine AS builder

WORKDIR /app

# Copy dependency manifests first for Docker layer cache
COPY package*.json ./
COPY prisma ./prisma/

# Install ALL dependencies (including devDeps needed for tsc + prisma generate)
RUN npm ci

# Generate Prisma client before compiling
RUN npx prisma generate

# Copy source
COPY tsconfig.json ./
COPY src ./src/

# Compile TypeScript → dist/
RUN npm run build

# ─── Stage 2: Production Image ────────────────────────────────────────────────
FROM node:22-alpine AS production

# Security: run as non-root user
RUN addgroup -S campusos && adduser -S campusos -G campusos

WORKDIR /app

# Copy only production dependencies
COPY package*.json ./
COPY prisma ./prisma/

RUN npm ci --omit=dev && npx prisma generate

# Copy compiled output from builder
COPY --from=builder /app/dist ./dist

# Change ownership of app directory
RUN chown -R campusos:campusos /app

USER campusos

# CampusOS API server port
EXPOSE 4000

# Health check — uses the /api/health endpoint
HEALTHCHECK --interval=30s --timeout=10s --start-period=30s --retries=3 \
  CMD wget -qO- http://localhost:4000/api/health | grep -q '"status":"healthy"' || exit 1

# Run the server
CMD ["node", "dist/server.js"]

# ─── Labels ───────────────────────────────────────────────────────────────────
LABEL org.opencontainers.image.title="CampusOS Server"
LABEL org.opencontainers.image.description="CampusOS Enterprise API Server"
LABEL org.opencontainers.image.vendor="CampusOS"
LABEL org.opencontainers.image.licenses="Proprietary"
