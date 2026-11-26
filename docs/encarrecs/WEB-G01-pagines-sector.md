---
id: WEB-G01
assignat: gemini
zona: verda
base: main
branca: gemini/WEB-G01
estat: obert
fase: 2 (SEO local, Girona)
mida: gran (dues parts; un commit per part)
---
# WEB-G01 · Pàgines de sector per a SEO local: motor + 5 esborranys

## Objectiu
Que la web pugui publicar **pàgines de sector** («Protecció de dades per a clíniques a Girona», «… per a escoles i
casals», etc.), que són les primeres pàgines del mapa de demanda de pimes (fase 2 del pla: primer el SEO local de
Girona). Té dues parts:

- **Part A (tècnica):** un tipus de contingut nou `contingut/sectors/*.json`, amb esquema, plantilla, pàgina índex, proves
  i integració amb el mapa del lloc. Els **esborranys** surten a les vistes prèvies de Cloudflare però **mai a producció**.
- **Part B (contingut):** **5 esborranys** de pàgina de sector en català, amb `estat: "esborrany"` i `[REVISAR: …]` a tot el que sigui
  jurídic i no estigui a les fonts permeses. Cap no es publica: el propietari els validarà un per un.

Treballa amb calma i comprova cada pas. És una feina gran: val més acabar bé la part A que fer-les totes dues a mitges.

## Context (llegeix-ho tot abans de començar)
- `AGENTS.md` (normes, glossari, procediment) i `eines/LLEGEIX-ME.md`.
- `eines/construir.mjs`: el generador (pàgines de blocs, serveis, actualitat, mapa del lloc, vista prèvia).
- `plantilles/serveis.mjs`: `marcInterior(lloc, dades)` dona el cap (`cap`), el menú (`nav`), el peu (`peu`), el JSON-LD de
  l'empresa (`empresa_ld`), la crida final (`bloc_final`) i `url_servei`. **Fes-los servir**: la pàgina de sector ha de tenir
  el mateix marc que les pàgines de servei.
- `plantilles/actualitat.mjs` (WEB-T06): barra de «Darrera revisió jurídica», bloc de fonts i crida a l'acció. Reaprofita'n
  el patró i les classes CSS (`noticia-revisio`, `noticia-fonts`, `noticia-cta`).
- `plantilles/markdown.mjs` (WEB-T11): `##`, llistes, `1.` llistes numerades, `>` paràgraf destacat, taules.
- `esquema/blocs.mjs` i `esquema/serveis.mjs`: com es defineixen i validen els camps (i `npm run exportar-esquema`).
- Proves que ja vigilen tota la web i que les pàgines noves han de passar: `proves/sitemap.mjs`, `hreflang.mjs`,
  `metadades.mjs` (títol ≤ 60, descripció ≤ 155), `domicili.mjs`, `csp.cjs`, `markdown.mjs`.
- `contingut/serveis.json` (`SLUG`, `PAGINES`): els serveis als quals pot enllaçar una pàgina de sector.
- `contingut/faq.json`: to i nivell de les respostes actuals (no en copiïs frases senceres).

## Part A · Motor de pàgines de sector

**Pots tocar o crear:** `esquema/sectors.mjs` (nou), `esquema/esquema.json` (regenerat), `eines/exportar-esquema.mjs` (només
si cal per exportar l'esquema nou), `eines/construir.mjs`, `plantilles/sectors.mjs` (nou), `styles.css` (classes noves al
final, si cal), `proves/sectors.mjs` (nou), `eines/LLEGEIX-ME.md` (documentació del tipus nou).
**NO pots tocar:** `plantilles/formularis/`, `proves/contractes/`, `_headers`, `.github/`, `package.json`, `diagnostic.html`,
`recollida.html`, `wizard/`, `necessito-dpo/`, ni cap fitxer de `contingut/` fora de `contingut/sectors/`.

