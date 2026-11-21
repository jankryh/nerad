# Nerad: revize a návrhy zlepšení

**Repo:** nerad @ `2297b6b` · **Datum:** 2026-11-21
**Zdroje:** `code.md`, `security.md`, `ux.md`, `codex.md`. Každý nález byl ověřen proti kódu na uvedeném řádku (final-reviewer, opus).
**Stav:** lint, build a 24 testů procházejí, `npm audit` hlásí 0 zranitelností a API klíč není v bundlu.

## Shrnutí

Kritická chyba (P0), která by běžnému dojíždějícímu rozbíjela aplikaci, nebyla nalezena. Codex došel ke stejnému závěru.
Dílčí reporty uváděly 2 nálezy jako P0 (C1 `minutesBefore`, U1.01/U1.02 a11y). Nejzávažnější, C1, je **nepotvrzený**: záporné `minutesBefore` je záměrný mechanismus a navržená oprava by plánovaný režim rozbila (viz Vyřazené nálezy). U1.01 je skutečný nález, ale patří do P2. U1.02 se nepotvrdil.

Skutečná rizika jsou tři:
- veřejná proxy přeposílá libovolné hodnoty parametrů pod serverovým klíčem,
- live polling ruší exponenciální backoff, takže při `429` zbytečně dál zatěžuje API,
- selhání jedné ze čtyř tabulí skryje všechny tabule i přepínač stanice.

| Priorita | Počet |
|---|---|
| P0 | 0 |
| P1 | 3 |
| P2 | 12 |
| P3 | 10 |
| Vyřazeno | 12 |

**Škála:** P0 = uživatelsky viditelná chyba při běžném použití. P1 = reálné riziko nebo chyba v pravděpodobném scénáři. P2 = okrajový scénář nebo nepřesnost. P3 = hygiena a nice-to-have.

## Přehled nálezů

