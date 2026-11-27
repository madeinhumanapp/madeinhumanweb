---
id: WEB-G06
assignat: gemini
zona: verda
base: main (amb WEB-G05 integrat)
branca: gemini/WEB-G06
estat: obert
fase: 2 (qualitat i SEO) + 5 (autotest SaaS, esborrany)
mida: enorme (set parts; un commit per part, en aquest ordre). Temps orientatiu: tres o quatre vegades WEB-G05 (més d'una hora i mitja)
---
# WEB-G06 · Megapaquet: regressió visual automàtica, teclat i contrast, textos 100 % centralitzats, preguntes per servei, dades de l'empresa i autotest SaaS (esborrany)

## Objectiu
Set parts, en aquest ordre:
- **A:** **regressió visual automàtica**: una prova que compara, píxel a píxel, totes les pàgines amb les de `main` i fa un informe.
- **B:** **teclat, focus i contrast**: enllaç «Salta al contingut», focus visible, menú mòbil amb teclat i contrast WCAG AA, amb prova.
- **C:** **textos 100 % centralitzats** a `plantilles/textos.mjs` (totes les plantilles generades), amb paritat estricta.
- **D:** **preguntes freqüents a cada pàgina de servei**, a partir del camp `servei` que ja tenen les preguntes.
- **E:** **dades de l'empresa (JSON-LD) completes** amb el que ja hi ha a `lloc.json`.
- **F:** **autotest SaaS en castellà** (`/es/autotest-saas/`), **esborrany** sense enviament, amb les 12 preguntes del pla.
- **G:** documentació i neteja.

A producció només poden canviar: les pàgines de servei (part D, canvi visible), el focus i l'enllaç «Salta al contingut» (part B,
invisibles fins que es fa servir el teclat), el JSON-LD (part E) i els fitxers nous. Tota la resta: paritat de `dist/` amb `main`.

## Context (llegeix-ho tot abans de començar)
- `AGENTS.md`, `eines/LLEGEIX-ME.md` i els encàrrecs `WEB-G04` i `WEB-G05`.
- `eines/construir.mjs`, `plantilles/*.mjs` (sobretot `marc.mjs`, `base.mjs`, `blocs.mjs`, `serveis.mjs`, `legal.mjs`, `textos.mjs`),
  `styles.css`, `pagines.css`, `marca.css` (variables de color: **només lectura**), `menu.js`.
- `proves/portada.mjs`, `proves/fil.mjs`, `proves/csp.cjs` i `proves/cerca.mjs` (servidor local i Playwright sense internet).
  **Atenció:** algunes pàgines tenen animacions d'entrada; si a les captures desactives animacions amb CSS, comprova que el
  contingut no quedi invisible (p. ex. elements que comencen amb `opacity: 0`): espera que la pàgina estigui estable.
- `contingut/faq.json` i `contingut/faq.es.json` (camp `servei`), `contingut/serveis.json`, `contingut/lloc.json`.
- `necessito-dpo/` (patró d'eina estàtica: `index.html`, `src/`, `dades/`, `estils.css`) i `diagnostic.js` (patró de preguntes,
  progrés i resultat en semàfor).

**Pots tocar o crear:** `eines/construir.mjs`, `eines/LLEGEIX-ME.md`, `plantilles/*.mjs` (llevat de `plantilles/formularis/`),
`styles.css` i `pagines.css` (classes noves al final; a la part B, regles de focus i de contrast), `menu.js` (part B: només teclat),
la carpeta nova `es/autotest-saas/`, proves noves `proves/visual.mjs`, `proves/teclat.mjs`, `proves/autotest-saas.mjs`, i les proves
existents `proves/textos.mjs`, `proves/serveis.mjs`, `proves/dades-estructurades.mjs`, `proves/pagina-faq.mjs`, `proves/accessibilitat.mjs`.
**NO pots tocar:** `contingut/` (cap fitxer), `plantilles/formularis/`, `proves/contractes/`, `proves/formularis.cjs`, `diagnostic.*`,
`recollida.html`, `wizard/`, `necessito-dpo/`, `es/necesito-dpo/`, `obligacions-ia/`, `fonts/`, `marca.css`, `_headers`,
`package.json`, `.github/`. Les proves noves no s'afegeixen a `package.json` ni a la CI: ho fa Claude en integrar.

