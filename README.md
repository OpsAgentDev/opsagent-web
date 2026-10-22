# opsagent-web

Next.js 15 (App Router, TypeScript strict) front end for OpsAgent. The browser calls brain directly
(`credentials: 'include'`); there is no server-side proxy. Styling is one plain stylesheet, `app/globals.css`.

## Layout

- `app/(marketing)/` static home. `app/(auth)/` `/sign-in`, `/auth/callback`. `app/(app)/` signed-in pages:
  `/dashboard`, `/onboarding/connect-aws`, `/connections/[id]`, `/findings` (client components; the layout
  reads the session with `GET /v1/auth/me` and uses the first organisation).
- `lib/api/client.ts` is the only code that talks to brain: typed `openapi-fetch` client, CSRF header on
  mutating requests, `ApiError` with problem details. `lib/api/schema.d.ts` is generated; never edit it.

## Develop

```
npm install
npm run sync-openapi      # copies ../opsagent-brain/openapi.json (or $OPENAPI_PATH) to lib/api/openapi.json, regenerates lib/api/schema.d.ts
cp .env.example .env.local
npm run dev               # http://localhost:3001, brain expected on http://localhost:3000
```

Use `localhost` for both, not `127.0.0.1`: the local session cookie is host-only. Brain needs
`WEB_BASE_URL=http://localhost:3001`.

## End-to-end test

`scripts/e2e.sh` starts Postgres, Redis and mailpit from brain's `docker-compose.yml` (ports 55432/56379,
override with `PG_PORT`/`REDIS_PORT`), recreates the `opsagent_brain_e2e` database, runs brain with `OPSAGENT_CONNECTORS=fake` and
`MAILER_SMTP_URL=smtp://localhost:1025` (server and worker in one process), builds and starts web, then runs
`tests/e2e/first-slice.spec.ts`. It signs in with the link read from mailpit's API, creates an organisation,
connects the fake `noisy` account, scans, and snoozes a critical finding. Logs: `brain-e2e.log`, `web-e2e.log`.
First time: `npx playwright install chromium`.

## CI

`.github/workflows/ci.yml`: `npm ci`, regenerate the schema from the committed `lib/api/openapi.json` and fail if it
differs from `lib/api/schema.d.ts`, `npm run lint` (ESLint and `tsc`), `npm run build`; plus a Docker build. CI never
touches the brain repo. Cross-repo drift is caught locally: after brain's API changes, run `npm run sync-openapi` and commit
`lib/api/openapi.json` and `lib/api/schema.d.ts`. The Playwright job runs only when the repository variable `E2E` is `1`
and needs the optional secret `BRAIN_READ_TOKEN` (read access to the private brain repo).
