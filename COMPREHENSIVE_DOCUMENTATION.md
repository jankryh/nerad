# Jízdní řád Řež – technická dokumentace

Tenhle soubor už není encyklopedie všeho možného. Má popisovat, jak projekt **fakt funguje teď**.

## Přehled

Aplikace zobrazuje 4 směry PID spojů pro Řež:

- S4: Řež → Praha Masarykovo
- S4: Praha Masarykovo → Řež
- 371: Husinec, Řež rozc. → Kobylisy
- 371: Kobylisy → Husinec, Řež rozc.

Frontend je postavený na:

- React 18
- TypeScript
- Vite
- Axios
- Tailwind CSS

## Jak je dnes udělaná API vrstva

Nejpoužívanější logika je schválně v jednom místě:

- `src/api/pidApi.ts`

Ten modul řeší:

- volání PID departure board API
- filtrování podle linky a směru
- převod odpovědi na interní typy
- jednoduchou in-memory cache pro tabule
- výpočet cestovních časů z dvojice odjezdy/příjezdy
- fallbacky pro chvíle, kdy PID nevrátí dost dat

Dřívější třídy v `src/api/services/` jsou v repu ještě přítomné, ale běžná aplikace je už nepoužívá.

## Proxy režim a práce s API klíčem

### Doporučené nastavení

```bash
PID_API_KEY=your_actual_api_key_here
VITE_PID_API_BASE_URL=/api
```

V tomto režimu:

- browser volá jen `/api`
- Vite proxy v devu přidá `X-Access-Token` server-side
- klíč nemusí být součástí klientského bundlu

### Přímý režim

```bash
VITE_PID_API_KEY=your_actual_api_key_here
VITE_PID_API_BASE_URL=https://api.golemio.cz/v2
```

Tohle je jen fallback. Funguje, ale vystavuje klíč frontendu.

### Důležitý detail

`src/api/pidApi.ts` posílá hlavičku `X-Access-Token` jen v direct režimu. Pokud je base URL relativní (`/api`), bere se to jako proxy režim a klíč se z klienta neposílá.

## Tok dat v aplikaci

### 1. Načtení hlavních tabulí

`useDepartures()` volá `getAllDepartures()`, které paralelně načte 4 předem definované směry.

### 2. Výpočet času příjezdu

`DepartureBoard` si pro zobrazené spoje dopočítává cestovní čas přes `getEnhancedTravelTime()` v `src/utils/timeCalculations.ts`.

Logika je praktická:

- vlak může spadnout na rozumný hardcoded fallback
- autobus preferuje reálná data; pokud nejsou, radši ukáže `N/A`

### 3. Cache

Používají se dvě jednoduché in-memory cache:

- board cache v `src/api/pidApi.ts` – default 30 s
- travel-time cache v `src/utils/timeCalculations.ts`

Žádná složitá cache vrstva, žádná třída navíc.

## Konfigurace

Klíčové konstanty jsou v `src/constants.ts`:

- `REFRESH_INTERVAL`
- `BOARD_CACHE_TTL`
- `API_REQUEST_TIMEOUT`
- `TRAVEL_TIMES`
- `TRAVEL_TIME_CONFIG`

## Debug logging

Verbose debug logy byly omezené.

- běžný provoz je tichý
- detailní logování jde zapnout přes `VITE_DEBUG=true`
- varování a chyby se pořád logují přes `logger.warn/error`

Logger je v:

- `src/utils/logger.ts`

## Vývoj

### Lokálně

```bash
cp .env.example .env
npm install
npm run dev
```

### Kontrola kvality

```bash
npm run build
npm run lint
```

## Poznámky ke struktuře repo

Důležité soubory:

- `src/api/pidApi.ts`
- `src/hooks/useDepartures.ts`
- `src/components/DepartureBoard.tsx`
- `src/utils/timeCalculations.ts`
- `vite.config.ts`

Soubory jako `test-arrival-browser.html`, `test-arrival-console.js` nebo starší servisní třídy jsou spíš historický materiál než jádro aktuální appky.

## Co nedokumentovat jako hotovou věc

Do dokumentace nepsat, že projekt má robustní enterprise architekturu, retry framework nebo sofistikovaný monitoring, pokud to zrovna není aktivně používané v runtime. Tenhle projekt je nejlepší, když je čitelný a upřímný.
