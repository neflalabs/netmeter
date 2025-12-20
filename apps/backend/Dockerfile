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

# Install dependencies (includes devDeps for compilation)
RUN bun install

# Compile Backend into a single binary
RUN bun build ./apps/backend/src/index.ts --compile --outfile=netmeter-backend

# Compile Migration Tool into a single binary
# The migration script reads the 'drizzle' folder at runtime.
RUN bun build ./packages/db/migrate.ts --compile --outfile=netmeter-migrate

# Stage 2: Runtime (Much smaller image)
FROM debian:bookworm-slim AS runner

WORKDIR /app

# Install CA certificates for HTTPS requests if needed
RUN apt-get update && apt-get install -y ca-certificates && rm -rf /var/lib/apt/lists/*

# Copy the compiled binaries from the builder
COPY --from=builder /app/netmeter-backend /app/netmeter-backend
COPY --from=builder /app/netmeter-migrate /app/netmeter-migrate

# Copy migration SQL files (required by netmeter-migrate at runtime)
# Our compiled binary looks for 'drizzle' in the same directory.
COPY --from=builder /app/packages/db/drizzle /app/drizzle

# Ensure data directory exists for SQLite
RUN mkdir -p /app/data

# Default environment variables
ENV NODE_ENV=production
ENV DATABASE_URL=file:/app/data/netmeter.db
ENV PORT=3000

# Fix permissions for the data directory
RUN chmod +x /app/netmeter-backend /app/netmeter-migrate

EXPOSE 3000

# Start the services: run migrations first, then start the backend
CMD ["sh", "-c", "./netmeter-migrate && ./netmeter-backend"]
