# Generador de la web i proves (prototip del pla del panell)

Pla complet: `rgpdtool/docs/panell-web/` (repositori privat).

**Publicació (Cloudflare Pages, projecte `madeinhumanweb`):** *Build command* `node eines/construir.mjs`, *Build output
directory* `dist`, variable `SKIP_DEPENDENCY_INSTALL=1` (el generador no necessita cap paquet). Configurat el
22/11/2026 (tall WEB-H10). Cada branca té vista prèvia a `<branca>.madeinhumanweb.pages.dev`; producció és `main`.
Retorn: Pages → *Deployments* → *Rollback to this deployment* (passos a `rgpdtool/docs/panell-web/TALL.md`).

## Carpetes

| Carpeta | Què hi ha |
|---|---|
| `contingut/` | El text de la web: `lloc.json` (contacte, menú, peu, SEO comú), `pagines/*.json` (blocs de cada pàgina), `actualitat/*.md` (notícies) |
| `esquema/` | Quins blocs hi ha, quins camps tenen i amb quins límits. Valida i genera els formularis del panell |
| `plantilles/` | Disseny: `base.mjs` (cap, menú, peu), `blocs.mjs` (un bloc = una funció), `formularis/` (protegits) |
| `eines/` | `construir.mjs` (contingut → `dist/`), `exportar-esquema.mjs`, `sense-html.mjs`, `previsualitzacio/` |
| `proves/` | Contractes amb rgpd-tool, vista prèvia, CSP, notícies i serveis |

## Ordres

```bash
npm ci && npm run navegador      # el primer cop: Playwright i el navegador de proves
npm run construir                # genera dist/ (sense dependències, ~25 ms)
npm run contractes               # els formularis envien a rgpd-tool el mateix que abans (4 «ok»)
npm run previsualitzacio         # vista prèvia: plantilles, injecció, cap lead fals, serveis i xarxes (9/9)
npm run actualitat               # notícies: llistat, pàgines, RSS, programació i validacions (sense navegador)
npm run serveis                  # esquema de contingut/serveis.json (URL fixes, sense HTML, límits)
npm run sense-html               # cap etiqueta HTML dins de contingut/
npm run comprovar                # totes seguides (és el que fa GitHub Actions)
node proves/formularis.cjs --desar   # NOMÉS si un canvi de contracte és volgut (i s'ha fet primer a rgpd-tool)
```

Les proves fan servir Playwright i no surten a internet: tot es serveix en local.
Encàrrecs per a Mistral: `docs/encarrecs/` i `AGENTS.md`.

## Text enriquit al contingut

Només `*cursiva*`, `**negreta**`, salt de línia i `[enllaç](/ruta)`. Cap etiqueta HTML: el validador la rebutja.

Al text llarg en Markdown (`plantilles/markdown.mjs`: notícies i articles, textos legals i seccions de servei) també
s'admeten: `##` i `###`, `- ` (llistes), `1. ` (llistes numerades, amb continuació sagnada de 2 espais i `start="N"` si
no comencen per 1), `> ` (paràgraf destacat, `<blockquote class="text-destacat">`), taules amb `|`, `` `codi` `` i
`<!-- nota interna -->`.

## Regles que protegeixen els connectors amb rgpd-tool

- Els formularis són blocs `formulari`: l'HTML és a `plantilles/formularis/` i només se n'editen el titular i l'entradeta.
  Els `name=""` i els valors de les opcions són dades de l'API (`proves/contractes/`).
- A la portada, els enllaços interns són àncores (`#contacte`), no `/#contacte`: si no, es perden els `utm_*`.
- URL que fan servir els correus i no es poden moure: `/#contacte`, `/recollida.html?token=…`,
  `/diagnostic.html?ref=…`, `/politica-privacitat.html` (llista completa a `proves/contractes/urls-estables.json`).

## Notícies (`contingut/actualitat/`)

Un fitxer per notícia: `AAAA-MM-DD-titol-curt.md` (minúscules, sense accents). El títol curt fa l'URL:
`/actualitat/titol-curt/`. És el mateix format dels esborranys de Mistral (rgpdtool, encàrrec WEB-A05).

