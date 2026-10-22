#!/usr/bin/env bash
# Copies brain's committed openapi.json and regenerates lib/api/schema.d.ts from it.
# OPENAPI_PATH overrides the source (default: ../opsagent-brain/openapi.json).
set -euo pipefail
cd "$(dirname "$0")/.."
src="${OPENAPI_PATH:-../opsagent-brain/openapi.json}"
cp "$src" openapi.json
npx openapi-typescript openapi.json -o lib/api/schema.d.ts
