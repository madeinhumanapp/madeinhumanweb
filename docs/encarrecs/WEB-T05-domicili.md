---
id: WEB-T05
assignat: mistral
zona: verda
base: main
branca: mistral/WEB-T05
estat: obert
fase: 0 (equip)
---
# WEB-T05 · El domicili només a l'avís legal

## Objectiu
Decisió del propietari: l'adreça postal (carrer i codi postal) només ha de sortir a l'avís legal (art. 10 LSSI-CE).
No ha de sortir al peu de les pàgines ni a les dades estructurades (JSON-LD) ni a les metaetiquetes de posició.
Al seu lloc, el peu diu on treballem.

## Context (llegeix-ho abans)
- `AGENTS.md`.
- `contingut/lloc.json`: `contacte.carrer`, `contacte.cp`, `contacte.ciutat` i el bloc `geo` (metaetiquetes).
- `esquema/blocs.mjs`: `CAMPS_CONTACTE` (camps que el panell deixa editar) i `validarLloc`.
- On surt avui l'adreça:
  - `plantilles/marc.mjs` (peu de les pàgines generades, element `<address>`);
  - `plantilles/serveis.mjs` (peu de les pàgines de servei i de la portada en castellà, i JSON-LD `PostalAddress`);
  - `plantilles/base.mjs` (omple `streetAddress` i `postalCode` del JSON-LD amb les dades de `lloc.json`);
  - `contingut/pagines/portada.ca.json` (JSON-LD de la portada: `address` i `geo`);
  - `plantilles/legal.mjs` (avís legal, `{{adreca}}`): **aquí s'ha de quedar**.

## Abast
- **Pots tocar:** `plantilles/marc.mjs`, `plantilles/serveis.mjs`, `plantilles/base.mjs`, `contingut/lloc.json`,
  `contingut/pagines/portada.ca.json` (només el JSON-LD), `esquema/blocs.mjs` (només `CAMPS_CONTACTE`), `esquema/esquema.json`
  (regenerat amb l'ordre), un fitxer nou `proves/domicili.mjs`, `package.json` (només per afegir l'ordre `domicili` i posar-la a `comprovar`).
- **NO pots tocar:** `plantilles/legal.mjs`, `contingut/legal/`, `diagnostic.html`, `recollida.html`, `wizard/`, `_headers`,
  `.github/`, `plantilles/formularis/`, `proves/contractes/`, ni cap altre fitxer. No esborris `carrer` ni `cp` de `lloc.json`:
  els fa servir l'avís legal.

## Què has de fer
1. **Camp nou** a `CAMPS_CONTACTE`: `zona: text('Zona de treball (peu)', 80, { ajuda: 'Surt al peu en lloc de l\'adreça' })`,
   i a `contingut/lloc.json`, `"zona": "Girona · Presencial a la demarcació i remot a tot Espanya"`.
   Executa `npm run exportar-esquema` i afegeix `esquema/esquema.json` al lliurament.
2. **Peu** (`plantilles/marc.mjs`): en lloc de `<address>carrer<br>cp ciutat</address>`, mostra el text de `contacte.zona`
   (sense etiqueta `<address>`). Peu de les pàgines de servei i de la portada en castellà (`plantilles/serveis.mjs`): treu el
   carrer i el codi postal; a les pàgines en català, posa-hi `contacte.zona`; a les de castellà, el text
   «Girona · Presencial en la demarcación y en remoto en toda España» (constant a `serveis.mjs`).
3. **JSON-LD:** a tot arreu on hi hagi `PostalAddress`, deixa només `addressLocality` (Girona), `addressRegion` i
   `addressCountry`: fora `streetAddress` i `postalCode` (a `portada.ca.json`, a `serveis.mjs` i a la funció de `base.mjs`,
   que no ha de tornar a afegir-los). Treu l'objecte `geo` del JSON-LD de la portada.
4. **Metaetiquetes de posició** (`contingut/lloc.json`, bloc `geo`): treu `geo.position` i `ICBM`; deixa `geo.region` i `geo.placename`.
5. **Prova nova `proves/domicili.mjs`** (sense navegador): llegeix `contacte.carrer` i `contacte.cp` de `contingut/lloc.json` i,
   recorrent tots els `.html` de `dist/`, comprova:
   - que **cap** pàgina conté el carrer ni el codi postal, **llevat de** `avis-legal.html`;
   - que `avis-legal.html` sí que els conté;
   - que cap JSON-LD de cap pàgina té `streetAddress`, `postalCode` ni `geo`;
   - que el text de `contacte.zona` surt al peu de la portada (`index.html`).
   En acabar ha d'escriure exactament: `totes les comprovacions del domicili correctes`.
6. Afegeix `"domicili": "node proves/domicili.mjs"` a `package.json` i posa `npm run domicili` dins de `comprovar`, després de `npm run construir`.

## Criteris d'acceptació
1. `npm run construir` sense errors.
2. `node proves/domicili.mjs` → `totes les comprovacions del domicili correctes`.
3. `npm run exportar-esquema -- --comprovar` → `esquema.json al dia`.
4. `npm run serveis`, `npm run actualitat` i `npm run comprovar` en verd (les proves amb navegador poden fallar al teu
   entorn per `libglib`: anota-ho al resum i continua; les passa Claude).
5. Al resum, la llista de pàgines on abans sortia l'adreça.

## Restriccions
- Sense dependències noves, secrets, rastrejadors ni tercers. Textos en català (i el de castellà, correcte).
- No escriguis l'adreça real en cap fitxer nou: la prova l'ha de llegir de `lloc.json`.

## Lliurament
Commit `WEB-T05: el domicili només a l'avís legal` a `mistral/WEB-T05`, `git push`, i el resum final d'`AGENTS.md`.
