# Base Stage
FROM node:20-alpine AS builder

WORKDIR /app

# Copy dependency definitions
COPY package*.json ./
COPY nx.json ./

# Install dependencies (including dev deps)
RUN npm ci

# Copy source code
COPY . .

# Generate Prisma Client (needed for build)
RUN npx prisma generate

# Build API
RUN npx nx build api --prod

# --- Runner Stage ---
FROM node:20-alpine AS runner

WORKDIR /app
ENV NODE_ENV production

# Dependencies required for Prisma & Argon2 (native modules)
# This includes OpenSSL for Prisma 
RUN apk add --no-cache openssl

# Copy built app
COPY --from=builder /app/dist/apps/api ./dist
COPY --from=builder /app/package*.json ./
COPY --from=builder /app/prisma ./prisma

# Install ONLY production dependencies (to keep image small)
# Native modules like argon2 might need to rebuild or be compatible
RUN npm ci --only=production && npm cache clean --force

# Copy generated Prisma Client (which is native and built in builder)
# This is crucial because `prisma generate` creates binaries in node_modules/.prisma
COPY --from=builder /app/node_modules/@prisma ./node_modules/@prisma
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma

EXPOSE 3000

CMD ["node", "dist/main.js"]
