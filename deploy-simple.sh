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

# Build — API klíč se NIKDY nepředává jako build-arg (leakne do JS bundlu)
echo "🏗️ Build bez API klíče v bundlu (klíč = runtime env pro nginx)"
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

# Runtime — PID_API_KEY pro nginx proxy
API_KEY="${PID_API_KEY:-$(grep PID_API_KEY .env 2>/dev/null | grep -v VITE_ | cut -d'=' -f2 || echo '')}"
docker run -d \
  --name rez-jizdni-rad \
  -p 8080:80 \
  --restart unless-stopped \
  -e PID_API_KEY="$API_KEY" \
  quay.io/rh-ee-jkryhut/nerad:latest

echo "✅ Deployment dokončen!"
echo "🌐 Aplikace je dostupná na: http://localhost:8080"
