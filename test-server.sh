#!/usr/bin/env bash
set -euo pipefail
PORT=${PORT:-3000}

# Build the Next.js app
npm run build

# Start the server in the background on the given port
PORT=$PORT npm run start &
SERVER_PID=$!

cleanup() {
  echo "Stopping server"
  kill $SERVER_PID || true
}
trap cleanup EXIT

# Wait for the server to become available
for i in {1..30}; do
  if curl -sSf "http://localhost:$PORT" >/dev/null; then
    echo "Server is up"
    exit 0
  fi
  sleep 1
done

echo "Server failed to start"
exit 1
