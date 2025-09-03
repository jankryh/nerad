# 🚀 Plán rozšíření - Další zastávky a linky

## 📋 Současný stav

### **Aktuální pokrytí:**
- ✅ **Řež** (U2823Z301) - vlak S4
- ✅ **Praha Masarykovo** (U480Z301) - vlak S4  
- ✅ **Husinec** (U2245Z2) - autobus 371
- ✅ **Praha Kobylisy** (U675Z12) - autobus 371

### **Aktuální linky:**
- 🚆 **S4** - Vlak Řež ↔ Praha Masarykovo
- 🚌 **371** - Autobus Řež ↔ Praha Kobylisy

## 🎯 Plánované rozšíření

### **Fáze 1: Rozšíření vlakových linek**

#### **S4 - Rozšíření směrů:**
- **Řež → Praha Masarykovo** (stávající)
- **Řež → Praha Hlavní nádraží** (nové)
- **Řež → Praha Holešovice** (nové)
- **Řež → Kralupy nad Vltavou** (nové)

#### **S3 - Nová linka:**
- **Řež → Praha Masarykovo** (alternativní trasa)
- **Řež → Praha Bubeneč** (nové)

#### **R1 - Rychlík:**
- **Řež → Praha Hlavní nádraží** (rychlejší)
- **Řež → Ústí nad Labem** (nové)

### **Fáze 2: Rozšíření autobusových linek**

#### **371 - Rozšíření směrů:**
- **Řež → Praha Kobylisy** (stávající)
- **Řež → Praha Letňany** (nové)
- **Řež → Praha Černý Most** (nové)

#### **372 - Nová linka:**
- **Řež → Praha Vysočany** (nové)
- **Řež → Praha Libeň** (nové)

#### **373 - Expresní linka:**
- **Řež → Praha Hlavní nádraží** (přímé)
- **Řež → Praha Florenc** (nové)

### **Fáze 3: Městské linky**

#### **MHD Řež:**
- **Linka A** - Řež → Husinec → Klecany
- **Linka B** - Řež → Roztoky → Únětice
- **Linka C** - Řež → Libčice → Kralupy

## 🗺️ Nové zastávky

### **Vlakové zastávky:**
```typescript
// Rozšířené STOPS
export const STOPS = {
  // Stávající
  REZ: 'U2823Z301',           // Řež
  MASARYKOVO: 'U480Z301',     // Praha Masarykovo
  HUSINEC_REZ: 'U2245Z2',     // Husinec
  KOBYLISY: 'U675Z12',        // Praha Kobylisy
  
  // Nové vlakové
  HLAVNI_NADRAZI: 'U1Z1',     // Praha Hlavní nádraží
  HOLESOVICE: 'U2Z2',         // Praha Holešovice
  KRALUPY: 'U3Z3',            // Kralupy nad Vltavou
  BUBENEC: 'U4Z4',            // Praha Bubeneč
  USTI_LABEM: 'U5Z5',         // Ústí nad Labem
  
  // Nové autobusové
  LETNANY: 'U6Z6',            // Praha Letňany
  CERNY_MOST: 'U7Z7',         // Praha Černý Most
  VYSOCANY: 'U8Z8',           // Praha Vysočany
  LIBEN: 'U9Z9',              // Praha Libeň
  FLORENC: 'U10Z10',          // Praha Florenc
  
  // Městské
  ROZTOKY: 'U11Z11',          // Roztoky
  UNETICE: 'U12Z12',          // Únětice
  LIBCICE: 'U13Z13',          // Libčice
  KLECANY: 'U14Z14',          // Klecany
} as const;
```

