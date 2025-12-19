# Build stage
FROM oven/bun:1.3.5 AS builder
WORKDIR /app

# Install build tools for native dependencies
RUN apt-get update && apt-get install -y \
    python3 \
    make \
    g++ \
    && rm -rf /var/lib/apt/lists/*

# Copy everything to handle monorepo dependencies
COPY . .

# Install all dependencies (including devDeps for build)
RUN bun install

# Build the frontend
RUN bun run --filter frontend build

# Production stage
FROM nginx:1.27-alpine
COPY --from=builder /app/apps/frontend/dist /usr/share/nginx/html
COPY apps/frontend/nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
