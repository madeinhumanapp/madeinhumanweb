# Madeinhuman Web

Static website for madeinhuman.cat — privacy consultancy (RGPD/AI Act).

## Architecture

- Pure HTML/CSS/JS, no build step
- Hosted on Cloudflare Pages (auto-deploy from `main` branch)
- Forms POST to `https://api.madeinhuman.cat` via Cloudflare Tunnel (independent of Pages)
- React (CDN) only for `recollida.html` wizard

## Key Files

- `index.html` — Main page with ✏️ EDITABLE markers
- `script.js` — Form handlers, FAQ data, cookie banner
- `styles.css` — All styles (dark blue + copper theme)
- `admin/` — Visual admin panel (GitHub API CMS, zero backend)
- `wizard/` — React components for data collection wizard
- `fonts/` — Self-hosted woff2 fonts

## API Endpoints (via Cloudflare Tunnel)

- `POST /api/public/contacte` — Contact form
- `POST /api/public/pressupost` — RGPD adequacy request
- `POST /api/public/recollida/*` — Wizard endpoints

## Rules

- Never change `name=""` attributes on form fields
- Never modify files in `wizard/` or `fonts/` without explicit request
- The admin panel reads/writes via GitHub API — keep it zero-backend
- All text in Catalan