| # | Pri | Nález | Místo | Zdroj | Verdikt |
|---|---|---|---|---|---|
| 1 | P1 | Proxy nevaliduje hodnoty parametrů, chybí rate limit | `api/departureboards.js:1,16-24` | codex P1.1, sec S2 | POTVRZENO |
| 2 | P1 | Live polling nuluje backoff a překrývá se s retry | `src/hooks/useDepartures.ts:137-140,164-166` | codex P1.6 | POTVRZENO |
| 3 | P1 | Chyba jedné tabule skryje všechny tabule i přepínač stanice | `src/api/pidApi.ts:281`, `src/components/DepartureGrid.tsx:64` | codex P1.8 | POTVRZENO |
| 4 | P2 | Po přepnutí stanice nebo času se krátce ukazují stará data | `src/hooks/useDepartures.ts:114-122`, `src/components/DepartureGrid.tsx:43` | codex P1.5 | POTVRZENO (přechodné) |
| 5 | P2 | „Obnovit" vrací 30s klientskou cache a přepíše „Aktualizováno" | `src/api/pidApi.ts:173-178`, `src/hooks/useDepartures.ts:123,175` | codex P1.7 | POTVRZENO |
| 6 | P2 | Časy se parsují a formátují v časové zóně zařízení | `src/components/DateTimePicker.tsx:9-11,24`, `src/utils/timeCalculations.ts:65-76`, `src/components/DepartureBoard.tsx:77` | codex P1.3 | ČÁSTEČNĚ (jen mimo Europe/Prague a v hodině přechodu DST) |
| 7 | P2 | Filtr okna používá `predicted`, tabule `scheduled + delay` | `src/api/pidApi.ts:208-213`, `src/utils/timeCalculations.ts:55-63` | codex P1.2 | POTVRZENO (okrajové) |
| 8 | P2 | Příjezd používá průměr trasy, ne příjezd konkrétního spoje | `src/utils/timeCalculations.ts:89-97` | codex P1.10 | POTVRZENO |
| 9 | P2 | Proxy fetch nemá timeout | `api/departureboards.js:27` | sec S1, codex P2.1 | POTVRZENO |
| 10 | P2 | CDN cachuje i chybové odpovědi upstreamu, tělo chyby se přeposílá | `api/departureboards.js:43-47` | codex P2.2, sec S3 | POTVRZENO (S3 jen částečně) |
| 11 | P2 | Picker propustí datum mimo `min`/`max` | `src/components/DateTimePicker.tsx:18-28` | codex P2.5, ux U1.04 | POTVRZENO |
| 12 | P2 | Odpočet netiká mezi polly a po návratu na kartu je zastaralý | `src/components/DepartureBoard.tsx:83-91`, `src/hooks/useDepartures.ts:162-168` | codex P2.6 | POTVRZENO |
| 13 | P2 | Fallback jízdní doba po chybě se cachuje na 5 minut | `src/api/pidApi.ts:395-410`, `src/utils/timeCalculations.ts:146-152` | codex P2.7 | POTVRZENO |
| 14 | P2 | Neplatný timestamp z API shodí render, chybějící vytvoří „teď" | `src/api/pidApi.ts:114`, `src/components/DepartureBoard.tsx:160` | codex P1.9 | POTVRZENO (vyžaduje vadná data) |
| 15 | P2 | A11y: auto-refresh se neohlásí, přepínač stanice nemá focus ring | `src/components/DepartureGrid.tsx:117-127`, `src/App.tsx:65` | ux U1.01, U1.03 | POTVRZENO |
| 16 | P3 | `limit` upstreamu se uplatní před filtrem linky a směru | `src/api/pidApi.ts:180-203` | codex P2.8 | ČÁSTEČNĚ |
| 17 | P3 | Relativní `minutesBefore/After` v klíči CDN cache | `src/api/pidApi.ts:188-192`, `api/departureboards.js:42-46` | codex P1.4 | ČÁSTEČNĚ (posun okna max. ~1 min) |
| 18 | P3 | Proxy následuje redirect i s `X-Access-Token` | `api/departureboards.js:27-34` | codex P2.3 | POTVRZENO (teoretické) |
| 19 | P3 | Přímý režim s `VITE_PID_API_KEY` není omezen na dev | `src/constants.ts:2`, `src/api/pidApi.ts:62` | codex P2.4 | POTVRZENO (jen při chybné konfiguraci) |
| 20 | P3 | Content-Type z upstreamu se přeposílá bez kontroly | `api/departureboards.js:37-41` | sec S8 | POTVRZENO |
| 21 | P3 | CI actions nepinované na SHA, zastaralé devDependencies | `.github/workflows/ci.yml:13-14`, `package.json` | sec S6, S4 | ČÁSTEČNĚ (S4 je údržba, ne security) |
| 22 | P3 | CSP `style-src 'unsafe-inline'` | `vercel.json:11` | sec S5 | POTVRZENO (nízké riziko) |
| 23 | P3 | Mezery v testech | `src/utils/__tests__/`, `src/components/__tests__/` | code C4, C9 | ČÁSTEČNĚ (soubory existují) |
| 24 | P3 | Travel-time lookupy běží dál po unmountu (bez AbortController) | `src/components/DepartureBoard.tsx:25-59` | code C2 | ČÁSTEČNĚ (stav chrání `cancelled`) |
| 25 | P3 | Drobnosti: log neznámého `boardDirection`, `role="status"` u prázdného stavu, chybí `focus-ring` u „Zkusit znovu" | `src/utils/timeCalculations.ts:111`, `src/components/DepartureBoard.tsx:115-122`, `src/components/DepartureGrid.tsx:81-84` | code C6, ux U1.05 | POTVRZENO |

## Detaily a minimální opravy

### P1

**1. Proxy bez validace hodnot.** `ALLOWED_PARAMS` kontroluje jen názvy parametrů. Hodnoty i opakované položky (`ids[]` × N, `limit=10000`, cizí zastávky) jdou na Golemio pod `PID_API_KEY`. Validace v `pidApi.ts:88-105` (`VALID_STOP_IDS`) běží jen v prohlížeči, proxy tedy nechrání. Když někdo proxy zneužije, vyčerpá kvótu a aplikace začne všem vracet `429`.
*Oprava:* na serveru povolit jen 5 ID ze `STOPS`, nejvýše 1 `ids[]`, `limit` 1–200, celočíselné minuty v rozumném rozsahu, `mode` ∈ {departures, arrivals}. Skalární parametry, které přijdou jako pole, odmítnout s 400. Rate limit lze nastavit bez kódu pravidlem ve Vercel Firewall pro `/api/*`.

