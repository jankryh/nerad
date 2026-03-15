# 🚆 Jízdní řád z a do Řeže

Jednoduchá React/Vite aplikace pro zobrazení nejbližších odjezdů vlaků **S4** a autobusů **371** z a do Řeže přes **Golemio PID API**.

## Co aplikace dnes opravdu dělá

- 4 tabule na jedné stránce:
  - Řež → Praha Masarykovo
  - Praha Masarykovo → Řež
  - Husinec, Řež rozc. → Kobylisy
  - Kobylisy → Husinec, Řež rozc.
- ukazuje nejbližší 3 odjezdy pro každý směr
- zobrazuje zpoždění a dopočtený čas příjezdu
- obnovuje data každých 30 sekund
- preferuje bezpečnější **proxy režim**, aby API klíč nebyl ve frontendu

## Stav projektu

- frontend: React 18 + TypeScript + Vite
- build: `npm run build`
- lint: `npm run lint`
- API vrstva je zjednodušená do jednoho čitelného modulu `src/api/pidApi.ts`
- starší servisní abstrakce v `src/api/services/` je už překonaná a aplikace ji nepoužívá

## Rychlý start

```bash
git clone https://github.com/jankryh/nerad.git
cd nerad
cp .env.example .env
npm install
npm run dev
```

Dev server běží na <http://localhost:3000>.

## Konfigurace API

### Doporučený režim: proxy

Do `.env` dej:

```bash
PID_API_KEY=your_actual_api_key_here
VITE_PID_API_BASE_URL=/api
```

Co se děje:
- frontend volá `/api/*`
- Vite dev proxy přepošle požadavek na `https://api.golemio.cz/v2/*`
- `X-Access-Token` se přidává na serverové straně
- klíč se nedostane do browser bundlu

### Legacy režim: přímé volání z browseru

Funguje, ale klíč je pak veřejně dostupný klientovi.

```bash
VITE_PID_API_KEY=your_actual_api_key_here
VITE_PID_API_BASE_URL=https://api.golemio.cz/v2
```

Používej jen na lokální test nebo neveřejné demo.

## Produkční nasazení

### Vercel

Tenhle projekt je teď připravený i pro **Vercel** v doporučeném proxy režimu:
- frontend běží jako statický build
- `/api/*` obsluhuje Vercel Serverless Function v `api/[...path].js`
- `PID_API_KEY` zůstává na serveru a neleze do browseru

#### Co nastavit na Vercelu

V projektu ve Vercelu nastav:

```bash
PID_API_KEY=your_actual_api_key_here
VITE_PID_API_BASE_URL=/api
```

#### Doporučený deploy flow

1. pushni repo na GitHub
2. ve Vercelu dej **Add New Project**
3. vyber repo
4. framework nech rozpoznat automaticky jako **Vite**
5. přidej env vars výše
6. deploy

Po deployi bude frontend volat:
- `/api/pid/departureboards`

A Vercel function to bezpečně přepošle na:
- `https://api.golemio.cz/v2/pid/departureboards`

#### Poznámky k Vercelu

- lokálně dál funguje `npm run dev` přes Vite proxy
- na Vercelu už Vite proxy neběží, tu roli přebírá `api/[...path].js`
- `vercel.json` přidává SPA rewrite, takže refresh na routách nespadne

### Docker

```bash
docker build -t rez-jizdni-rad .
docker run -d \
  -p 8080:80 \
  -e PID_API_KEY=your_actual_api_key_here \
  --name rez-jizdni-rad \
  rez-jizdni-rad
```

Frontend dál volá `/api/*`; reverse proxy na serveru musí přidat `X-Access-Token`.

### Docker Compose

```bash
cp .env.example .env
# doplň PID_API_KEY

docker compose up -d --build
```

## Skripty

```bash
npm run dev
npm run build
npm run preview
npm run lint
```

## Debug logging

Ve výchozím stavu je aplikace tichá. Pokud chceš víc detailů ve vývoji:

```bash
VITE_DEBUG=true
```

## Důležité soubory

- `src/api/pidApi.ts` – hlavní API vrstva
- `src/hooks/useDepartures.ts` – načítání 4 tabulí
- `src/utils/timeCalculations.ts` – výpočet cestovních časů a cache
- `vite.config.ts` – dev proxy pro bezpečnější práci s API klíčem
- `COMPREHENSIVE_DOCUMENTATION.md` – stručnější technická dokumentace

## Poznámka

Projekt je schválně praktičtější než „enterprise“. Když se změní chování aplikace, drž dokumentaci v souladu s realitou repa.
