---
id: WEB-G03
assignat: gemini
zona: verda
base: main (amb WEB-G02 integrat)
branca: gemini/WEB-G03
estat: obert
fase: 2 (SEO)
mida: molt gran (quatre parts; un commit per part, en aquest ordre)
---
# WEB-G03 · Paquet: esborranys d'articles a la vista prèvia, sectors en castellà, 5 sectors i 5 articles més

## Objectiu
Quatre parts, en aquest ordre (cadascuna depèn de les anteriors):
- **A:** que les notícies i articles en `estat: esborrany` es puguin veure a les **vistes prèvies** de Cloudflare (com els sectors de WEB-G01), mai a producció.
- **B:** que les pàgines de sector admetin **castellà** (`/es/sectores/…`) amb `hreflang` entre versions, i traduir-hi els 5 esborranys actuals.
- **C:** **5 esborranys més** de pàgina de sector en català.
- **D:** **5 esborranys d'article** (guies) en català amb la plantilla de WEB-T06.

Res de B, C ni D es publica: tot queda en `estat: "esborrany"` fins que el propietari ho validi.

## Context (llegeix-ho tot abans de començar)
- `AGENTS.md`, `eines/LLEGEIX-ME.md` (notícies, sectors, esborranys) i els encàrrecs `WEB-T06`, `WEB-T11`, `WEB-G01` i `WEB-G02`.
- `eines/construir.mjs` (com es decideix si es generen esborranys: `CF_PAGES_BRANCH` ≠ `main` o `--esborranys`).
- `plantilles/actualitat.mjs`, `esquema/blocs.mjs` (`CAMPS_NOTICIA`, `validarNoticia`), `proves/actualitat.mjs`.
- `plantilles/sectors.mjs`, `esquema/sectors.mjs`, `proves/sectors.mjs`, `contingut/sectors/*.json` (els 5 esborranys).
- Proves de tota la web que han de continuar en verd: `sitemap`, `hreflang`, `metadades`, `domicili`, `markdown`, `csp`.

