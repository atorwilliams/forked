#!/bin/bash
# Run on the server after git pull, or as your full deploy step.
set -e

APP_DIR="/var/www/forked"

if [ -z "$DATABASE_URL" ] && [ ! -f "$APP_DIR/.env.local" ]; then
  echo "ERROR: DATABASE_URL is not set and .env.local not found. Aborting."
  exit 1
fi

cd "$APP_DIR"
# Load .env.local so DATABASE_URL is available for prisma migrate deploy
set -a; [ -f .env.local ] && source .env.local; set +a

echo ">>> Pulling latest..."
git pull origin main

echo ">>> Installing dependencies..."
npm ci

echo ">>> Running database migrations..."
npx prisma migrate deploy

echo ">>> Building..."
npm run build

echo ">>> Restarting app..."
# Start with PM2 on first deploy; restart on subsequent deploys
if pm2 list | grep -q "forked"; then
  pm2 restart forked
else
  pm2 start ecosystem.config.js
  pm2 save
  pm2 startup  # prints a command to run so PM2 survives reboots
fi

echo ">>> Done."
