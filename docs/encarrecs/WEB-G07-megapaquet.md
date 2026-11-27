---
id: WEB-G07
assignat: gemini
zona: verda
branca: gemini/WEB-G07
estat: obert
fase: 3
---

# WEB-G07 · Megapaquet: reserves amb confirmació, regressió visual a la CI i informe de registre

## Objectiu (una frase)

Deixar el selector de reserves a punt per engegar-lo amb **confirmació manual**, posar la regressió visual a la CI i preparar
un **informe de registre** («tu» / «vosaltres») perquè el propietari pugui decidir el registre de la web amb tot a la vista.

## Context

- **Llegeix abans de començar:** `AGENTS.md`, `eines/LLEGEIX-ME.md`, `reserva.js`, `plantilles/reserva.mjs`,
  `proves/reserva.mjs`, `diagnostic.js` (funció `resultat`), `proves/visual.mjs`, `.github/workflows/comprovacions.yml`,
  `plantilles/textos.mjs` i `proves/contractes/reserva.json` (nou: contracte de les reserves amb rgpd-tool).
- **Les reserves ja existeixen a rgpd-tool, però estan apagades.** Quan algú reserva, la reserva queda **pendent**: una persona
  la confirma després i el visitant rep la confirmació per correu, amb el fitxer del calendari adjunt. Per això la resposta del
  `POST` porta ara `"estat": "pendent"` (vegeu el contracte). El selector actual diu «Trucada reservada» i ofereix el botó
  «Afegir al calendari»: això ja no és cert mentre no hi hagi la confirmació.
- **Registre:** el propietari encara no ha decidit si la web pública parla de «tu» o de «vosaltres» (en castellà, «tú» o
  «vosotros»). Hi ha pàgines de cada manera. La part C **no canvia cap text**: només en fa un inventari.

## Abast

**Pots tocar o crear:** `reserva.js`, `plantilles/reserva.mjs`, `plantilles/textos.mjs` (només claus noves de la part A),
`styles.css` o `pagines.css` (classes noves al final, només si cal), `proves/reserva.mjs`, `proves/visual.mjs`,
`.github/workflows/comprovacions.yml` (només el job nou de la part B), una eina nova `eines/registre.mjs`, una prova nova
`proves/registre.mjs`, i `eines/LLEGEIX-ME.md`.

**NO pots tocar:** `contingut/` (cap fitxer: la part C no corregeix res), `plantilles/formularis/`, `proves/contractes/`,
`proves/formularis.cjs`, `diagnostic.html`, `recollida.html`, `wizard/`, `necessito-dpo/`, `es/necesito-dpo/`, `es/autotest-saas/`,
`obligacions-ia/`, `fonts/`, `marca.css`, `_headers`, `package.json`. Les proves noves no s'afegeixen a `package.json`: ho fa
Claude en integrar. A `reserva.js`, la constant **`ACTIVA` es queda a `false`**.

**Paritat:** tot el que no sigui la part A ha de generar un `dist/` idèntic a `main`. Abans de començar, fes-ne una còpia:
`node eines/construir.mjs --sortida /tmp/web-g07-main-dist`.

---

## Part A · Selector de reserves amb confirmació manual (commit `WEB-G07a`)

1. **Resposta del `POST`:** si porta `estat: 'pendent'`, el pas final és una **sol·licitud rebuda**, no una reserva feta:
   - títol (focus, com ara): ca «Sol·licitud rebuda», es «Solicitud recibida»;
   - detall: el dia i l'hora demanats, com ara (`exitDetall`);
   - text: ca «Us confirmarem l'hora per correu. Si no us arriba, reviseu el correu brossa o escriviu-nos.», es «Os
     confirmaremos la hora por correo. Si no os llega, revisad la carpeta de correo no deseado o escribidnos.»;
   - enllaç «Escriviu-nos» / «Escribidnos» cap a `contacteHref`;
   - **sense** el botó «Afegir al calendari» (el fitxer arriba per correu quan es confirma).
2. Si la resposta **no** porta `estat` (format antic), el comportament actual es manté igual (compatibilitat).
3. Textos nous al diccionari de `reserva.js` (ca i es) amb el mateix registre que la resta del selector («vosaltres» /
   «vosotros»). Si `plantilles/reserva.mjs` mostra algun text que parli de «reserva feta» o de «confirmació immediata», adapta'l
   amb claus noves a `textos.mjs` (ca i es).
4. **`proves/reserva.mjs`:**
   - les respostes simulades de l'API surten de **`proves/contractes/reserva.json`** (llegeix-lo; no copiïs els objectes a mà),
     de manera que si el contracte canvia, la prova ho detecta;
   - cas nou: `POST` amb `estat: 'pendent'` → títol «Sol·licitud rebuda», cap botó de calendari, cap descàrrega `.ics`, focus al
     títol i text a la regió `aria-live`;
   - cas de compatibilitat: `POST` sense `estat` → comportament actual (botó i `.ics`);
   - els casos que ja hi havia (409, 404, `franges: []`, error de xarxa, `/reserva/` sense `t`, `ACTIVA = false` sense cap petició,
     botons de 44 px, CSP real) continuen passant.
5. Captures abans/després del pas final (375 i 1280 px) **no** calen: aquesta pantalla només existeix amb `ACTIVA = true`. Fes
   que la prova desi, si s'executa amb `--captures <carpeta>`, una captura del pas «Sol·licitud rebuda» a 375 i 1280 px (ca i es).

## Part B · Regressió visual a la CI (commit `WEB-G07b`)