## Part A · Regressió visual automàtica (`proves/visual.mjs`)
1. Ús: `node proves/visual.mjs --base <dist de referència> [--actual dist] [--amplades 375,768,1280] [--estricte]`.
   Serveix les dues carpetes en local (dos ports) i fa una captura de pàgina sencera de **totes** les pàgines `.html` (llevat de
   `_previsualitzacio/` i `recollida.html`) a cada amplada, amb `reducedMotion: 'reduce'` i esperant que la pàgina sigui estable.
2. Compara les dues captures **sense dependències**: carrega els dos PNG en una pàgina de Playwright i compta els píxels diferents amb
   `canvas.getImageData` (llindar de tolerància petit per color, configurable). Si l'alçada canvia, és diferent.
3. Informe a `captures/visual/informe.html` (ja és a `.gitignore`): per cada pàgina i amplada, «idèntica» o el % de píxels
   diferents, i per a les diferents, la captura d'abans, la de després i una imatge de diferències (píxels canviats en un color de
   `marca.css`). Al terminal, la llista de pàgines diferents i, en acabar, `cap diferència visual` o `N captures amb diferències`.
4. Sense `--estricte` sempre surt amb codi 0 (és informativa); amb `--estricte`, surt amb error si hi ha diferències.
5. Comprova-la tu: `main` contra `main` → `cap diferència visual`; un canvi de color temporal en una classe → la detecta.
6. Commit: `WEB-G06a: regressió visual automàtica`.

## Part B · Teclat, focus i contrast
1. **«Salta al contingut»** com a primer element del `<body>` a totes les pàgines generades (ca: «Salta al contingut»; es: «Saltar al
   contenido»), que apunta a l'`id` del `<main>` (afegeix-ne un d'estable, p. ex. `contingut`, sense trencar el `#top` que ja hi ha).
   Amagat fins que rep el focus; en rebre'l, visible a dalt a l'esquerra amb els colors de la marca.
2. **Focus visible** a enllaços, botons i camps: `:focus-visible` amb un contorn de les variables de `marca.css`, que es vegi sobre
   tots els fons de la web. No canviïs l'aspecte sense focus.
