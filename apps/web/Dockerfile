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

# Build Web (Next.js)
# Output: dist/apps/web/.next
RUN npx nx build web --prod

# --- Runner Stage ---
FROM node:20-alpine AS runner

WORKDIR /app
ENV NODE_ENV production
ENV PORT 3000
ENV HOSTNAME "0.0.0.0"

# Copy standalone output
# The structure inside standalone mimics the project root
# usually: standalone/apps/web/server.js
# We copy everything from standalone to /app
COPY --from=builder /app/dist/apps/web/.next/standalone ./
COPY --from=builder /app/dist/apps/web/.next/static ./dist/apps/web/.next/static
COPY --from=builder /app/dist/apps/web/public ./dist/apps/web/public

EXPOSE 3000

# Start server
CMD ["node", "apps/web/server.js"]