```
---
titol: "…"                 # fins a 130 caràcters (millor fins a 70)
resum: "…"                 # targeta i entradeta (millor fins a 160)
meta_descripcio: "…"       # opcional (màx. 155): substitueix resum a meta description i og:description
data: 2026-11-20           # no surt a la web abans d'aquest dia (hora de Madrid)
data_revisio: 2026-11-25   # opcional: barra de revisió jurídica sota el H1 i dateModified del JSON-LD
revisat_per: "…"           # opcional (màx. 120): per defecte «Revisat per un consultor RGPD i DPO extern de madeinhuman»
etiqueta: rgpd             # rgpd | ia | apdcat
ninxol: general            # opcional: general | salut | educacio | comerc | serveis | hostaleria | social | saas
tipus_article: guia        # opcional: noticia (per defecte, NewsArticle) | guia (Article)
font_nom: "AEPD"
font_url: "https://…"      # obligatori per publicar una notícia amb cos
fonts_addicionals: "https://… | https://…"  # opcional (màx. 600): URL https:// separades per « | » (bloc «Fonts» i citation)
data_font: 2026-11-03      # opcional
servei_relacionat: auditoria   # opcional: adequacio | dpo | auditoria | ia | web
cta_desti: servei          # opcional: diagnostic | contacte | servei (amb servei, servei_relacionat és obligatori)
cta_text: "…"              # opcional (màx. 80): text del botó de la crida final
estat: publicat            # esborrany | publicat
idioma: ca                 # ca (/actualitat/…) | es (/es/actualidad/…)
grup_hreflang: "..."       # opcional: mateix valor a les versions ca i es d'una mateixa notícia o guia
---

## Què ha passat
…
---
Notes de revisió: tot el que hi ha després d'aquesta línia no es publica mai.
```

- **Amb cos** (Markdown de `plantilles/markdown.mjs`): pàgina pròpia (`/actualitat/<slug>/` en català o
  `/es/actualidad/<slug>/` en castellà), i la targeta enllaça a la pàgina. **Sense cos** («breu»): només targeta.
- **Idiomes separats:** el llistat `/actualitat/`, el canal `/actualitat/rss.xml` i la portada només mostren notícies
  publicades en català; `/es/actualidad/` i `/es/actualidad/rss.xml` només es generen quan hi ha notícies publicades
  en castellà. Si dues pàgines visibles comparteixen `grup_hreflang`, generen `hreflang` recíprocs (`ca` ↔ `es`,
  `x-default` → `ca`); cap grup no pot repetir idioma.
- **Guies (`tipus_article: guia`):** mostren temps de lectura estimat (`paraules / 200`, mínim 1 min), un índex de
  continguts («En aquesta guia» / «En esta guía») amb enllaços als `##` quan n'hi ha 3 o més (amb `id` estable i únic
  a cada `h2`), i el bloc automàtic «Sectors on s'aplica» / «Sectores donde se aplica» amb els sectors visibles del
  mateix idioma que les citen a `articles_relacionats`.
- Una notícia amb `estat: publicat` i qualsevol `[REVISAR` no deixa construir la web.
- **Esborranys (`estat: esborrany`) amb cos:** no surten mai a producció (`npm run construir`), ni als llistats,
  ni als RSS, ni al mapa del lloc, ni a la portada. En vistes prèvies (`CF_PAGES_BRANCH` ≠ `main`) o amb `--esborranys`
  es genera la seva pàgina amb `noindex, nofollow`, la franja d'esborrany i cada `[REVISAR]` ressaltat
  (`<mark class="revisar" id="revisar-N">` + caixa resum «Marques pendents (N)»), a més de `/actualitat/esborranys/`
  i la taula global `/esborranys/`.
- Programació: una notícia publicada amb data futura surt a la primera construcció d'aquell dia
  (`DATA_CONSTRUCCIO=AAAA-MM-DD npm run construir` simula un altre dia). Quan hi hagi panell, un cron reconstruirà
  la web cada matí (WEB-A03).
