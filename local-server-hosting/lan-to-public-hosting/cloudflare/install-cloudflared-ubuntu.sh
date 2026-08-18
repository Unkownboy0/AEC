#!/usr/bin/env bash
# ==============================================================================
# Cloudflare Tunnel (cloudflared) Automated Installer for Ubuntu/Debian
# ==============================================================================
set -euo pipefail

if [ "$EUID" -ne 0 ]; then
  echo "❌ Please run with sudo: sudo bash $0"
  exit 1
fi

echo "================================================================="
echo "  ☁️ Installing Cloudflare Tunnel (cloudflared) on Ubuntu"
echo "================================================================="

# Add Cloudflare GPG key and repository
mkdir -p --mode=0755 /usr/share/keyrings
curl -fsSL https://pkg.cloudflare.com/cloudflare-main.gpg | tee /usr/share/keyrings/cloudflare-main.gpg >/dev/null

UBUNTU_CODENAME=$(lsb_release -cs 2>/dev/null || echo "jammy")
echo "deb [signed-by=/usr/share/keyrings/cloudflare-main.gpg] https://pkg.cloudflare.com/cloudflared ${UBUNTU_CODENAME} main" | tee /etc/apt/sources.list.d/cloudflared.list

apt-get update -y
apt-get install -y cloudflared

echo ""
echo "✅ cloudflared version $(cloudflared --version) installed successfully!"
echo ""
echo "Next Steps to activate public access:"
echo "  1. Authenticate with your Cloudflare domain:"
echo "     cloudflared tunnel login"
echo ""
echo "  2. Create your tunnel:"
echo "     cloudflared tunnel create campusos-production"
echo ""
echo "  3. Copy config template to /etc/cloudflared/config.yml and route DNS:"
echo "     sudo cp $(dirname "$0")/config.example.yml /etc/cloudflared/config.yml"
echo "     cloudflared tunnel route dns campusos-production api.yourinstitution.edu"
echo "     cloudflared tunnel route dns campusos-production campusos.yourinstitution.edu"
echo ""
echo "  4. Start cloudflared background service:"
echo "     sudo cloudflared service install"
echo "     sudo systemctl enable --now cloudflared"
echo "================================================================="
