# 🚆 Jízdní řád z a do Řeže

> Aktuální odjezdy vlaků S4 a autobusů 371 z a do Řeže pomocí PID API

📚 **Pro kompletní technickou dokumentaci viz [COMPREHENSIVE_DOCUMENTATION.md](COMPREHENSIVE_DOCUMENTATION.md)**

[![Docker](https://img.shields.io/badge/Docker-Ready-blue.svg)](https://hub.docker.com/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.2+-blue.svg)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React-18.2+-blue.svg)](https://reactjs.org/)
[![Vite](https://img.shields.io/badge/Vite-4.5+-green.svg)](https://vitejs.dev/)

## 📋 Obsah

- [🚀 Rychlý start](#-rychlý-start)
- [🔧 Instalace](#-instalace)
- [🔐 Nastavení API](#-nastavení-api)
- [🐳 Docker deployment](#-docker-deployment)
- [📱 Funkce](#-funkce)
- [🏗️ Architektura](#️-architektura)
- [🚀 Deployment](#-deployment)
- [🛡️ Bezpečnost](#️-bezpečnost)
- [🔍 Troubleshooting](#-troubleshooting)
- [📚 Dokumentace](#-dokumentace)

## 🚀 Rychlý start

### **1. Klonování repozitáře**
```bash
git clone https://github.com/jankryh/nerad.git
cd nerad
```

### **2. Nastavení API klíče**
```bash
# Vytvořit .env soubor s vaším API klíčem
cp .env.example .env
# Upravit .env a přidat skutečný API klíč
```

### **3. Spuštění aplikace**
```bash
# Instalace závislostí
npm install

# Development server
npm run dev

# Build pro production
npm run build
```

## 🔧 Instalace

### **Požadavky**
- **Node.js** 18+ 
- **npm** 9+
- **Git**

### **Závislosti**
```bash
npm install
```

### **Dostupné scripty**
```bash
npm run dev          # Development server
npm run build        # Production build
npm run preview      # Preview production build
npm run lint         # ESLint kontrola
```

## 🔐 Nastavení API

### **🚨 DŮLEŽITÉ: Bezpečnost API klíčů**

**API klíče se NIKDY nesmí commitovat do Git repozitáře!**

### **1. Získání API klíče**

#### **Registrace na Golemio.cz:**
1. **Jděte na**: https://api.golemio.cz/api-keys/auth/sign-up
2. **Klikněte na "Registrace"** nebo "Sign Up"
3. **Vyplňte formulář** s vašimi údaji:
   - Email adresa
   - Heslo
   - Jméno a příjmení
   - Organizace (volitelné)
4. **Potvrďte email** (ověřovací odkaz)
5. **Přihlaste se** do účtu

#### **Vytvoření aplikace:**
1. **V dashboardu** klikněte na "Nová aplikace"
2. **Vyplňte údaje** o aplikaci:
   - Název: např. "Jízdní řád Řež"
   - Popis: "Aplikace pro zobrazení odjezdů vlaků S4 a autobusů 371"
   - Kategorie: "Doprava" nebo "Veřejné služby"
3. **Potvrďte vytvoření**

#### **Získání API klíče:**
1. **V detailu aplikace** najděte sekci "API klíče"
2. **Vygenerujte nový klíč** (JWT token)
3. **Zkopírujte klíč** - bude vypadat jako: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`
4. **Uložte klíč** do `.env` souboru

#### **⚠️ Důležité poznámky:**
- **API klíč je citlivý** - nikdy ho nesdílejte
- **Klíč má platnost** - může vypršet
- **Rate limiting** - dodržujte limity API
- **Podmínky použití** - přečtěte si je před použitím

#### **Testování API klíče:**
```bash
# Ověřte, že API klíč funguje
curl -H "X-Access-Token: YOUR_API_KEY" \
     "https://api.golemio.cz/v2/pid/departureboards?ids[]=U2823Z301&limit=1"

# Měli byste dostat JSON odpověď s odjezdy
# Pokud dostanete 401/403, zkontrolujte API klíč
```

### **2. Lokální development**
Vytvořte `.env` soubor v root adresáři:
```bash
# .env
VITE_PID_API_KEY=your_actual_api_key_here
VITE_PID_API_BASE_URL=https://api.golemio.cz/v2
```

### **3. Production deployment**
```bash
# Docker
docker run -e VITE_PID_API_KEY=your_key ...

# Kubernetes
kubectl create secret generic pid-api-secret \
  --from-literal=VITE_PID_API_KEY=your_key
```

## 🐳 Docker deployment

### **Rychlé spuštění**
```bash
# Stáhnout a spustit
docker run -d -p 8080:80 --name rez-jizdni-rad \
  quay.io/rh-ee-jkryhut/nerad:latest
```

### **S environment proměnnými**
```bash
docker run -d \
  -p 8080:80 \
  -e VITE_PID_API_KEY=your_api_key \
  --name rez-jizdni-rad \
  quay.io/rh-ee-jkryhut/nerad:latest
```

### **Docker Compose**
```bash
# Spuštění
docker-compose up -d

# Zastavení
docker-compose down
```

## 📱 Funkce

### **🚆 Vlaky S4**
- **Řež → Praha Masarykovo** - odjezdy z Řeže
- **Praha Masarykovo → Řež** - odjezdy do Řeže
- **Čas jízdy**: ~18 minut
- **Frekvence**: každých 30 minut

### **🚌 Autobusy 371**
- **Řež → Praha Kobylisy** - odjezdy z Řeže
- **Praha Kobylisy → Řež** - odjezdy do Řeže
- **Čas jízdy**: ~28 minut
- **Frekvence**: každých 15-30 minut

### **✨ Další funkce**
- **Real-time aktualizace** každých 30 sekund
- **Zpoždění** a předpokládané časy
- **Responzivní design** pro mobilní zařízení
- **Automatické obnovování** dat

## 🏗️ Architektura

### **Frontend**
- **React 18** s TypeScript
- **Vite** build tool
- **CSS3** s moderním designem
- **Responzivní layout**

### **Backend API**
- **Golemio PID API v2**
- **REST API** pro odjezdy
- **JWT autentizace**
- **Rate limiting**

### **Deployment**
- **Multi-stage Docker build**
- **Nginx** web server
- **Alpine Linux** base image
- **Optimizované** pro production

## 🚀 Deployment

### **Automatické deployment scripty**

#### **Kompletní script (`deploy.sh`)**
```bash
# Všechny funkce včetně kontroly a ověření
./deploy.sh

# Deployment s konkrétním tagem
./deploy.sh -t v1.0.0

# Deployment na jiný port
./deploy.sh -p 9090

# Nápověda
./deploy.sh --help
```

#### **Zjednodušený script (`deploy-simple.sh`)**
```bash
# Rychlý deployment
./deploy-simple.sh
```

### **Manuální deployment**
```bash
# 1. Build image
docker build -t rez-jizdni-rad:latest .

# 2. Spuštění kontejneru
docker run -d -p 8080:80 --name rez-jizdni-rad \
  rez-jizdni-rad:latest

# 3. Ověření
curl http://localhost:8080
```

### **CI/CD pipeline**
```yaml
# GitHub Actions příklad
name: Deploy
on:
  push:
    branches: [main]
jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Deploy to server
        run: |
          chmod +x deploy.sh
          ./deploy.sh
```

## 🛡️ Bezpečnost

### **✅ Implementované opatření**
- **Environment proměnné** pro API klíče
- **`.env` soubory** v `.gitignore`
- **TypeScript** pro type safety
- **ESLint** pro code quality
- **Docker** pro izolaci

### **🔒 Bezpečnostní checklist**
- [x] **API klíče** nejsou v Git
- [x] **`.env` soubory** nejsou tracked
- [x] **Environment proměnné** správně nastaveny
- [x] **Docker image** bezpečný
- [x] **HTTPS** v production

### **🚨 Co NEDĚLAT**
- ❌ Commitovat `.env` soubory
- ❌ Hardcodovat API klíče
- ❌ Posílat API klíče přes email
- ❌ Ignorovat bezpečnostní varování

## 🔍 Troubleshooting

### **Časté problémy**

#### **API klíč se nenačítá**
```bash
# Zkontrolovat .env soubor
cat .env

# Restartovat development server
npm run dev

# Zkontrolovat environment proměnné
echo $VITE_PID_API_KEY
```

#### **Docker kontejner se nespouští**
```bash
# Zkontrolovat logy
docker logs rez-jizdni-rad

# Zkontrolovat Docker daemon
docker info

# Restartovat Docker
sudo systemctl restart docker
```

#### **Port je obsazen**
```bash
# Zkontrolovat co běží na portu 8080
sudo netstat -tuln | grep :8080

# Použít jiný port
./deploy.sh -p 9090
```

### **Logy a debugging**
```bash
# Docker logy
docker logs rez-jizdni-rad
docker logs -f rez-jizdni-rad

# Kontejner status
docker ps -a | grep rez-jizdni-rad

# Stav aplikace
curl -I http://localhost:8080
```

## 📚 Dokumentace

### **Kompletní dokumentace**
- **`COMPREHENSIVE_DOCUMENTATION.md`** - kompletní technická dokumentace
- **`README.md`** - tento soubor (základní přehled)
- **`AGENTS.md`** - přehled pravidel pro přispěvatele
- **`UBUNTU_DEPLOYMENT.md`** - Ubuntu deployment instrukce

### **Užitečné odkazy**
- [Golemio API](https://api.golemio.cz/)
- [PID (Pražská integrovaná doprava)](https://pid.cz/)
- [React dokumentace](https://reactjs.org/)
- [Vite dokumentace](https://vitejs.dev/)
- [Docker dokumentace](https://docs.docker.com/)

## 🤝 Přispívání

### **Jak přispět**
1. **Fork** repozitáře
2. **Vytvořte feature branch** (`git checkout -b feature/amazing-feature`)
3. **Commitněte změny** (`git commit -m 'Add amazing feature'`)
4. **Pushněte branch** (`git push origin feature/amazing-feature`)
5. **Otevřete Pull Request**

### **Bezpečnostní reporty**
Pokud najdete bezpečnostní problém:
- **NEOTEVÍREJTE** veřejný issue
- **Kontaktujte** maintainera soukromě
- **Popište** problém detailně

## 📄 Licence

Tento projekt je licencován pod **MIT License** - viz [LICENSE](LICENSE) soubor pro detaily.

## 👥 Autoři

- **Jan Kryhut** - hlavní vývojář
- **AI Assistant** - dokumentace a deployment scripty

## 🙏 Poděkování

- **Golemio** za poskytnutí PID API
- **PID** za data o veřejné dopravě
- **React a Vite** komunita za skvělé nástroje

---

**Poslední aktualizace**: 2025-09-03  
**Verze**: 2.0.0  
**Status**: ✅ Produkční ready

> 🚆 **Užijte si jízdu vlakem S4 a autobusem 371!**
