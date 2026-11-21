# UX/Accessibility Review – Nerad (Praha departures)

**Testováno:** 2026-11-21  
**Prostředí:** Vite dev server (localhost:3000), desktop + iPhone 15 Pro + iPad Air  
**Stav API:** PID API vracelo 429 (rate limit), testovány error stavy

---

## Kritické nálezy (P0)

### U1.01 – Chybí aria-live region pro automatické aktualizace
**Kde:** DepartureGrid.tsx, všechny komponenty s polling  
**Problém:** Když se data automaticky obnoví (live mode), čtečka obrazovky neohlásí změnu odjezdů.  
**Dopad:** Zrakově postižený uživatel neví, že se tabulka aktualizovala, musí ji ručně procházet znovu.  
**Návrh řešení:** Přidat `<div role="status" aria-live="polite" aria-atomic="true">` s textem jako "Odjezdy aktualizovány v 17:14" do DepartureGrid nebo hlavního layoutu. Můžete použít sr-only třídu, pokud nechcete viditelný text.

### U1.02 – Delay indikace pouze barvou (červená)
**Kde:** DepartureBoard.tsx:157–165  
**Problém:** Zpoždění je signalizováno pouze červenou barvou (`text-red-400`), bez textového označení nebo ikony.  
**Dopad:** Uživatelé s barvoslepostí nebo špatným kontrastem nepoznají, že je odjezd zpožděný.  
**Návrh řešení:** Přidat vizuální indikátor (např. `⚠️` ikonu nebo text "zpožděno") vedle času, nebo použít `aria-label="Odjezd zpožděn o ${delay} minut"` na elementu s časem.

---

## Důležité nálezy (P1)

### U1.03 – Radio toggle nemá focus outline ve všech tématech
**Kde:** DepartureGrid.tsx:115–131, radio tlačítka Masarykovo/Bubny  
**Problém:** Tlačítka mají `role="radio"` a `aria-checked`, ale při navigaci klávesnicí (Tab) není jasně vidět, které tlačítko má focus (zejména v dark theme).  
**Dopad:** Uživatelé na klávesnici nevidí, kam přesně navigovali.  
**Návrh řešení:** Přidat explicitní focus-ring třídu (stejně jako u ostatních tlačítek) nebo použít `focus-visible:ring-2 focus-visible:ring-primary-500` na každé tlačítko.

### U1.04 – Datetime picker nemá vizuální indikaci validity/rozsahu
**Kde:** DateTimePicker.tsx:34–43  
**Problém:** Input má `min` a `max`, ale když uživatel zkusí zadat čas mimo rozsah (např. za 100 dní), není jasná chybová zpráva.  
**Dopad:** Uživatel si nemusí všimnout, že datum nebylo akceptováno, a bude se divit, proč se nic nestalo.  
**Návrh řešení:** Přidat validaci `onBlur` a zobrazit zprávu "Datum musí být mezi dnes a +90 dní" (toast nebo text pod inputem), nebo použít `aria-invalid="true"` a `aria-describedby` s chybovou zprávou.

### U1.05 – Chybí indikace prázdného stavu pro screenreadery
**Kde:** DepartureBoard.tsx:115–122  
**Problém:** Když nejsou žádné odjezdy, komponenta vrací statický text "Žádné odjezdy", ale bez `role="status"` nebo `aria-live`.  
**Dopad:** Čtečka obrazovky neohlásí změnu z "načítání" na "žádné odjezdy", uživatel může čekat na data, která už nedorazí.  
**Návrh řešení:** Přidat `role="status"` a `aria-live="polite"` k prázdnému stavu.

---

## Doporučení (P2)

### U1.06 – Zlepšit kontrast "Za X min" sloupce
**Kde:** DepartureBoard.tsx:187–191  
**Problém:** Text "Za X min" má barvu `text-white` nebo `text-primary-400`, ale na dark backgroundu s glassmorphism může být kontrast pod WCAG AA (zejména `text-primary-400`).  
**Dopad:** Horší čitelnost pro uživatele s nižším zrakem nebo v jasném prostředí.  
**Návrh řešení:** Zkontrolovat kontrast v obou tématech (použít nástroj jako WebAIM Contrast Checker). Zvážit použití silnějšího odstínu nebo přidání text-shadow.

### U1.07 – Live badge a "jízdní řád" badge nemají aria-label
**Kde:** Header.tsx:47–55  
**Problém:** Badge "live" a "jízdní řád" jsou pouze vizuální, nemají `aria-label` vysvětlující jejich význam.  
**Dopad:** Čtečka obrazovky přečte pouze "live" nebo "jízdní řád" bez kontextu.  
**Návrh řešení:** Přidat `aria-label="Živé odjezdy"` a `aria-label="Zobrazuji jízdní řád"` k span elementům.

