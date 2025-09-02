---
# Zadání jednoduché webové aplikace – Jízdní řád z a do Řeže

## Popis projektu
Cílem je vytvořit jednoduchou webovou aplikaci, která zobrazuje aktuální nejbližší odjezdy veřejné dopravy z a do určených zastávek včetně případného aktuálního zpoždění. Aplikace bude pracovat s vlakovou linkou S4 a autobusovou linkou 371. Data budou čerpána z [PID Departure Boards API](https://api.golemio.cz/pid/docs/openapi/).

***

## Požadavky na funkcionalitu

1. **Zobrazované linky a zastávky:**

   - Vlak S4
     - Směr z: Řež → Praha Masarykovo nádraží
     - Směr do: Praha Masarykovo nádraží → Řež
   - Autobus 371
     - Směr z: Husinec, Řež rozcestí → Praha Kobylisy
     - Směr do: Praha Kobylisy → Husinec, Řež rozcestí

2. **Data k zobrazení pro každý směr:**

   - Nejbližší odjezd (aktuální)
   - 2 následující odjezdy
   - U každého odjezdu zobrazit:
     - Typ dopravy (vlak/autobus)
     - Číslo linky
     - Směr jízdy
     - Čas odjezdu v lokálním čase
     - Aktuální zpoždění v minutách (pokud je k dispozici)

3. **Technické požadavky:**

   - Použití PID Departure Boards API („GET v4/pid/transferboards“) z API Golemio.cz
   - Autentizace pomocí API klíče (v hlavičce `Authorization: ApiKey secret`)
   - Limita zobrazených odjezdů na 3 na každý směr (nejbližší + 2 následující)
   - Formát času ISO 8601 v API převést na lokální a zobrazit ve formátu HH:mm
   - Web musí být responzivní, vhodný pro desktop i mobil

4. **Uživatelské rozhraní:**

   - Přehledné rozdělení pro jednotlivé směry a linky
   - Zvýraznění nejbližšího odjezdu
   - Zobrazení zpoždění, pokud existuje (např. „zpoždění: 3 min“)
   - Zobrazení chybové zprávy, pokud data nejsou dostupná

5. **Doporučení:**

   - Implementace pravidelné obnovy dat (např. každých 30 s)
   - Ošetření výpadků API nebo prázdných výsledků
   - Kód i dokumentace přehledně odděleny

***

## Příklad API volání

```
GET https://api.golemio.cz/pid/v4/pid/transferboards
?stopPlaceId={ID_zastávky}
&lineId={ID_linky}
&direction={směr}
&limit=3
```

Hlavička s API klíčem:

```
Authorization: ApiKey secret
```

Parametry pro zastávky a linky musí být doplněny dle PID identifikátorů odpovídajících zastávek Řež, Praha Masarykovo, Husinec, Řež rozcestí a Kobylisy.

***

## Příklad získané odpovědi (JSON) a zpracování

```json
{
  "departures": [
    {
      "line": "S4",
      "mode": "train",
      "direction": "Praha Masarykovo nádraží",
      "scheduledTime": "2025-09-02T16:20:00+02:00",
      "delay": 2
    },
    {
      "line": "S4",
      "mode": "train",
      "direction": "Praha Masarykovo nádraží",
      "scheduledTime": "2025-09-02T17:00:00+02:00",
      "delay": 0
    },
    {
      "line": "S4",
      "mode": "train",
      "direction": "Praha Masarykovo nádraží",
      "scheduledTime": "2025-09-02T17:40:00+02:00",
      "delay": null
    }
  ]
}
```

***

## Ukázka React komponenty pro zobrazení odjezdů

```jsx
function DepartureBoard({ departures }) {
  return (
    <div>
      <h2>Nejbližší odjezdy</h2>
      <ul>
        {departures.map((dep, index) => (
          <li key={index} style={{ fontWeight: index === 0 ? 'bold' : 'normal' }}>
            {dep.mode.toUpperCase()} {dep.line} → {dep.direction} 
            : {new Date(dep.scheduledTime).toLocaleTimeString([], {hour: '2-digit', minute: '2-digit'})}
            {dep.delay ? ` (zpoždění: ${dep.delay} min)` : ''}
          </li>
        ))}
      </ul>
    </div>
  );
}
```

***

## Další doporučení ke zpracování

- Pro každý směr (4 kombinace) zavolat API s příslušnými parametry a získat 3 odjezdy.
- Výstupy sjednotit UI do přehledu na jedné stránce.
- Implementovat polling dat (např. přes `setInterval`) pro aktualizaci zpoždění.
- Zobrazit informaci o chybě při neúspěšném načtení dat.
- Dodržet konzistenci časových pásem a formátů.
- Upřesnit PID ID zastávek dle dokumentace PID API.

***

Toto zadání poskytuje podrobný popis funkcionality i příklady kódu pro snadnou implementaci i další rozšíření. Rád pomohu i s výběrem technologií, API integrací nebo UI/UX návrhem.

***

Pokračovat ve vypracování konkrétního technického plánu nebo implementace?

Sources
[1] Otevřená data PID | Pražská integrovaná doprava ... https://pid.cz/o-systemu/opendata/
[2] Mobilní aplikace PID Lítačka | Pražská integrovaná ... https://pid.cz/informace-k-cestovani/mobilni-aplikace/
[3] Pražská integrovaná doprava | API Store by Apitalks https://api.store/czechia-api/prazska-integrovana-doprava/
[4] PID - Odjezdová tabule - Home Assistant - CZ fórum https://www.homeassistant-cz.cz/viewtopic.php?t=751
[5] 1 Základní informace o cílovém řešení https://zakazky.operatorict.cz/document_audit_2188/p4_funkcni-a-technicke-pozadavky-pdf
[6] Mobilní aplikace „PID info“ zjednoduší cestování v Praze i v ... https://pid.cz/mobilni-aplikace-pid-info-zjednodusi-cestovani-v-praze-v-regionu/
[7] Zadání bakalářské práce https://dspace.cvut.cz/bitstream/handle/10467/102032/F8-BP-2022-Krupicka-Zdenek-thesis.pdf?sequence=-1
[8] Sledování polohy vozidel PID: kde je právě můj autobus? https://www.root.cz/clanky/sledovani-polohy-vozidel-pid-kde-je-prave-muj-autobus/
[9] Často kladené dotazy (FAQ) https://pid.cz/informace-k-cestovani/faq/




