#!/usr/bin/env bash
# CI: fails clearly without BRAIN_READ_TOKEN, then picks the brain ref: the branch named BRANCH if
# brain has it, else main. Writes `ref=<name>` to $GITHUB_OUTPUT.
set -euo pipefail
if [ -z "${BRAIN_READ_TOKEN:-}" ]; then
  echo "::error::Repository secret BRAIN_READ_TOKEN is not set (read access to OpsAgentDev/opsagent-brain)."
  exit 1
fi
url="https://x-access-token:${BRAIN_READ_TOKEN}@github.com/OpsAgentDev/opsagent-brain.git"
ref=main
if git ls-remote --exit-code --heads "$url" "refs/heads/$BRANCH" >/dev/null; then ref="$BRANCH"; fi
echo "brain ref: $ref"
echo "ref=$ref" >> "$GITHUB_OUTPUT"
