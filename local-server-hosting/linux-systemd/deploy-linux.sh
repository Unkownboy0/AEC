#!/usr/bin/env bash
# ==============================================================================
# CampusOS — Ubuntu/Debian 1-Step Production Deployer
# ==============================================================================
set -euo pipefail

echo "================================================================="
echo "  🚀 CampusOS Linux (Ubuntu/Debian) Production Deployer"
echo "================================================================="

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
APP_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"

echo "📂 Application Root: $APP_ROOT"

# 1. Check/Prepare Environment File
ENV_FILE="$APP_ROOT/product/server/.env"
EXAMPLE_ENV="$APP_ROOT/local-server-hosting/.env.local-server.example"

if [ ! -f "$ENV_FILE" ]; then
    if [ -f "$EXAMPLE_ENV" ]; then
        echo "⚠️  product/server/.env not found! Copying from .env.local-server.example..."
        cp "$EXAMPLE_ENV" "$ENV_FILE"
    else
        echo "⚠️  product/server/.env not found! Generating default production .env..."
        cat << 'EOF' > "$ENV_FILE"
# ======================================================================
#   CampusOS Local Server Environment Configuration
# ======================================================================
NODE_ENV=production
PORT=5000
DATABASE_URL="postgresql://campusos:campusos_secure_password@127.0.0.1:5432/campusos?schema=public"
JWT_SECRET="campusos_production_secret_must_be_32_characters_long_random_key_123"
JWT_EXPIRES_IN=15m
REFRESH_TOKEN_EXPIRES_IN=7d
REMEMBER_ME_REFRESH_TOKEN_EXPIRES_IN=30d
PASSWORD_RESET_TOKEN_MINUTES=15
ALLOWED_ORIGINS="*"
PUBLIC_APP_URL="http://localhost:5173"
LOG_LEVEL=info
STORAGE_ROOT="./uploads"
BACKUP_ROOT="./backups"
PG_DUMP_PATH=pg_dump
TRUST_PROXY=1
PAYMENT_GATEWAY=DISABLED
CAMPUS_TENANT_ID=campusos-default
EMAIL_PROVIDER=DISABLED
EOF
    fi
    echo "ℹ️  Created $ENV_FILE. Please verify DATABASE_URL and secrets if needed."
fi

# Ensure storage and logs directories exist
mkdir -p "$APP_ROOT/product/server/uploads"
mkdir -p "$APP_ROOT/product/server/backups"
mkdir -p "$APP_ROOT/product/server/logs"

# 2. Install Server Dependencies
echo ""
echo "==> [1/4] Installing backend and frontend npm dependencies..."
cd "$APP_ROOT/product/server"
npm ci --prefer-offline || npm install

cd "$APP_ROOT/product/client"
npm ci --prefer-offline || npm install

# 3. Database Sync & Seed
echo ""
echo "==> [2/4] Initializing Prisma & Database Schema..."
cd "$APP_ROOT/product/server"
npx prisma generate
npx prisma db push --accept-data-loss
echo "==> Seeding initial accounts..."
npm run seed || echo "Seed skipped or already populated."

# 4. Build Production Artifacts
echo ""
echo "==> [3/4] Compiling Production Artifacts (TypeScript & Vite)..."
cd "$APP_ROOT/product/server"
npm run build

cd "$APP_ROOT/product/client"
if ! npm run build; then
    echo "⚠️ Client build failed due to environment/GLIBC native bindings. Cleaning cache and installing compatible Rollup engine..."
    rm -rf node_modules package-lock.json
    npm install --no-audit
    npm run build
fi

# 5. Process Manager Launch (PM2)
echo ""
echo "==> [4/4] Starting / Reloading Services..."
cd "$APP_ROOT/local-server-hosting"
if command -v pm2 &> /dev/null; then
    pm2 startOrReload ecosystem.config.cjs --update-env
    pm2 save
    echo "✅ PM2 production processes running."
else
    echo "⚠️ PM2 not found globally. Installing PM2 or run manually:"
    echo "   sudo npm install -g pm2"
    echo "   pm2 start $APP_ROOT/local-server-hosting/ecosystem.config.cjs"
fi

# Determine server IP
HOST_IP=$(hostname -I 2>/dev/null | awk '{print $1}' || echo "127.0.0.1")

echo ""
echo "================================================================="
echo "  🎉 CampusOS Deployment Completed Successfully!"
echo "================================================================="
echo "  🌐 Local Browser Access:   http://localhost:5173"
echo "  🌐 LAN / Wi-Fi Access:     http://${HOST_IP}:5173"
echo "  📱 Mobile Android API:     http://${HOST_IP}:5000/api"
echo "  📊 Process Status:         pm2 status"
echo "  📜 Live Logs:              pm2 logs"
echo "================================================================="
