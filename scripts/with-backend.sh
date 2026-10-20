#!/usr/bin/env bash
# Usage: with-backend.sh <backend> <port> <command...>
# Starts the backend, waits until it is healthy, runs the command, then stops the backend.
set -euo pipefail

backend=$1 port=$2
shift 2

setsid make -s -C "backends/$backend" run PORT="$port" TEMP_STORAGE=1 &
pid=$!
trap 'kill -- -$pid 2>/dev/null || true' EXIT

for _ in $(seq 60); do
  curl -sf "http://localhost:$port/api/health" >/dev/null && break
  sleep 0.5
done

MINIKAN_API_URL="http://localhost:$port" "$@"