1. **Format** (`contingut/sectors/<slug>.json`, un per pàgina; `<slug>` en minúscules, sense accents, amb guions):

| Camp | Tipus | Regles |
|---|---|---|
| `slug` | text | igual que el nom del fitxer; l'URL serà `/sectors/<slug>/` |
| `idioma` | `ca` | de moment només català |
| `estat` | `esborrany` \| `publicat` | |
| `sector` | `salut`, `educacio`, `comerc`, `serveis`, `hostaleria`, `social` | |
| `titol_seo` | text ≤ 60 | `<title>` |
| `descripcio` | text ≤ 155 | `<meta name="description">` |
| `h1` | text ≤ 90 | |
| `entradeta` | text ≤ 300 | sota el H1 |
| `capsula` | text ≤ 420 | «paràgraf càpsula»: resposta directa de 40-60 paraules (es pinta com a paràgraf destacat) |
| `seccions` | llista (2-8) de `{ titol, cos }` | `titol` en forma de pregunta (≤ 90); `cos` en Markdown (≤ 2500), sense HTML |
| `documents` | llista (0-10) de text ≤ 120 | documents que normalment necessita el sector |
| `faq` | llista (0-6) de `{ pregunta, resposta }` | `resposta` en text enriquit mínim (≤ 600) |
| `servei_relacionat` | clau de `SERVEIS_NOTICIA` | enllaç «Et pot interessar» |
| `cta_desti` | `diagnostic` \| `contacte` \| `servei` | com a WEB-T06 |
| `cta_text` | text ≤ 80 | opcional |
| `data_revisio` | data | opcional; amb `revisat_per`, barra de revisió (mateix text per defecte que WEB-T06) |
| `revisat_per` | text ≤ 120 | opcional |
| `fonts` | llista (0-8) de `{ nom, url }` | `url` amb `https://`; bloc «Fonts» al final i `citation` al JSON-LD |

2. **Validació** (`esquema/sectors.mjs`, i errors de construcció a `construir.mjs`): tipus, llargades i llistes de la taula;
   `slug` igual que el nom del fitxer; cap HTML (els mateixos criteris que la resta del contingut); `cta_desti: servei` requereix
   `servei_relacionat`; **una pàgina amb `estat: publicat` no pot contenir `[REVISAR` enlloc** (com les notícies).
3. **Esborranys:** les pàgines amb `estat: esborrany` **no es generen** a producció. Es generen, amb `noindex, nofollow` i una
   franja visible «Esborrany: pendent de validació», només quan la variable d'entorn `CF_PAGES_BRANCH` existeix i no és `main`
   (vistes prèvies de Cloudflare) o quan s'executa `node eines/construir.mjs --esborranys`. Documenta-ho a `eines/LLEGEIX-ME.md`.
4. **Plantilla** (`plantilles/sectors.mjs`): mateix marc que les pàgines de servei (`marcInterior`). Estructura: molles de pa
   (Inici → Sectors → pàgina), H1, barra de revisió (si n'hi ha), entradeta, càpsula com a paràgraf destacat, seccions (H2 +
   Markdown), llista de documents, FAQ, «Et pot interessar» (servei), fonts, crida a l'acció (`noticia-cta` o `bloc_final`).
   JSON-LD: `empresa_ld()`, `Service` (`serviceType` = el servei relacionat, `areaServed` = la zona de `marcInterior`),
   `BreadcrumbList` i, si hi ha `faq`, `FAQPage`. `hreflang` `ca` + `x-default` cap a la pròpia canònica.
5. **Índex** `/sectors/`: llista de les pàgines **publicades** (títol, entradeta i enllaç). Si no n'hi ha cap de publicada, no
   es genera, i el mapa del lloc no l'inclou.
