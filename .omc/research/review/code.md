# Code Review Findings – src/

**Spuštěno:** 2026-11-21  
**Scope:** React components, API client, hooks, utils, testy  
**Build/Lint/Test:** ✅ Vše prošlo

---

## C1 – Chybný výpočet minutesBefore pro budoucí datum (P0 BUG)

**Soubor:** `src/api/pidApi.ts:189-192`  
**Závažnost:** P0 – kritická chyba logiky  

**Problém:**  
Když uživatel vybere budoucí datum/čas (scheduled mode), `offsetMinutes` je kladný (např. +120 min), takže `minutesBefore = -offsetMinutes` vychází záporný (např. -120). PID API pravděpodobně očekává kladnou hodnotu pro `minutesBefore` (počet minut **před** stanoveným časem, kam se má okno rozšířit). Tím pádem API buď ignoruje parametr, vrací chybu, nebo vrací nesprávná data.

**Scénář selhání:**  
Uživatel vybere zítřejší ráno 8:00. App pošle `minutesBefore=-1440`, což nedává smysl. API může vrátit prázdný výsledek nebo chybně orientované časové okno.

**Návrh opravy:**  
```typescript
// Řádek 189-192 v pidApi.ts
if (isScheduled) {
  const offsetMinutes = Math.floor((targetDateTime.getTime() - now) / 60000);
  // Pro budoucí datum: offsetMinutes je kladný, chceme okno [T-30min, T+240min]
  // minutesBefore by mělo být 0 (nezahrnujeme minulost před T) nebo malá rezerva
  params.minutesBefore = 30; // nebo 0, podle toho co API akceptuje
  params.minutesAfter = offsetMinutes + 240;
}
```

Případně pokud chceme "looking-glass" okno kolem vybraného času, musí být:
```typescript
params.minutesBefore = 30;  // 30 minut před T
params.minutesAfter = offsetMinutes + 240;  // od teď až do T+4h
```

**Ověření:** Otestovat scheduled mode s datem v budoucnosti a zkontrolovat, že vrácené odjezdy odpovídají očekávanému oknu `[T, T+4h]`.

---

## C2 – Race condition v cleanup efektu při výpočtu travel-time (P1 DŮLEŽITÉ)

**Soubor:** `src/components/DepartureBoard.tsx:25-59`  
**Závažnost:** P1 – může způsobit stale state update warning, nesprávné travel times v UI  

**Problém:**  
Efekt na řádcích 25-59 spouští async výpočet travel times pro každý `departure`. Cleanup funkce nastaví `cancelled = true`, ale `Promise.allSettled` už běží a může se dokončit **po** unmount nebo re-render s novými `departures`. Pokud efekt znovu běží kvůli změně `departures` nebo `pragueStation` (např. switch stanice Masarykovo→Bubny), starý běžící výpočet skončí a zavolá `setEnhancedTravelTimes()` i když už je neaktuální. Stav se sice neaktualizuje (díky `cancelled`), ale výpočet proběhl zbytečně.

**Scénář selhání:**  
1. Načtení 3 departures → spustí efekt A.
2. Přepnutí stanice Masarykovo→Bubny → unmount efektu A, spustí efekt B.
3. Efekt A doběhne po efektu B → pokud by nebyl `cancelled` check, přepsal by B výsledky.
4. S aktuálním kódem: warning `Can't perform a React state update on unmounted component` pokud cleanup nestihne zrušit pending promises.

**Konkrétní problém:** `Promise.allSettled` nečeká na abort signál, takže API requesty v `getEnhancedTravelTime` pokračují i po cleanup. AbortController chybí.

**Návrh opravy:**  
Přidat `AbortController` a předat `signal` do `getEnhancedTravelTime` → `calculateTravelTime` → `fetchBoard`. Pokud efekt unmountne, zrušit in-flight requesty.

