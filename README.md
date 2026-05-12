# Jízdní řád z a do Řeže

React/Vite aplikace pro zobrazení nejbližších odjezdů vlaků **S4** a autobusů **371** z a do Řeže přes **Golemio PID API**.

## Co to dělá

- 2 tabule (Do Prahy / Z Prahy), vlaky S4 + autobusy 371 sloučené
- dvousloupcový layout na desktopu, stacked na mobilu
- zpoždění a dopočtený čas příjezdu
- **date/time picker** — výběr libovolného budoucího data a času (live mód + plánovaný mód)
- auto-refresh v live módu
- dark/light theme
- responsivní design (mobile-first)

## Tech stack

- React 19 + TypeScript 6 + Vite 8
- Tailwind CSS 4
- Axios (HTTP client)
- Vitest (testy)
- ESLint 10 (flat config)
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
├── api/pidApi.ts              API vrstva (PID volání, cache, filtrování, plánované dotazy)
├── components/
│   ├── DateTimePicker.tsx     Výběr data/času (live vs plánovaný mód)
│   ├── DepartureBoard.tsx     Tabule odjezdů
│   ├── DepartureGrid.tsx      Grid layout (2 sloupce na desktopu)
│   ├── Header.tsx             Hlavička + date picker + status
│   ├── PerformanceMonitor.tsx  Dev metriky
│   └── ThemeSelector.tsx      Přepínač theme
├── contexts/ThemeContext.tsx   Dark/light theme
├── hooks/
│   ├── useDepartures.ts       Fetch odjezdů (live + plánovaný mód)
│   └── usePerformance.ts      Performance metriky
├── utils/
│   ├── timeCalculations.ts    Časy příjezdů, travel time cache
│   ├── performance.ts         Tracking
│   └── logger.ts              Debug logger
├── constants.ts               Konfigurace (zastávky, linky, TTL, timeouty)
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
