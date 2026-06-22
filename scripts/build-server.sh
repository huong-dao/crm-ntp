#!/bin/bash
# Build production trên server — tránh lỗi _global-error / OOM
set -e

cd "$(dirname "$0")"

# NODE_ENV trong .env gây lỗi prerender /_global-error — bỏ qua khi build
unset NODE_ENV
export NODE_OPTIONS="${NODE_OPTIONS:---max-old-space-size=4096}"

echo "=== Building (NODE_OPTIONS=$NODE_OPTIONS) ==="
npm run build

echo "=== Build OK ==="
