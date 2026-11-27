---
id: WEB-G05
assignat: gemini
zona: verda
base: main (amb WEB-G04 integrat)
branca: gemini/WEB-G05
estat: obert
fase: 3 (embut: reserves) + 2 (SEO/GEO) + eines de validació
mida: molt gran (sis parts; un commit per part, en aquest ordre). Temps orientatiu: el doble que WEB-G04 (més d'una hora)
---
# WEB-G05 · Megapaquet: selector de reserves, taula de validació 2.0, textos centralitzats, cerca interna, llms.txt i etiquetes dels formularis

## Objectiu
Sis parts, en aquest ordre:
- **A:** el **selector de reserves propi** (pla, 5.5): component a la pantalla final del diagnòstic i pàgina `/reserva/`, contra
  una API que **encara no existeix** (la farà Claude a rgpd-tool). Tot queda **desactivat** a producció fins que l'API hi sigui.
- **B:** **taula de validació 2.0**: filtres, llista de marques per copiar o descarregar i instruccions per publicar.
- **C:** **textos d'interfície centralitzats** a `plantilles/textos.mjs` (ca i es), preparant el futur `/en/`.
- **D:** **cerca interna** sense tercers: índex generat a la construcció, pàgines `/cerca/` i `/es/buscar/`, i un cercador a la 404.
- **E:** **`/llms.txt`** generat amb el contingut publicat (orientació per als cercadors amb IA).
- **F:** **etiquetes dels formularis** (`label for` / `id`) i `<h1>` de `necessito-dpo/`, i documentació.

Cap part genera contingut nou per validar (no s'escriu cap text jurídic). A producció només poden canviar: la 404 (part D),
els formularis de la portada (només atributs, part F), `necessito-dpo/` (part F) i els fitxers nous (`/cerca/`, `/es/buscar/`,
`/reserva/`, `/llms.txt`, `reserva.js`, `cerca.js`). Tota la resta: paritat de `dist/` amb `main`.

## Context (llegeix-ho tot abans de començar)
- `AGENTS.md`, `eines/LLEGEIX-ME.md` i els encàrrecs `WEB-G02` (semàfor i `<div id="reserva" hidden>`), `WEB-G03` i `WEB-G04`.
- `diagnostic.html` i `diagnostic.js` (`resultat()`, `CALENDARI_URL`), `turnstile.js` (patró d'un script propi petit i sense
  dependències), `_headers` (la CSP per defecte ja permet `connect-src https://rgpd.madeinhuman.cat`: **no cal tocar-la**).
- `eines/construir.mjs`, `plantilles/marc.mjs`, `plantilles/serveis.mjs` (`marcInterior`, `COMU`), `plantilles/actualitat.mjs`,
  `plantilles/sectors.mjs`, `plantilles/base.mjs`, la plantilla de la 404 (vegeu WEB-T13 i `proves/pagina-404.mjs`).
- `proves/diagnostic-resultat.mjs` (com s'intercepta l'API amb Playwright), `proves/esborranys.mjs`, `proves/accessibilitat.mjs`
  (`PENDENTS_DE_CLAUDE`), `proves/formularis.cjs` i `proves/contractes/` (contracte amb rgpd-tool: **només lectura**).

**Pots tocar o crear:** `eines/construir.mjs`, `eines/LLEGEIX-ME.md`, `plantilles/*.mjs` (fitxers nous inclosos, p. ex.
`plantilles/textos.mjs`, `plantilles/reserva.mjs`, `plantilles/cerca.mjs`), `styles.css` (classes noves al final), fitxers nous a
l'arrel `reserva.js`, `cerca.js`, `diagnostic.js` (**només** per muntar el selector dins de `resultat()`: cap canvi a preguntes,
validació ni enviament), `diagnostic.html` (**només** afegir `<script src="reserva.js"></script>` i estils del selector dins del
`<style>`), `plantilles/formularis/*.html` (**només** afegir `id`, `for` i `aria-describedby`; mai canviar `name`, `value`,
`type`, l'ordre ni el text), `necessito-dpo/index.html` (**només** `<h1>` estàtic i, si cal, classes de `necessito-dpo/estils.css`),
proves noves `proves/reserva.mjs`, `proves/textos.mjs`, `proves/cerca.mjs`, `proves/llms.mjs`, i les proves existents
`proves/esborranys.mjs`, `proves/accessibilitat.mjs` (treure les excepcions que arreglis), `proves/pagina-404.mjs`.
**NO pots tocar:** `contingut/`, `proves/contractes/`, `proves/formularis.cjs`, `recollida.html`, `wizard/`, `fonts/`,
`marca.css`, `_headers`, `package.json`, `.github/`, `necessito-dpo/src/` ni `necessito-dpo/dades/`.
Les proves noves no s'afegeixen a `package.json` ni a la CI: ho fa Claude en integrar.

## Part A · Selector de reserves (desactivat fins que hi hagi l'API)

### API que farà Claude a rgpd-tool (implementa el client exactament així)
- `GET https://rgpd.madeinhuman.cat/api/public/reserva/franges?t=<token>`
  → `200 { "ok": true, "zona": "Europe/Madrid", "durada": 20, "franges": [ { "id": "f_…", "inici": "2026-12-03T09:00:00+01:00", "fi": "2026-12-03T09:20:00+01:00" } ] }`
  → `404 { "ok": false, "error": "token" }` (token desconegut o caducat) · `200` amb `franges: []` (no n'hi ha cap de lliure).
- `POST https://rgpd.madeinhuman.cat/api/public/reserva` amb JSON `{ "t": "<token>", "franja": "f_…" }`
  → `200 { "ok": true, "inici": "…", "fi": "…" }` · `409 { "ok": false, "error": "ocupada" }` · `404 { "ok": false, "error": "token" }`
  · `400 { "ok": false, "error": "dades" }`.
- El token és opac (el genera rgpd-tool). La resposta del diagnòstic hi afegirà, en el futur, un camp `tokenReserva`; avui no hi és.

### Què has de fer
1. **`reserva.js`** (sense dependències, com `turnstile.js`): exposa `window.MadeinhumanReserva.muntar(contenidor, token, idioma)`.
   Té una constant `var ACTIVA = false;` al començament: si és `false`, `muntar()` no fa res i **no fa cap petició**.
2. **Interfície** (català; deixa preparat el castellà amb un diccionari dins de `reserva.js`):
   - carrega les franges i les agrupa per dia («dimecres 3 de desembre»), amb l'hora local de `zona` (`Intl.DateTimeFormat` amb
     `timeZone`), i un avís «Hores en horari de Catalunya»;
   - cada franja és un botó de com a mínim 44 px; en triar-ne una, pas de confirmació («Confirmar la trucada de 20 minuts del …»);
   - èxit: missatge, botó «Afegir al calendari» que descarrega un `.ics` generat al navegador (`Blob`; `SUMMARY`, `DTSTART`,
     `DTEND` en UTC, `UID`, sense dades personals) i el text «Us enviarem la confirmació per correu»;
   - errors: `409` → «Aquesta hora s'acaba d'ocupar» i es recarreguen les franges; `404` → «L'enllaç ja no és vàlid» amb enllaç a
     `/#contacte`; xarxa o `franges: []` → enllaç a `/#contacte`;
   - accessibilitat: grup amb `role="radiogroup"` o botons amb `aria-pressed`, `aria-live="polite"` per als estats, focus al títol
     de cada pas, res d'animacions amb `prefers-reduced-motion`.
3. **Diagnòstic:** a `resultat()`, si la resposta porta `tokenReserva` **i** `ACTIVA` és `true`, munta el selector a `#reserva`
   (treu `hidden`) i amaga el botó de `CALENDARI_URL`. Si no, tot queda exactament com ara.
4. **Pàgina `/reserva/`** (plantilla nova, marc interior en català, `noindex, nofollow`, fora del mapa del lloc): llegeix `t` de
   l'URL, l'esborra de la barra d'adreces amb `history.replaceState` i munta el selector. Sense `t`: «Per reservar una trucada, feu
   el diagnòstic gratuït o escriviu-nos» amb enllaços a `/diagnostic` i `/#contacte`. Amb `ACTIVA = false`, el mateix missatge.
5. **Prova `proves/reserva.mjs`** (Playwright, sense internet, servidor local com les altres): treballa sobre una **còpia temporal**
   de `dist/` amb `ACTIVA = true` i intercepta les dues adreces de l'API. Casos: franges agrupades per dia i hora correcta
   (inclòs un canvi d'hora d'estiu/hivern), reserva correcta i `.ics` vàlid, `409` amb recàrrega, `404`, `franges: []`, error de
   xarxa, `/reserva/` sense `t`, `t` esborrat de l'URL, muntatge a `/diagnostic` només si hi ha `tokenReserva`, botons ≥ 44 px a
   375 px, cap error de consola ni infracció de CSP (amb les capçaleres reals de `_headers`, com `proves/csp.cjs`). I sobre el `dist/`
   real (`ACTIVA = false`): cap petició a l'API ni a `/diagnostic` ni a `/reserva/`. En acabar:
   `totes les comprovacions del selector de reserves correctes`.
6. `npm run contractes` ha de continuar donant 4 `ok` (el cos del diagnòstic no canvia).
7. Commit: `WEB-G05a: selector de reserves propi (desactivat)`.

## Part B · Taula de validació 2.0 (`/esborranys/`, només vistes prèvies)
1. **Filtres** per tipus i idioma amb enllaços que porten els valors a l'URL (`/esborranys/?tipus=sector&idioma=es`), perquè
   «Enrere» torni a la mateixa vista. Sense JavaScript es veu tota la taula; amb JavaScript (un script petit propi), es filtra.
2. Columna «fitxer» llegible (sense trencar el camí lletra a lletra: nom curt visible i camí complet en `title`).
3. Per a cada esborrany, un desplegable `<details>` amb la llista de les seves marques `[REVISAR` (text complet). A dalt, botons
   «Copiar totes les marques» (porta-retalls) i «Descarregar en Markdown» (`Blob`, fitxer `marques-revisar.md` agrupat per fitxer).
4. Un requadre «Com es publica un esborrany» amb els passos: resoldre les marques, posar `estat: publicat` i la `data_revisio`
   des del panell, i comprovar la vista prèvia. Text curt, en català, registre «tu» (és per al propietari).
5. Proves a `proves/esborranys.mjs` (estàtiques: atributs dels filtres, `<details>` per esborrany, recompte i Markdown generat).
6. Commit: `WEB-G05b: taula de validació amb filtres i llista de marques`.

## Part C · Textos d'interfície centralitzats
1. Crea `plantilles/textos.mjs` amb un diccionari `{ ca: {…}, es: {…} }` i una funció `t(idioma, clau, valors)` (substitució
   simple de `{n}`, `{data}`…). Hi passes **tots** els textos fixos visibles de `plantilles/actualitat.mjs`, `plantilles/sectors.mjs`
   i de la taula d'esborranys (molles, títols de blocs, franges, crides per defecte, «N min de lectura», «En aquesta guia»…).
   Les plantilles els llegeixen d'aquí.
2. **Paritat estricta**: `dist/` de producció **i** el de `--esborranys` han de ser idèntics byte a byte als d'abans de la part C
   (desa'ls abans de començar la part C i compara-hi).
3. Prova `proves/textos.mjs`: cada clau existeix en `ca` i en `es`, cap valor buit, cap clau sense ús, i cap dels textos coneguts
   (llista dins de la prova) no queda escrit directament a les plantilles migrades.
4. Commit: `WEB-G05c: textos d'interfície centralitzats`.

## Part D · Cerca interna (sense tercers)
1. A la construcció, genera `/cerca/index.json` (pàgines en català) i `/es/buscar/index.json` (en castellà) amb, per pàgina
   **publicada i indexable**: `url`, `titol`, `descripcio` i els `h2` (sense el cos sencer). Cap esborrany, cap pàgina `noindex`.
2. Pàgines `/cerca/` i `/es/buscar/` (`noindex, follow`, marc interior, fora del mapa del lloc) amb un camp de cerca i resultats
   (script propi `cerca.js`, sense dependències): sense accents ni majúscules, coincidència de totes les paraules, títols primer,
   màxim 20 resultats, `?q=` a l'URL (enllaçable i compatible amb «Enrere»), missatge si no n'hi ha i enllaç a `/#contacte`.
   Sense JavaScript, un text amb enllaços a les seccions principals.
3. A la **404** (ca i es), un formulari `GET` cap a `/cerca/` (o `/es/buscar/`) amb el camp `q`. És un canvi visible: captures abans
   i després (`npm run captures -- g05-abans` a `main` i `npm run captures -- g05-despres`; si el navegador no s'obre al teu entorn,
   anota-ho).
4. Prova `proves/cerca.mjs` (sense navegador per a l'índex; amb Playwright per a la interfície, sobre el servidor local):
   l'índex només té pàgines publicades i indexables, cerca sense accents, `?q=` funciona, cap error de consola ni de CSP. Actualitza
   `proves/pagina-404.mjs` amb el formulari.
5. Commit: `WEB-G05d: cerca interna sense tercers`.

## Part E · `/llms.txt`
1. A la construcció, genera `/llms.txt` (format de [llmstxt.org](https://llmstxt.org/): `# Madeinhuman`, una línia `> ` amb la
   descripció de `lloc.json`, i seccions `## Serveis`, `## Preguntes freqüents`, `## Actualitat`, `## Sectors`, `## Legal` amb
   enllaços absoluts i una descripció curta de cada pàgina). Només pàgines **publicades i indexables**; les seccions sense pàgines no
   surten. Una secció `## Español` amb les pàgines en castellà. Sense text nou: tot surt dels camps que ja existeixen.
2. `robots.txt` no canvia.
3. Prova `proves/llms.mjs`: estructura, URLs absolutes que existeixen a `dist/`, cap esborrany ni `noindex` (també amb
   `--esborranys`, on ha de ser idèntic al de producció).
4. Commit: `WEB-G05e: llms.txt generat amb el contingut publicat`.

## Part F · Etiquetes dels formularis, `<h1>` de necessito-dpo i documentació
1. `plantilles/formularis/contacte.html` i `adequacio.html`: cada camp amb la seva `<label for="…">` i `id` únic a la pàgina
   (prefix per formulari, p. ex. `contacte-nom`), i `aria-describedby` on hi hagi text d'ajuda. **Cap altre canvi.** Comprova que el
   cos que s'envia és idèntic (`npm run contractes`: 4 `ok`; si el navegador no s'obre al teu entorn, anota-ho: ho comprova Claude).
2. `necessito-dpo/index.html`: un `<h1>` estàtic amb el títol de l'eina (el mateix text que ja es veu a la pantalla inicial; si
   l'aplicació ja pinta un `h1`, fes que no n'hi hagi dos). Captures abans i després si canvia res de visible.
3. Treu de `PENDENTS_DE_CLAUDE` les excepcions que hagis arreglat (`recollida.html` hi continua).
4. Documenta a `eines/LLEGEIX-ME.md`: selector de reserves (API, `ACTIVA`, com s'activarà), taula de validació, `textos.mjs`, cerca,
   `llms.txt` i les proves noves.
5. Commit: `WEB-G05f: etiquetes dels formularis, h1 de necessito-dpo i documentació`.

## Criteris d'acceptació
1. Proves noves correctes: `node proves/reserva.mjs`, `node proves/textos.mjs`, `node proves/cerca.mjs`, `node proves/llms.mjs`
   (les de navegador poden fallar al teu entorn: anota-ho, les passa Claude).
2. `node proves/esborranys.mjs`, `node proves/accessibilitat.mjs` (sense les excepcions arreglades), `node proves/pagina-404.mjs`,
   `npm run qualitat` i `npm run qualitat-esborranys` correctes.
3. Paritat: després de cada part, només canvien els fitxers que diu l'objectiu (llista-ho al resum amb el motiu).
4. `npm run exportar-esquema -- --comprovar` → `esquema.json al dia`; `npm run comprovar` en verd (navegador: anota-ho i continua).
5. Al resum: la llista de pàgines publicades que canvien, què fa el selector amb cada resposta de l'API, i el temps total.

## Restriccions
- Sense dependències noves, secrets, rastrejadors ni tercers (la CSP no canvia). Tot el text visible, escapat. Res a
  `localStorage`, `sessionStorage` ni galetes.
- No t'aturis a preguntar: si dubtes, tria l'opció més prudent i anota-ho. Si et quedes encallat més de 3 intents en una part,
  desa el que funcioni d'aquella part, passa a la següent i explica-ho al resum.

## Lliurament
Sis commits (`WEB-G05a` … `WEB-G05f`) a `gemini/WEB-G05`, `git push`, i el resum final d'`AGENTS.md`.