- `data_text` i `font_text` només serveixen perquè les notícies migrades (WEB-A02) es vegin igual que abans.
- El repositori de la web és públic: els esborranys es preparen a rgpdtool (`docs/panell-web/esborranys/`), no aquí.

## Abans i després del tall

Fins al 22/11/2026 Cloudflare publicava l'arrel del repositori i el generador s'havia de mantenir idèntic a la web
feta a mà (proves de paritat i del tall, extractor de la portada). Des del tall, la web publicada és `dist/` i aquelles
eines s'han retirat (es poden consultar a l'historial de git). Un canvi visual a les plantilles es revisa amb
`npm run captures -- <etiqueta>` (abans i després) i amb la vista prèvia de la branca a Cloudflare Pages.

## Pàgines que no surten del contingut

- `diagnostic.html`, `necessito-dpo/` i `recollida.html` són aplicacions: el seu text és dins del seu JavaScript
  o de les seves dades, i el diagnòstic i la recollida són connectors amb rgpd-tool. El generador les copia tal
  qual; els contractes i la CSP les vigilen. El panell no les edita (decisió C-09).
- `xarxes/` sí que surt del contingut (`contingut/pagines/xarxes.json`, plantilla `plantilles/xarxes.mjs`).

## Pàgines de servei (`contingut/serveis.json`)

Estructura fixa (C-10), validada per `esquema/serveis.mjs`: per a cada servei i idioma, `curt`, `titol_seo`,
`descripcio`, `eyebrow`, `h1` (text enriquit), `lede` i `seccions` (`{ titol, cos }`, cos en Markdown). Les URL
(`SLUG`) i la llista de serveis són fixes: canviar-les trencaria enllaços, i el validador ho impedeix.

## Pàgines de sector (`contingut/sectors/*.json`)

Un fitxer JSON per pàgina: `contingut/sectors/<slug>.json` (minúscules, sense accents, amb guions; el camp `slug` ha de
coincidir amb el nom del fitxer). Esquema i validació a `esquema/sectors.mjs`; plantilla a `plantilles/sectors.mjs`.

- **Idioma (`ca` o `es`):** les catalanes es generen a `/sectors/<slug>/` (índex `/sectors/`) i les castellanes a
  `/es/sectores/<slug>/` (índex `/es/sectores/`). El camp opcional `grup_hreflang` vincula la versió catalana i la
  castellana d'una mateixa pàgina per generar `hreflang` recíprocs (`ca` ↔ `es`, `x-default` → `ca`); un mateix grup
  no pot tenir dues pàgines del mateix idioma.
- **Enllaçat intern (`articles_relacionats`):** llista opcional de 0 a 4 slugs de notícia/guia del **mateix idioma**
  (validat a la construcció). Pinta el bloc «Guies relacionades» / «Guías relacionadas» amb les visibles i alimenta el
  bloc automàtic «Sectors on s'aplica» a les guies. Cada pàgina de sector també mostra fins a 3 «Altres sectors» /
  «Otros sectores» visibles del mateix idioma (prioritzant el mateix `sector`).
- **Publicades (`estat: "publicat"`):** es generen sempre, surten a l'índex del seu idioma, s'enllacen des de la pàgina
  de servei corresponent («Per sectors» / «Por sectores») i entren soles al mapa del lloc. Qualsevol marca `[REVISAR`
  atura la construcció.
- **Esborranys (`estat: "esborrany"`):** **no** es generen a producció (`npm run construir` o `CF_PAGES_BRANCH=main`).
  Només es generen, amb `noindex, nofollow`, la franja d'esborrany i les marques `[REVISAR]` ressaltades
  (`<mark class="revisar" id="revisar-N">` + caixa «Marques pendents (N)»), a les vistes prèvies de Cloudflare
  (`CF_PAGES_BRANCH` present i diferent de `main`) o localment amb `node eines/construir.mjs --esborranys`.
  No apareixen als índexs ni al mapa del lloc. Si no hi ha cap pàgina publicada en un idioma, el seu índex no es genera.
