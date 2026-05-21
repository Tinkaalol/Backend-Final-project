FROM node:20-slim AS builder

# Install OpenSSL
RUN apt-get update -y && apt-get install -y openssl && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Build backend
COPY package*.json ./
COPY prisma ./prisma/
RUN npm install --omit=dev
RUN npx prisma generate
COPY src ./src
COPY openapi.yaml ./

# Build frontend
COPY frontend/package*.json ./frontend/
WORKDIR /app/frontend
RUN npm install
RUN npm run build

# Final stage
FROM node:20-slim

RUN apt-get update -y && apt-get install -y openssl && rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY --from=builder /app/package*.json ./
COPY --from=builder /app/prisma ./prisma/
COPY --from=builder /app/src ./src
COPY --from=builder /app/openapi.yaml ./
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/.prisma ./.prisma
COPY --from=builder /app/frontend/dist ./frontend/dist

EXPOSE 3000

CMD ["sh", "-c", "npx prisma migrate deploy && node src/server.js"]
