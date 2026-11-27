# Madeinhuman Web

Static website for madeinhuman.cat — privacy consultancy (RGPD/AI Act).

## Architecture

- Static site generated since the cutover (22/11/2026): `eines/construir.mjs` builds `dist/` from `contingut/` (JSON and
  Markdown) + `plantilles/` (one function per block) with the schema in `esquema/` (exported to `esquema/esquema.json`
  for the panel). No runtime dependencies. Plan, decisions and backlog: `rgpdtool/docs/panell-web/` (private repo)
- Cloudflare Pages (project `madeinhumanweb`): build command `node eines/construir.mjs`, output `dist`,
  `SKIP_DEPENDENCY_INSTALL=1`; production = `main`, every branch gets a preview at `<branch>.madeinhumanweb.pages.dev`
  (long names are shortened). Pages serves `/page.html` as `/page` (308, query kept): `_headers` rules need both forms
- Content is edited from the «Web» panel of rgpd-tool (GitHub App → branch `esborrany` → publish to `main`)
- Forms POST to `https://rgpd.madeinhuman.cat` (app hosted on Render)
- React, Babel and SheetJS only for `recollida.html` wizard, self-hosted in `vendor/` (pinned versions)
- No third-party requests from any page: no external analytics, pixels, font CDNs or link shorteners. Only exception
  (decided 26/11/2026): Cloudflare Turnstile (`turnstile.js`) on the pages with forms, loaded only when the visitor
  starts filling a form; the key lives in `turnstile.js` and the secret in rgpd-tool

## Key Files

- `contingut/` — all the text: `lloc.json`, `pagines/*.json` (blocks), `serveis.json`, `faq.json`, `actualitat/*.md` (news), `legal/*.md`
- `diagnostic.html`, `recollida.html`, `necessito-dpo/` — apps, static files (connectors with rgpd-tool); not generated
- `script.js` — Form handlers, FAQ data, cookie banner
- `marca.css` — Single source of truth: brand tokens (colors from `marca/generador/marca.py`) and `@font-face`. Load it before any other stylesheet
- `styles.css` — All styles of the main pages (uses the tokens from `marca.css`)
- `wizard/` — React components for data collection wizard
- `fonts/` — Self-hosted woff2 fonts (DM Sans, Playfair Display, DM Mono)
- `vendor/` — Third-party JS for `recollida.html` (see `vendor/LLEGEIX-ME.md`)
- `xarxes/` — Links page for social profiles (`?o=ig|tt|gbp` adds UTM, `xarxes/xarxes.js`); generated from `contingut/pagines/xarxes.json`; `noindex`
- `marca/generador/` — Brand image generator (Python + Playwright); not deployed (not copied to `dist/`)
- `favicon.svg`, `favicon.ico`, `apple-touch-icon.png` — Simplified logo (h + gold cursor); `og-image.png` is generated with `python marca/generador/og.py`
- `esquema/`, `plantilles/`, `eines/` — generator (see `eines/LLEGEIX-ME.md`); not deployed
- `proves/` — checks: `npm run contractes` (form payloads to rgpd-tool), `npm run previsualitzacio` (panel preview),
  `npm run csp` (every page with the real `_headers`), `npm run actualitat`, `npm run serveis`; `npm run comprovar`
  runs them all (also in GitHub Actions). `npm run captures -- <label>` for before/after screenshots of visual changes
- `AGENTS.md` + `docs/encarrecs/` — instructions and task briefs for Mistral (Vibe). Mistral works on `mistral/<ID>`

## API Endpoints (via Render — rgpd.madeinhuman.cat)

- `POST /api/public/contacte` — Contact form
- `POST /api/public/pressupost` — RGPD adequacy request
- `POST /api/public/diagnostic` — Free RGPD diagnostic (`diagnostic.html`)
- `POST /api/public/recollida/*` — Wizard endpoints

The contact, adequacy and diagnostic forms also send `utm_source`, `utm_medium`, `utm_campaign` and `utm_content`, read from the page URL at submit time by `utm.js` (whitelist `[a-z0-9._-]`, max 100). Never store attribution data on the visitor's device (no cookies, localStorage or sessionStorage: LSSI art. 22.2).

## Rules

- Never change `name=""` attributes on form fields, nor the `value` of their options (they are API data).
  `proves/contractes/` is the contract with rgpd-tool: a deliberate change goes API first, then web, then `node proves/formularis.cjs --desar`
- On the homepage, internal links are fragment-only (`#contacte`, not `/#contacte`): otherwise the `utm_*` of the URL are lost
- URLs used by rgpd-tool e-mails must not move: `/#contacte`, `/recollida.html?token=`, `/diagnostic.html?ref=`, `/politica-privacitat.html`
- No HTML inside `contingut/`: only `*em*`, `**strong**`, line breaks and `[text](/path)` (the schema rejects HTML)
- Template changes that alter what visitors see: before/after screenshots (`npm run captures`) and the branch preview on Pages, approved before merging to `main`
- Never modify files in `wizard/` or `fonts/` without explicit request
- All text in Catalan
