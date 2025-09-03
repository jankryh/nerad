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
