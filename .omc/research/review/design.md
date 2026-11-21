# Nerad: UX/Design Review – Informační hierarchie, layout a vizuální hierarchie

**Testováno:** 2026-11-21  
**Prostředí:** Produkce (https://nerad.vercel.app/)  
**Viewporty:** Desktop (2560×1800), iPad Air (820×1180), iPhone 15 Pro (393×852), iPhone SE (375×667)  
**Témata:** Světlé + tmavé  
**Zaměření:** Informační hierarchie, mobile layout, kontrast, přehlednost ovládání, mikrotexty

**Vyřazeno z rozsahu:** Accessibility (už provedeno v `ux.md` a `REPORT.md` #11, #15, #25) – zde pouze design a usability.

---

## Kontext použití

Aplikace slouží dojíždějícím Řež ↔ Praha, kteří si na mobilu rychle potřebují zjistit: **"Kdy jede další spoj a mám běžet?"**

Kritická informace: **čas do odjezdu (sloupec ZA)**, zejména první řádek.  
Sekundární: odkud jede (Masarykovo/Bubny), zpoždění, příjezd.

---

## Kritické nálezy (P1 – ovlivňuje běžné použití)

### D1.01 – Ovládací tlačítka pod minimální doporučenou velikostí pro touch

**Kde:** Header.tsx:61–71 (Obnovit), ThemeSelector.tsx:14–28, DepartureGrid.tsx:115–131 (Masarykovo/Bubny)  
**Problém:** Na iPhone 15 Pro (testováno browser eval):
- Obnovit: 40×28 px
- Světlé/Tmavé: 41×33 px
- Masarykovo: 91×24 px
- Bubny: 56×24 px
- Datetime picker: 185×33 px (šířka OK, výška ne)

Všechna tlačítka mají výšku pod 44px (iOS HIG minimum, WCAG 2.5.5 Level AAA doporučení 44×44 px).

**Dopad:** Dojíždějící s rukavicemi, velkými prsty nebo v rychlosti v metru má problém trefit malá tlačítka. Chybný klik na téma místo refresh, nebo místo Bubny klikne vedle.

**Návrh řešení:**
```tsx
// Header.tsx:65
className="... px-3 py-2.5 sm:py-2 ..." // mobilní py-2.5 → min 40px výška, desktop může zůstat menší

// ThemeSelector.tsx:16
className="... px-3 py-2.5 sm:py-2 ..."

// DepartureGrid.tsx:120, 126 (tlačítka Masarykovo/Bubny)
className="... px-4 py-2.5 ..." // zvýšit padding
```

**Priorita:** P1 – ovlivňuje každou interakci na mobilu.

---

### D1.02 – Čas do odjezdu (ZA) není vizuálně dominantní

**Kde:** DepartureBoard.tsx:187–191  
**Problém:** Sloupec "ZA" (jak dlouho do odjezdu) má stejnou velikost jako čas odjezdu:
- ZA: `text-sm sm:text-base lg:text-lg` (14px → 16px → 18px)
- ODJEZD: `text-sm sm:text-base lg:text-lg` (14px → 16px → 18px)

První řádek má modrou barvu (`text-primary-400`), ale velikost je stejná. Když uživatel otevře aplikaci v metru, **oko se musí najít, kde je čas do odjezdu** – není to první věc, která uživatele udeří do oka.

**Dopad:** Dojíždějící musí tabulku přečíst zleva doprava, místo aby okamžitě viděl "29 min" nebo "teď". Zpomaluje orientaci.

**Návrh řešení:**
```tsx
// DepartureBoard.tsx:188
<span className={`
  font-mono font-bold 
  text-lg sm:text-xl lg:text-2xl  /* větší než ODJEZD */
  ${index === 0 ? 'text-primary-400' : 'text-white'}
`}>
  {minutesUntil !== null ? formatCountdown(minutesUntil) : '--'}
</span>
```

Alternativně: první řádek může mít ZA extra-large (`text-2xl sm:text-3xl`), pokud je do 60 minut – když ještě dává smysl běžet.

**Priorita:** P1 – hlavní use case aplikace.

---

### D1.03 – Název aplikace oříznutý na mobilech

**Kde:** Header.tsx:44–46  
**Problém:**
- iPhone 15 Pro: "Řež ↔ Pra..." (truncate)
- iPhone SE (375px): "Řež ↔ P..." (ještě horší)

Uživatel nevidí "Praha", ačkoli je to klíčový kontext (kam jedu).

**Dopad:** Nejasné, kam aplikace jede. Pro návštěvníka nebo sdílený telefon není z názvu jasné, že je to do Prahy.

**Návrh řešení:**

**Varianta A (preferovaná):** Zkrácený text na mobilu, plný na desktopu:
```tsx
<h1 className="text-base sm:text-lg font-semibold text-white leading-tight">
  <span className="sm:hidden">Řež ↔ Praha</span>
  <span className="hidden sm:inline truncate">Řež ↔ Praha</span>
</h1>
```
A v CSS zajistit, že na mobilu se "Praha" nezobrazí zkráceně, nebo použít kratší variantu "Řež–Praha" (en dash místo šipky šetří cca 10px).

**Varianta B:** Ikona místo textu "Praha" na mobilech:
```tsx
<h1 className="...">
  Řež ↔ <span className="hidden sm:inline">Praha</span>
  <span className="sm:hidden">🏙️</span> {/* nebo lucide MapPin */}
</h1>
```

**Priorita:** P1 – branding a jasnost kontextu.

---

## Důležité nálezy (P2 – zlepšení UX)

### D2.01 – Nekonzistentní formát času v "ZA" sloupci

**Kde:** DepartureBoard.tsx:93–103 (`formatCountdown`)  
**Problém:** Formát se mění:
- 0–59 min: `"29 min"`, `"teď"`
- 60–119 min: `"1h"`, `"1h 20m"` (s mezerami)
- Plánovaný režim: `"+30 min"` nebo `"-5 min"`

Mezera mezi číslem a jednotkou někde je (`"1h 20m"`), někde ne (bylo by logičtější `"1h 20m"` vs `"29min"` bez mezery všude, nebo mezera všude).

**Dopad:** Mírně rušivé při rychlém čtení, oko musí přepínat mezi formáty. Není kritické, ale zpomaluje skenování tabulky.

**Návrh řešení:**
```tsx
const formatCountdown = (minutes: number): string => {
  if (targetDateTime) {
    const sign = minutes > 0 ? '+' : '';
    return `${sign}${minutes} min`;  // OK, konzistentní
  }
  if (minutes <= 0) return 'teď';
  if (minutes < 60) return `${minutes} min`;  // mezera OK
  const hours = Math.floor(minutes / 60);
  const rem = minutes % 60;
  return rem === 0 ? `${hours} h` : `${hours} h ${rem} m`;  // přidat mezery konzistentně
};
```
Nebo úplně bez mezer: `"29min"`, `"1h20m"` (kompaktnější, více švýcarský hodinový styl).

**Priorita:** P2 – detail, ale pravidelní uživatelé si všimnou.

---

### D2.02 – Příjezd (PŘÍJEZD) má nižší kontrast než odjezd

**Kde:** DepartureBoard.tsx:177–181  
**Problém:** Příjezd je `text-zinc-300` (světle šedá), zatímco odjezd je `text-white` (bílá).

V dark theme je `text-zinc-300` cca `rgb(212, 212, 216)` na `rgb(9, 9, 11)` backgroundu → kontrast ~16:1 (WCAG AAA).  
V light theme (pokud je) je to pravděpodobně také OK, ale příjezd je vizuálně méně důležitý než odjezd, což je správně.

**Dopad:** Žádný negativní – je to správná hierarchie. Příjezd je sekundární info, nižší kontrast je OK.

**Návrh řešení:** Žádný – toto je správně navržené. Ponechat jako **pozitivní nález**.

---

### D2.03 – "Cesta" sloupec skrytý na mobilech i tam, kde by se vešel

**Kde:** DepartureBoard.tsx:183–185  
**Problém:** Sloupec "Cesta" (doba jízdy) je `hidden sm:block` (640px breakpoint).

Na tabletech (iPad Air 820px) se zobrazuje, ale na menších tabletech nebo větších telefonech na šířku (landscape) by se vešel, ale není.

**Dopad:** Uživatel na větším telefonu nebo landscape orientaci nevidí dobu cesty, ačkoli by místo bylo (na iPhone 15 Pro landscape je ~852px šířka, takže by se vešlo).

**Návrh řešení:**
```tsx
<div className="hidden md:block w-14 flex-shrink-0" role="cell">
  <span className="text-xs text-zinc-500">{travelMin}min</span>
</div>
```
Změnit breakpoint z `sm:` (640px) na `md:` (768px), nebo použít `hidden lg:block` (1024px), pokud je sloupec skutečně jen pro desktop.

Nebo použít container queries (Tailwind 3.4+):
```tsx
<div className="hidden @md:block w-14 flex-shrink-0" role="cell">
```

**Priorita:** P2 – není kritické (na tabletech funguje), ale na větších telefonech zbytečně schovává užitečnou info.

---

### D2.04 – Live/jízdní řád badge na mobilu drobný, může ujít

**Kde:** Header.tsx:47–55  
**Problém:** Badge má `text-[10px]` (10px font), což je velmi malé i na retina displeji. Když je aplikace v plánovaném režimu (žlutý "jízdní řád"), může uživatel přehlédnout, že se **nedívá na live data**.

**Dopad:** Dojíždějící si myslí, že vidí živé časy, ale má otevřený plánovaný režim (např. zítra ráno) a běží ke spoji, který nejede.

**Návrh řešení:**
```tsx
{selectedDateTime ? (
  <span className="inline-flex items-center rounded-full bg-amber-500/10 px-2 py-1 text-xs font-medium text-amber-400">
    jízdní řád
  </span>
) : (
  <span className="inline-flex items-center rounded-full bg-emerald-500/10 px-2 py-1 text-xs font-medium text-emerald-400">
    live
  </span>
)}
```
Zvětšit z `text-[10px]` na `text-xs` (12px) a padding z `px-1.5 py-0.5` na `px-2 py-1`.

Nebo přidat ikonu k "jízdní řád" badge (📅 nebo lucide Calendar), která je výraznější než jen text.

**Priorita:** P2 – může vést k chybě (běžení za spojm, který nejede), ale uživatel si pravděpodobně všimne data v datetime pickeru.

---

### D2.05 – Desktop dvousloupcový layout nevyužívá celou šířku na velkých monitorech

**Kde:** DepartureGrid.tsx (dva sloupce Do Prahy / Z Prahy side-by-side na desktopu)  
**Problém:** Na velmi velkých monitorech (2560px testováno) je hodně prázdného místa po stranách. Tabule jsou omezené max-width kontejnerem, ale mohly by být širší nebo mít větší font.

**Dopad:** Na velkém monitoru (developer na 27" displeji) je aplikace malá uprostřed, font je relativně drobný.

**Návrh řešení:**
```tsx
// DepartureGrid.tsx nebo App.tsx – kontejner
<div className="max-w-7xl mx-auto px-4"> {/* místo max-w-4xl */}
```

Nebo na extra velkých obrazovkách (xl+) zvětšit font všude o stupeň:
```tsx
// DepartureBoard.tsx:157
className="font-mono font-bold text-sm sm:text-base lg:text-lg xl:text-xl"
```

**Priorita:** P2 – netýká se primárního use case (mobil v metru), ale desktop uživatelé (např. na domácím PC plánování cest) by uvítali větší velikost.

---

## Vylepšení a polish (P3 – nice-to-have)

### D3.01 – Tlačítko "Obnovit" na mobilu skrylo text, zůstala jen ikona

**Kde:** Header.tsx:70  
**Problém:** Text "Obnovit" je `hidden sm:inline`, takže na mobilu je jen ikona refresh (🔄). To je kompaktní, ale pro nové uživatele může být nejasné, co ikona dělá (tooltip se na mobilu nezobrazí při hover).

**Dopad:** Nový uživatel nemusí vědět, že ikona obnovuje data. Pravidelní uživatelé si zvyknou.

**Návrh řešení:**
Ponechat pouze ikonu je OK (úspora místa), ale přidat vizuální indikaci při refreshingu jasněji:
```tsx
<RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin text-primary-300' : 'text-white'}`} />
```
Nebo přidat krátký text i na mobilu: `"Obnovit"` → `"Refresh"` nebo jen na desktop plný text, mobil zkrácený není potřeba (ikona stačí).

**Priorita:** P3 – funguje, jen by mohlo být jasnější pro nové uživatele.

---

### D3.02 – Hodiny v headeru zabírají hodně místa na mobilech

**Kde:** Header.tsx:75–80  
**Problém:** Hodiny mají `text-sm sm:text-xl` (14px → 20px) a zabírají relativně hodně místa v headeru. Na mobilu je každý pixel cenný.

**Dopad:** Header je vysoký, uživatel musí scrollovat dolů, aby viděl druhý odjezd (iPhone SE).

**Návrh řešení:**
```tsx
<time 
  className="text-xs sm:text-xl font-bold text-white font-mono" // zmenšit z text-sm na text-xs (12px)
```

Nebo hodiny přesunout úplně doprava do headeru vedle theme toggle (na desktopech jsou už teď vpravo, na mobilu pod).

**Priorita:** P3 – úspora několika pixelů, ne kritické.

---

### D3.03 – Prázdný stav ("Žádné odjezdy") by mohl nabídnout akci

**Kde:** DepartureBoard.tsx:117–122  
**Problém:** Když nejsou žádné odjezdy (např. v noci nebo příliš vzdálený termín), uživatel vidí jen statický text "Žádné odjezdy v tomto čase".

**Dopad:** Uživatel neví, co má dělat – zkusit jiný čas? Vrátit se na live režim?

**Návrh řešení:**
```tsx
<div className="glass rounded-xl border border-white/10 p-6 text-center">
  <p className="text-white/50 text-sm mb-3">
    {targetDateTime ? 'Žádné odjezdy v tomto čase' : 'Žádné odjezdy'}
  </p>
  {targetDateTime && (
    <button
      onClick={() => onDateTimeChange(null)}
      className="text-primary-400 text-sm font-medium hover:text-primary-300"
    >
      Zpět na živé odjezdy
    </button>
  )}
</div>
```

Nebo nabídnout "Zkusit dřívější čas" tlačítko.

**Priorita:** P3 – edge case (prázdný stav), ale UX by bylo o něco přívětivější.

---

### D3.04 – Datetime picker kalendář má malé touch targety (nativní widget)

**Kde:** DateTimePicker.tsx:34–43  
**Problém:** `<input type="datetime-local">` používá nativní widget prohlížeče. Na iOS je to relativně dobré, ale na Androidu může být calendar picker drobný.

**Dopad:** Vybrat datum/čas na Android telefonu může být fiddly.

**Návrh řešení:**
Ponechat nativní widget (je rychlý a známý uživatelům), nebo implementovat custom picker s react-day-picker + time select (větší touch targets, ale více kódu).

Pro teď: nativní widget je OK, uživatelé jsou na něj zvyklí z jiných aplikací.

**Priorita:** P3 – nativní widget funguje, custom by byl improvement, ale není nutný.

---

### D3.05 – Masarykovo/Bubny přepínač by mohl být vizuálně výraznější

**Kde:** DepartureGrid.tsx:115–131  
**Problém:** Radio toggle má `text-xs` (12px) a `px-3 py-1` (malý padding). Na mobilu jsou tlačítka malá (Masarykovo 91×24, Bubny 56×24 – viz D1.01).

**Dopad:** Uživatel nemusí na první pohled vidět, že může přepnout stanici. Přepínač vypadá jako sekundární UI element.

**Návrh řešení:**
```tsx
<button
  className={`
    px-4 py-2.5 text-sm font-medium rounded-lg transition-all
    ${active ? 'bg-primary-500 text-white' : 'bg-white/5 text-white/60'}
    focus-ring
  `}
>
  {label}
</button>
```
Zvětšit font z `text-xs` na `text-sm` a padding na `py-2.5` (řeší i D1.01).

**Priorita:** P3 – funguje, ale mohlo by být výraznější.

---

### D3.06 – První řádek tabulky má světle modré pozadí, ale není to live-tracking

**Kde:** DepartureBoard.tsx:150  
**Problém:** První řádek má `bg-white/[0.02]` (velmi jemné světlejší pozadí) a ZA sloupec má `text-primary-400` (modrá). To je správná vizuální hierarchie, ale modrá barva může evokovat "tento spoj právě jede" (live tracking), což aplikace nedělá.

**Dopad:** Uživatel by mohl očekávat, že když je první řádek modrý, aplikace ukazuje, kde spoj právě je (GPS tracking).

**Návrh řešení:**
Ponechat modrou, je to jen zvýraznění "nejbližší odjezd". Pokud by se v budoucnu přidalo live tracking (mapa s polohou vlaku), použít jinou barvu (např. zelenou) pro tracked spoj.

**Priorita:** P3 – designový detail, ne chyba.

---

### D3.07 – Kontrast tlačítek v light theme

**Kde:** Header.tsx:65, ThemeSelector.tsx:16  
**Problém:** V light theme jsou tlačítka `bg-white/5` (velmi světlá) na světlém pozadí (`rgb(250, 250, 250)`). Hranice `border-white/10` může být slabá.

**Dopad:** V jasném prostředí (venku, okno) mohou být tlačítka hůř viditelná.

**Návrh řešení:**
Zkontrolovat kontrast v light theme a případně zvýšit alpha kanál:
```tsx
className="bg-white/10 border-white/20 dark:bg-white/5 dark:border-white/10"
```

Nebo použít theme-aware barvy z Tailwind:
```tsx
className="bg-gray-100 border-gray-200 dark:bg-white/5 dark:border-white/10"
```

**Priorita:** P3 – light theme se používá méně (commuters v metru mají dark), ale je dobré zkontrolovat.

---

### D3.08 – Tooltip na hodiny a ostatní elementy

**Kde:** Header.tsx:77–80 (hodiny), DateTimePicker.tsx:42 (datetime input)  
**Problém:** Hodiny mají `aria-label`, ale na desktopu při hover není tooltip s vysvětlením (např. "Aktuální čas na serveru" nebo "Váš místní čas").

**Dopad:** Uživatel nemusí vědět, jestli jsou hodiny jeho lokální čas nebo server time (v tomto případě to je lokální, protože `new Date()`).

**Návrh řešení:**
Přidat `title="Aktuální čas"` k time elementu. Tooltip je jen popisný, ne nutný.

**Priorita:** P3 – detail, většina uživatelů to nebude řešit.

---

### D3.09 – Loading state spinner velikost

**Kde:** DepartureGrid.tsx (loading spinner při načítání)  
**Problém:** Neověřeno v tomto review (nebyl screenshot loading state), ale pokud je spinner malý, může být na mobilu nejasné, že se načítá.

**Návrh řešení:**
Zkontrolovat velikost spinneru v loading state:
```tsx
<div className="flex justify-center items-center p-8">
  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500"></div>
</div>
```
Minimálně 48×48 px spinner na mobilu.

**Priorita:** P3 – loading state je většinou rychlý (do 1s).

---

### D3.10 – Ikona vlaku/autobusu v badge může být na mobilu nečitelná

**Kde:** DepartureBoard.tsx:169–174  
**Problém:** Ikona má `w-3 h-3` (12px) v badge `text-[11px] sm:text-xs`. Na malých telefonech může být ikona vlaku/autobusu těžko rozlišitelná.

**Dopad:** Uživatel musí číst text "S4" nebo "371" místo rozpoznání ikony.

**Návrh řešení:**
Zvětšit ikonu na mobilu:
```tsx
{departure.mode === 'train'
  ? <Train className="w-3.5 h-3.5 sm:w-3 sm:h-3" />
  : <Bus className="w-3.5 h-3.5 sm:w-3 sm:h-3" />
}
```

Nebo použít barvu ikony k rozlišení (vlak modrá, bus zelená) + zvětšit na `w-4 h-4`.

**Priorita:** P3 – číslo linky je jednoznačné, ikona je jen vizuální pomůcka.

---

## Pozitivní zjištění (co funguje dobře)

✅ **Dvousloupcový layout na desktopu** (Do Prahy / Z Prahy vedle sebe) – výborné využití prostoru, není potřeba scrollovat mezi sekcemi.

✅ **Responsive breakpointy** – layout se přizpůsobuje (mobilní stack, tablet single column s CESTA, desktop dvousloupcový).

✅ **Kontrast v dark theme** – text na dark backgroundu má dostatečný kontrast (bílá na černé, modrá pro urgentní časy).

✅ **Glassmorphism efekt** – jemný, nepřehnaný, moderní look.

✅ **První řádek zvýrazněný** – modré ZA a jemné pozadí jasně ukazují "tohle je nejbližší spoj".

✅ **Zpoždění červeně + "+X" text** – jasná indikace zpoždění (ne jen barvou, viz U1.02 vyřazeno).

✅ **Live badge zelený, jízdní řád žlutý** – barevné rozlišení režimů.

✅ **Kompaktní header na mobilu** – hodiny, theme, refresh, datetime picker se vejdou do 2 řádků.

✅ **Font mono pro časy** – dobře rozlišitelné číslice (5 vs S, 1 vs I).

✅ **Ikona vlak/bus v badge** – rychlá vizuální orientace (ačkoli drobná, viz D3.10).

✅ **Hover efekt na řádky tabulky** – jemný feedback při hover na desktopu.

✅ **Error state** (z ux.md) – pěkně zpracovaný s retry tlačítkem a odpočtem.

✅ **Loading state** – spinner + text "Načítání spojů".

---

## Top 5 změn s největším efektem (benefit/effort)

| # | Nález | Benefit | Effort | Soubory |
|---|---|---|---|---|
| 1 | **D1.02 – Zvětšit ZA sloupec** | Okamžitá orientace "kdy jede spoj" – hlavní use case | Nízký (změna text-sm → text-xl) | `DepartureBoard.tsx:188` |
| 2 | **D1.01 – Zvětšit touch targets tlačítek** | Méně chybných kliků na mobilu | Nízký (py-2 → py-2.5) | `Header.tsx:65`, `ThemeSelector.tsx:16`, `DepartureGrid.tsx:120,126` |
| 3 | **D1.03 – Opravit truncate názvu** | Jasný kontext "kam jedu" | Nízký (sm:hidden / hidden sm:inline) | `Header.tsx:44` |
| 4 | **D2.04 – Zvětšit live/jízdní řád badge** | Méně riziko, že uživatel přehlédne plánovaný režim | Nízký (text-[10px] → text-xs) | `Header.tsx:48,52` |
| 5 | **D2.01 – Konzistentní formát času** | Rychlejší čtení tabulky | Nízký (úprava formatCountdown) | `DepartureBoard.tsx:93-103` |

**Kombinace #1 + #2** pokrývá 80 % UX zlepšení pro dojíždějící na mobilu. Zbytek jsou vylepšení a polish.

---

## Shrnutí

**Celkové hodnocení:** 7.5/10 (design)

**Silné stránky:** Čistý, moderní design, dobře fungující responsive layout, jasná vizuální hierarchie mezi primárními a sekundárními daty (odjezd vs příjezd), výborné využití prostoru na desktopu (dvousloupcový layout).

**Hlavní slabiny:**
1. **Informační hierarchie:** Čas do odjezdu (ZA) není dostatečně dominantní – měl by být větší než čas odjezdu (D1.02).
2. **Touch targets:** Všechna tlačítka pod 44px minimum, což je problém na mobilech (D1.01).
3. **Název aplikace oříznutý** na mobilech ("Řež ↔ Pra...") – ztrácí se kontext (D1.03).

**Rychlé vítězství (low-hanging fruit):**
- Zvětšit ZA font z `text-base` na `text-xl` (1 řádek kódu, velký UX improvement)
- Přidat `py-2.5` na mobilní tlačítka (3 soubory, 5 minut práce)
- Opravit truncate názvu (1 řádek)

**Kontext:** Pro aplikaci zaměřenou na dojíždějící v metru je D1.02 (velikost ZA sloupce) **nejkritičtější nález** – když uživatel otevře aplikaci, první věc, kterou potřebuje vědět, je "mám běžet nebo můžu jít pomalu", což je informace v ZA sloupci. Ta by měla být vizuálně nejdominantnější element na obrazovce.
