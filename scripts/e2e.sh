#!/usr/bin/env bash
# Boots brain (fake connector, mail to mailpit) and web, then runs the Playwright suite.
# Needs Docker, Rust (cargo) and a brain checkout at $BRAIN_DIR (default ../opsagent-brain).
set -euo pipefail
cd "$(dirname "$0")/.."
BRAIN_DIR="${BRAIN_DIR:-../opsagent-brain}"
PG_PORT="${PG_PORT:-55432}" REDIS_PORT="${REDIS_PORT:-56379}"
# Reuse the brain checkout's running compose stack (same ports) instead of clashing with it.
export COMPOSE_PROJECT_NAME="${COMPOSE_PROJECT_NAME:-opsagent-brain}"
export PG_PORT REDIS_PORT

compose() { docker compose -f "$BRAIN_DIR/docker-compose.yml" "$@"; }
compose up -d --wait postgres redis mailpit
# A fresh database per run: the fake account can be connected by only one live connection.
compose exec -T postgres psql -qU loco -d postgres \
  -c "DROP DATABASE IF EXISTS opsagent_brain_e2e WITH (FORCE)" -c "CREATE DATABASE opsagent_brain_e2e"

pids=()
cleanup() { for p in "${pids[@]}"; do kill "$p" 2>/dev/null || true; done; }
trap cleanup EXIT

wait_for() { # url, name
  for _ in $(seq 1 300); do curl -sf "$1" >/dev/null && return 0; sleep 1; done
  echo "$2 did not come up at $1" >&2; return 1
}

# Brain's env, exported so the Playwright helpers can run brain CLI tasks against the same database.
BRAIN_DIR="$(cd "$BRAIN_DIR" && pwd)"
export BRAIN_DIR APP_ENV=development APP_BASE_URL=http://localhost:3000 WEB_BASE_URL=http://localhost:3001 \
  DATABASE_URL="postgres://loco:loco@localhost:$PG_PORT/opsagent_brain_e2e" \
  REDIS_URL="redis://localhost:$REDIS_PORT" \
  OPSAGENT_CONNECTORS=fake MAILER_SMTP_URL=smtp://localhost:1025 \
  OPSAGENT_KEK="${OPSAGENT_KEK:-AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA=}" \
  SLACK_CLIENT_ID=e2e-slack-client SLACK_CLIENT_SECRET=e2e-slack-secret LOG_LEVEL=info
[ -f "$HOME/.cargo/env" ] && source "$HOME/.cargo/env"

# Brain (axum, no Loco) in development mode: APP_ENV=development above, so migrations run on boot;
# the Postgres job worker runs in-process, so verify and scan jobs run.
(
  cd "$BRAIN_DIR/app"
  PORT=3000 exec cargo run -q -- start --server-and-worker
) > brain-e2e.log 2>&1 &
pids+=($!)

export NEXT_PUBLIC_API_BASE_URL=http://localhost:3000 NEXT_PUBLIC_OPSAGENT_FAKE=1
npm run build
npm run start > web-e2e.log 2>&1 &
pids+=($!)

wait_for http://localhost:3000/healthz brain
wait_for http://localhost:3001/ web
npx playwright test "$@"
