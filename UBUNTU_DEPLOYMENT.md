# 🐧 Deployment na Ubuntu Linux

## 🚨 Problém s environment proměnnými

Na Ubuntu Linuxu se `.env` soubory nemusí načítat stejně jako na macOS. Toto je způsobeno tím, jak Vite zpracovává environment proměnné.

## 🔍 Diagnostika problému

### **Kontrola .env souboru:**
```bash
# Zkontrolujte, zda .env existuje
ls -la .env

# Zkontrolujte obsah
cat .env

# Zkontrolujte práva
ls -la .env
```

### **Kontrola environment proměnných:**
```bash
# Zkontrolujte, zda se načítají
echo $VITE_PID_API_KEY

# Zkontrolujte všechny VITE_ proměnné
env | grep VITE
```

## 🛠️ Řešení

### **Řešení 1: Build s environment proměnnými (Doporučeno)**

```bash
# 1. Nastavte environment proměnné
export VITE_PID_API_KEY="your_api_key_here"
export VITE_PID_API_BASE_URL="https://api.golemio.cz/v2"

# 2. Ověřte nastavení
echo "API Key: $VITE_PID_API_KEY"
echo "Base URL: $VITE_PID_API_BASE_URL"

# 3. Udělejte build
npm run build

# 4. Spusťte preview
npm run preview
```

### **Řešení 2: Použití .env.local**

```bash
# Vytvořte .env.local (má vyšší prioritu)
cp .env .env.local

# Nebo přímo
echo "VITE_PID_API_KEY=your_api_key_here" > .env.local
echo "VITE_PID_API_BASE_URL=https://api.golemio.cz/v2" >> .env.local

# Build
npm run build
```

### **Řešení 3: Docker build s build args**

```bash
# Build s environment proměnnými
docker build \
  --build-arg VITE_PID_API_KEY="your_api_key_here" \
  --build-arg VITE_PID_API_BASE_URL="https://api.golemio.cz/v2" \
  -t rez-jizdni-rad:latest .
```

### **Řešení 4: Použití deployment scriptů**

```bash
# Ujistěte se, že máte .env soubor
ls -la .env

# Spusťte deployment script
./deploy.sh

# Nebo zjednodušený
./deploy-simple.sh
```

## 🔧 Ubuntu specifické úpravy

### **1. Práva k souborům:**
```bash
# Nastavte správná práva
chmod 600 .env
chown $USER:$USER .env

# Zkontrolujte práva
ls -la .env
```

### **2. Shell konfigurace:**
```bash
# Přidejte do ~/.bashrc nebo ~/.zshrc
echo 'export VITE_PID_API_KEY="your_api_key_here"' >> ~/.bashrc
echo 'export VITE_PID_API_BASE_URL="https://api.golemio.cz/v2"' >> ~/.bashrc

# Reload shell
source ~/.bashrc
```

### **3. Systemd environment (pro služby):**
```bash
# Vytvořte /etc/systemd/system/rez-jizdni-rad.service
sudo nano /etc/systemd/system/rez-jizdni-rad.service

# Přidejte environment proměnné
[Service]
Environment=VITE_PID_API_KEY=your_api_key_here
Environment=VITE_PID_API_BASE_URL=https://api.golemio.cz/v2
```

## 🧪 Testování

### **1. Test environment proměnných:**
```bash
# Vytvořte test script
cat > test-env.sh << 'EOF'
#!/bin/bash
echo "🔍 Test environment proměnných:"
echo "VITE_PID_API_KEY: ${VITE_PID_API_KEY:-'NENASTAVENO'}"
echo "VITE_PID_API_BASE_URL: ${VITE_PID_API_BASE_URL:-'NENASTAVENO'}"

if [ -f .env ]; then
  echo "✅ .env soubor existuje"
  echo "📋 Obsah .env:"
  cat .env
else
  echo "❌ .env soubor neexistuje"
fi
EOF

chmod +x test-env.sh
./test-env.sh
```

### **2. Test build procesu:**
```bash
# Test build s environment proměnnými
export VITE_PID_API_KEY="test_key"
export VITE_PID_API_BASE_URL="https://api.golemio.cz/v2"

echo "🏗️ Test build..."
npm run build

# Zkontrolujte build output
ls -la dist/
```

### **3. Test Docker build:**
```bash
# Test Docker build s build args
docker build \
  --build-arg VITE_PID_API_KEY="test_key" \
  --build-arg VITE_PID_API_BASE_URL="https://api.golemio.cz/v2" \
  -t test-build .

# Spusťte test kontejner
docker run -d -p 8081:80 --name test-container test-build

# Test aplikace
curl http://localhost:8081

# Cleanup
docker stop test-container
docker rm test-container
docker rmi test-build
```

## 🚀 Kompletní workflow pro Ubuntu

```bash
#!/bin/bash
# Ubuntu deployment script

echo "🚀 Ubuntu deployment..."

# 1. Nastavení environment proměnných
export VITE_PID_API_KEY="your_api_key_here"
export VITE_PID_API_BASE_URL="https://api.golemio.cz/v2"

# 2. Ověření
echo "🔑 API Key: ${VITE_PID_API_KEY:0:20}..."
echo "🌐 Base URL: $VITE_PID_API_BASE_URL"

# 3. Build
echo "🏗️ Build..."
npm run build

# 4. Docker build
echo "🐳 Docker build..."
docker build \
  --build-arg VITE_PID_API_KEY="$VITE_PID_API_KEY" \
  --build-arg VITE_PID_API_BASE_URL="$VITE_PID_API_BASE_URL" \
  -t rez-jizdni-rad:latest .

# 5. Spuštění
echo "🚀 Spouštím..."
docker run -d -p 8080:80 --name rez-jizdni-rad rez-jizdni-rad:latest

echo "✅ Hotovo! Aplikace běží na http://localhost:8080"
```

## 🔍 Troubleshooting

### **Problém: Environment proměnné se nenačítají**
```bash
# Řešení: Nastavte je explicitně
export VITE_PID_API_KEY="your_key"
export VITE_PID_API_BASE_URL="https://api.golemio.cz/v2"
```

### **Problém: .env soubor se nenačítá**
```bash
# Řešení: Použijte .env.local
cp .env .env.local
```

### **Problém: Docker build nefunguje**
```bash
# Řešení: Použijte build args
docker build --build-arg VITE_PID_API_KEY="your_key" .
```

### **Problém: Aplikace se nespouští**
```bash
# Řešení: Zkontrolujte logy
docker logs rez-jizdni-rad
```

## 📚 Užitečné odkazy

- [Vite Environment Variables](https://vitejs.dev/guide/env-and-mode.html)
- [Docker Build Args](https://docs.docker.com/engine/reference/commandline/build/#build-arg)
- [Ubuntu Systemd Environment](https://systemd.io/ENVIRONMENT/)

---

**Poznámka**: Na Ubuntu Linuxu je důležité nastavit environment proměnné **před** buildem, ne po něm.
