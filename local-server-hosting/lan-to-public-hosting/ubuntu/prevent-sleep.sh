#!/usr/bin/env bash
# ==============================================================================
# Prevent Ubuntu Desktop / Server from entering Sleep or Suspend Mode
# ==============================================================================
set -euo pipefail

if [ "$EUID" -ne 0 ]; then
  echo "❌ Please run with sudo: sudo bash $0"
  exit 1
fi

echo "================================================================="
echo "  ⚡ Configuring Ubuntu 24/7 Continuous Server Power Profile"
echo "================================================================="

# Mask sleep and suspend targets in systemd
systemctl mask sleep.target suspend.target hibernate.target hybrid-sleep.target

# Set GNOME desktop sleep settings if running on desktop environment
if command -v gsettings &>/dev/null; then
    gsettings set org.gnome.settings-daemon.plugins.power sleep-inactive-ac-type 'nothing' || true
    gsettings set org.gnome.settings-daemon.plugins.power sleep-inactive-ac-timeout 0 || true
fi

echo "✅ System sleep, suspend, and hibernation have been disabled."
echo "   The server will now remain online continuously 24/7."
echo "================================================================="
