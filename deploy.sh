#!/bin/bash
set -e

REGISTRY="novikov551"
TAG="${1:-latest}"

echo "=== Сборка образов ==="
docker build -t $REGISTRY/together-backend:$TAG ./backend
docker build -t $REGISTRY/together-frontend:$TAG ./frontend

echo "=== Пуш в Docker Hub ==="
docker push $REGISTRY/together-backend:$TAG
docker push $REGISTRY/together-frontend:$TAG

echo "=== Готово! ==="
echo "На сервере выполни:"
echo "  cd /opt/together && docker compose pull && docker compose up -d"
