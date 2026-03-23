# ===========================
# Stage 1 — install backend deps
# ===========================
# Multi-stage build: Stage 1 uses full node:18 image (includes build tools like gcc/make)
# for npm install — some packages need native compilation
FROM node:18 AS backend-deps
WORKDIR /app/backend

# Copy package files first (Docker cache optimization)
# If dependencies haven't changed, Docker reuses this layer instead of reinstalling
COPY backend/package*.json ./
RUN npm install


# ===========================
# Stage 2 — runtime
# ===========================
# node:18-slim is ~200MB smaller — no build tools, only the Node.js runtime
# Result: smaller image = faster pulls, smaller attack surface
FROM node:18-slim AS runtime
WORKDIR /app


# Copy installed node_modules from Stage 1, then overlay backend source code
COPY --from=backend-deps /app/backend ./backend
COPY backend ./backend

# Copy seed scripts (used by Dockerfile.seed, included here for shared image compatibility)
COPY db ./db

# Copy vanilla JS frontend (no build step needed — served as static files)
COPY frontend ./frontend

EXPOSE 3000

CMD ["node", "backend/src/server.js"]
