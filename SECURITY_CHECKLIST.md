# 🛡️ Bezpečnostní Checklist

## ✅ Kontrola bezpečnosti API klíčů

### **Git repozitář:**
- [x] **API klíč odstraněn** z Git historie
- [x] **`.env` soubor** není tracked v Git
- [x] **`.env` soubor** je v `.gitignore`
- [x] **`.env.example`** obsahuje pouze ukázky
- [x] **Žádné citlivé údaje** v commit zprávách

### **Lokální soubory:**
- [x] **`.env` soubor** existuje lokálně
- [x] **`.env` soubor** obsahuje skutečný API klíč
- [x] **`.env.example`** obsahuje ukázkové hodnoty

### **Kód:**
- [x] **`constants.ts`** používá environment proměnné
- [x] **Žádné hardcoded** API klíče v kódu
- [x] **TypeScript definice** pro environment proměnné

## 🔍 Jak ověřit bezpečnost:

### **1. Kontrola Git historie:**
```bash
# Hledat API klíče v commit zprávách
git log --grep="API key" -i

# Hledat API klíče v souborech
git log -S "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9" --all

# Zkontrolovat tracked soubory
git ls-files | grep -E "\.env$"
```

### **2. Kontrola aktuálního kódu:**
```bash
# Hledat API klíče v src/
grep -r "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9" src/

# Hledat hardcoded API klíče
grep -r "API_KEY.*=" src/
```

### **3. Kontrola .gitignore:**
```bash
# Zkontrolovat .gitignore
cat .gitignore | grep -E "\.env"
```

## 🚨 Co dělat při nalezení API klíče:

### **1. Okamžitě:**
- [ ] **Změnit API klíč** na serveru
- [ ] **Odebrat z kódu** a commitovat
- [ ] **Vyčistit Git historii**

### **2. Vyčištění Git historie:**
```bash
# Odstranit soubor z historie
git filter-branch --force --index-filter \
  'git rm --cached --ignore-unmatch src/constants.ts' \
  --prune-empty --tag-name-filter cat -- --all

# Force push
git push origin main --force
```

### **3. Ověření:**
```bash
# Zkontrolovat, že API klíč zmizel
git log -S "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9" --all

# Zkontrolovat aktuální stav
git status
```

## 📋 Pravidelné kontroly:

### **Před každým commitem:**
- [ ] **Zkontrolovat** `.env` soubory
- [ ] **Zkontrolovat** commit zprávy
- [ ] **Zkontrolovat** změny v kódu

### **Před každým push:**
- [ ] **Zkontrolovat** Git status
- [ ] **Zkontrolovat** tracked soubory
- [ ] **Zkontrolovat** .gitignore

### **Pravidelně:**
- [ ] **Rotovat API klíče** (měsíčně)
- [ ] **Kontrolovat** přístupová práva
- [ ] **Aktualizovat** .env.example

## 🔐 Bezpečnostní best practices:

### **✅ Co dělat:**
- Používat environment proměnné
- Používat .env soubory pro lokální development
- Používat .env.example pro dokumentaci
- Používat .gitignore pro .env soubory
- Rotovat API klíče pravidelně

### **❌ Co NEDĚLAT:**
- Commitovat .env soubory
- Hardcodovat API klíče v kódu
- Posílat API klíče přes email
- Ukládat API klíče v plain text
- Ignorovat bezpečnostní varování

---

**Poslední kontrola**: 2025-09-03  
**Kontroloval**: AI Assistant  
**Status**: ✅ BEZPEČNÉ
