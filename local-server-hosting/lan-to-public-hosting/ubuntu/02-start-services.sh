#!/usr/bin/env bash
# ==============================================================================
# Start / Restart all CampusOS and Cloudflare background services on Ubuntu
# ==============================================================================
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
APP_ROOT="$(cd "$SCRIPT_DIR/../../.." && pwd)"

echo "================================================================="
echo "  🚀 Starting CampusOS Services & Cloudflare Tunnel"
echo "================================================================="

# Start PostgreSQL if not running
sudo systemctl start postgresql

# Start PM2 services
cd "$APP_ROOT/local-server-hosting"
pm2 startOrReload ecosystem.config.cjs --update-env
pm2 save

# Start Cloudflared if installed as service
if systemctl is-enabled cloudflared &>/dev/null; then
    sudo systemctl restart cloudflared
    echo "✅ Cloudflare Tunnel service running."
fi

echo ""
echo "📊 Current Status:"
pm2 status
echo "================================================================="