**2. Poll ruší backoff.** Interval volá `fetchData()` s `isRetryAttempt = false`. Při chybě se tak nastaví `attempt = 0` (ř. 137) a backoff začne znovu od 5 s. Limit 5 pokusů se nikdy neuplatní a poll se může překrývat s naplánovaným retry. UX tester při testu narazil na `429`, takže scénář je reálný.
*Oprava:* v intervalu přeskočit fetch, když běží retry (`if (document.hidden || retryTimerRef.current) return;`).

**3. Jedna chyba skryje všechno.** `Promise.all` (ř. 281) zahodí i úspěšné tabule. `DepartureGrid` v chybovém stavu (ř. 64) nevykreslí tabule ani přepínač stanice. Když selhává Bubny, uživatel se nemůže přepnout zpět a volba je uložená v `localStorage`, takže potíž přetrvá i po reloadu. V plánovaném režimu se navíc každá chyba přepíše na „Zkuste bližší termín" (`useDepartures.ts:131-133`).
*Oprava:* `Promise.allSettled` a chyba per tabule. Minimum: vykreslit přepínač stanice i v chybovém stavu a hlášku o termínu zobrazit jen u 4xx.

### P2

**4. Stará data po přepnutí.** Při změně stanice nebo času zůstanou v gridu předchozí odjezdy, dokud nedoběhne nový fetch (typicky do 1 s). *Oprava:* při změně `targetDateTime`/`pragueStation` zavolat `setDepartures(emptyState)`.

**5. „Obnovit" neobnovuje.** `fetchBoard` má `useCache = true` a TTL 30 s, hook přesto nastaví `lastUpdate = new Date()`. *Oprava:* ruční refresh má cache obejít (`useCache: false` přes `getAllDepartures`). `lastUpdate` nastavovat podle skutečného fetchu.

**6. Časová zóna zařízení.** Dojíždějícího v Praze se to týká jen v hodině přechodu DST, proto P2. *Oprava bez nové závislosti:* všude, kde se formátuje, přidat `timeZone: 'Europe/Prague'`. Pro parsování `datetime-local` stačí malý helper přes `Intl.DateTimeFormat(..., { timeZone: 'Europe/Prague', timeZoneName: 'longOffset' })`.

**7. Nekonzistentní čas spoje.** Filtr okna bere `predicted ?? scheduled`, řazení a zobrazení `scheduled + max(delay, 0)`. *Oprava:* jedna funkce `effectiveTime(item)` pro filtr, řazení, odpočet i příjezd.

**8. Příjezd z průměru.** `selectBestTravelTime` vždy preferuje `average_`, přestože `calculateTravelTime` páruje spoje přes `tripId`. *Oprava:* preferovat záznam se stejným `tripId`, průměr jako fallback.

**9. Proxy timeout.** *Oprava:* `signal: AbortSignal.timeout(7000)` a při `TimeoutError` vrátit 504.

**10. Cache chyb.** `s-maxage` se nastavuje i pro 4xx a 5xx. *Oprava:* `s-maxage` jen při `upstreamResponse.ok`, jinak `no-store`. U 401/403 vracet generickou hlášku.

**11. Picker mimo rozsah.** *Oprava:* `if (!e.target.validity.valid) return;`.

**12. Zastaralý odpočet.** *Oprava:* listener `visibilitychange`, který po zviditelnění zavolá `fetchData()`.

**13. Cachovaný fallback.** *Oprava:* `if (!selectedTravelTime.fallbackUsed) cacheTravelTime(...)`.

**14. Vadný timestamp.** Neplatný `scheduled` s kladným `delay` vyhodí `RangeError` v `toISOString()`. *Oprava:* v `fetchBoard` vyřadit položky bez platného času, odstranit fallback `new Date().toISOString()`.

