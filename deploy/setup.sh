#!/bin/bash
# First-time server setup. Run once as root.
set -e

APP_DIR="/var/www/forked"
REPO_URL="YOUR_REPO_URL_HERE"

# Node.js 22 LTS via NodeSource
curl -fsSL https://deb.nodesource.com/setup_22.x | bash -
apt-get install -y nodejs

# PM2
npm install -g pm2

# Clone repo
mkdir -p /var/www
git clone "$REPO_URL" "$APP_DIR"
cd "$APP_DIR"

# Install dependencies
npm ci

# Copy and fill in env vars
cp .env.example .env.local
echo ""
echo ">>> Edit $APP_DIR/.env.local and fill in all values, then run deploy/deploy.sh"