6. **Mapa del lloc:** les pàgines publicades hi entren soles (el mapa ja es construeix a partir de l'HTML indexable). Comprova-ho.
7. **Prova `proves/sectors.mjs`** (sense navegador; fes servir fitxers de prova en una carpeta temporal, com `proves/actualitat.mjs`,
   amb `DIR_SECTORS` o una opció equivalent): validacions (cada error de la taula), esborrany no generat a producció i generat amb
   `--esborranys` (amb `noindex` i franja), pàgina publicada completa (H1 únic, càpsula, seccions, FAQPage, Service, Breadcrumb,
   fonts, crida, canònica, hreflang, al mapa), índex amb només les publicades, i `[REVISAR` que bloqueja la publicació. En acabar:
   `totes les comprovacions de les pàgines de sector correctes`.
8. Commit de la part A: `WEB-G01a: motor de pàgines de sector`.

## Part B · 5 esborranys de pàgina de sector (Girona)

**Pots crear:** `contingut/sectors/clinica-consulta-salut-girona.json`, `escoles-casals-clubs-girona.json`,
`comercos-botigues-online-girona.json`, `hostaleria-allotjaments-turistics-girona.json`, `gestories-despatxos-girona.json`.
Tots amb `estat: "esborrany"`.

**Normes de contingut (obligatòries):**
- Català normatiu, registre **«vosaltres»** (com el diagnòstic), veu de la marca «nosaltres». Glossari d'`AGENTS.md`.
- **Res inventat.** Cap xifra, sanció, termini, article ni data que no sigui en una font oficial que citis al camp `fonts`
  (EUR-Lex per al RGPD i el Reglament d'IA, BOE per a la LOPDGDD i la LSSI-CE, AEPD, APDCat). Si no estàs segur d'un article o
  apartat, escriu-ho en general i afegeix `[REVISAR: què cal confirmar]`. Cap xifra de sancions.
- Prudència: «normalment cal», «a valorar», «depèn de…»; mai «és obligatori en tots els casos» si hi ha excepcions.
- Útil per al lector: errors habituals del sector, quins tractaments fan servir (clients, pacients, menors, càmeres,
  proveïdors…), quins documents solen faltar i què es pot fer avui. Res de preus.
- Cada esborrany: 4-6 seccions amb títol en forma de pregunta, 5-8 documents, 3-5 preguntes de FAQ, `servei_relacionat`
  (`adequacio` per defecte; `dpo` si el sector ho justifica), `cta_desti: "diagnostic"`.
- Sense dades personals ni noms d'empreses reals.

**Comprova:** `node eines/construir.mjs --esborranys` genera les 5 pàgines i passen `metadades`, `hreflang`, `domicili` i
`markdown`; `npm run construir` (producció) **no** les genera. Commit de la part B: `WEB-G01b: 5 esborranys de pàgines de sector`.

## Criteris d'acceptació
1. `node proves/sectors.mjs` → `totes les comprovacions de les pàgines de sector correctes`.
2. `npm run exportar-esquema -- --comprovar` → `esquema.json al dia`.
3. `npm run construir`: cap pàgina de sector (són esborranys) i cap canvi a les pàgines que ja existeixen (compara `dist/` amb una
   còpia generada des de `main`).
4. `node eines/construir.mjs --esborranys`: les 5 pàgines, amb `noindex`, franja d'esborrany i cap infracció de `metadades` ni de `domicili`.
5. `npm run comprovar` en verd (les proves amb navegador poden fallar al teu entorn: anota-ho i continua).
6. Al resum: la llista de totes les marques `[REVISAR]` de la part B, agrupades per fitxer.

## Restriccions
- Sense dependències noves, secrets, rastrejadors ni tercers (la CSP no canvia). Tot el text visible, escapat.
- Si et quedes encallat més de 3 intents en un punt de la part A, para, desa el que funcioni i explica-ho al resum.

## Lliurament
Dos commits (`WEB-G01a`, `WEB-G01b`) a `gemini/WEB-G01`, `git push`, i el resum final d'`AGENTS.md`.