- **Eines estàtiques en esborrany (`NOMES_ESBORRANYS` a `construir.mjs`):** carpetes que només es copien en mode esborranys
  (ara, `es/autotest-saas/`). A producció no existeixen fins que es validen i es treuen de la llista.
- **Taula de validació 2.0 (`/esborranys/`):** en mode esborranys es genera una taula central amb tots els esborranys
  (sectors, guies i notícies, `ca` i `es`), ordenats de menys a més marques `[REVISAR]`, amb:
  - filtres per tipus i idioma reflectits a l'URL (`/esborranys/?tipus=sector&idioma=es`, compatibles amb «Enrere» i
    sense requerir JavaScript per veure la taula completa; script propi `esborranys/esborranys.js`);
  - nom curt del fitxer visible amb el camí complet a `title`, i enllaç a la traducció si comparteixen `grup_hreflang`;
  - un desplegable `<details>` per esborrany amb el text complet de cada marca `[REVISAR]`;
  - botons superiors «Copiar totes les marques» i «Descarregar en Markdown» (`marques-revisar.md` agrupat per fitxer);
  - requadre «Com es publica un esborrany» amb els passos des del panell. No existeix mai a producció.
- A les proves es pot redirigir la carpeta amb `DIR_SECTORS`.

## Selector de reserves propi (`reserva.js` i `/reserva/`, WEB-G05 i WEB-G07)

Component propi sense dependències per reservar una trucada de 20 minuts contra l'API de `rgpd-tool`, preparat per
substituir `CALENDARI_URL` quan l'API estigui desplegada:

- **Estat actual (desactivat):** `reserva.js` té `var ACTIVA = false;` al començament. Mentre sigui `false`,
  `window.MadeinhumanReserva.muntar()` no fa res ni envia cap petició; `/diagnostic` manté `#reserva` ocult i el botó
  de `CALENDARI_URL`, i `/reserva/` mostra el missatge alternatiu amb enllaços a `/diagnostic` i `/#contacte`.
- **API i contracte (`proves/contractes/reserva.json`) a `rgpd.madeinhuman.cat`:**
  - `GET /api/public/reserva/franges?t=<token>` → `200 { ok: true, zona, durada, franges: [{ id, inici, fi }] }`
    (`404 { ok: false, error: "token" }` si el token ha caducat o no existeix; `franges: []` si no hi ha hores lliures).
  - `POST /api/public/reserva` amb `{ t, franja }` → `200 { ok: true, estat: "pendent", inici, fi }` (confirmació manual:
    mostra «Sol·licitud rebuda» / «Solicitud recibida» amb el dia i l'hora demanats, l'avís de confirmació per correu i
    enllaç a contacte, **sense** botó ni fitxer `.ics`, movent el focus al títol i anunciant l'estat a la regió
    `aria-live="polite"`); `409` (`ocupada` → avís i recàrrega automàtica de franges), `404` (`token`), `400` (`dades`).
    Si la resposta `200` arriba sense camp `estat` (format antic), manté per compatibilitat la pantalla «Trucada
    reservada» amb el botó i el fitxer `.ics` en UTC.
- **Com es prova:** `node proves/reserva.mjs` llegeix totes les respostes simulades directament de
  `proves/contractes/reserva.json` (si el contracte canvia, la prova ho detecta) i comprova el flux `estat: "pendent"`
  en català i castellà, la compatibilitat sense `estat`, els codis `409`/`400`/`404`, `ACTIVA = false` sobre `dist/` i
  la CSP real. Amb `--captures <carpeta>`, desa captures del pas «Sol·licitud rebuda» / «Solicitud recibida» a 375 i
  1280 px en tots dos idiomes.
- **Com s'activarà:** quan `rgpd-tool` exposi els dos punts finals i afegeixi `tokenReserva` a la resposta de
  `/api/public/diagnostic`, només caldrà canviar `var ACTIVA = true;` a `reserva.js` (la CSP de `_headers` ja inclou
  `connect-src https://rgpd.madeinhuman.cat`). A `/reserva/?t=<token>`, el token s'esborra de la barra d'adreces amb
  `history.replaceState`.

