---
id: WEB-G04
assignat: gemini
zona: verda
base: main (amb WEB-G03 integrat)
branca: gemini/WEB-G04
estat: obert
fase: 2 (SEO) + eines de validació
mida: molt gran (sis parts; un commit per part, en aquest ordre). Temps orientatiu: més d'una hora
---
# WEB-G04 · Megapaquet: taula de validació, actualitat en castellà, enllaçat intern i controls de qualitat de tota la web

## Objectiu
Sis parts, en aquest ordre (cadascuna depèn de les anteriors):
- **A:** una **taula de validació** a les vistes prèvies (`/esborranys/`) i les marques `[REVISAR` **ressaltades** dins de cada
  esborrany, perquè el propietari pugui validar els 30 esborranys ràpidament.
- **B:** **notícies i guies en castellà** (`/es/actualidad/…`) amb `grup_hreflang`, i, a les guies, **índex de continguts** i
  **temps de lectura**.
- **C:** **traducció al castellà** de les 5 guies en esborrany.
- **D:** **enllaçat intern** entre sectors i guies («Guies relacionades», «Altres sectors», «Sectors on s'aplica»).
- **E:** **controls de qualitat de tota la web**: enllaços interns, dades estructurades (JSON-LD), accessibilitat estàtica i pes
  de les pàgines, amb proves noves.
- **F:** **correccions** del que trobin els controls de la part E (si en troben) i documentació.

Res del contingut nou es publica: tot queda en `estat: esborrany`. A producció, les parts A-D no han de canviar **res**
(paritat de `dist/` amb `main`); només la part F pot canviar pàgines publicades, i cada canvi s'ha de justificar.

## Context (llegeix-ho tot abans de començar)
- `AGENTS.md`, `eines/LLEGEIX-ME.md` (notícies, sectors, esborranys) i els encàrrecs `WEB-T06`, `WEB-T11`, `WEB-G01`, `WEB-G02`
  i `WEB-G03`.
- `eines/construir.mjs` (mode esborranys: `CF_PAGES_BRANCH` ≠ `main` o `--esborranys`; com es construeixen actualitat i sectors).
- `plantilles/actualitat.mjs` (`renderArticle`, `paginesActualitat`, `paginesEsborranysActualitat`), `plantilles/sectors.mjs`
  (`grup_hreflang` i hreflang recíproc entre pàgines visibles), `plantilles/marc.mjs`, `plantilles/serveis.mjs`
  (`marcInterior`, textos comuns `COMU.ca` / `COMU.es`), `plantilles/markdown.mjs`.
- `esquema/blocs.mjs` (`CAMPS_NOTICIA`, `validarNoticia`), `esquema/sectors.mjs`, `eines/exportar-esquema.mjs`.
- Proves existents que han de continuar en verd: `actualitat`, `sectors`, `sitemap`, `hreflang`, `metadades`, `domicili`,
  `markdown`, `csp`, `pagina-404`, `serveis`.
- `contingut/sectors/*.json` (15 esborranys: 10 ca, 5 es) i `contingut/actualitat/2026-12-0N-*.md` (5 guies en esborrany).

**Pots tocar o crear (totes les parts):** `eines/construir.mjs`, `eines/exportar-esquema.mjs`, `eines/LLEGEIX-ME.md`,
`plantilles/actualitat.mjs`, `plantilles/sectors.mjs`, `plantilles/serveis.mjs`, `plantilles/marc.mjs`, `plantilles/base.mjs`,
`plantilles/legal.mjs`, `plantilles/blocs.mjs` (aquests quatre darrers **només** a la part F i només per corregir el que trobin les
proves), `esquema/blocs.mjs` (només notícies), `esquema/sectors.mjs`, `esquema/esquema.json` (regenerat), `styles.css` (classes
noves al final; a la part F, correccions puntuals), `proves/actualitat.mjs`, `proves/sectors.mjs`, proves noves
`proves/esborranys.mjs`, `proves/enllacos.mjs`, `proves/dades-estructurades.mjs`, `proves/accessibilitat.mjs`, `proves/pes.mjs`,
`contingut/sectors/*.json` (afegir camps d'enllaçat; el text no canvia), les 5 guies `contingut/actualitat/2026-12-0N-*.md`
(afegir `grup_hreflang`; el text no canvia) i fitxers **nous** a `contingut/actualitat/` (tots en `estat: esborrany`).
**NO pots tocar:** les 3 notícies publicades, `contingut/` fora del que s'ha dit, `plantilles/formularis/`, `proves/contractes/`,
`diagnostic.*`, `recollida.html`, `wizard/`, `necessito-dpo/`, `fonts/`, `marca.css`, `_headers`, `package.json`, `.github/`.
Les proves noves no s'afegeixen a `package.json` ni a la CI: ho fa Claude en integrar.

## Part A · Taula de validació a les vistes prèvies
1. En mode esborranys (i **només** en mode esborranys), una pàgina `/esborranys/` (`noindex, nofollow`, franja «Esborrany: pendent
   de validació», marc de la web en català) amb una taula de **tots** els esborranys: pàgines de sector (ca i es) i notícies/guies
   (ca i, després de la part B, es). Columnes: tipus (sector / guia / notícia), idioma, títol (enllaç a la pàgina), nombre de marques
   `[REVISAR`, traducció (enllaç a la pàgina del mateix `grup_hreflang`, si n'hi ha) i fitxer d'origen (`contingut/…`).
   Ordre: primer les que tenen **menys** marques (són les més a prop de poder-se publicar), després per tipus i títol.
   Damunt de la taula, un resum: total d'esborranys i total de marques.
2. A cada pàgina d'esborrany (sector o notícia), cada `[REVISAR: …]` del text visible es pinta dins de
   `<mark class="revisar" id="revisar-N">…</mark>` (N = 1, 2, 3… per pàgina) i, abans del peu, una caixa «Marques pendents (N)» amb
   la llista d'enllaços `#revisar-N` i el text de cada marca. Les pàgines sense marques no porten la caixa.
   Estil a `styles.css`: només variables de `marca.css`, sense animacions, llegible en mòbil.
3. La pàgina `/actualitat/esborranys/` que ja existeix es manté, i enllaça a `/esborranys/`.
4. A producció: no existeix `/esborranys/`, cap `<mark class="revisar"` enlloc i paritat de `dist/` amb `main`.
5. Prova nova `proves/esborranys.mjs` (sense navegador, amb fitxers temporals com `proves/sectors.mjs`): la taula llista tots els
   esborranys amb el recompte correcte; ordre per nombre de marques; enllaç de traducció; marques numerades i caixa amb els enllaços;
   escapament (una marca amb `<b>` no genera cap etiqueta); a producció no hi ha res de tot això. En acabar:
   `totes les comprovacions de la taula d'esborranys correctes`.
6. Commit: `WEB-G04a: taula de validació i marques ressaltades a les vistes prèvies`.

## Part B · Actualitat en castellà, índex de continguts i temps de lectura
1. Esquema de notícies: `idioma` admet `ca` i `es`; camp nou opcional `grup_hreflang` (mateixes regles que als sectors; un grup no
   pot tenir dues notícies del mateix idioma). Exporta l'esquema.
2. Rutes en castellà: `/es/actualidad/<slug>/`, llistat `/es/actualidad/` i `/es/actualidad/rss.xml` **només si hi ha notícies
   publicades en castellà** (avui no n'hi ha: a producció no surt res). Marc en castellà (`lang="es"`, menú i peu en castellà), textos
   fixos en castellà (molles «Inicio › Actualidad», «Darrera revisió jurídica» → «Última revisión jurídica», «Fuentes», «Te puede
   interesar», crida, «Más noticias», franja «Borrador: pendiente de validación»), enllaços a `/es/servicios/…` i
   `/es/#contacto` quan pertoqui. Les notícies en castellà no surten al llistat, al RSS ni a la portada en català, i al revés.
3. `hreflang`: si dues notícies comparteixen `grup_hreflang` i totes dues són visibles a la construcció, `ca` ↔ `es` recíprocs i
   `x-default` → la catalana; si no, només la pròpia llengua i `x-default` (el mateix criteri que els sectors).
4. Només per a `tipus_article: guia`: **temps de lectura** sota el títol («N min de lectura» / «N min de lectura» en castellà; paraules
   del cos / 200, arrodonit amunt, mínim 1) i **índex de continguts** («En aquesta guia» / «En esta guía») amb enllaços als `##`
   quan n'hi ha 3 o més (cada `h2` del cos rep un `id` estable a partir del text: minúscules, sense accents, guions; sense
   duplicats). Les notícies (`tipus_article` diferent de `guia`) queden **idèntiques**.
5. Proves a `proves/actualitat.mjs` (fitxers temporals): rutes i `lang` en castellà, llistat i RSS separats per idioma, hreflang
   recíproc, validació de grups, índex i temps de lectura només a les guies, ids dels `h2` únics, paritat de les notícies publicades.
6. Commit: `WEB-G04b: actualitat en castellà, índex i temps de lectura a les guies`.

## Part C · Traducció al castellà de les 5 guies
1. Afegeix `grup_hreflang` a les 5 guies catalanes (`2026-12-0N-*.md`) i crea les 5 versions en castellà
   (`contingut/actualitat/2026-12-0N-<slug-en-castella>.md`, `idioma: es`, el mateix `grup_hreflang`, `estat: esborrany`, sense
   `data_revisio`), amb `meta_descripcio` ≤ 155 i títol que doni un `<title>` ≤ 60 amb « · Madeinhuman».
2. **Només traduir**: castellà correcte, registre «vosotros», veu «nosotros», cap afegit; mantén cada `[REVISAR: …]`, traduït.
3. Comprova amb `node eines/construir.mjs --esborranys` que surten a `/es/actualidad/<slug>/` amb hreflang recíproc i que
   `metadades`, `hreflang`, `domicili` i `markdown` continuen en verd.
4. Commit: `WEB-G04c: traducció al castellà de les 5 guies`.

## Part D · Enllaçat intern entre sectors i guies
1. Sectors: camp nou opcional `articles_relacionats` (llista de 0-4 slugs de notícia del **mateix idioma**; la construcció falla si
   un slug no existeix o és d'un altre idioma). Bloc «Guies relacionades» / «Guías relacionadas» a la pàgina de sector amb les que
   siguin **visibles** a la construcció (a producció, només les publicades; a les vistes prèvies, també els esborranys). Si no n'hi
   ha cap de visible, no hi ha bloc.
2. A les guies, bloc automàtic «Sectors on s'aplica» / «Sectores donde se aplica»: les pàgines de sector visibles del mateix idioma
   que la citen a `articles_relacionats`. Si no n'hi ha, res.
3. Sectors: bloc «Altres sectors» / «Otros sectores» amb fins a 3 pàgines visibles del mateix idioma i el mateix `sector` (si no
   n'hi ha prou, completa amb altres sectors visibles del mateix idioma, per ordre de slug). Si no n'hi ha cap, res.
4. Omple `articles_relacionats` als 15 esborranys de sector amb les guies que hi encaixin (p. ex. videovigilància a comerç, gimnasos,
   comunitats i hostaleria; encarregat del tractament a gestories i clíniques; galetes a comerç en línia; bretxa i IA on tingui
   sentit). Les versions en castellà enllacen les guies en castellà.
5. A producció no canvia res (cap sector publicat). Proves a `proves/sectors.mjs` i `proves/actualitat.mjs`: validació dels slugs
   (inexistent, idioma diferent), blocs presents i absents segons la visibilitat, «Altres sectors» del mateix sector i idioma, i
   reciprocitat sector ↔ guia.
6. Commit: `WEB-G04d: enllaçat intern entre sectors i guies`.

## Part E · Controls de qualitat de tota la web (proves noves, sense navegador)
Cada prova recorre els `.html` de `dist/` (menys `_previsualitzacio/`) i s'ha de poder executar sobre la construcció de producció
(`npm run construir`) i sobre la d'esborranys (`node eines/construir.mjs --esborranys`), amb una opció `--arrel <carpeta>` com a
`proves/formularis.cjs`. Sense dependències noves: analitza l'HTML amb expressions regulars o un analitzador mínim propi.
Llista cada infracció amb la pàgina i el detall; en acabar, `totes les comprovacions de <tema> correctes`.
1. `proves/enllacos.mjs`: cada `href` i `src` intern (comença per `/` o és relatiu) apunta a un fitxer que existeix a la carpeta
   (tenint en compte que Pages serveix `/pagina.html` com a `/pagina` i `/carpeta/` com a `/carpeta/index.html`); cada `#fragment`
   d'una pàgina existeix com a `id` a la pàgina de destinació; cap enllaç `href=""` ni `href="#"` sense ús; els enllaços externs
   amb `target="_blank"` porten `rel` amb `noopener`. Llista final (informativa) de dominis externs enllaçats.
2. `proves/dades-estructurades.mjs`: cada `<script type="application/ld+json">` és JSON vàlid i té `@context` `https://schema.org`;
   per tipus: `Article`/`NewsArticle` (`headline`, `datePublished`, `author`, `publisher`, `inLanguage`), `BreadcrumbList`
   (posicions 1..n seguides, `item` absoluts amb `https://madeinhuman.cat`), `FAQPage` (cada pregunta amb resposta no buida),
   `Service` (`serviceType`, `areaServed`, `provider` o referència a l'empresa); cap `streetAddress`, `postalCode` ni `geo` fora de
   l'avís legal; cap URL interna amb `.html` si la pàgina canònica no en porta.
3. `proves/accessibilitat.mjs`: `<html lang>` present i coherent amb la ruta (`/es/` → `es`); un sol `h1`; cap salt de nivell de
   títol (p. ex. `h2` → `h4`); cada `<img>` amb `alt` (pot ser buit si és decorativa); cada camp de formulari amb `label` associada o
   `aria-label`; cap enllaç ni botó sense text accessible; `id` únics a cada pàgina; existeix `<main>`; els `<iframe>` (si n'hi ha)
   tenen `title`.
4. `proves/pes.mjs`: pes de cada pàgina (HTML + CSS + JS + imatges enllaçats localment, sense comptar dues vegades el mateix fitxer)
   amb un pressupost per defecte de 500 kB per pàgina (llevat de `recollida.html`, que en surt com a avís); llista de les 5 pàgines
   més pesants; cap imatge de més de 300 kB.
5. Executa les quatre proves sobre les dues construccions i **anota al resum totes les infraccions trobades** (encara no les
   corregeixis: és la part F). Si una regla dona falsos positius, ajusta la regla (no la pàgina) i explica-ho.
6. Commit: `WEB-G04e: controls de qualitat de tota la web (enllaços, JSON-LD, accessibilitat, pes)`. Si encara hi ha infraccions,
   les proves poden sortir amb error en aquest commit: s'arreglen a la part F.

## Part F · Correccions i documentació
1. Corregeix les infraccions de la part E dins dels fitxers permesos (plantilles i `styles.css`). **No** toquis `diagnostic.*`,
   `recollida.html`, `wizard/` ni `necessito-dpo/`: si les infraccions són allà, afegeix-les a una llista d'excepcions
   `PENDENTS_DE_CLAUDE` dins de la prova (surten com a avís) i anota-les.
2. Per a cada pàgina publicada que canviï, al resum: quina pàgina, què ha canviat i per què. Si el canvi és visible, captures abans i
   després amb `npm run captures -- g04-abans` (a `main`) i `npm run captures -- g04-despres` (si el navegador no s'obre al teu
   entorn, anota-ho: les fa Claude).
3. Documenta a `eines/LLEGEIX-ME.md`: la taula `/esborranys/` i les marques, l'actualitat en castellà, l'índex i el temps de
   lectura, l'enllaçat intern (`articles_relacionats`) i les quatre proves noves (què vigilen i com s'executen).
4. Commit: `WEB-G04f: correccions dels controls de qualitat i documentació`.

## Normes de contingut (parts C i D)
- Castellà correcte («vosotros»), veu de la marca «nosotros»; català normatiu. Glossari d'`AGENTS.md`.
- **Res inventat ni afegit**: la part C només tradueix, i la part D només afegeix camps d'enllaçat. Cap xifra, sanció, termini ni
  article nou. Cada `[REVISAR: …]` es manté.

## Criteris d'acceptació
1. `node proves/esborranys.mjs`, `node proves/actualitat.mjs` i `node proves/sectors.mjs` correctes (amb tots els casos nous).
2. `node proves/enllacos.mjs`, `node proves/dades-estructurades.mjs`, `node proves/accessibilitat.mjs` i `node proves/pes.mjs`
   correctes sobre la construcció de producció **i** sobre la d'esborranys (excepcions de `PENDENTS_DE_CLAUDE` com a avís).
3. `npm run exportar-esquema -- --comprovar` → `esquema.json al dia`.
4. `npm run construir`: paritat de `dist/` amb `main` **després de les parts A-D** (compara-ho abans de començar la part E); després
   de la part F, només les diferències que justifiques al resum.
5. `node eines/construir.mjs --esborranys`: 15 pàgines de sector, 10 guies en esborrany (5 ca + 5 es), `/esborranys/` i
   `/actualitat/esborranys/`; tots amb `noindex` i franja; `metadades`, `hreflang`, `domicili` i `markdown` en verd.
6. `npm run comprovar` en verd (les proves amb navegador poden fallar al teu entorn: anota-ho i continua).
7. Al resum: les infraccions de la part E (abans de corregir) i què s'ha fet amb cadascuna; la llista de pàgines publicades que han
   canviat; les marques `[REVISAR]` noves de la part C, agrupades per fitxer; i el temps total.

## Restriccions
- Sense dependències noves, secrets, rastrejadors ni tercers (la CSP no canvia). Tot el text visible, escapat.
- No t'aturis a preguntar: si dubtes, tria l'opció més prudent i anota-ho. Si et quedes encallat més de 3 intents en una part,
  desa el que funcioni d'aquella part, passa a la següent i explica-ho al resum.

## Lliurament
Sis commits (`WEB-G04a` … `WEB-G04f`) a `gemini/WEB-G04`, `git push`, i el resum final d'`AGENTS.md`.
