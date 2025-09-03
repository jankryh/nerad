#!/bin/bash

# 🚀 Jednoduchý Deployment Script
# Git pull → Docker build → Docker push → Docker run

set -e

echo "🚀 Spouštím deployment..."

# 1. Git pull
echo "📥 Git pull..."
git pull origin main

# 2. Docker build
echo "🏗️ Docker build..."
docker build -t quay.io/rh-ee-jkryhut/nerad:latest .

# 3. Docker push
echo "📤 Docker push..."
docker push quay.io/rh-ee-jkryhut/nerad:latest

# 4. Zastavení starého kontejneru
echo "🛑 Zastavuji starý kontejner..."
docker stop rez-jizdni-rad 2>/dev/null || true
docker rm rez-jizdni-rad 2>/dev/null || true

# 5. Spuštění nového kontejneru
echo "🚀 Spouštím nový kontejner..."

# Načtení API klíče z .env souboru
if [ -f .env ] && grep -q VITE_PID_API_KEY .env; then
  API_KEY=$(grep VITE_PID_API_KEY .env | cut -d'=' -f2)
  echo "🔑 API klíč nalezen, spouštím s environment proměnnými"
  docker run -d \
    --name rez-jizdni-rad \
    -p 8080:80 \
    --restart unless-stopped \
    -e VITE_PID_API_KEY="$API_KEY" \
    quay.io/rh-ee-jkryhut/nerad:latest
else
  echo "⚠️  API klíč nenalezen, spouštím bez environment proměnných"
  docker run -d \
    --name rez-jizdni-rad \
    -p 8080:80 \
    --restart unless-stopped \
    quay.io/rh-ee-jkryhut/nerad:latest
fi

echo "✅ Deployment dokončen!"
echo "🌐 Aplikace je dostupná na: http://localhost:8080"
