# 📚 Přehled dokumentace

## 🎯 Hlavní dokumentace

### **`README.md` - ⭐ HLAVNÍ SOUBOR**
- **Účel**: Kompletní přehled projektu
- **Obsah**: Všechny důležité informace na jednom místě
- **Status**: ✅ **DOPORUČUJI PONECHAT**

## 📋 Detailní dokumentace (volitelné)

### **`ENVIRONMENT_SETUP.md`**
- **Účel**: Detailní nastavení environment proměnných
- **Obsah**: Instrukce pro API klíče, Docker, Kubernetes
- **Status**: 🔄 **MŮŽETE SMAZAT** (obsahuje README.md)

### **`DEPLOYMENT.md`**
- **Účel**: Deployment instrukce
- **Obsah**: Docker, Podman, Quay.io
- **Status**: 🔄 **MŮŽETE SMAZAT** (obsahuje README.md)

### **`DEPLOYMENT_SCRIPTS.md`**
- **Účel**: Dokumentace deployment scriptů
- **Obsah**: Použití deploy.sh a deploy-simple.sh
- **Status**: 🔄 **MŮŽETE SMAZAT** (obsahuje README.md)

### **`SECURITY_CHECKLIST.md`**
- **Účel**: Bezpečnostní checklist
- **Obsah**: Kontrola API klíčů a bezpečnosti
- **Status**: 🔄 **MŮŽETE SMAZAT** (obsahuje README.md)

### **`PID_ID_INSTRUCTIONS.md`**
- **Účel**: Instrukce pro PID API
- **Obsah**: Jak najít PID ID zastávek
- **Status**: 🔄 **MŮŽETE SMAZAT** (obsahuje README.md)

## 🗑️ Doporučení pro úklid

### **Co SMAZAT** (obsahuje README.md):
```bash
rm ENVIRONMENT_SETUP.md
rm DEPLOYMENT.md
rm DEPLOYMENT_SCRIPTS.md
rm SECURITY_CHECKLIST.md
rm PID_ID_INSTRUCTIONS.md
```

### **Co PONECHAT**:
- ✅ **`README.md`** - hlavní dokumentace
- ✅ **`deploy.sh`** - deployment script
- ✅ **`deploy-simple.sh`** - zjednodušený deployment
- ✅ **`docker-compose.yml`** - Docker konfigurace
- ✅ **`.env.example`** - ukázka environment proměnných

## 🚀 Výsledek po úklidu

Po smazání redundantních souborů budete mít:
- **1 hlavní README** s všemi informacemi
- **2 deployment scripty** pro automatizaci
- **Čistou strukturu** projektu
- **Jednotnou dokumentaci** na jednom místě

## 📝 Poznámka

Všechny důležité informace z jednotlivých souborů byly sloučeny do `README.md`. Pokud potřebujete detailnější informace o konkrétních tématech, můžete je najít v příslušných sekcích hlavního README.

---

**Doporučení**: Ponechte pouze `README.md` a deployment scripty. Ostatní dokumentační soubory můžete bezpečně smazat.
