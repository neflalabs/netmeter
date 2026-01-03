# Stage 1: Build Frontend
FROM oven/bun:1.3.5 AS frontend-builder
WORKDIR /app
COPY . .
RUN bun install
RUN bun run --filter frontend build

# Stage 2: Build Backend & Runtime
FROM oven/bun:1.3.5-slim AS runner
WORKDIR /app

# Install system dependencies (if needed by backend native modules)
RUN apt-get update && apt-get install -y \
    python3 \
    make \
    g++ \
    && rm -rf /var/lib/apt/lists/*

# Copy monorepo files
COPY . .

# Install production dependencies for backend
RUN bun install --production

# Copy built frontend assets to backend's public directory
COPY --from=frontend-builder /app/apps/frontend/dist /app/apps/backend/public

# Setup data directory
RUN mkdir -p /app/data && chown -R bun:bun /app/data && chown -R bun:bun /app

# Environment variables
ENV NODE_ENV=production
ENV DATABASE_URL=file:/app/data/netmeter.db
ENV PORT=3000

USER bun
EXPOSE 3000

# Start backend
CMD ["sh", "-c", "bun run --filter @netmeter/db migrate && bun run --filter backend start"]
