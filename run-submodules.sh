#!/usr/bin/env bash
set -euo pipefail

SUBMODULES=(rspack-json rspack-storage rspack-rkyv)

if [ $# -eq 0 ]; then
  echo "Usage: $0 <command> [args...]"
  echo "Example: $0 pnpm build:cli:release"
  echo "Runs the given command in each submodule directory in parallel."
  exit 1
fi

pids=()
dirs=()
for dir in "${SUBMODULES[@]}"; do
  if [ -d "$dir" ]; then
    echo "[$dir] Running: $*"
    (cd "$dir" && "$@") &
    pids+=($!)
    dirs+=("$dir")
  else
    echo "[$dir] SKIP (directory not found)"
  fi
done

failed=0
for i in "${!pids[@]}"; do
  wait "${pids[$i]}" || { failed=1; echo "[${dirs[$i]}] FAILED (exit code $?)"; }
done

if [ "$failed" -eq 0 ]; then
  echo "All submodules completed successfully."
else
  echo "Some submodules failed."
  exit 1
fi