```typescript
useEffect(() => {
  if (!TRAVEL_TIME_CONFIG.enableRealTimeInUI || departures.length === 0) {
    setEnhancedTravelTimes(new Map());
    return;
  }

  const controller = new AbortController();

  const calculateEnhancedTimes = async () => {
    const newTravelTimes = new Map<string, number>();
    await Promise.allSettled(
      departures.map(async (departure) => {
        const key = `${departure.tripId}-${departure.scheduledTime}`;
        try {
          const travelTime = await getEnhancedTravelTime(departure, true, pragueStation, controller.signal);
          if (!controller.signal.aborted) {
            newTravelTimes.set(key, travelTime);
          }
        } catch (err) {
          if (!controller.signal.aborted) {
            logger.warn('Failed to calculate travel time', err);
            newTravelTimes.set(key, TRAVEL_TIMES[departure.mode]);
          }
        }
      }),
    );

    if (!controller.signal.aborted) {
      setEnhancedTravelTimes(newTravelTimes);
    }
  };

  calculateEnhancedTimes().catch((err) => {
    if (!controller.signal.aborted) {
      logger.warn('Failed to calculate enhanced times', err);
    }
  });

  return () => { controller.abort(); };
}, [departures, pragueStation]);
```

Upravit signaturu `getEnhancedTravelTime`, `calculateTravelTime`, a `fetchBoard` pro přijetí `signal?: AbortSignal`.

---

## C3 – Nová funkce refreshData na každém renderu (P1 OPTIMALIZACE)

**Soubor:** `src/hooks/useDepartures.ts:175`  
**Závažnost:** P1 – způsobuje zbytečné re-rendery child komponent  

**Problém:**  
Hook vrací `refreshData: () => fetchData()`, což je nový arrow function na každém renderu. Komponenty, které berou `refreshData` jako prop (např. `Header`), dostanou novou referenci při každém renderu rodiče → React.memo neúčinkuje, děti se re-renderují zbytečně.

**Scénář selhání:**  
Každou sekundu se aktualizuje `currentTime` v `Header` → re-render → `useDepartures` vrací nový `refreshData` → `Header` znovu renderuje refresh button i když se stav departures nezměnil. Při rapidních aktualizacích (countdown ticker) to může způsobit stuttering.

**Návrh opravy:**  
Použít `useCallback`:
```typescript
const refreshData = useCallback(() => {
  fetchData();
}, [fetchData]);

return {
  ...departures,
  isLoading,
  error,
  lastUpdate,
  refreshData,  // stabilní reference
  retryCount,
  isRetrying,
  nextRetryIn,
  manualRetry,
};
```

---

## C4 – Chybějící testy pro time calculation edge cases (P1 KVALITA)

**Soubor:** `src/utils/__tests__/timeCalculations.test.ts` – **neexistuje**  
**Závažnost:** P1 – kritická logika bez unit testů  

**Problém:**  
`timeCalculations.ts` obsahuje složitou logiku:
- Výpočet actual departure time s delay
- Travel time selection (average vs per-trip)
- Cache invalidation
- Fallback chain (realtime → cache → hardcoded)
- Edge cases: `boardDirection` undefined, neplatné ISO časy, DST přechody, midnight boundary

**Žádné testy** neexistují pro:
- `calculateActualDepartureTime` s delay 0, >60 min, null
- `getEnhancedTravelTime` s různými scénáři: cache hit, cache miss, API fail, boardDirection=undefined
- `selectBestTravelTime` s prázdným polem, jen fallback, mix real+average
- `formatTime` s neplatným ISO stringem

**Scénář selhání:**  
Změna v `getStopIdsForTrip` (např. přidání nové stanice Libeň) může rozbít travel time pro existující směry, ale testy to nezachytí. Produkce zobrazuje `--:--` nebo `0min` travel time místo fallbacku.

