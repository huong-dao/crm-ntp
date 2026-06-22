#!/bin/bash
# Setup DB trên DirectAdmin — chạy trong APPLICATION ROOT (thư mục có package.json + prisma/)
set -e

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

echo "=== App root: $ROOT ==="

if [ ! -f prisma/schema.prisma ]; then
  echo "ERROR: Không thấy prisma/schema.prisma trong $ROOT"
  echo "→ Git clone / git pull vào ĐÚNG thư mục Application root trên panel."
  exit 1
fi

export NODE_OPTIONS="${NODE_OPTIONS:---max-old-space-size=4096}"

echo "=== npm install ==="
npm install

echo "=== prisma generate ==="
npx prisma generate

echo "=== migrate ==="
npx prisma migrate deploy

echo "=== seed ==="
npx prisma db seed

echo "=== build ==="
npm run build

echo "=== Hoàn tất — Restart app trên DirectAdmin ==="