## Textos d'interfície centralitzats (`plantilles/textos.mjs`, WEB-G05 i WEB-G06)

Tots els textos fixos visibles i atributs d'interfície (`aria-label`, `alt` fixos, `title`) de les 11 plantilles generades
(`marc.mjs`, `base.mjs`, `blocs.mjs`, `serveis.mjs` inclosa la 404, `legal.mjs`, `actualitat.mjs`, `sectors.mjs`, `cerca.mjs`,
`reserva.mjs`, `llms.mjs` i `xarxes.mjs`) es centralitzen a `plantilles/textos.mjs` (`TEXTOS = { ca, es }`, `IDIOMES_ACTIUS`,
`IDIOMES_PREVISTOS = ['ca', 'es', 'en']`, `teIdioma(idioma)` i `t(idioma, clau, valors)`), preparat per incorporar un tercer
idioma (`en`) sense escampar cadenes per les plantilles.

## Preguntes freqüents per servei i dades de l'empresa al JSON-LD (WEB-G06)

- **Preguntes per servei:** a cada pàgina de servei (`ca` i `es`), si hi ha entrades a `contingut/faq.json` / `contingut/faq.es.json`
  amb `servei` igual a la clau del servei, es pinta la secció «Preguntes freqüents sobre aquest servei» / «Preguntas frecuentes sobre
  este servicio» amb cada resposta dins d'un `<details>` i un enllaç cap a l'`id` estable de la pregunta a `/preguntes-frequents/` o
  `/es/preguntas-frecuentes/` (`idPreguntaFaq()` a `plantilles/blocs.mjs`). Sense `FAQPage` duplicat a les pàgines de servei; els serveis
  sense preguntes associades (com `web`) mantenen l'HTML intacte.
- **JSON-LD de l'empresa (`ProfessionalService`):** tant a `empresa_ld()` (`plantilles/serveis.mjs`) com a la portada (`plantilles/base.mjs`),
  l'objecte de l'empresa inclou `contactPoint` (telèfon, correu i idiomes de `contingut/lloc.json`), `knowsAbout` (noms dels serveis de
  `contingut/serveis.json` en l'idioma de la pàgina), `areaServed` i `sameAs` (només URL `https://` de perfils socials declarats a
  `lloc.json`; si no n'hi ha, s'omet sense inventar res). Sense `streetAddress`, `postalCode` ni `geo` fora de l'avís legal.

## Teclat, focus visible i contrast WCAG AA (WEB-G06)

- Totes les pàgines generades comencen amb l'enllaç «Salta al contingut» / «Saltar al contenido» cap a `<main id="contingut" tabindex="-1">`,
  visible en rebre el focus, i disposen de contorn `:focus-visible` amb tokens de `marca.css` sobre enllaços, botons i camps.
- El menú mòbil (`menu.js`) s'obre i es tanca amb `Enter`/`Espai`, manté `aria-expanded` al dia i es tanca amb `Escape` retornant el focus
  al botó `.nav-burger`.
- `node proves/teclat.mjs` comprova amb Playwright el «Salta al contingut» a totes les pàgines generades, el focus visible a portada i
  servei, el menú mòbil a 375 px i el contrast WCAG AA (4,5:1 text normal, 3:1 text gran) a 1280 px.

## Regressió visual automàtica (`proves/visual.mjs` i job `visual` a la CI, WEB-G06 i WEB-G07)

Compara píxel a píxel totes les pàgines HTML (llevat de `_previsualitzacio/` i `recollida.html`) entre una carpeta base (p. ex. `main`)
i `dist/` a 375, 768 i 1280 px, sense dependències externes (canvas dins de Playwright), i genera l'informe a `captures/visual/informe.html`.
Amb `--resum-markdown <fitxer>`, escriu també una taula resum en Markdown (pàgines idèntiques, pàgines amb diferències i percentatge de cadascuna):

