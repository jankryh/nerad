# 🐳 Deployment Guide - Jízdní řád z a do Řeže

## Container Image

**🎯 Image je dostupný na Quay.io:**
- **Repository**: `quay.io/rh-ee-jkryhut/nerad`
- **Latest**: `quay.io/rh-ee-jkryhut/nerad:latest` (v2.0.0 - responzivní design)
- **Current**: `quay.io/rh-ee-jkryhut/nerad:v2.0.0` (čistý design, mobilní optimalizace)
- **Previous**: `quay.io/rh-ee-jkryhut/nerad:v1.1.0` (opravené deprecated závislosti)
- **Legacy**: `quay.io/rh-ee-jkryhut/nerad:v1.0.0` (původní verze)

## 🚀 Spuštění s Podman

### Jednoduché spuštění:
```bash
podman run -d -p 8080:80 --name rez-jizdni-rad quay.io/rh-ee-jkryhut/nerad:latest
```

### S docker-compose:
```bash
podman-compose up -d
```

## 🐳 Práce s Dockerem

### Instalace Dockeru

#### macOS:
```bash
# Pomocí Homebrew
brew install --cask docker

# Nebo stáhnout Docker Desktop z oficiálních stránek
# https://www.docker.com/products/docker-desktop
```

#### Linux (Ubuntu/Debian):
```bash
# Aktualizace balíčků
sudo apt update

# Instalace Docker
sudo apt install docker.io docker-compose

# Spuštění Docker služby
sudo systemctl start docker
sudo systemctl enable docker

# Přidání uživatele do docker skupiny
sudo usermod -aG docker $USER
```

#### Windows:
- Stáhnout Docker Desktop z: https://www.docker.com/products/docker-desktop
- Nainstalovat a restartovat systém

### Docker příkazy

#### Build image:
```bash
# Build s tagem
docker build -t rez-jizdni-rad:latest .

# Build s konkrétní verzí
docker build -t rez-jizdni-rad:v1.0.0 .

# Build s no-cache (pro vynucení nového buildu)
docker build --no-cache -t rez-jizdni-rad:latest .
```

#### Spuštění kontejneru:
```bash
# Základní spuštění na portu 8080
docker run -d -p 8080:80 --name rez-jizdni-rad rez-jizdni-rad:latest

# Spuštění s restart policy
docker run -d -p 8080:80 --restart unless-stopped --name rez-jizdni-rad rez-jizdni-rad:latest

# Spuštění s environment proměnnými
docker run -d -p 8080:80 -e NODE_ENV=production --name rez-jizdni-rad rez-jizdni-rad:latest

# Spuštění s volume mount (pro development)
docker run -d -p 8080:80 -v $(pwd)/src:/app/src --name rez-jizdni-rad rez-jizdni-rad:latest
```

#### Správa kontejnerů:
```bash
# Zastavení kontejneru
docker stop rez-jizdni-rad

# Spuštění existujícího kontejneru
docker start rez-jizdni-rad

# Restart kontejneru
docker restart rez-jizdni-rad

# Odstranění kontejneru
docker rm rez-jizdni-rad

# Zobrazení logů
docker logs rez-jizdni-rad

# Zobrazení logů v reálném čase
docker logs -f rez-jizdni-rad

# Zobrazení informací o kontejneru
docker inspect rez-jizdni-rad
```

#### Informace a monitoring:
```bash
# Zobrazení běžících kontejnerů
docker ps

# Zobrazení všech kontejnerů (včetně zastavených)
docker ps -a

# Zobrazení všech imagů
docker images

# Zobrazení využití disku
docker system df

# Vyčištění nepoužívaných objektů
docker system prune
```

### Docker Compose

#### Vytvoření docker-compose.yml:
```yaml
version: '3.8'
services:
  rez-jizdni-rad:
    image: rez-jizdni-rad:latest
    container_name: rez-jizdni-rad
    ports:
      - "8080:80"
    restart: unless-stopped
    environment:
      - NODE_ENV=production
    volumes:
      - ./logs:/var/log/nginx
```

#### Spuštění s Docker Compose:
```bash
# Spuštění na pozadí
docker-compose up -d

# Zobrazení logů
docker-compose logs -f

# Zastavení
docker-compose down

# Restart
docker-compose restart
```

### Kompletní workflow s Dockerem

```bash
# 1. Build image
docker build -t rez-jizdni-rad:latest .

# 2. Spuštění kontejneru
docker run -d -p 8080:80 --restart unless-stopped --name rez-jizdni-rad rez-jizdni-rad:latest

# 3. Ověření, že běží
docker ps

# 4. Test aplikace
curl http://localhost:8080
# nebo otevřete v prohlížeči: http://localhost:8080

# 5. Zobrazení logů
docker logs rez-jizdni-rad

# 6. Zastavení a úklid
docker stop rez-jizdni-rad
docker rm rez-jizdni-rad
```

### Troubleshooting

#### Časté problémy:
```bash
# Port je již obsazen
docker run -d -p 8081:80 --name rez-jizdni-rad rez-jizdni-rad:latest

# Kontejner se nespouští
docker logs rez-jizdni-rad

# Problém s právy (Linux)
sudo docker run -d -p 8080:80 --name rez-jizdni-rad rez-jizdni-rad:latest

# Vyčištění všech kontejnerů
docker stop $(docker ps -aq)
docker rm $(docker ps -aq)
```

#### Debugging:
```bash
# Spuštění v interaktivním módu
docker run -it --rm rez-jizdni-rad:latest /bin/sh

# Zobrazení procesů v kontejneru
docker exec -it rez-jizdni-rad ps aux

# Přístup do běžícího kontejneru
docker exec -it rez-jizdni-rad /bin/sh
```

## 🌐 Přístup k aplikaci

Po spuštění bude aplikace dostupná na:
- **URL**: `http://localhost:8080`
- **Port**: 8080 (mapovaný na container port 80)

## 🔧 Container Details

### Technické specifikace:
- **Base Image**: `docker.io/library/nginx:alpine`
- **Build Image**: `docker.io/library/node:20-alpine`
- **Port**: 80 (HTTP)
- **Size**: ~187 kB (gzipped: ~63 kB)
- **Runtime**: Nginx server

### Build informace:
- **Multi-stage build** s Node.js 20 Alpine
- **NPM**: Nejnovější verze (11.5.2+)
- **Produkční build** s Vite
- **Optimalizované** pro production
- **Linux kompatibilní** - plné registry názvy

### Linux deployment:
Pro Linux systémy použijte plné registry názvy v Dockerfile:
```dockerfile
FROM docker.io/library/node:20-alpine AS builder
FROM docker.io/library/nginx:alpine
```

## 🛠️ Správa containeru

### Zastavení:
```bash
podman stop rez-jizdni-rad
```

### Restart:
```bash
podman restart rez-jizdni-rad
```

### Smazání:
```bash
podman rm rez-jizdni-rad
```

### Logy:
```bash
podman logs rez-jizdni-rad
```

## 🔄 Update na novou verzi

```bash
# Stáhnout novou verzi
podman pull quay.io/rh-ee-jkryhut/nerad:latest

# Zastavit a smazat starý container
podman stop rez-jizdni-rad
podman rm rez-jizdni-rad

# Spustit nový container
podman run -d -p 8080:80 --name rez-jizdni-rad quay.io/rh-ee-jkryhut/nerad:latest
```

## 📊 Monitoring

### Health check:
```bash
curl http://localhost:8080/
```

### Container status:
```bash
podman ps | grep rez-jizdni-rad
```
