#!/usr/bin/env bash
# ==============================================================================
# CampusOS — Complete Ubuntu LAN-to-Public Server Setup & Deployment
# ==============================================================================
set -euo pipefail

if [ "$EUID" -ne 0 ]; then
  echo "❌ Please run with sudo: sudo bash $0"
  exit 1
fi

echo "================================================================="
echo "  🚀 CampusOS Ubuntu LAN-to-Public Hosting Setup"
echo "================================================================="

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
APP_ROOT="$(cd "$SCRIPT_DIR/../../.." && pwd)"
TARGET_USER="${SUDO_USER:-$USER}"

echo "📂 Project Directory: $APP_ROOT"
echo "👤 Service User:     $TARGET_USER"

# 1. Update and install dependencies
echo ""
echo "==> [1/6] Installing Ubuntu system dependencies..."
apt-get update -y
apt-get install -y curl wget git build-essential ufw postgresql postgresql-contrib

# Node.js 20 LTS
if ! command -v node &> /dev/null; then
    echo "==> Installing Node.js 20 LTS..."
    curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
    apt-get install -y nodejs
fi

# PM2
npm install -g pm2

# 2. Database setup
echo ""
echo "==> [2/6] Configuring PostgreSQL database..."
systemctl enable --now postgresql

DB_NAME="campusos"
DB_USER="campusos"
DB_PASS="campusos_secure_password"

sudo -u postgres psql -tc "SELECT 1 FROM pg_user WHERE usename = '$DB_USER'" | grep -q 1 || \
sudo -u postgres psql -c "CREATE USER $DB_USER WITH PASSWORD '$DB_PASS';"

sudo -u postgres psql -tc "SELECT 1 FROM pg_database WHERE datname = '$DB_NAME'" | grep -q 1 || \
sudo -u postgres psql -c "CREATE DATABASE $DB_NAME OWNER $DB_USER;"

sudo -u postgres psql -c "GRANT ALL PRIVILEGES ON DATABASE $DB_NAME TO $DB_USER;"

# 3. Environment & Directories
echo ""
echo "==> [3/6] Setting up environment and folders..."
ENV_FILE="$APP_ROOT/product/server/.env"
if [ ! -f "$ENV_FILE" ]; then
    cat << 'EOF' > "$ENV_FILE"
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

mkdir -p "$APP_ROOT/product/server/uploads"
mkdir -p "$APP_ROOT/product/server/backups"
mkdir -p "$APP_ROOT/product/server/logs"

# 4. Install dependencies and build
echo ""
echo "==> [4/6] Installing npm dependencies and building production artifacts..."
cd "$APP_ROOT/product/server"
npm ci --prefer-offline || npm install
npx prisma generate
npx prisma db push --accept-data-loss
npm run seed || true
npm run build

cd "$APP_ROOT/product/client"
if ! npm ci --prefer-offline 2>/dev/null; then
    npm install --no-audit
fi

if ! npm run build; then
    rm -rf node_modules package-lock.json
    npm install --no-audit
    npm run build
fi

# 5. Install Cloudflare Tunnel agent
echo ""
echo "==> [5/6] Checking Cloudflare Tunnel (cloudflared)..."
if ! command -v cloudflared &> /dev/null; then
    bash "$SCRIPT_DIR/../cloudflare/install-cloudflared-ubuntu.sh"
else
    echo "✅ cloudflared is already installed."
fi

# 6. Start PM2 background processes
echo ""
echo "==> [6/6] Launching PM2 production processes..."
chown -R "$TARGET_USER:$TARGET_USER" "$APP_ROOT"
cd "$APP_ROOT/local-server-hosting"
sudo -u "$TARGET_USER" pm2 startOrReload ecosystem.config.cjs --update-env
sudo -u "$TARGET_USER" pm2 save

# Prevent OS sleep
bash "$SCRIPT_DIR/prevent-sleep.sh"

echo ""
echo "================================================================="
echo "  🎉 CampusOS LAN Server is Ready for Public Exposure!"
echo "================================================================="
echo "  Internal Server Status:"
echo "    - Backend API: http://127.0.0.1:5000"
echo "    - Web Client:  http://127.0.0.1:5173"
echo ""
echo "  To make publicly accessible:"
echo "    1. Run: cloudflared tunnel login"
echo "    2. Run: cloudflared tunnel create campusos-production"
echo "    3. Follow: local-server-hosting/lan-to-public-hosting/PUBLIC_LAN_HOSTING_GUIDE.md"
echo "================================================================="