```bash
# 1. A main (abans dels canvis), genera la referència:
node eines/construir.mjs --sortida /tmp/main-dist
# 2. A la branca de treball, reconstrueix dist/ i compara:
npm run construir
node proves/visual.mjs --base /tmp/main-dist                                          # informativa (codi 0)
node proves/visual.mjs --base /tmp/main-dist --amplades 1280 --estricte               # falla si hi ha diferències
node proves/visual.mjs --base /tmp/main-dist --amplades 375,1280 --resum-markdown /tmp/resum.md
```

- **Job `visual` a GitHub Actions (`.github/workflows/comprovacions.yml`):** és informatiu (`continue-on-error: true`) i s'omet a `main`
  (`if: github.ref != 'refs/heads/main'`). Construeix `main` en una carpeta temporal fora del repositori amb `git worktree add`, construeix
  la branca actual a `dist/`, compara a `375,1280` px i escriu la taula resum a `$GITHUB_STEP_SUMMARY` sense pujar captures com a artefacte
  ni fer servir accions de tercers.

## Informe de registre «tu» / «vosaltres» (`eines/registre.mjs`, WEB-G07)

Eina **de només lectura** i sense dependències per fer l'inventari del tractament («tu» / «vosaltres» en català; «tú» / «vosotros» en castellà)
a tota la web abans d'unificar-ne el registre. No modifica cap fitxer de `contingut/` ni cap fitxer seguit per git.

```bash
node eines/registre.mjs                     # analitza tota la web (amb esborranys) → captures/registre/informe.md
node eines/registre.mjs --sense-esborranys  # només les pàgines publicades
node proves/registre.mjs                    # proves unitàries (ca/es, falsos positius) i garantia de només lectura
```

- **Com funciona:** construeix la web en una carpeta temporal fora del repositori, extreu el text visible de cada `.html` (sense `<script>`,
  `<style>` ni blocs `<pre hidden>`, però incloent `aria-label`, `alt`, `placeholder` i `title`) i detecta pronoms, possessius, clítics i
  formes verbals freqüents de 2a persona evitant falsos positius comuns («us» dins paraula, `US`, «et al.», «et cetera», «te» substantiu, `OS`,
  homògrafs de 3a persona del singular).
- **Com llegir `captures/registre/informe.md`:**
  1. **Resum:** taula amb el recompte de pàgines en cada registre (`tu`, `vosaltres`, `mixt`, `cap`), separat per publicades i esborranys (`ca`/`es`).
  2. **Frases d'interfície comunes:** quines cadenes del menú/peu (`contingut/lloc.json`) i de `plantilles/textos.mjs` introdueixen marques de registre.
  3. **Inventari per pàgina:** taula amb idioma, ruta, si és esborrany, comptadors i registre dominant.
  4. **Pàgines mixtes:** detall de totes les ocurrències amb ~60 caràcters de context per localitzar-les ràpidament.

## Autotest SaaS en castellà (`/es/autotest-saas/`, esborrany, WEB-G06)

Eina estàtica en esborrany (`noindex, nofollow`, fora de `sitemap.xml`, sense enllaços des de la resta de la web i amb la franja visible
«Borrador: pendiente de validación») a `es/autotest-saas/` (`index.html`, `estils.css`, `dades/preguntes.js`, `src/avaluar.js`, `src/app.js`).

