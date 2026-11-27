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
idioma: ca
---

## Què ha passat
…
---
Notes de revisió: tot el que hi ha després d'aquesta línia no es publica mai.
```

- **Amb cos** (Markdown de `plantilles/markdown.mjs`): pàgina pròpia, i la targeta enllaça a la pàgina.
  **Sense cos** («breu»): només targeta.
- Surten al llistat `/actualitat/`, al canal `/actualitat/rss.xml` i al mapa del lloc. A la portada, el bloc
  `actualitat` amb `"origen": "actualitat"` mostra les 3 últimes; si no n'hi ha cap de publicada, la llista manual.
- Una notícia amb `estat: publicat` i qualsevol `[REVISAR` no deixa construir la web.
- **Esborranys (`estat: esborrany`) amb cos:** no surten mai a producció (`npm run construir`), ni al llistat `/actualitat/`,
  ni al RSS, ni al mapa del lloc, ni a la portada. En vistes prèvies (`CF_PAGES_BRANCH` ≠ `main`) o amb `--esborranys` es
  genera la seva pàgina amb `noindex, nofollow` i la franja «Esborrany: pendent de validació», i un índex a `/actualitat/esborranys/`.
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
coincidir amb el nom del fitxer). Esquema i validació a `esquema/sectors.mjs`; plantilla a `plantilles/sectors.mjs`
(URL `/sectors/<slug>/` i índex `/sectors/`).

- **Publicades (`estat: "publicat"`):** es generen sempre, surten a `/sectors/` i entren soles al mapa del lloc. Qualsevol
  marca `[REVISAR` atura la construcció.
- **Esborranys (`estat: "esborrany"`):** **no** es generen a producció (`npm run construir` o `CF_PAGES_BRANCH=main`).
  Només es generen, amb `noindex, nofollow` i la franja «Esborrany: pendent de validació», a les vistes prèvies de
  Cloudflare (`CF_PAGES_BRANCH` present i diferent de `main`) o localment amb `node eines/construir.mjs --esborranys`.
  No apareixen a l'índex `/sectors/` ni al mapa del lloc. Si no hi ha cap pàgina publicada, `/sectors/` no es genera.
- A les proves es pot redirigir la carpeta amb `DIR_SECTORS`.
