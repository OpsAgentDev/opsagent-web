# AGENTS.md — opsagent-web

This repo is **web**: the Next.js marketing site, docs, and dashboard for OpsAgent. It holds implementation only. All knowledge, decisions, specs, and plans live in the ArchBoss hub: `../OpsAgent-ArchBoss` (read its `AGENTS.md` first, then `DECISIONS.md`). If ArchBoss is not checked out beside this repo, stop and ask for it.

No `CLAUDE.md` in this repo; this file is the only instruction file.

## Run
```
npm ci
npm run sync-openapi      # copies ../opsagent-brain/openapi.json to lib/api/openapi.json (committed), regenerates lib/api/schema.d.ts
npm run lint && npm test && NEXT_PUBLIC_API_BASE_URL=http://localhost:3000 npm run build
bash scripts/e2e.sh       # boots brain (fake connector, mailpit) and web, runs Playwright serially; no Slack app needed
# BRAIN_DIR=../opsagent-brain-<worktree> to test against a brain branch
```

## Layout
- `app/(marketing)` static pages; `app/(auth)` sign-in and `/auth/callback?token=`; `app/(app)` dashboard, onboarding, connections, findings (client-rendered in Plan 1); Plan 2 adds `settings/delivery` (Slack connect via `POST /v1/orgs/{org}/integrations/slack/start`, channel per connection, recipients), `deliveries` (history) and `connections/[id]/briefing` (preview).
- Public, no session: `app/recipients/confirm?token=` and `app/unsubscribe/[token]`; both act only on an explicit button POST (mail scanners prefetch links). Brain builds these links from its `WEB_BASE_URL`, which must be this site's origin.
- `lib/api/client.ts` is the only place `fetch` is called (ESLint enforces it); types come from the generated `lib/api/schema.d.ts`, never hand-written. CI does not check out brain: it regenerates the schema from the committed `lib/api/openapi.json`. After brain's API changes, run `npm run sync-openapi` and commit both files.
- Talks to brain at `NEXT_PUBLIC_API_BASE_URL` with credentials; CSRF token from `GET /v1/auth/csrf`.

## Rules (summary; binding text in ArchBoss `docs/tech-spec/engineering-principles.md`)
One API client, pages under ~200 lines, no duplicated fetch or error handling, no sensitive values in `NEXT_PUBLIC_*`, brand lines per PRD section 5. The founder's commit-msg hook strips `Co-Authored-By`; do not bypass hooks.

## Logging
Use `lib/log.ts` (`log.debug/info/warn/error(message, fields?)`), never `console.*` (ESLint `no-console` enforces it). Never pass tokens, cookies, or API keys in fields. Spec: ArchBoss `docs/tech-spec/logging.md`.