### **Nové linky:**
```typescript
// Rozšířené LINES
export const LINES = {
  // Stávající
  S4: 's4',                   // Vlak S4
  BUS_371: '371',             // Autobus 371
  
  // Nové vlakové
  S3: 's3',                   // Vlak S3
  R1: 'r1',                   // Rychlík R1
  
  // Nové autobusové
  BUS_372: '372',             // Autobus 372
  BUS_373: '373',             // Autobus 373
  
  // Městské
  MHD_A: 'a',                 // MHD linka A
  MHD_B: 'b',                 // MHD linka B
  MHD_C: 'c',                 // MHD linka C
} as const;
```

## 🏗️ Architektonické změny

### **1. Rozšíření API funkcí**

#### **Nové směry:**
```typescript
// Rozšířené DIRECTIONS
export const DIRECTIONS = {
  // Stávající
  FROM_REZ: 'from-rez',       // Z Řeže
  TO_REZ: 'to-rez',           // Do Řeže
  
  // Nové směry
  TO_PRAGUE_CENTER: 'to-prague-center',     // Do centra Prahy
  TO_PRAGUE_NORTH: 'to-prague-north',      // Do severní Prahy
  TO_PRAGUE_EAST: 'to-prague-east',        // Do východní Prahy
  TO_USTI: 'to-usti',                      // Do Ústí nad Labem
  TO_KRALUPY: 'to-kralupy',                // Do Kralup
  TO_ROZTOKY: 'to-roztoky',                // Do Roztok
  TO_KLECANY: 'to-klecany',                // Do Klecan
} as const;
```

#### **Rozšířené API funkce:**
```typescript
// Nové API funkce
export const getExtendedDepartures = async () => {
  // Všechny vlakové linky
  const [s4Departures, s3Departures, r1Departures] = await Promise.allSettled([
    getDepartures('U2823Z301', 'S4', 5, 'to-prague-center'),
    getDepartures('U2823Z301', 'S3', 5, 'to-prague-center'),
    getDepartures('U2823Z301', 'R1', 3, 'to-usti'),
  ]);
  
  // Všechny autobusové linky
  const [bus371, bus372, bus373] = await Promise.allSettled([
    getDepartures('U2823Z301', '371', 5, 'to-prague-north'),
    getDepartures('U2823Z301', '372', 5, 'to-prague-east'),
    getDepartures('U2823Z301', '373', 3, 'to-prague-center'),
  ]);
  
  // Městské linky
  const [mhdA, mhdB, mhdC] = await Promise.allSettled([
    getDepartures('U2823Z301', 'a', 3, 'to-klecany'),
    getDepartures('U2823Z301', 'b', 3, 'to-roztoky'),
    getDepartures('U2823Z301', 'c', 3, 'to-kralupy'),
  ]);
  
  return {
    trains: { s4: s4Departures, s3: s3Departures, r1: r1Departures },
    buses: { bus371, bus372, bus373 },
    mhd: { mhdA, mhdB, mhdC }
  };
};
```

### **2. Rozšíření UI komponent**

#### **Nové DepartureBoard typy:**
```typescript
// Rozšířené komponenty
export const DepartureGridExtended: React.FC = () => {
  return (
    <div className="departure-grid-extended">
      {/* Vlakové linky */}
      <div className="transport-section trains">
        <h2>🚆 Vlakové linky</h2>
        <div className="grid-row">
          <div className="grid-column">
            <DepartureBoard title="S4 → Praha" departures={s4Departures} />
            <DepartureBoard title="S3 → Praha" departures={s3Departures} />
            <DepartureBoard title="R1 → Ústí" departures={r1Departures} />
          </div>
        </div>
      </div>
      
      {/* Autobusové linky */}
      <div className="transport-section buses">
        <h2>🚌 Autobusové linky</h2>
        <div className="grid-row">
          <div className="grid-column">
            <DepartureBoard title="371 → Kobylisy" departures={bus371} />
            <DepartureBoard title="372 → Vysočany" departures={bus372} />
            <DepartureBoard title="373 → Florenc" departures={bus373} />
          </div>
        </div>
      </div>
      
      {/* Městské linky */}
      <div className="transport-section mhd">
        <h2>🚏 Městské linky</h2>
        <div className="grid-row">
          <div className="grid-column">
            <DepartureBoard title="A → Klecany" departures={mhdA} />
            <DepartureBoard title="B → Roztoky" departures={mhdB} />
            <DepartureBoard title="C → Kralupy" departures={mhdC} />
          </div>
        </div>
      </div>
    </div>
  );
};
```

