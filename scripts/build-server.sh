#!/bin/bash
# Build production trên hosting Node.js (cPanel / gaziantep panel thường set NODE_ENV=development)
set -e

cd "$(dirname "$0")/.."

export NODE_OPTIONS="${NODE_OPTIONS:---max-old-space-size=4096}"
export RAYON_NUM_THREADS="${RAYON_NUM_THREADS:-1}"
export UV_THREADPOOL_SIZE="${UV_THREADPOOL_SIZE:-1}"

echo "=== NODE_ENV trước build: ${NODE_ENV:-unset} ==="
echo "=== npm run build sẽ ép NODE_ENV=production (cross-env) ==="
npm run build

echo "=== Build OK ==="
