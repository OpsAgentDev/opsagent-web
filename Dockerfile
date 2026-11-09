# syntax=docker/dockerfile:1
FROM node:26-alpine AS builder
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci
COPY . .
# NEXT_PUBLIC_* is inlined at build time: Railway passes service variables as build args.
ARG NEXT_PUBLIC_API_BASE_URL
ENV NEXT_PUBLIC_API_BASE_URL=$NEXT_PUBLIC_API_BASE_URL
# Public site key for Cloudflare Turnstile; optional (unset = no widget).
ARG NEXT_PUBLIC_TURNSTILE_SITE_KEY
ENV NEXT_PUBLIC_TURNSTILE_SITE_KEY=$NEXT_PUBLIC_TURNSTILE_SITE_KEY
# Sign-ups switch: "true" swaps the waitlist for the free-trial sign-up (default off).
ARG NEXT_PUBLIC_SIGNUPS_OPEN
ENV NEXT_PUBLIC_SIGNUPS_OPEN=$NEXT_PUBLIC_SIGNUPS_OPEN
RUN test -n "$NEXT_PUBLIC_API_BASE_URL" || { echo "NEXT_PUBLIC_API_BASE_URL build arg is required" >&2; exit 1; }
RUN npm run build

FROM node:26-alpine
WORKDIR /app
ENV NODE_ENV=production PORT=3001 HOSTNAME=0.0.0.0
COPY --from=builder --chown=node:node /app/.next/standalone ./
COPY --from=builder --chown=node:node /app/.next/static ./.next/static
COPY --from=builder --chown=node:node /app/public ./public
USER node
EXPOSE 3001
CMD ["node", "server.js"]
