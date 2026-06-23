#!/usr/bin/env bash
set -euo pipefail

cd "$(dirname "$0")"

echo "==> Pulling latest code..."
git pull

echo "==> Building and restarting containers..."
docker compose --env-file .env up -d --build

echo "==> Pruning old images..."
docker image prune -f

echo "==> Waiting for health check..."
sleep 10
if curl -sf http://localhost:3000/api/health > /dev/null; then
  echo "    App is healthy at http://localhost:3000"
else
  echo "    WARNING: health check failed. Check logs:"
  echo "    docker compose logs --tail=50 server"
  exit 1
fi
