# syntax=docker/dockerfile:1
FROM node:26-alpine@sha256:6bd9ab43c0ec0190ca7b2d193906cb8b7edf6e7f4afa43ddeccd6452710bffb5 AS builder
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci
COPY . .
# NEXT_PUBLIC_* is inlined at build time: the deploy workflow passes them as build args.
ARG NEXT_PUBLIC_API_BASE_URL
ENV NEXT_PUBLIC_API_BASE_URL=$NEXT_PUBLIC_API_BASE_URL
# Public site key for Cloudflare Turnstile; optional (unset = no widget).
ARG NEXT_PUBLIC_TURNSTILE_SITE_KEY
ENV NEXT_PUBLIC_TURNSTILE_SITE_KEY=$NEXT_PUBLIC_TURNSTILE_SITE_KEY
# Sign-ups switch: "true" swaps the waitlist for the free-trial sign-up (default off).
ARG NEXT_PUBLIC_SIGNUPS_OPEN
ENV NEXT_PUBLIC_SIGNUPS_OPEN=$NEXT_PUBLIC_SIGNUPS_OPEN
# Human review switch: "true" shows human review (default off: hidden everywhere).
ARG NEXT_PUBLIC_HUMAN_REVIEW
ENV NEXT_PUBLIC_HUMAN_REVIEW=$NEXT_PUBLIC_HUMAN_REVIEW
# Empty: no Google Analytics and no cookie banner.
ARG NEXT_PUBLIC_GA_ID
ENV NEXT_PUBLIC_GA_ID=$NEXT_PUBLIC_GA_ID
RUN test -n "$NEXT_PUBLIC_API_BASE_URL" || { echo "NEXT_PUBLIC_API_BASE_URL build arg is required" >&2; exit 1; }
RUN npm run build

FROM node:26-alpine@sha256:6bd9ab43c0ec0190ca7b2d193906cb8b7edf6e7f4afa43ddeccd6452710bffb5
# Pick up Alpine security fixes newer than the base image (zlib CVE-2026-4738).
RUN apk upgrade --no-cache
WORKDIR /app
ENV NODE_ENV=production PORT=3001 HOSTNAME=0.0.0.0
COPY --from=builder --chown=node:node /app/.next/standalone ./
COPY --from=builder --chown=node:node /app/.next/static ./.next/static
COPY --from=builder --chown=node:node /app/public ./public
# The task runs with a read-only root; Next writes only these two (image and fetch cache, revalidated
# pages). VOLUME makes the Fargate mounts keep node's ownership.
RUN mkdir -p .next/cache .next/server/route-cache && chown node:node .next/cache .next/server/route-cache
VOLUME ["/app/.next/cache", "/app/.next/server/route-cache"]
USER node
EXPOSE 3001
CMD ["node", "server.js"]