**15. A11y.** Na řádek „Aktualizováno" (`App.tsx:65`) přidat `role="status"`. Tlačítkům přepínače stanice přidat třídu `focus-ring`.

### P3 (stručně)

16. Při plné odpovědi dohledat další stránku, nebo zvýšit live `limit`.
17. Posílat absolutní začátek okna, případně u plánovaných dotazů snížit `s-maxage`.
18. V proxy `redirect: 'error'`.
19. Větev s `VITE_PID_API_KEY` povolit jen při `import.meta.env.DEV`.
20. Vynutit `content-type: application/json`, na jiný typ odpovědět 502.
21. Pinovat actions na SHA a zapnout Dependabot. `npm outdated` řešit jako údržbu.
22. `unsafe-inline` odstranit až po ověření, že prod build nepotřebuje inline styly.
23. Testy: `getEnhancedTravelTime`, `DepartureBoard` (řazení, odpočet), parametry plánovaného dotazu (`minutesBefore = -offset`).
24. AbortController jen pokud zbytečné requesty přispívají k `429`.
25. Drobnosti z tabulky, každá na jeden řádek.

## Doporučené pořadí PR

1. **`fix: validate proxy params, add timeout, no-store errors`**: #1, #9, #10, #18, #20. Navíc pravidlo rate limitu ve Vercel Firewall.
2. **`fix: polling backoff, per-board errors, stale data`**: #2, #3, #4, #5, #12.
3. **`fix: consistent prague time handling`**: #6, #7, #11, #14.
4. **`fix: per-trip arrival, do not cache fallback travel time`**: #8, #13.
5. **`feat: a11y live region and focus states`**: #15, #25.
6. **`chore: tests, ci pinning, dev-only direct api key`**: #16, #17, #19, #21–#24.

## Nápady na funkce

- **Odkaz se stavem v URL** (`?t=2026-11-22T07:30&s=bubny`): sdílení a záložka „ranní spoj", bez backendu.
- **Upozornění X minut před odjezdem** (Notification API a timer, bez push serveru).
- **PWA a offline**: manifest a service worker s poslední odpovědí, označenou časem stažení.
- **Oblíbené spoje** v `localStorage`, zvýrazněné v tabuli.
- **Přestup vlak ↔ bus**: upozornit, když příjezd S4 nestíhá navazující 371 (data už v aplikaci jsou).

## Vyřazené nálezy

| Nález | Zdroj | Důvod |
|---|---|---|
| `minutesBefore` je pro budoucí datum záporné (P0) | code C1 | **NEPOTVRZENO.** Záporné `minutesBefore = -offset` dává okno `[T, T+4h]`. Zavedl ho záměrně commit 9496a2a a API ho přijímá. Oprava `= 30` by pro zítřek vyčerpala `limit=200` dnešními spoji a tabule by zůstala prázdná. |
| Nová `refreshData` při každém renderu (P1) | code C3 | Šum. Tikání hodin je lokální stav `Header`, `App` se nepřerenderuje. |
| Cache travel-time přeroste limit | code C5 | Nejvýše ~6 klíčů při limitu 50. |
| Zavádějící název testu | code C7 | Kosmetika, název odpovídá. |
| Nepoužitý import `Radio` | code C8 | Import se používá. |
| `timeCalculations.test.ts` neexistuje | code C4 | Soubor existuje (10 testů). |
| Chybí CORS hlavičky | sec S7 | Vercel ACAO nepřidává, cross-origin čtení je blokované. Serverové zneužití řeší #1. |
| Zastaralé závislosti jako security P1 | sec S4 | `npm audit` = 0, jen devDependencies. Přeřazeno do #21 (P3). |
| Zpoždění jen barvou (P0) | ux U1.02 | Vedle času je text `+{delay}`. |
| Nedostatečný kontrast „Za X min" | ux U1.06 | Neměřeno, report jinde uvádí kontrast OK. |
| Badge bez aria-label | ux U1.07 | Viditelný text čtečka přečte. |
| Skip link na iOS, sloupec „Cesta" na tabletu | ux U1.09, U1.10 | U1.09 spekulace. U1.10 chybně: `sm` = 640 px, na iPadu Air se sloupec zobrazuje. |
