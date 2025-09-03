# 🎯 Priority rozšíření - Souhrn

## 🚀 Fáze 1: Vlakové rozšíření (Priorita: VYSOKÁ)

### **Okamžité akce (1-2 týdny):**
- [ ] **Validace PID ID** pro nové vlakové zastávky
- [ ] **API testování** pro linky S3 a R1
- [ ] **UI prototyp** pro více vlakových linek

### **Implementace (2-3 týdny):**
- [ ] **S3 linka** - alternativní trasa do Prahy
- [ ] **R1 rychlík** - rychlejší spojení
- [ ] **Rozšíření S4** - více směrů

### **Očekávaný přínos:**
- **+2 vlakové linky** (celkem 3)
- **Lepší pokrytí** Prahy
- **Rychlejší spojení** do Ústí nad Labem

## 🚌 Fáze 2: Autobusové rozšíření (Priorita: STŘEDNÍ)

### **Implementace (2-3 týdny):**
- [ ] **Linka 372** - Řež → Vysočany
- [ ] **Linka 373** - Řež → Florenc (expresní)
- [ ] **Rozšíření 371** - více směrů

### **Očekávaný přínos:**
- **+2 autobusové linky** (celkem 3)
- **Lepší pokrytí** východní Prahy
- **Expresní spojení** do centra

## 🚏 Fáze 3: Městské linky (Priorita: NÍZKÁ)

### **Implementace (3-4 týdny):**
- [ ] **Linka A** - Řež → Klecany
- [ ] **Linka B** - Řež → Roztoky
- [ ] **Linka C** - Řež → Kralupy

### **Očekávaný přínos:**
- **+3 MHD linky** (celkem 3)
- **Lokální doprava** v okolí Řeže
- **Kompletní pokrytí** regionu

## 📊 Souhrn priorit

### **Priorita 1 (VYSOKÁ):**
1. **Vlakové rozšíření** - největší dopad na uživatele
2. **API optimalizace** - pro více linek
3. **UI rozšíření** - pro více typů dopravy

### **Priorita 2 (STŘEDNÍ):**
1. **Autobusové rozšíření** - střední dopad
2. **Performance tuning** - pro větší objem dat
3. **Error handling** - robustnost

### **Priorita 3 (NÍZKÁ):**
1. **Městské linky** - lokální význam
2. **PWA funkcionalita** - offline režim
3. **Advanced features** - filtry, vyhledávání

## 🎯 Doporučený postup

### **Týden 1-2:**
- Validace PID ID pro vlaky
- API testování nových linek
- UI prototyp pro vlaky

### **Týden 3-4:**
- Implementace S3 a R1
- Rozšíření S4 směrů
- Testování vlakových linek

### **Týden 5-6:**
- Implementace autobusových linek
- UI aktualizace pro autobusy
- Performance optimalizace

### **Týden 7-8:**
- Implementace MHD linek
- Komplexní UI pro všechny typy
- Finální testování a optimalizace

## 🚨 Klíčové rizika

### **Technická rizika:**
- **API limity** - více volání může překročit limity
- **Performance** - větší objem dat může zpomalit aplikaci
- **UI komplexita** - příliš mnoho informací může zmást uživatele

### **Mitigace:**
- **Caching strategie** - snížení API volání
- **Lazy loading** - načítání podle potřeby
- **Modulární UI** - organizované zobrazení

## 📈 Očekávané metriky

### **Před rozšířením:**
- **Linky**: 2 (S4, 371)
- **Zastávky**: 4
- **API volání**: 4 za 30 sekund

### **Po rozšíření:**
- **Linky**: 9 (S3, S4, R1, 371, 372, 373, A, B, C)
- **Zastávky**: 18
- **API volání**: 18 za 30 sekund

### **Cíle:**
- **Pokrytí**: +350% (z 2 na 9 linek)
- **Uživatelé**: +200% (více možností dopravy)
- **Performance**: <2s načítání (optimalizované)

---

**Závěr**: Rozšíření je technicky proveditelné, ale vyžaduje pečlivé plánování a implementaci po fázích. Doporučuji začít s vlakovým rozšířením jako nejvyšší prioritou.
