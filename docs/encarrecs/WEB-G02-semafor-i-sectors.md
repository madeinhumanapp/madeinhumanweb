---
id: WEB-G02
assignat: gemini
zona: verda
base: main (amb WEB-G01 integrat)
branca: gemini/WEB-G02
estat: obert
fase: 3 (embut) + 2 (SEO)
mida: gran (dues parts; un commit per part)
---
# WEB-G02 · Resultat del diagnòstic en semàfor + enllaçat intern dels sectors

## Objectiu
- **Part A:** que la pantalla final de l'autotest (`/diagnostic`) mostri el resultat com un **semàfor** clar (verd, ambre o
  vermell), amb els 3 riscos principals i una crida a reservar una trucada, sense canviar res del que s'envia a rgpd-tool.
- **Part B:** que les pàgines de sector **publicades** (WEB-G01) quedin enllaçades des de les pàgines de servei i tinguin data
  de modificació al mapa del lloc. Avui no n'hi ha cap de publicada: a producció no ha de canviar res.

## Context (llegeix-ho tot abans de començar)
- `AGENTS.md` i `eines/LLEGEIX-ME.md`.
- `diagnostic.html` (estils dins de `<style>`) i `diagnostic.js`. La funció `resultat(d, email, comercial)` pinta la pantalla
  final amb la resposta de l'API: `{ ok, referencia, index (0-100), nivell ('baix'|'mitja'|'alt'), top (3 títols de risc),
  documentsOk, documentsTotal, documentsDubte }`. **Això és tot el que hi ha**: no inventis dades que l'API no dona.
- Llindars del motor (rgpd-tool): `baix` < 35, `mitja` 35-65, `alt` > 65. Fes servir el `nivell` que arriba, no recalculis.
- `marca.css`: colors de risc (`--risc-baix`, `--daurat-clar`, `--risc-alt`) i la resta de variables.
- `proves/formularis.cjs` (contracte: omple el diagnòstic i desa el cos enviat) i `proves/portada.mjs` o `proves/fil.mjs`
  (com es serveix `dist/` en local i es fan proves amb Playwright, sense sortir a internet; `--captures`).
- WEB-G01: `plantilles/sectors.mjs`, `esquema/sectors.mjs`, `proves/sectors.mjs`; `plantilles/serveis.mjs` (`pagina_servei`);
  `eines/construir.mjs` (mapa del lloc i `datesActualitatMapa`).

## Part A · Semàfor del resultat

**Pots tocar:** `diagnostic.js` (**només** `resultat()` i funcions auxiliars noves per pintar-la), `diagnostic.html` (**només**
el bloc `<style>`), i una prova nova `proves/diagnostic-resultat.mjs`.
**NO pots tocar:** les preguntes, la validació, l'enviament, els camps o els valors del formulari (són el contracte amb
rgpd-tool), `proves/contractes/`, `_headers`, `package.json`, `.github/`.

1. **Semàfor:** tres llums (verd, ambre, vermell) amb la del `nivell` encesa i les altres apagades. Al costat o a sota:
   l'etiqueta («Risc baix», «Risc mitjà», «Risc alt»), l'índex (`48 / 100`) i una frase curta per nivell, prudent i útil
   (p. ex. «Teniu una base, però hi ha punts que convé tancar»). Res de xifres de sancions ni de promeses.
2. **Accessibilitat:** el color no pot ser l'únic senyal (etiqueta de text sempre visible); el semàfor té `role="img"` i un
   `aria-label` complet («Risc mitjà: índex 48 sobre 100»); el focus va al títol del resultat; amb `prefers-reduced-motion`
   no hi ha cap animació. Contrastos suficients.
3. **Contingut sota el semàfor:** els 3 riscos de `top` (llista numerada), l'estat de la documentació (el text que ja hi ha:
   «N de M documents» o «pendent de confirmar»), l'avís de l'informe enviat per correu (el que ja hi ha) i la crida
   «Reservar una trucada de 20 minuts» (`CALENDARI_URL`, com ara). Deixa preparat un contenidor buit i ocult
   `<div id="reserva" hidden></div>` per a un futur selector de reserves propi (no hi posis res).
4. **Estils** a `<style>` de `diagnostic.html`: només variables de `marca.css` o dels àlies que ja hi ha; mòbil primer
   (375 px) i escriptori; cap degradat nou.
5. **Prova `proves/diagnostic-resultat.mjs`** (Playwright, sense internet, amb el mateix servidor local que les altres proves):
   omple el diagnòstic, intercepta `POST https://rgpd.madeinhuman.cat/api/public/diagnostic` i respon amb tres casos
   (`baix` 20, `mitja` 50, `alt` 80). Per a cadascun comprova: la llum correcta encesa i les altres no; l'etiqueta i l'índex;
   l'`aria-label`; els 3 riscos; la crida amb l'enllaç; cap error de consola ni infracció de CSP. Amb `--captures`, desa
   captures a `captures/diagnostic-resultat/` (375 i 1280 px, els tres casos). En acabar:
   `totes les comprovacions del resultat del diagnòstic correctes`.
