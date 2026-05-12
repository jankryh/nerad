# Changelog

## v2.4.0 - 2026-05-12

### Added
- **date/time picker** — výběr libovolného budoucího data a času odjezdů (až 90 dní dopředu)
- live mód (zelený badge) vs plánovaný mód (amber badge "jízdní řád")
- tlačítko "Živě" pro návrat do live módu
- API podpora `minutesBefore` parametru pro plánované dotazy
- client-side filtrování okna [T, T+4h]

### Changed
- dvousloupcový grid layout na desktopu (Do Prahy / Z Prahy vedle sebe)
- sekční nadpisy s ikonami šipek místo tenkých divider čar
- zvýrazněný countdown u prvního odjezdu (primary accent)
- hover efekt na řádcích odjezdů
- větší delay badge (+N) pro čitelnost
- departure time a countdown `lg:text-lg` na desktopu

### Removed
- urgency logika (missed/leave-now/soon/relaxed) — všechny spoje vypadají stejně
- footer s "stihnutelných" a "nejbližší" indikátory

## v2.1.0 - 2026-04-02

### Cleanup
- smazány Docker soubory (Dockerfile, docker-compose.yml, nginx.conf) — deployment pouze přes Vercel
- smazány deploy skripty (deploy.sh, deploy-simple.sh)
- smazány manuální testovací soubory (test-arrival-browser.html, test-arrival-console.js)
- smazána UBUNTU_DEPLOYMENT.md, COMPREHENSIVE_DOCUMENTATION.md, todo.md
- README.md přepsán — stručnější, sloučená technická dokumentace
- AGENTS.md aktualizován

## v2.0.0 - 2026-03-15

Major release projektu Řež <-> Praha.

### Added / Improved
- vylepšené UI tabule odjezdů
- 4 směry na jedné stránce
- zobrazení zpoždění
- přepočet relevantních časů
- stabilnější načítání z PID API
- Vercel/proxy deployment flow