**Návrh opravy:**  
Vytvořit `src/utils/__tests__/timeCalculations.test.ts` s coverage:
```typescript
describe('calculateActualDepartureTime', () => {
  it('adds delay to scheduled time', () => { ... });
  it('returns scheduled time when delay is 0', () => { ... });
  it('handles null delay', () => { ... });
});

describe('getEnhancedTravelTime', () => {
  it('returns cached value within TTL', () => { ... });
  it('falls back to hardcoded when API fails', () => { ... });
  it('returns fallback for unknown boardDirection', () => { ... });
  it('validates bus duration is 5-60 min', () => { ... });
});

describe('selectBestTravelTime', () => {
  it('prefers average over individual trips', () => { ... });
  it('returns null for empty array', () => { ... });
});
```

**Priorita:** Pokrýt alespoň `getEnhancedTravelTime` a `calculateActualDepartureTime` před dalšími změnami.

---

## C5 – Travel-time cache size limit se neprověřuje před přidáním (P2 OPTIMALIZACE)

**Soubor:** `src/utils/timeCalculations.ts:35-53`  
**Závažnost:** P2 – může způsobit mírný memory leak  

**Problém:**  
Funkce `cacheTravelTime` přidá záznam do `Map` a **pak** zkontroluje velikost. Pokud `size > maxCacheSize`, prochází cache a maže staré. Ale nový záznam už je v cache, takže `size` může přechodně být `maxCacheSize + 1`. Při rapidním ukládání (např. 50 departures najednou) může cache narůst nad limit.

**Scénář selhání:**  
`maxCacheSize = 50`, app načte 60 departures v scheduled mode → cache má 60 záznamů → cleanup smaže staré, ale na okamžik byl heap vyšší.

**Návrh opravy:**  
Nejprve zkontrolovat velikost a vyčistit, **pak** přidat:
```typescript
const cacheTravelTime = (cacheKey: string, duration: number, line: string, mode: 'train' | 'bus'): void => {
  // Cleanup před přidáním
  if (travelTimeCache.size >= TRAVEL_TIME_CONFIG.maxCacheSize) {
    const now = Date.now();
    for (const [key, entry] of travelTimeCache.entries()) {
      if (now - entry.timestamp.getTime() > TRAVEL_TIME_CONFIG.cacheDuration) {
        travelTimeCache.delete(key);
      }
    }
    // Pokud stále plný, smazat nejstarší
    if (travelTimeCache.size >= TRAVEL_TIME_CONFIG.maxCacheSize) {
      const oldest = [...travelTimeCache.entries()]
        .sort((a, b) => a[1].timestamp.getTime() - b[1].timestamp.getTime())[0];
      if (oldest) travelTimeCache.delete(oldest[0]);
    }
  }

  travelTimeCache.set(cacheKey, { duration, timestamp: new Date(), line, mode });
};
```

---

## C6 – Tichá chyba při neznámém boardDirection (P2 INFO)

**Soubor:** `src/utils/timeCalculations.ts:78-87`  
**Závažnost:** P2 – edge case, ale měl by se logovat  

**Problém:**  
Pokud `departure.boardDirection` je `undefined` nebo neznámá hodnota (např. API vrátí nový směr `'to-liben'`), `getStopIdsForTrip` vrací `{ departureStopId: null, arrivalStopId: null }`. Caller (`getEnhancedTravelTime`) to zachytí a vrátí `hardcodedFallback`, ale **bez logu**. Debugování, proč某个 směr nepoužívá realtime data, je obtížné.

**Scénář selhání:**  
PID přidá novou zastávku/směr, app začne vracet departures s novým `boardDirection`, ale travel time zůstává na fallbacku. Developer neví, že je problém, dokud se nepodívá do kódu.

**Návrh opravy:**  
Přidat warning log v `getEnhancedTravelTime` když `departureStopId` nebo `arrivalStopId` jsou null:
```typescript
const { departureStopId, arrivalStopId } = getStopIdsForTrip(departure, pragueStation);
if (!departureStopId || !arrivalStopId) {
  logger.warn(`Unknown boardDirection for trip ${departure.tripId}: ${departure.boardDirection}, using fallback`);
  return hardcodedFallback;
}
```