**Pots tocar o crear (totes les parts):** `eines/construir.mjs`, `plantilles/actualitat.mjs`, `plantilles/sectors.mjs`,
`plantilles/serveis.mjs` (només si cal per a l'enllaçat dels sectors en castellà), `esquema/blocs.mjs` (només notícies),
`esquema/sectors.mjs`, `esquema/esquema.json` (regenerat), `eines/exportar-esquema.mjs`, `styles.css` (classes noves al final),
`proves/actualitat.mjs`, `proves/sectors.mjs`, `eines/LLEGEIX-ME.md`, `contingut/sectors/` (fitxers nous i les traduccions) i
`contingut/actualitat/` (**només fitxers nous**, tots en `estat: esborrany`).
**NO pots tocar:** les notícies que ja hi ha, `contingut/` fora de `sectors/` i dels fitxers nous d'`actualitat/`,
`plantilles/formularis/`, `proves/contractes/`, `diagnostic.*`, `recollida.html`, `wizard/`, `necessito-dpo/`, `_headers`,
`package.json`, `.github/`.

## Part A · Esborranys de notícies a la vista prèvia
1. Amb el mateix criteri que els sectors (vista prèvia o `--esborranys`), les notícies amb `estat: esborrany` **i cos** generen
   la seva pàgina amb `noindex, nofollow` i la franja «Esborrany: pendent de validació». **No** surten al llistat
   `/actualitat/`, ni al RSS, ni al mapa del lloc, ni a la portada.
2. En mode esborranys, una pàgina `/actualitat/esborranys/` (`noindex, nofollow`) llista els esborranys amb l'enllaç, perquè el
   propietari els trobi. A producció no existeix.
3. A producció tot ha de quedar **idèntic** (paritat de `dist/` amb `main`).
4. Proves a `proves/actualitat.mjs` per a tot això (fitxers temporals, com ara).
5. Commit: `WEB-G03a: esborranys de notícies a la vista prèvia`.

## Part B · Sectors en castellà
1. Esquema: `idioma` admet `ca` i `es`; camp nou opcional `grup_hreflang` (text curt, mateix valor a les dues versions d'una
   mateixa pàgina). Ruta en castellà: `/es/sectores/<slug>/`; índex `/es/sectores/` (només si n'hi ha de publicades en castellà).
2. Plantilla en castellà: el marc de les pàgines en castellà (`marcInterior` amb `lang: 'es'`), textos fixos en castellà (molles
   «Inicio › Sectores», «Documentos que suelen hacer falta», «Te puede interesar», «Fuentes», crida…), enllaços a
   `/es/servicios/…`, `lang="es"`.
3. `hreflang`: si dues pàgines comparteixen `grup_hreflang`, `ca` ↔ `es` recíprocs i `x-default` → la catalana; si no, només la
   pròpia llengua i `x-default`. Validació: un mateix grup no pot tenir dues pàgines del mateix idioma.
4. Si existeix l'enllaçat intern de WEB-G02 («Per sectors» a les pàgines de servei), fes-lo també a les pàgines de servei en
   castellà amb els sectors publicats en castellà.
5. Tradueix els 5 esborranys actuals a fitxers nous en castellà (slug en castellà, `idioma: "es"`, mateix `grup_hreflang` que el
   català, que també has d'afegir als 5 catalans), `estat: "esborrany"`. **Només traduir**: mantén cada `[REVISAR: …]`, traduït.
6. Proves a `proves/sectors.mjs` (rutes, `lang`, `hreflang` recíproc, validació de grups, índexs, enllaçat en castellà).
7. Commit: `WEB-G03b: sectors en castellà`.

## Part C · 5 esborranys més de sector (català)
Fitxers nous a `contingut/sectors/`, `estat: "esborrany"`, amb `grup_hreflang`:
`clinica-dental-farmacia-girona` (sector `salut`), `gimnasos-centres-esportius-girona` (`serveis`), `immobiliaries-girona` (`serveis`),
`comunitats-propietaris-administradors-girona` (`serveis`), `entitats-socials-associacions-girona` (`social`).
Mateixes normes de contingut que la part B de WEB-G01 (es repeteixen a sota). Commit: `WEB-G03c: 5 esborranys més de sector`.

## Part D · 5 esborranys d'article (guies, català)
Fitxers nous `contingut/actualitat/2026-12-0N-<slug>.md` (N de 1 a 5), `estat: esborrany`, `tipus_article: guia`,
`idioma: ca`, `etiqueta` adequada, `font_nom` + `font_url` (font oficial principal), `fonts_addicionals`, `meta_descripcio` (≤ 155),
`ninxol: general`, `cta_desti: diagnostic`. **Sense** `data_revisio` (la posarà el propietari en validar). Temes:
1. Què heu de fer si teniu una bretxa de dades (notificació a l'autoritat i a les persones afectades).
2. Càmeres de videovigilància al negoci: cartell, informació i conservació de les imatges.
3. Fer servir eines d'IA (xats) a l'empresa: mesures d'alfabetització en IA (art. 4 del Reglament d'IA).
4. Proveïdors que accedeixen a les vostres dades: el contracte d'encarregat del tractament (art. 28 RGPD).
5. Galetes a la web: què cal abans de carregar-les (art. 22.2 LSSI-CE).
Estructura de cada article (WEB-T06 i WEB-T11): un paràgraf destacat (`> `) de 40-60 paraules al començament, 4-6 seccions `##`
en forma de pregunta, una llista numerada de passos, sense HTML. Commit: `WEB-G03d: 5 esborranys d'article`.

## Normes de contingut (parts B, C i D)
- Català normatiu (castellà correcte a la part B), registre **«vosaltres»**, veu de la marca «nosaltres». Glossari d'`AGENTS.md`.
- **Res inventat.** Cap xifra, sanció, termini, article ni data que no sigui en una font oficial citada (EUR-Lex, BOE, AEPD,
  APDCat). Si no n'estàs segur, escriu-ho en general i afegeix `[REVISAR: què cal confirmar]`. Cap xifra de sancions. Res de preus.
- Prudència («normalment cal», «a valorar», «depèn de…»). Sense dades personals ni noms d'empreses reals.

## Criteris d'acceptació
1. `node proves/actualitat.mjs` i `node proves/sectors.mjs` correctes (amb tots els casos nous).
2. `npm run exportar-esquema -- --comprovar` → `esquema.json al dia`.
3. `npm run construir`: paritat de `dist/` amb `main` (a producció no surt cap esborrany).
4. `node eines/construir.mjs --esborranys`: 15 pàgines de sector (10 en català i 5 en castellà) i 5 articles en esborrany, més
   `/actualitat/esborranys/`; tots amb `noindex` i franja; `metadades`, `hreflang`, `domicili` i `markdown` en verd.
5. `npm run comprovar` en verd (les proves amb navegador poden fallar al teu entorn: anota-ho i continua).
6. Al resum: totes les marques `[REVISAR]` de les parts B, C i D, agrupades per fitxer.

## Restriccions
- Sense dependències noves, secrets, rastrejadors ni tercers (la CSP no canvia). Tot el text visible, escapat.
- No t'aturis a preguntar: si dubtes, tria l'opció més prudent i anota-ho. Si et quedes encallat més de 3 intents en una part,
  desa el que funcioni d'aquella part, passa a la següent i explica-ho al resum.

## Lliurament
Quatre commits (`WEB-G03a` … `WEB-G03d`) a `gemini/WEB-G03`, `git push`, i el resum final d'`AGENTS.md`.