6. `npm run contractes` ha de continuar donant 4 `ok` (el cos enviat no canvia).
7. Commit: `WEB-G02a: resultat del diagnòstic en semàfor`.

## Part B · Enllaçat intern dels sectors

**Pots tocar:** `plantilles/serveis.mjs` (**només** `pagina_servei`: una secció nova), `plantilles/sectors.mjs`,
`eines/construir.mjs` (passar les pàgines de sector publicades a les pàgines de servei i les dates al mapa del lloc),
`proves/sectors.mjs`, `styles.css` (classes noves al final, si cal).
**NO pots tocar:** `contingut/` (cap esborrany canvia d'estat), `package.json`, `.github/`, `_headers`.

1. A cada pàgina de servei en català, si hi ha pàgines de sector **publicades** amb aquell `servei_relacionat`, una secció
   «Per sectors» amb els enllaços (títol `h1` de la pàgina de sector i enllaç a `/sectors/<slug>/`). Si no n'hi ha cap,
   **res** (l'HTML de la pàgina de servei ha de ser idèntic a l'actual).
2. Mapa del lloc: les pàgines de sector publicades porten `lastmod` = `data_revisio` (si en tenen); l'índex `/sectors/` porta
   la data més recent de les publicades.
3. Proves a `proves/sectors.mjs` (amb fitxers temporals, com ara): amb un sector publicat amb `servei_relacionat: adequacio`,
   la pàgina de servei d'adequació l'enllaça i les altres no; el mapa del lloc té el `lastmod`; **sense** cap sector publicat,
   les pàgines de servei són idèntiques a les de `main`.
4. Commit: `WEB-G02b: enllaçat intern i dates dels sectors`.

## Criteris d'acceptació
1. `node proves/diagnostic-resultat.mjs` i `node proves/diagnostic-resultat.mjs --captures` correctes (si el navegador no
   s'obre al teu entorn, anota-ho: les passa Claude).
2. `node proves/sectors.mjs` correcte (inclosos els casos nous).
3. `npm run construir`: paritat amb `main` a totes les pàgines llevat de `diagnostic.html` (compara `dist/` amb una còpia de `main`).
4. `npm run contractes` amb 4 `ok` i `npm run comprovar` en verd (les proves amb navegador poden fallar al teu entorn: anota-ho i continua).

## Restriccions
- Sense dependències noves, secrets, rastrejadors ni tercers (la CSP no canvia). Textos en català, registre «vosaltres».
- No t'aturis a preguntar: si dubtes, tria l'opció més prudent i anota-ho al resum. Si et quedes encallat més de 3 intents
  en un punt, para, desa el que funcioni i explica-ho.

## Lliurament
Dos commits (`WEB-G02a`, `WEB-G02b`) a `gemini/WEB-G02`, `git push`, i el resum final d'`AGENTS.md`.