- **Funcionament actual:** 12 preguntes en castellà (registre «vosotros») que avaluen de manera 100 % local un semàfor accessible
  (verd/ambre/vermell), els paquets orientatius («Base SaaS», «Trust Pack B2B», «Add-on IA»), el perfil opcional «Fundador en solitario»,
  els avisos «probables, a valorar» (EIPD i representant de l'art. 27 RGPD) i una llista de punts a revisar, amb crida «Hablemos» cap a
  `/es/#contacto`. Sense `fetch`, sense `localStorage`, sense `sessionStorage` ni galetes.
- **Què faltarà abans de publicar-lo:**
  1. Validació jurídica i editorial de totes les marques `[REVISAR: …]` de `es/autotest-saas/dades/preguntes.js` per la persona responsable.
  2. Decidir si s'hi afegeix enviament a l'API de `rgpd-tool` (amb contracte a `proves/contractes/` i protecció CSP).
  3. Treure la franja d'esborrany i el `noindex, nofollow`, afegir canònica i enllaçar-lo des de la web en castellà.

## Cerca interna sense tercers (`/cerca/`, `/es/buscar/` i `404.html`, WEB-G05)

- A la construcció es generen `/cerca/index.json` (català) i `/es/buscar/index.json` (castellà) amb `{ url, titol,
  descripcio, h2 }` **només** de les pàgines publicades i indexables (mai esborranys ni `noindex`, tampoc amb
  `--esborranys`).
- Les pàgines `/cerca/` i `/es/buscar/` (`plantilles/cerca.mjs`, `noindex, follow`, fora del mapa del lloc, `hreflang`
  recíproc) carreguen `cerca.js`: cerca sense accents ni majúscules, exigeix totes les paraules, prioritza coincidències
  al títol, limita a 20 resultats, sincronitza `?q=` amb l'historial («Enrere») i ofereix alternativa `<noscript>`.
- `404.html` inclou un formulari `GET` amb camp `q` cap a `/cerca/` (bloc català) i `/es/buscar/` (bloc castellà).

## `/llms.txt` (`plantilles/llms.mjs`, WEB-G05)

Generat automàticament a `dist/llms.txt` seguint `llmstxt.org`: `# Madeinhuman`, línia `> ` amb la descripció de
`contingut/lloc.json`, i seccions (`## Serveis`, `## Preguntes freqüents`, `## Actualitat`, `## Sectors`, `## Legal`,
`## Español`) ometent les buides. Només inclou pàgines publicades i indexables (idèntic amb `--esborranys`). `robots.txt`
no canvia.

## Controls de qualitat i proves noves (WEB-G04, WEB-G05, WEB-G06 i WEB-G07)

Tots els controls estàtics accepten `--arrel <carpeta>` (per defecte `dist`) i funcionen tant sobre producció
(`npm run construir`) com sobre la construcció d'esborranys (`node eines/construir.mjs --esborranys`):

```bash
node proves/esborranys.mjs             # taula /esborranys/ 2.0 (filtres, <details>, Markdown, guia) i absència a producció
node proves/textos.mjs                 # paritat ca/es a plantilles/textos.mjs (11 plantilles + estructura en), sense claus sense ús
node proves/llms.mjs                   # estructura de /llms.txt, URLs absolutes a dist/, cap esborrany ni noindex
node proves/pagina-404.mjs             # 404 bilingüe, formularis de cerca /cerca/ i /es/buscar/ i enllaços vàlids
node proves/enllacos.mjs               # enllaços i recursos interns, fragments #id, href buits, target=_blank rel=noopener
node proves/dades-estructurades.mjs    # JSON-LD vàlid, ProfessionalService (contactPoint, knowsAbout, sameAs), Article/Service/FAQ
node proves/accessibilitat.mjs         # lang coherent, <main>, un sol <h1>, nivells de títol, ids únics, alt, labels, enllaços/botons
node proves/pes.mjs                    # pressupost ≤ 500 kB per pàgina (avís a recollida.html) i imatges ≤ 300 kB
node proves/cerca.mjs                  # índexs de cerca (sense navegador) i interfície /cerca/ i /es/buscar/ amb Playwright + CSP
node proves/reserva.mjs                # selector de reserves amb contracte reserva.json, estat pendent, compatibilitat, CSP i --captures
node proves/visual.mjs --base <dir>    # regressió visual píxel a píxel, informe HTML i --resum-markdown (CI)
node proves/teclat.mjs                 # «Salta al contingut», focus visible, menú mòbil amb teclat i contrast WCAG AA
node proves/autotest-saas.mjs          # avaluació pura i recorregut Playwright + CSP de /es/autotest-saas/ (esborrany)
node proves/registre.mjs               # detecció de registre tu/vosaltres (ca/es), falsos positius i garantia de només lectura
```
