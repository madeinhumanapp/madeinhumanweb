---
id: WEB-T07
assignat: mistral
zona: verda
base: main
branca: mistral/WEB-T07
estat: obert
fase: 2 (SEO)
---
# WEB-T07 · Preguntes freqüents en castellà publicades

## Objectiu
Publicar `/es/preguntas-frecuentes/` amb les mateixes preguntes que `/preguntes-frequents/`, traduïdes, enllaçades
entre elles amb `hreflang`. **No es fusiona fins que el propietari validi les respostes** (és contingut jurídic):
la vista prèvia de la branca serveix per revisar-les.

## Context (llegeix-ho abans)
- `AGENTS.md` (glossari: «pymes» en castellà) i `docs/encarrecs/WEB-L03-faq-castella.md`.
- `docs/traduccions/faq.es.md`: esborrany de traducció (16 preguntes; n'hi pot haver alguna que ja no és a la web).
- `contingut/faq.json`: les **15** preguntes actuals en català (`cat`, `pregunta`, `resposta`, `destacada`, `servei`).
- `contingut/pagines/preguntes-frequents.json`: la pàgina catalana (camp `cap.alternatives` per als `hreflang`).
- `eines/construir.mjs` (carrega `faq.json` i el passa a totes les pàgines) i `plantilles/blocs.mjs` (bloc `faq`:
  l'enllaç «Et pot interessar» va a `/serveis/<slug>/` amb `SLUG.ca`).
- `contingut/serveis.json`: `SLUG.es` i `PAGINES.<servei>.es.curt` per als enllaços en castellà.

## Abast
- **Pots tocar / crear:** `contingut/faq.es.json` (nou), `contingut/pagines/preguntas-frecuentes.json` (nou),
  `contingut/pagines/preguntes-frequents.json` (només `cap.alternatives`), `contingut/lloc.json` (només per afegir
  l'enllaç a la FAQ al menú o peu **en castellà**), `eines/construir.mjs` (només carregar i validar `faq.es.json` i passar
  la FAQ de l'idioma de cada pàgina), `plantilles/blocs.mjs` (només el bloc `faq`), `proves/pagina-faq.mjs`.
- **NO pots tocar:** `contingut/faq.json`, cap altra pàgina, `plantilles/formularis/`, `proves/contractes/`, `.github/`,
  `_headers`, `diagnostic.html`, `recollida.html`, `wizard/`.

## Què has de fer
1. `contingut/faq.es.json`: les 15 preguntes de `faq.json`, en el **mateix ordre** i amb els mateixos `cat`, `destacada`
   i `servei`; `pregunta` i `resposta` en castellà, partint de `docs/traduccions/faq.es.md`. Si el text català actual no
   coincideix amb l'«Original» de l'esborrany, tradueix el català actual i marca la resposta amb `[REVISAR: canviat
   respecte a l'esborrany]`. Cap pregunta nova; la que sobri de l'esborrany, no la posis.
2. `contingut/pagines/preguntas-frecuentes.json`: com la catalana, amb `idioma: "es"`, `ruta: "/es/preguntas-frecuentes/"`,
   `fitxer: "es/preguntas-frecuentes/index.html"`, títol i descripció (≤ 155) en castellà, canònica, `og`, molles de pa
   (`BreadcrumbList`) amb «Inicio» → `/es/`, i textos del bloc `faq` (etiqueta, titular, entradeta, pestanyes) en castellà.
3. `cap.alternatives` a **totes dues** pàgines: `ca` → la catalana, `es` → la castellana, `x-default` → la catalana.
4. Generador: les pàgines amb `idioma: "es"` reben la FAQ de `faq.es.json` (i el JSON-LD `FAQPage` en castellà); les altres,
   la de sempre. Valida `faq.es.json` amb el mateix `validarFaq` i comprova que té les mateixes preguntes (`cat`, `servei`)
   en el mateix ordre que `faq.json`: si no, error de construcció.
5. Bloc `faq` en castellà: «Te puede interesar:» i enllaç a `/es/servicios/<SLUG.es>/` amb `PAGINES.<servei>.es.curt`.
6. Afegeix l'enllaç «Preguntas frecuentes» al menú o al peu en castellà de `lloc.json` (on hi hagi el de la versió catalana).
7. `proves/pagina-faq.mjs`: comprovacions de la pàgina castellana (15 preguntes a l'HTML, `FAQPage` en castellà, enllaços
   a `/es/servicios/`, un sol `<h1>`, `lang="es"`, canònica i parell `hreflang` amb la catalana).

## Criteris d'acceptació
1. `npm run construir` sense errors (20 pàgines generades).
2. `node proves/pagina-faq.mjs` i `npm run hreflang` correctes.
3. `npm run sitemap`: `/es/preguntas-frecuentes/` és al mapa del lloc.
4. `npm run comprovar` en verd (les proves amb navegador poden fallar al teu entorn: anota-ho i continua).
5. Al resum: la llista de respostes amb `[REVISAR]` i el motiu.

## Restriccions
- Res inventat: només traduir. Castellà correcte («pymes», «RGPD», «Reglamento de IA»). Sense HTML al contingut.

## Lliurament
Commit `WEB-T07: preguntes freqüents en castellà` a `mistral/WEB-T07`, `git push`, i el resum final d'`AGENTS.md`.
