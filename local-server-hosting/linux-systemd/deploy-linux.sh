#!/usr/bin/env bash
set -euo pipefail

echo "========================================================"
echo "  CampusOS Linux Local Server 1-Step Deployer"
echo "========================================================"

APP_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"

echo "==> [1/4] Installing dependencies..."
cd "$APP_ROOT/product/server"
npm ci
cd "$APP_ROOT/product/client"
npm ci

echo "==> [2/4] Initializing Database & Prisma..."
cd "$APP_ROOT/product/server"
npx prisma generate
npx prisma db push --accept-data-loss
npm run seed || true

echo "==> [3/4] Compiling Production Artifacts..."
npm run build
cd "$APP_ROOT/product/client"
npm run build

echo "==> [4/4] Starting PM2 background processes..."
cd "$APP_ROOT/local-server-hosting"
if command -v pm2 &> /dev/null; then
    pm2 start windows-native/ecosystem.config.cjs
    pm2 save
    echo "PM2 started successfully."
else
    echo "PM2 not found. Run 'npm install -g pm2' or use systemd service."
fi

echo "========================================================"
echo "  Deployment Complete! Access http://$(hostname -I | awk '{print $1}'):5173"
echo "========================================================"
