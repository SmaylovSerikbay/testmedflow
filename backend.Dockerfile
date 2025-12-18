FROM golang:1.23-alpine AS builder

WORKDIR /app

COPY backend/go.mod ./backend/go.mod
WORKDIR /app/backend
RUN go mod download

COPY backend/. .
# Ensure go.sum is populated with all dependencies (including pgx) before build
RUN go mod tidy
RUN go build -o /app/medflow-backend .

FROM alpine:3.20

WORKDIR /app

COPY --from=builder /app/medflow-backend /app/medflow-backend

ENV DB_HOST=localhost \
    DB_PORT=5432 \
    DB_USER=medflow \
    DB_PASSWORD=medflow_password \
    DB_NAME=medflow

EXPOSE 8080

ENTRYPOINT ["/app/medflow-backend"]