## 📊 Implementační plán

### **Milestone 1: Vlakové rozšíření (2-3 týdny)**
- [ ] **Přidat nové zastávky** do constants.ts
- [ ] **Rozšířit API funkce** pro S3 a R1
- [ ] **Aktualizovat UI** pro více vlakových linek
- [ ] **Testování** s PID API

### **Milestone 2: Autobusové rozšíření (2-3 týdny)**
- [ ] **Přidat autobusové zastávky**
- [ ] **Implementovat linky 372 a 373**
- [ ] **Rozšířit směry** pro autobusy
- [ ] **UI aktualizace** pro autobusy

### **Milestone 3: Městské linky (3-4 týdny)**
- [ ] **Přidat MHD zastávky**
- [ ] **Implementovat linky A, B, C**
- [ ] **Komplexní UI** pro všechny typy dopravy
- [ ] **Responzivní design** pro mobilní zařízení

### **Milestone 4: Optimalizace (1-2 týdny)**
- [ ] **Performance tuning** pro více dat
- [ ] **Caching strategie** pro API volání
- [ ] **Error handling** pro všechny linky
- [ ] **Dokumentace** a testování

## 🔧 Technické požadavky

### **API rozšíření:**
- **Rate limiting** - více API volání
- **Batch requests** - optimalizace API volání
- **Error handling** - robustní zpracování chyb
- **Caching** - lokální cache pro data

### **UI/UX vylepšení:**
- **Tabs/sections** - organizace podle typu dopravy
- **Filtry** - podle linky, směru, času
- **Search** - vyhledávání zastávek
- **Favorites** - oblíbené linky

### **Performance:**
- **Lazy loading** - načítání podle potřeby
- **Virtual scrolling** - pro dlouhé seznamy
- **Service Worker** - offline funkcionalita
- **PWA** - Progressive Web App

## 📈 Očekávané výsledky

### **Rozšířené pokrytí:**
- **Vlaky**: 3 linky (S3, S4, R1)
- **Autobusy**: 3 linky (371, 372, 373)
- **MHD**: 3 linky (A, B, C)
- **Celkem**: 9 linek místo současných 2

### **Uživatelské benefity:**
- **Více možností** dopravy
- **Lepší pokrytí** Prahy a okolí
- **Flexibilnější** plánování cest
- **Komplexnější** přehled dopravy

### **Technické benefity:**
- **Škálovatelná** architektura
- **Modulární** komponenty
- **Lepší** error handling
- **Optimalizovaný** performance

## 🚨 Rizika a omezení

### **API limity:**
- **Rate limiting** - více API volání
- **Data volume** - větší množství dat
- **Response time** - pomalejší načítání

### **UI komplexita:**
- **Přetížené rozhraní** - příliš mnoho informací
- **Navigační složitost** - složitější orientace
- **Mobile UX** - problémy na malých obrazovkách

### **Maintenance:**
- **Více kódu** - složitější údržba
- **API změny** - závislost na PID API
- **Testing** - složitější testování

## 📋 Další kroky

### **Okamžité akce:**
1. **Validace PID ID** pro nové zastávky
2. **API testování** pro nové linky
3. **UI prototyp** pro rozšířené rozhraní
4. **Performance analýza** současného řešení

### **Plánování:**
1. **Detailní specifikace** nových funkcí
2. **UI/UX design** pro rozšířené rozhraní
3. **API dokumentace** pro nové endpointy
4. **Testovací strategie** pro všechny linky

---

**Poznámka**: Tento plán je koncepční a bude implementován postupně podle priorit a dostupnosti PID API dat.
