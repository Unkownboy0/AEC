#!/usr/bin/env bash
# ==============================================================================
# CampusOS — Complete Ubuntu OS Setup & Provisioning Script
# Supported: Ubuntu 20.04 / 22.04 / 24.04 LTS
# Run as: sudo bash ubuntu-setup.sh
# ==============================================================================
set -euo pipefail

if [ "$EUID" -ne 0 ]; then
  echo "❌ Please run as root or with sudo: sudo bash $0"
  exit 1
fi

echo "================================================================="
echo "  🚀 CampusOS Complete Ubuntu Provisioning & Setup"
echo "================================================================="

TARGET_USER="${SUDO_USER:-$USER}"
TARGET_HOME=$(getent passwd "$TARGET_USER" | cut -d: -f6)
INSTALL_DIR="/opt/campusos"

echo "==> [1/7] Updating apt repositories and installing core packages..."
apt-get update -y
apt-get install -y curl wget git build-essential ufw nginx postgresql postgresql-contrib

# Install Node.js 20 LTS via NodeSource
if ! command -v node &> /dev/null; then
    echo "==> [2/7] Installing Node.js 20 LTS..."
    curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
    apt-get install -y nodejs
fi
echo "Node.js version: $(node -v)"
echo "npm version:     $(npm -v)"

# Install PM2 globally
echo "==> [3/7] Installing PM2 process manager..."
npm install -g pm2

# Setup PostgreSQL User and Database
echo "==> [4/7] Configuring PostgreSQL Database..."
systemctl enable --now postgresql

DB_NAME="campusos"
DB_USER="campusos"
DB_PASS="campusos_secure_password"

sudo -u postgres psql -tc "SELECT 1 FROM pg_user WHERE usename = '$DB_USER'" | grep -q 1 || \
sudo -u postgres psql -c "CREATE USER $DB_USER WITH PASSWORD '$DB_PASS';"

sudo -u postgres psql -tc "SELECT 1 FROM pg_database WHERE datname = '$DB_NAME'" | grep -q 1 || \
sudo -u postgres psql -c "CREATE DATABASE $DB_NAME OWNER $DB_USER;"

sudo -u postgres psql -c "GRANT ALL PRIVILEGES ON DATABASE $DB_NAME TO $DB_USER;"

echo "✅ PostgreSQL user '$DB_USER' and database '$DB_NAME' verified."

# Configure Firewall (UFW)
echo "==> [5/7] Configuring Firewall (UFW) rules..."
ufw allow OpenSSH
ufw allow 80/tcp
ufw allow 443/tcp
ufw allow 5000/tcp
ufw allow 5173/tcp
# Enable ufw if not already active
if ! ufw status | grep -q "Status: active"; then
    echo "y" | ufw enable || true
fi
echo "✅ Firewall rules configured."

# If script is run inside the cloned repository, symlink or copy to /opt/campusos if requested
CURRENT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
echo "Current project location: $CURRENT_DIR"

# Permissions
chown -R "$TARGET_USER:$TARGET_USER" "$CURRENT_DIR"

echo "==> [6/7] Running deployment script as user: $TARGET_USER..."
sudo -u "$TARGET_USER" bash "$CURRENT_DIR/local-server-hosting/linux-systemd/deploy-linux.sh"

# Setup PM2 startup on system boot
echo "==> [7/7] Setting up PM2 auto-startup on server boot..."
env PATH=$PATH:/usr/bin pm2 startup systemd -u "$TARGET_USER" --hp "$TARGET_HOME" || true
sudo -u "$TARGET_USER" pm2 save

echo ""
echo "================================================================="
echo "  🎉 UBUNTU SERVER SETUP COMPLETE!"
echo "================================================================="
echo "  CampusOS is now fully installed and running as a background service."
echo "  Management commands:"
echo "    - Check status: pm2 status"
echo "    - View logs:    pm2 logs"
echo "    - Restart all:  pm2 restart all"
echo "================================================================="
