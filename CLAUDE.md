# Madeinhuman Web

Static website for madeinhuman.cat — privacy consultancy (RGPD/AI Act).

## Architecture

- Pure HTML/CSS/JS, no build step
- Hosted on Cloudflare Pages (auto-deploy from `main` branch)
- Forms POST to `https://rgpd.madeinhuman.cat` (app hosted on Render)
- React, Babel and SheetJS only for `recollida.html` wizard, self-hosted in `vendor/` (pinned versions)
- No third-party requests from any page: no external analytics, pixels, font CDNs or link shorteners

## Key Files

- `index.html` — Main page with ✏️ EDITABLE markers
- `script.js` — Form handlers, FAQ data, cookie banner
- `marca.css` — Single source of truth: brand tokens (colors from `marca/generador/marca.py`) and `@font-face`. Load it before any other stylesheet
- `styles.css` — All styles of the main pages (uses the tokens from `marca.css`)
- `admin/` — Visual admin panel (GitHub API CMS, zero backend)
- `wizard/` — React components for data collection wizard
- `fonts/` — Self-hosted woff2 fonts (DM Sans, Playfair Display, DM Mono)
- `vendor/` — Third-party JS for `recollida.html` (see `vendor/LLEGEIX-ME.md`)
- `xarxes/` — Links page for social profiles (`?o=ig|tt|gbp` adds UTM); `noindex`, not in the sitemap
- `marca/generador/` — Brand image generator (Python + Playwright); not deployed (`.assetsignore`)
- `favicon.svg`, `favicon.ico`, `apple-touch-icon.png` — Simplified logo (h + gold cursor); `og-image.png` is generated with `python marca/generador/og.py`

## API Endpoints (via Render — rgpd.madeinhuman.cat)

- `POST /api/public/contacte` — Contact form
- `POST /api/public/pressupost` — RGPD adequacy request
- `POST /api/public/diagnostic` — Free RGPD diagnostic (`diagnostic.html`)
- `POST /api/public/recollida/*` — Wizard endpoints

The contact, adequacy and diagnostic forms also send `utm_source`, `utm_medium`, `utm_campaign` and `utm_content`, read from the page URL at submit time by `utm.js` (whitelist `[a-z0-9._-]`, max 100). Never store attribution data on the visitor's device (no cookies, localStorage or sessionStorage: LSSI art. 22.2).

## Rules

- Never change `name=""` attributes on form fields
- Never modify files in `wizard/` or `fonts/` without explicit request
- The admin panel reads/writes via GitHub API — keep it zero-backend
- All text in Catalan