### U1.08 – Chybí loading state announcement při ručním refresh
**Kde:** Header.tsx:61–71, DepartureGrid.tsx loading state  
**Problém:** Když uživatel klikne na "Obnovit", tlačítko se deaktivuje a spinner se točí, ale čtečka obrazovky neohlásí "Načítání...".  
**Dopad:** Uživatel čtečky neví, zda se akce provedla.  
**Návrh řešení:** Přidat `aria-live="assertive"` region, který ohlásí "Načítání dat o odjezdech" při kliknutí na refresh.

### U1.09 – Skip link nefunguje na mobilních čtečkách správně
**Kde:** App.tsx:40–45  
**Problém:** Skip link používá `sr-only` a `focus:not-sr-only`, což je dobrá praxe, ale na iOS VoiceOver se někdy zobrazí mimo viditelnou oblast.  
**Dopad:** Zrakově postižený uživatel na mobilu může mít problém s aktivací skip linku.  
**Návrh řešení:** Zkontrolovat pozici `focus:absolute focus:top-4 focus:left-4` na mobilních viewportech a přidat `focus:z-[9999]` pro zajištění viditelnosti nad všemi prvky.

### U1.10 – Responsive breakpointy skrývají "Cesta" sloupec předčasně
**Kde:** DepartureBoard.tsx:183–185  
**Problém:** Sloupec "Cesta" (travel time) je `hidden sm:block`, takže na mobilu zmizí, ale na tabletech (iPad Air) je dost místa.  
**Dopad:** Uživatel na tabletu nevidí dobu cesty, ačkoli by se to vešlo.  
**Návrh řešení:** Změnit breakpoint na `hidden md:block` nebo použít container queries.

---

## Pozitivní zjištění

✅ **Výborné aria-label na všech interaktivních prvcích** (tlačítka, inputy)  
✅ **Role semantics** – správné použití `role="banner"`, `role="table"`, `role="row"`, `role="cell"`, `role="radiogroup"`  
✅ **Keyboard navigation** – všechny ovládací prvky jsou focusable a mají focus-ring  
✅ **Skip-to-content link** – přítomen v App.tsx  
✅ **Error states** – pěkně zpracované s ikonou, textem, retry tlačítkem a aria-role="alert"  
✅ **Loading states** – spinner s aria-role="status" a text "Načítání spojů"  
✅ **Icons mají aria-hidden="true"** – správně, aby čtečka nečetla "train icon"  
✅ **Datetime input má aria-label** – "Vybrat datum a čas odjezdu"  
✅ **Theme toggle má aria-label** – "Přepnout na světlé/tmavé téma"  
✅ **Responsive design** – aplikace funguje na všech testovaných viewportech (desktop, iPhone 15 Pro, iPad Air)  

---

## Screenshot analýza

| Zařízení | Soubor | Poznámka |
|----------|--------|----------|
| Desktop 1280×900 | desktop.png | Světlé téma, data načtena, přehledné rozložení |
| Desktop 1280×900 | desktop-dark.png | Tmavé téma, error state s retry countdown |
| iPhone 15 Pro | iphone-15-pro.png | Tmavé téma, error state, mobil skrývá některé sloupce |
| iPad Air | ipad-air.png | Tmavé téma, error state, dobré využití prostoru |
| Desktop bubny | bubny-view.png | Přepnutí na Bubny funguje, jiné odjezdy |

**Kontrast v dark theme:** V pořádku, bílý text na tmavém pozadí s glass efektem má dostatečný kontrast.  
**Error state UX:** Výborné – ikona, zpráva, pokus X/5, retry tlačítko + countdown "Další pokus za Xs".  
**Mobile responsiveness:** Dobrá, header se zalamuje, tlačítka jsou dostatečně velká pro touch.

---

## Nápady na funkce

1. **Upozornění před odjezdem** – Možnost nastavit notifikaci (Web Push API nebo localStorage + upozornění v UI) X minut před vybraným odjezdem. Např. "Vlak S4 odjíždí za 10 minut".

2. **Oblíbené spojení** – Tlačítko "★" u každého odjezdu pro uložení oblíbených spojů (např. "S4 v 7:23 do Masarykova"). Seznam oblíbených na samostatné záložce nebo dropdown.

3. **Historie cest** – Zaznamenat, které spoje uživatel zobrazoval (localStorage), a nabídnout rychlý výběr "Poslední hledané časy" vedle datetime pickeru.

4. **Mapa s polohou vlaku/autobusu** – Integrace s real-time GPS daty z PID (pokud je API poskytuje) – zobrazit na mapě, kde přesně je vlak S4, který mi jede za 5 minut.

5. **Offline mode** – Service Worker pro cachovací jízdní řády (aspoň pro příštích 24h), aby aplikace fungovala i bez internetu. Indikace "offline data" s časem posledního stažení.

---

**Celkové hodnocení:** 8/10  
Aplikace má velmi dobrou a11y základnu (aria-labels, role, keyboard nav, skip link), ale chybí dynamické oznámení změn pro čtečky obrazovky (aria-live) a indikace zpoždění by měla být víc než jen barva.
