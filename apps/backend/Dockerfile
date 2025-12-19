# Stage 1: Build
FROM oven/bun:1.3.5 AS builder

WORKDIR /app

# Install build tools for native dependencies
RUN apt-get update && apt-get install -y \
    python3 \
    make \
    g++ \
    && rm -rf /var/lib/apt/lists/*

# Copy monorepo structure
COPY . .

# Install production dependencies
RUN bun install --production

# Stage 2: Runtime (Slim image)
FROM oven/bun:1.3.5-slim AS runner

WORKDIR /app

# Copy only the necessary files from builder
COPY --from=builder /app /app

# Ensure data directory exists for SQLite and set permissions
RUN mkdir -p /data && chown -R bun:bun /data && chown -R bun:bun /app

# Default environment variables
ENV NODE_ENV=production
ENV DATABASE_URL=file:/data/netmeter.db
ENV PORT=3000

USER bun
EXPOSE 3000

# Start the backend service (run migrations first)
CMD ["sh", "-c", "bun run --filter @netmeter/db migrate && bun run --filter backend start"]
