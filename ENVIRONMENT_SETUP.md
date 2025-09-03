# 🔐 Nastavení Environment Proměnných

## 🚨 DŮLEŽITÉ: Bezpečnost API klíčů

**API klíče se NIKDY nesmí commitovat do Git repozitáře!**

## 📋 Požadované Environment Proměnné

### **VITE_PID_API_KEY**
- **Popis**: API klíč pro PID (Pražská integrovaná doprava) API
- **Zdroj**: https://api.golemio.cz/
- **Formát**: JWT token
- **Příklad**: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`

### **VITE_PID_API_BASE_URL** (volitelné)
- **Popis**: Base URL pro PID API
- **Výchozí**: `https://api.golemio.cz/v2`
- **Formát**: URL string

## 🚀 Rychlé nastavení

### **1. Lokální development (.env)**

Vytvořte `.env` soubor v root adresáři projektu:

```bash
# .env
VITE_PID_API_KEY=your_actual_api_key_here
VITE_PID_API_BASE_URL=https://api.golemio.cz/v2
```

### **2. Production deployment**

#### **Docker:**
```bash
docker run -d \
  -p 8080:80 \
  -e VITE_PID_API_KEY=your_api_key \
  --name rez-jizdni-rad \
  quay.io/rh-ee-jkryhut/nerad:latest
```

#### **Docker Compose:**
```yaml
version: '3.8'
services:
  rez-jizdni-rad:
    image: quay.io/rh-ee-jkryhut/nerad:latest
    environment:
      - VITE_PID_API_KEY=${PID_API_KEY}
    ports:
      - "8080:80"
```

#### **Kubernetes:**
```yaml
apiVersion: v1
kind: Secret
metadata:
  name: pid-api-secret
type: Opaque
data:
  VITE_PID_API_KEY: <base64_encoded_api_key>
---
apiVersion: apps/v1
kind: Deployment
spec:
  template:
    spec:
      containers:
      - name: rez-jizdni-rad
        env:
        - name: VITE_PID_API_KEY
          valueFrom:
            secretKeyRef:
              name: pid-api-secret
              key: VITE_PID_API_KEY
```

## 🔑 Získání API klíče

### **1. Registrace na Golemio:**
- Jděte na: https://api.golemio.cz/
- Zaregistrujte se
- Vytvořte novou aplikaci
- Získejte API klíč

### **2. Testování API klíče:**
```bash
curl -H "X-Access-Token: YOUR_API_KEY" \
     "https://api.golemio.cz/v2/pid/departureboards?ids[]=U2823Z301&limit=1"
```

## 🛡️ Bezpečnostní opatření

### **✅ Co dělat:**
- Používejte `.env` soubory pro lokální development
- Používejte environment proměnné v production
- Používejte Kubernetes Secrets nebo Docker Secrets
- Rotujte API klíče pravidelně

### **❌ Co NEDĚLAT:**
- NIKDY necommitovat `.env` soubory
- NIKDY neukládat API klíče v kódu
- NIKDY neposílat API klíče přes email
- NIKDY neukládat API klíče v plain text

## 🔍 Kontrola nastavení

### **Lokální kontrola:**
```bash
# Zkontrolovat, zda se .env načítá
echo $VITE_PID_API_KEY

# Spustit aplikaci a zkontrolovat konzoli
npm run dev
```

### **Production kontrola:**
```bash
# Docker
docker exec rez-jizdni-rad env | grep VITE

# Kubernetes
kubectl exec deployment/rez-jizdni-rad -- env | grep VITE
```

## 🚨 Troubleshooting

### **API klíč se nenačítá:**
1. Zkontrolujte název proměnné (`VITE_` prefix)
2. Restartujte development server
3. Zkontrolujte `.env` soubor
4. Zkontrolujte `.gitignore`

### **CORS chyby:**
1. Zkontrolujte API klíč
2. Zkontrolujte base URL
3. Zkontrolujte CORS nastavení na serveru

### **401/403 chyby:**
1. Zkontrolujte platnost API klíče
2. Zkontrolujte práva aplikace
3. Zkontrolujte rate limiting

## 📚 Užitečné odkazy

- [Golemio API dokumentace](https://api.golemio.cz/)
- [Vite Environment Variables](https://vitejs.dev/guide/env-and-mode.html)
- [Docker Environment Variables](https://docs.docker.com/compose/environment-variables/)
- [Kubernetes Secrets](https://kubernetes.io/docs/concepts/configuration/secret/)

---

**Poznámka**: Tento soubor obsahuje citlivé informace. Nikdy ho necommitujte do Git repozitáře!
