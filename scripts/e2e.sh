#!/usr/bin/env bash
# Boots brain (fake connector, mail to mailpit) and web, then runs the Playwright suite.
# Needs Docker, Rust (cargo) and a brain checkout at $BRAIN_DIR (default ../opsagent-brain).
set -euo pipefail
cd "$(dirname "$0")/.."
BRAIN_DIR="${BRAIN_DIR:-../opsagent-brain}"
PG_PORT="${PG_PORT:-55432}" REDIS_PORT="${REDIS_PORT:-56379}"
export PG_PORT REDIS_PORT

docker compose -f "$BRAIN_DIR/docker-compose.yml" up -d postgres redis mailpit

pids=()
cleanup() { for p in "${pids[@]}"; do kill "$p" 2>/dev/null || true; done; }
trap cleanup EXIT

wait_for() { # url, name
  for _ in $(seq 1 300); do curl -sf "$1" >/dev/null && return 0; sleep 1; done
  echo "$2 did not come up at $1" >&2; return 1
}

# Brain in development mode with the worker in-process, so verify and scan jobs run.
(
  cd "$BRAIN_DIR/app"
  [ -f "$HOME/.cargo/env" ] && source "$HOME/.cargo/env"
  PORT=3000 API_BASE_URL=http://localhost:3000 WEB_BASE_URL=http://localhost:3001 \
  DATABASE_URL="postgres://loco:loco@localhost:$PG_PORT/opsagent_brain_development" \
  REDIS_URL="redis://localhost:$REDIS_PORT" \
  OPSAGENT_CONNECTORS=fake MAILER_SMTP_URL=smtp://localhost:1025 \
  OPSAGENT_KEK="${OPSAGENT_KEK:-AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA=}" \
  LOG_LEVEL=info exec cargo run -q -- start --server-and-worker
) > brain-e2e.log 2>&1 &
pids+=($!)

export NEXT_PUBLIC_API_BASE_URL=http://localhost:3000 NEXT_PUBLIC_OPSAGENT_FAKE=1
npm run build
npm run start > web-e2e.log 2>&1 &
pids+=($!)

wait_for http://localhost:3000/healthz brain
wait_for http://localhost:3001/ web
npx playwright test "$@"
