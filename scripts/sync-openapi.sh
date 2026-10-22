#!/usr/bin/env bash
# Copies brain's openapi.json to lib/api/openapi.json (committed) and regenerates lib/api/schema.d.ts from it.
# OPENAPI_PATH overrides the source (default: ../opsagent-brain/openapi.json).
set -euo pipefail
cd "$(dirname "$0")/.."
src="${OPENAPI_PATH:-../opsagent-brain/openapi.json}"
cp "$src" lib/api/openapi.json
npx openapi-typescript lib/api/openapi.json -o lib/api/schema.d.ts
