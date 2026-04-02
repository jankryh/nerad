# Jízdní řád z a do Řeže

React/Vite aplikace pro zobrazení nejbližších odjezdů vlaků **S4** a autobusů **371** z a do Řeže přes **Golemio PID API**.

## Co to dělá

- 4 tabule na jedné stránce:
  - Řež → Praha Masarykovo nádraží
  - Praha Masarykovo nádraží → Řež
  - Husinec, Řež rozc. → Kobylisy
  - Kobylisy → Husinec, Řež rozc.
- 3 nejbližší odjezdy pro každý směr
- zpoždění a dopočtený čas příjezdu
- auto-refresh každých 30 sekund
- dark/light theme

## Tech stack

- React 18 + TypeScript + Vite
- Tailwind CSS
- Axios (HTTP client)
- Vitest (testy)
- Vercel (deployment + serverless API proxy)

## Rychlý start

```bash
git clone https://github.com/jankryh/nerad.git
cd nerad
cp .env.example .env   # doplň PID_API_KEY
npm install
npm run dev
```

Dev server běží na `http://localhost:3000`.

## Konfigurace

### Proxy režim (doporučený)

```bash
PID_API_KEY=your_api_key
VITE_PID_API_BASE_URL=/api
```

- frontend volá `/api/*`
- Vite dev proxy (lokálně) / Vercel serverless function (produkce) přidá `X-Access-Token` server-side
- API klíč se nedostane do browser bundlu

### Přímý režim (jen lokální test)

```bash
VITE_PID_API_KEY=your_api_key
VITE_PID_API_BASE_URL=https://api.golemio.cz/v2
```

Klíč je veřejně dostupný klientovi — jen pro neveřejné demo.

## Deployment

Projekt je nasazený na **Vercel** s automatickým deployem přes GitHub.

### Vercel setup

1. Propoj repo na Vercelu
2. Framework: Vite (auto-detect)
3. Environment variables:
   - `PID_API_KEY` — PID Golemio API klíč
   - `VITE_PID_API_BASE_URL` = `/api`
4. Push na `main` → automatický deploy

Serverless function `api/departureboards.js` proxuje requesty na `https://api.golemio.cz/v2/*`.

### CI

GitHub Actions (`.github/workflows/ci.yml`) — lint, build, testy na každém push/PR.

## Struktura

```
src/
├── api/pidApi.ts              API vrstva (PID volání, cache, filtrování)
├── components/
│   ├── DepartureBoard.tsx     Tabule odjezdů
│   ├── DepartureGrid.tsx      Grid layout
│   ├── Header.tsx             Hlavička + status
│   ├── PerformanceMonitor.tsx  Dev metriky
│   └── ThemeSelector.tsx      Přepínač theme
├── contexts/ThemeContext.tsx   Dark/light theme
├── hooks/
│   ├── useDepartures.ts       Polling 4 tabulí
│   ├── useEnhancedTravelTime.ts  Výpočet cestovního času
│   └── usePerformance.ts      Performance metriky
├── utils/
│   ├── cache.ts               In-memory cache
│   ├── timeCalculations.ts    Časy příjezdů, fallbacky
│   ├── performance.ts         Tracking
│   └── logger.ts              Debug logger
├── constants.ts               Konfigurace (refresh, TTL, timeouty)
├── types.ts                   TypeScript typy
└── App.tsx                    Root komponenta
```

## Skripty

```bash
npm run dev       # dev server
npm run build     # tsc + vite build
npm run lint      # ESLint
npm run test      # Vitest
npm run preview   # preview produkčního buildu
```

## Debug

```bash
VITE_DEBUG=true   # verbose logování do konzole
```

## Licence

MIT
