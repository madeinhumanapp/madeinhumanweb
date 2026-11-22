# Madeinhuman Web

Static website for madeinhuman.cat — privacy consultancy (RGPD/AI Act).

## Architecture

- Pure HTML/CSS/JS. Until the cutover (WEB-H10 of the panel plan) Cloudflare serves the repository root as is
- In progress (branch `claude/website-control-panel-iz6s7h`): one generator `eines/construir.mjs` builds `dist/` from
  `contingut/` (JSON) + `plantilles/` (one function per block) with the schema in `esquema/`. No runtime dependencies.
  Plan, decisions and backlog: `rgpdtool/docs/panell-web/` (private repo; start with `PLA-ACCIONS.md`)
- Hosted on Cloudflare Pages (auto-deploy from `main` branch)
- Forms POST to `https://rgpd.madeinhuman.cat` (app hosted on Render)
- React, Babel and SheetJS only for `recollida.html` wizard, self-hosted in `vendor/` (pinned versions)
- No third-party requests from any page: no external analytics, pixels, font CDNs or link shorteners

## Key Files

- `index.html` — Main page with ✏️ EDITABLE markers
- `script.js` — Form handlers, FAQ data, cookie banner
- `marca.css` — Single source of truth: brand tokens (colors from `marca/generador/marca.py`) and `@font-face`. Load it before any other stylesheet
- `styles.css` — All styles of the main pages (uses the tokens from `marca.css`)
- `wizard/` — React components for data collection wizard
- `fonts/` — Self-hosted woff2 fonts (DM Sans, Playfair Display, DM Mono)
- `vendor/` — Third-party JS for `recollida.html` (see `vendor/LLEGEIX-ME.md`)
- `xarxes/` — Links page for social profiles (`?o=ig|tt|gbp` adds UTM); `noindex`, not in the sitemap
- `marca/generador/` — Brand image generator (Python + Playwright); not deployed (`.assetsignore`)
- `favicon.svg`, `favicon.ico`, `apple-touch-icon.png` — Simplified logo (h + gold cursor); `og-image.png` is generated with `python marca/generador/og.py`
- `contingut/`, `esquema/`, `plantilles/`, `eines/` — generator (see `eines/LLEGEIX-ME.md`); not deployed (`.assetsignore`)
- `proves/` — checks: `npm run paritat` (generated = current site), `npm run contractes` (form payloads to rgpd-tool),
  `npm run previsualitzacio` (panel preview security). `npm run comprovar` runs them all (also in GitHub Actions)
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
- Migrating ≠ redesigning: a migration must keep `npm run paritat` at 19/19; visual changes go in a separate, reviewed step
- Never modify files in `wizard/` or `fonts/` without explicit request
- All text in Catalan
