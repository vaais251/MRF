FROM node:20-alpine AS base

# Install dependencies only when needed
FROM base AS deps
RUN apk add --no-cache libc6-compat openssl
WORKDIR /app

# Install dependencies based on the preferred package manager
COPY package.json package-lock.json* ./
RUN npm ci

# Rebuild the source code only when needed
FROM base AS builder
RUN apk add --no-cache openssl
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Next.js telemetry
ENV NEXT_TELEMETRY_DISABLED 1

# Generate Prisma client and build Next.js app
RUN npx prisma generate
RUN npm run build

# Production image, copy all the files and run next
FROM base AS runner
# openssl + libc6-compat are required by the Prisma engines on Alpine (musl)
RUN apk add --no-cache openssl libc6-compat
WORKDIR /app

ENV NODE_ENV production
ENV NEXT_TELEMETRY_DISABLED 1

# Prisma CLI is needed at startup for `prisma migrate deploy`. The Next.js
# standalone output strips it, so install it (pinned to match @prisma/client).
RUN npm install -g prisma@5.22.0

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Copy public folder if it exists (mkdir ensures the target always exists)
RUN mkdir -p ./public
COPY --from=builder /app/public* ./public/

# Automatically leverage output traces to reduce image size
# https://nextjs.org/docs/advanced-features/output-file-tracing
# We need to copy .next/standalone if standalone mode is enabled in next.config.mjs
# If not, we just copy .next
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/scripts ./scripts

# Normalize line endings (defends against a CRLF checkout) and make executable
RUN sed -i 's/\r$//' ./scripts/migrate-and-seed.sh \
 && chmod +x ./scripts/migrate-and-seed.sh

# Let the non-root runtime user write to Prisma dirs, so any prisma command
# (or an accidental `generate`) doesn't fail with a permissions error.
RUN chown -R nextjs:nodejs /usr/local/lib/node_modules /app/prisma /app/scripts

USER nextjs

EXPOSE 3000

ENV PORT 3000

CMD ["node", "server.js"]
