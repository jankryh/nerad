# Repository Guidelines

## Structure
- `src/` — TypeScript source: `api/` (PID client), `components/` (React UI), `hooks/` (polling), `contexts/` (theming), `utils/` (time helpers)
- `src/constants.ts` — konfigurace (refresh interval, cache TTL, API timeout, travel times)
- `src/types.ts` — sdílené TypeScript typy
- `api/departureboards.js` — Vercel serverless proxy

## Build & Dev

```bash
npm run dev       # Vite dev server, port 3000
npm run build     # tsc + vite build → dist/
npm run lint      # ESLint + TS
npm run test      # Vitest
```

## Coding Style
- TypeScript + React JSX, 2-space indent
- `PascalCase.tsx` pro komponenty, `useSomething.ts` pro hooks
- Tailwind utility classes inline
- `npm run lint` před commitem

## Testy
- Vitest + @testing-library/react
- Testy v `src/components/__tests__/` a `src/utils/__tests__/`

## Commit konvence
- Krátké, lowercase: `feat: add delay indicator`, `fix: cache invalidation`, `chore: cleanup`
- Prefix: `feat`, `fix`, `chore`, `docs`
- Skupinovat related změny, lint + build musí projít

## Deployment
- Pouze Vercel — push na `main` triggeruje auto-deploy
- CI: GitHub Actions (lint, build, test)
- API klíč: `PID_API_KEY` jako Vercel env var, nikdy v bundlu
