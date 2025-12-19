FROM docker.io/library/golang:1.24-alpine AS builder

WORKDIR /app

# Install git and build tools (gcc) for CGO
RUN apk add --no-cache git build-base

COPY go.mod ./
# RUN go mod download # Skipped because go.sum might not exist yet

COPY . .

# Fetch the specific library requested by user
RUN go get go.mau.fi/whatsmeow
RUN go get github.com/mattn/go-sqlite3

# Run tidy here to ensure dependencies are fetched based on source code
RUN go mod tidy

# Patch whatsmeow library to change Browser Name from "whatsmeow" to "Google Chrome"
RUN sed -i 's/proto.String("whatsmeow")/proto.String("Google Chrome")/g' /go/pkg/mod/go.mau.fi/whatsmeow@*/store/clientpayload.go

# Build the binary with CGO enabled (required for sqlite3) and force rebuild (-a) to pick up patched library
RUN CGO_ENABLED=1 GOOS=linux go build -a -o whatsapp-bot main.go

# Production Stage
FROM alpine:3.20

WORKDIR /app

# Install dependencies for running basic network tools if needed
RUN apk --no-cache add ca-certificates && \
    addgroup -S appgroup && adduser -S appuser -G appgroup

COPY --from=builder /app/whatsapp-bot .

# Ensure data directory exists and set permissions
RUN mkdir -p /app/data && chown -R appuser:appgroup /app/data

USER appuser
EXPOSE 3000

CMD ["./whatsapp-bot"]