3. **Menú mòbil amb teclat**: s'obre i es tanca amb Enter/Espai, `Escape` el tanca i retorna el focus al botó, `aria-expanded` al dia.
4. **Prova `proves/teclat.mjs`** (Playwright, servidor local): a cada pàgina generada, el primer Tab arriba a «Salta al contingut» i
   Enter porta el focus al `<main>`; a la portada i a una pàgina de servei, tots els elements enfocables tenen un contorn de focus
   visible (estil calculat diferent de l'estat sense focus); menú mòbil a 375 px amb teclat i `Escape`; **contrast** WCAG AA
   (4,5:1 text normal, 3:1 text gran ≥ 24 px o ≥ 18,66 px en negreta) del text visible de cada pàgina generada a 1280 px, calculat amb
   els colors computats (si el fons és una imatge o un degradat, salta l'element i compta'l a part). Llista cada infracció.
5. Corregeix les infraccions de contrast **dins de `styles.css` / `pagines.css`** amb variables existents de `marca.css`. Si per
   corregir-ne una caldria un color nou, no el creïs: afegeix-la a una llista `PENDENTS_DE_CLAUDE` de la prova i anota-ho.
6. Comprova amb la part A que, sense focus, totes les pàgines són **idèntiques** a `main` (si alguna correcció de contrast canvia
   l'aspecte, és un canvi visible: posa-ho al resum amb les captures de l'informe).
7. Commit: `WEB-G06b: salta al contingut, focus visible, menú amb teclat i contrast`.

## Part C · Textos 100 % centralitzats
1. Passa a `plantilles/textos.mjs` **tots** els textos fixos visibles i els atributs de text (`aria-label`, `alt` fixos, `title`)
   que encara són dins de les plantilles generades: `marc.mjs`, `base.mjs`, `blocs.mjs`, `serveis.mjs` (inclosa la 404),
   `legal.mjs`, `cerca.mjs`, `reserva.mjs`, `llms.mjs`, `xarxes.mjs`. **No** hi passis el contingut (el que ve de `contingut/`).
2. **Paritat estricta**: `dist/` de producció i el de `--esborranys` idèntics byte a byte als d'abans de la part C.
3. `proves/textos.mjs`: ampliada a les plantilles noves (claus ca/es completes, sense claus sense ús, i cap text conegut escrit
   directament a les plantilles migrades). Deixa preparada l'estructura per a un tercer idioma (`en`) sense afegir-ne cap text.
4. Commit: `WEB-G06c: textos d'interfície 100 % centralitzats`.

## Part D · Preguntes freqüents a cada pàgina de servei
1. A cada pàgina de servei (ca i es), si hi ha preguntes de `faq.json` / `faq.es.json` amb `servei` igual a la clau del servei, una
   secció «Preguntes freqüents sobre aquest servei» / «Preguntas frecuentes sobre este servicio» amb la pregunta (enllaç a la
   pregunta de la pàgina de preguntes freqüents, amb un `id` estable per pregunta) i la resposta en un `<details>`. Si no n'hi ha
   cap, res (HTML idèntic a l'actual).
2. A la pàgina de preguntes freqüents, cada pregunta rep un `id` estable (a partir del text: minúscules, sense accents, guions) sense
   canviar res de visible.
3. **Sense** `FAQPage` a les pàgines de servei (ja és a la pàgina de preguntes freqüents): només HTML.
4. Proves a `proves/serveis.mjs` i `proves/pagina-faq.mjs`: la secció surt on toca i amb les preguntes correctes, enllaços que
   existeixen (`proves/enllacos.mjs` en verd), pàgines sense preguntes idèntiques. Captures a l'informe de la part A.
5. Commit: `WEB-G06d: preguntes freqüents a les pàgines de servei`.

## Part E · Dades de l'empresa (JSON-LD) completes
1. A l'objecte de l'empresa (`empresa_ld()` i on es generi el de la portada): `sameAs` amb els perfils socials que ja hi ha a
   `lloc.json` (només URL `https://`), `contactPoint` amb el correu i el telèfon que ja es mostren al peu, `knowsAbout` amb els noms
   dels serveis de `serveis.json`, i `areaServed` com ara. **Res inventat**: si una dada no és a `contingut/`, no hi va (cap
   identificador de Wikidata ni cap xarxa que no hi sigui).
2. Cap `streetAddress`, `postalCode` ni `geo` (la prova de domicili ho vigila).
3. `proves/dades-estructurades.mjs`: comprova `sameAs` (URL vàlides i iguals a les de `lloc.json`), `contactPoint` i `knowsAbout`.
4. Commit: `WEB-G06e: dades de l'empresa completes al JSON-LD`.

## Part F · Autotest SaaS en castellà (esborrany, sense enviament)
Eina estàtica nova a `es/autotest-saas/` (mateix patró que `necessito-dpo/`: `index.html`, `src/app.js`, `src/avaluar.js`,
`dades/preguntes.js`, `estils.css`), **`noindex, nofollow`**, fora del mapa del lloc, sense cap enllaç des de la resta de la web, amb
una franja visible «Borrador: pendiente de validación».
1. **Les 12 preguntes del pla**, en aquest ordre i amb aquestes opcions (castellà correcte, registre «vosotros»):
   1. tipus de clients: B2C, B2B, mixt; 2. mida de l'equip: en solitari, 2-5, més de 5; 3. jurisdicció: Espanya, UE, fora de la UE;
   4. dades: només de compte, operatives, sensibles; 5. infraestructura (stack): UE, EUA, desconeguda; 6. IA al producte: no, API de
   tercers, model propi; 7. decisions automatitzades amb efectes sobre persones: sí / no (pregunta **separada** de la 6);
   8. DPA (contracte d'encarregat) per als clients B2B: sí / no / no ho sé; 9. esborrat, registres (logs) i còpies de seguretat:
   definits / parcialment / no; 10. galetes i analítica: cap, només pròpies, de tercers; 11. estat documental: complet, parcial,
   res; 12. moment: prellançament, en producció, un client B2B bloqueja la venda.
2. **Avaluació** (`src/avaluar.js`, funció pura i provada): resultat en semàfor (verd/ambre/vermell) amb una llista de punts a
   revisar i els **paquets** que s'activarien: «Base SaaS» (sempre), «Trust Pack B2B» (si B2B o mixt, o DPA no/no ho sé, o un client
   bloqueja la venda) i «Add-on IA» (si IA per API o model propi, o decisions automatitzades). Perfil **«Fundador en solitari»** quan
   l'equip és en solitari, no hi ha dades sensibles i no hi ha decisions automatitzades. Avisos de l'**EIPD** i del **representant de
   l'art. 27 RGPD** formulats sempre com a «probables, a valorar», mai com a obligatoris (l'art. 35.3 i les excepcions de l'art. 27.2
   ho condicionen). Cada afirmació jurídica del resultat porta `[REVISAR: …]` al text (el propietari la validarà).
3. **Resultat:** semàfor accessible (com el del diagnòstic: `role="img"` amb `aria-label`, color mai com a únic senyal), punts a
   revisar, paquets i perfil, i una crida «Hablemos» cap a `/es/#contacto`. **No s'envia res enlloc** (cap `fetch`); res a
   `localStorage`, `sessionStorage` ni galetes.
4. Accessible i mòbil primer: botons ≥ 44 px, focus visible, progrés («Pregunta 3 de 12»), «Atrás», `prefers-reduced-motion`.
   Colors només de `marca.css`.
5. **Prova `proves/autotest-saas.mjs`**: avaluació pura (sense navegador) amb casos per a cada paquet, el perfil, els avisos i el
   semàfor; i Playwright (servidor local, CSP real de `_headers`): recorregut complet a 375 i 1280 px, «Atrás», resultat, cap
   petició de xarxa fora del mateix origen, cap error de consola ni de CSP, `noindex` i fora del mapa del lloc.
6. Commit: `WEB-G06f: autotest SaaS en castellà (esborrany)`.

## Part G · Documentació i neteja
1. `eines/LLEGEIX-ME.md`: regressió visual (com executar-la contra `main`), teclat i contrast, `textos.mjs` complet, preguntes per
   servei, JSON-LD de l'empresa, autotest SaaS (com és, que és esborrany i què faltarà per publicar-lo: validació, API, enllaç).
2. Executa `node proves/visual.mjs --base /tmp/web-g06-main-dist` sobre el resultat final i posa al resum la llista de pàgines amb
   diferències i el motiu de cadascuna (han de ser només les de la part D i, si n'hi ha, correccions de contrast de la part B).
3. Commit: `WEB-G06g: documentació`.

## Criteris d'acceptació
1. Proves noves correctes: `node proves/visual.mjs` (main contra main sense diferències), `node proves/teclat.mjs`,
   `node proves/autotest-saas.mjs` (les de navegador poden fallar al teu entorn: anota-ho, les passa Claude).
2. `node proves/textos.mjs`, `node proves/serveis.mjs`, `node proves/pagina-faq.mjs`, `node proves/dades-estructurades.mjs`,
   `npm run qualitat`, `npm run qualitat-esborranys`, `npm run domicili`, `npm run hreflang` i `npm run sitemap` correctes.
3. Paritat: només canvia el que diu l'objectiu (llista-ho al resum amb el motiu).
4. `npm run exportar-esquema -- --comprovar` → `esquema.json al dia`; `npm run comprovar` en verd (navegador: anota-ho i continua).
5. Al resum: infraccions de contrast trobades i què s'ha fet; pàgines publicades que canvien; les marques `[REVISAR]` de la part F;
   i el temps total.

## Restriccions
- Sense dependències noves, secrets, rastrejadors ni tercers (la CSP no canvia). Tot el text visible, escapat.
- No t'aturis a preguntar: si dubtes, tria l'opció més prudent i anota-ho. Si et quedes encallat més de 3 intents en una part,
  desa el que funcioni d'aquella part, passa a la següent i explica-ho al resum.

## Lliurament
Set commits (`WEB-G06a` … `WEB-G06g`) a `gemini/WEB-G06`, `git push`, i el resum final d'`AGENTS.md`.