---

## C7 – Test pidApi.test.ts má zavádějící název (P2 DOKUMENTACE)

**Soubor:** `src/api/__tests__/pidApi.test.ts:6`  
**Závažnost:** P2 – test neověřuje co tvrdí  

**Problém:**  
Test `'shares identical in-flight requests and caches per limit'` ověřuje, že při dvou paralelních requestech se stejným URL se fetch zavolá jen jednou (dedupe). Ale **neověřuje cachování** – cache se testuje jen implicitně (druhý request má jiný limit, takže jiný cache key → jiný záznam v cache). Test by se měl jmenovat `'deduplicates identical in-flight requests'`.

**Návrh opravy:**  
Přejmenovat test, přidat samostatný test pro cache:
```typescript
it('deduplicates identical in-flight requests', async () => {
  // ... stávající test
});

it('caches responses within TTL', async () => {
  // Mock fetch, zavolat getDepartures, počkat <BOARD_CACHE_TTL, zavolat znovu,
  // ověřit fetch byl volán jen jednou
});
```

---

## C8 – Unused import Radio v DateTimePicker (P2 CLEANUP)

**Soubor:** `src/components/DateTimePicker.tsx:2`  
**Závažnost:** P2 – dead import  

**Problém:**  
Import `Radio` z `lucide-react` se používá v JSX na řádku 54, takže **není** unused. False alarm – **tento finding není platný**.

---

## C9 – Chybějící testy pro DepartureBoard, DepartureGrid (P2 KVALITA)

**Soubor:** `src/components/__tests__/DepartureBoard.test.tsx`, `DepartureGrid.test.tsx` – **neexistují**  
**Závažnost:** P2 – UI logika netestována  

**Problém:**  
Komponenty `DepartureBoard` a `DepartureGrid` obsahují UI logiku:
- Sorting departures podle času (řádek 105-108 DepartureBoard)
- Countdown formatting (`formatCountdown`)
- Arrival time calculation (`getArrivalTime`)
- Error/loading states (DepartureGrid)
- Station toggle (DepartureGrid řádky 115-131)

**Žádné testy** neexistují pro tyto scénáře. Změna v sorting logice nebo countdown formatování může rozbít UI, ale CI to nezachytí.

**Návrh opravy:**  
Vytvořit snapshot testy + unit testy pro kritickou logiku:
```typescript
// src/components/__tests__/DepartureBoard.test.tsx
describe('DepartureBoard', () => {
  it('sorts departures by actual departure time', () => { ... });
  it('formats countdown as "teď" when <=0 in live mode', () => { ... });
  it('formats countdown as "+5 min" in scheduled mode', () => { ... });
  it('calculates arrival time with travel time and delay', () => { ... });
});

// src/components/__tests__/DepartureGrid.test.tsx
describe('DepartureGrid', () => {
  it('shows loading state when no data and isLoading=true', () => { ... });
  it('shows error with retry button when error prop is set', () => { ... });
  it('toggles prague station and calls onChange', () => { ... });
});
```

---

## Shrnutí

**P0 kritické:**  
- C1: Chybný `minutesBefore` pro budoucí datum → opravit prioritně

**P1 důležité:**  
- C2: Race condition v travel-time efektu → přidat AbortController  
- C3: Nová `refreshData` funkce každý render → useCallback  
- C4: Chybějící testy pro `timeCalculations.ts` → přidat unit testy

**P2 nice-to-have:**  
- C5: Cache size limit se nekontroluje před přidáním → cleanup před insert  
- C6: Tichá chyba při neznámém `boardDirection` → přidat warning log  
- C7: Zavádějící název testu → přejmenovat  
- C9: Chybějící testy pro UI komponenty → přidat snapshot + unit testy

**Celkový stav:** Build, lint, testy procházejí. Kód je čistý, ale má 1 kritickou chybu (C1) a několik optimalizací/testovacích mezer.