1. Job nou `visual` a `.github/workflows/comprovacions.yml`, **informatiu** (`continue-on-error: true`), que:
   - fa el checkout amb `fetch-depth: 0` (o `git fetch origin main`), construeix `main` en una carpeta temporal fora del
     repositori amb `git worktree add` i la branca actual a `dist/`;
   - executa `node proves/visual.mjs --base <dist de main> --amplades 375,1280` (sense `--estricte`);
   - escriu el resum (pàgines idèntiques, pàgines amb diferències i el percentatge de cadascuna) a `$GITHUB_STEP_SUMMARY`, en
     una taula Markdown.
   - **Cap acció nova de tercers** fora de les oficials que ja es fan servir (`actions/checkout`, `actions/setup-node`). No
     pugis captures com a artefacte.
2. `proves/visual.mjs`: afegeix l'opció `--resum-markdown <fitxer>`, que escrigui aquesta taula, i fes que el job la faci
   servir. Si la branca és `main`, el job s'omet.
3. Documenta-ho a `eines/LLEGEIX-ME.md`.

## Part C · Informe de registre «tu» / «vosaltres» (commit `WEB-G07c`)

Eina **de només lectura**: no modifica cap fitxer de contingut.

1. `eines/registre.mjs` (sense dependències): construeix la web amb esborranys en una carpeta temporal fora del repositori,
   llegeix el **text visible** de cada pàgina `.html` (sense `<script>`, `<style>` ni atributs, però sí `aria-label`, `alt`,
   `placeholder` i `title`) i hi detecta formes de cada registre:
   - català, «tu»: pronoms i possessius (`tu`, `et`, `t'`, `-te`, `el teu`, `la teva`, `els teus`, `les teves`) i verbs en
     segona persona del singular d'ús freqüent (per exemple: `tens`, `pots`, `vols`, `necessites`, `fas`, `ets`, `saps`,
     `tractes`, `descobreix`, `demana`, `escriu`, `respon`, `comença`);
   - català, «vosaltres»: `vosaltres`, `us`, `-vos`, `vostre`, `vostra`, `vostres` i les formes de segona del plural
     (`teniu`, `podeu`, `voleu`, `necessiteu`, `feu`, `sou`, `sabeu`, `tracteu`, `descobriu`, `demaneu`, `escriviu`, `responeu`,
     `comenceu`);
   - castellà: «tú» (`tú`, `tu`, `te`, `tienes`, `puedes`, `quieres`, `necesitas`, `tu empresa`…) i «vosotros» (`vosotros`,
     `os`, `vuestro`, `tenéis`, `podéis`, `queréis`, `necesitáis`…).
   Evita els falsos positius més clars (per exemple, «us» dins d'una paraula, «et» en llatí o en noms propis, «te» com a
   substantiu en castellà) i documenta al codi les regles i els límits.
2. Sortida: `captures/registre/informe.md` (la carpeta `captures/` ja és ignorada per git), amb:
   - una taula per pàgina: idioma, ruta, si és esborrany, nombre de formes «tu» i «vosaltres» i **registre dominant**
     («tu», «vosaltres», «mixt» o «cap»);
   - per a les pàgines mixtes, la llista de frases on apareix cada forma (amb 60 caràcters de context);
   - un resum al principi: quantes pàgines hi ha en cada registre i quines frases d'interfície comunes (menú, peu, botons de
     `textos.mjs`) fan servir cada forma.
   Ús: `node eines/registre.mjs [--sense-esborranys]`.
3. `proves/registre.mjs`: prova l'eina amb textos inventats (frases en cada registre, frases mixtes i els falsos positius de
   l'apartat 1) i comprova que no modifica cap fitxer del repositori (compara `git status --porcelain` abans i després).
4. Al resum final, enganxa la **taula de resum** de l'informe (no l'informe sencer).

## Part D · Documentació (commit `WEB-G07d`)

`eines/LLEGEIX-ME.md`: selector de reserves amb estat «pendent» (i com es prova amb el contracte), job `visual` de la CI, i
eina d'informe de registre (com executar-la i com llegir-ne el resultat).

---

## Criteris d'acceptació (verificables)

1. `npm run construir` sense errors i `node proves/visual.mjs --base /tmp/web-g07-main-dist --amplades 1280 --estricte` sense
   cap diferència (la part A no canvia cap pàgina amb `ACTIVA = false`).
2. `node proves/reserva.mjs` correcta (els casos nous i els antics), fent servir les respostes de `proves/contractes/reserva.json`.
3. `node proves/registre.mjs` correcta i `node eines/registre.mjs` genera l'informe sense tocar cap fitxer seguit per git.
4. La sintaxi del workflow és vàlida (YAML correcte, el job nou té `continue-on-error: true` i no afegeix accions de tercers).
5. `npm run contractes` continua donant 4 `ok`, i `npm run textos` correcta (claus ca/es completes).
6. `git diff --name-only origin/main...` només conté fitxers de «Pots tocar».

## Restriccions

- Sense dependències noves, secrets, rastrejadors ni tercers. Sense `localStorage`, `sessionStorage` ni galetes.
- Res inventat. La part C **no corregeix** cap text: només n'informa.

## Lliurament

Branca `gemini/WEB-G07` des de `main`, 4 commits (`WEB-G07a` … `WEB-G07d`) en aquest ordre, `git push -u origin gemini/WEB-G07`
i el **resum final** d'`AGENTS.md`, amb la taula de resum de la part C i el **temps total**.
