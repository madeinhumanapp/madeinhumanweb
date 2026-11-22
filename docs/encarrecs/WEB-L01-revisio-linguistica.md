# WEB-L01 — Revisió lingüística, de to i de terminologia de la web

**Branca base:** `claude/website-control-panel-iz6s7h` · **Branca de treball:** `mistral/WEB-L01`
Es fa en **dos lots** (dues sessions): lot A (portada, FAQ i serveis) i lot B (pàgines legals i aplicacions).

## Objectiu

Detectar errades i incoherències als textos públics de madeinhuman.cat abans de migrar-los. **No modifiquis cap
fitxer de la web: només proposes.** La responsable aprovarà o descartarà cada proposta i Claude aplicarà les aprovades.

## Context

- madeinhuman és una consultoria de protecció de dades (RGPD) i Reglament d'IA per a pimes de Girona i comarques.
- Hi ha registres barrejats: la portada i els serveis tracten de «tu»; el diagnòstic, de «vosaltres». **No proposis
  canviar el registre**: només inventaria'l (apartat 3).
- Als textos en català hi ha «pymes» i «pimes». No ho canviïs: posa-ho al glossari (apartat 4).
- El contingut jurídic (dates del Reglament d'IA, obligacions, imports, organismes) ja s'ha revisat. No en proposis
  canvis. Si alguna cosa et sembla incorrecta, fes-ne una fila de tipus `[REVISAR]` i explica per què.
- Alguns termes poden ser tries per a les cerques de Google («DPO», «pymes»): indica-ho al glossari.

## Entrades (només lectura)

**Lot A:** `index.html` (text visible, `<title>`, `meta description`, `og:*`, `twitter:*` i els textos del JSON-LD),
`script.js` (l'array `FAQ_DATA`, els missatges dels formularis i el bàner de galetes),
`marca/pagines/contingut.py` (**només** els textos en català; d'aquí surten `serveis/*/index.html`).

**Lot B:** `avis-legal.html`, `politica-privacitat.html`, `politica-cookies.html`, `diagnostic.html`, els textos
visibles de `diagnostic.js`, `necessito-dpo/index.html`, els textos visibles de `necessito-dpo/src/app.js` i
`necessito-dpo/dades/regles.js`, `xarxes/index.html`.

No revisis: `es/`, `recollida.html`, `wizard/`, `marca/generador/`.

## Lliurament

Lot A: `docs/revisio/WEB-L01a-revisio.md` · Lot B: `docs/revisio/WEB-L01b-revisio.md`. Estructura de cada fitxer:

**1. Resum** — de 3 a 6 línies: quantes propostes de cada tipus i les 3 més importants.

**2. Propostes** — una taula per fitxer d'entrada, en l'ordre en què apareixen al fitxer:

| # | Fitxer | On | Text actual | Proposta | Tipus | Motiu |
|---|---|---|---|---|---|---|
| 1 | `index.html` | Peu, descripció | `regulació d'Intel·ligència Artificial per a pymes` | `regulació d'intel·ligència artificial per a pymes` | coherència | Nom comú: en minúscula, com a la resta de la web. |

- **Fitxer:** la ruta des de l'arrel del repositori, entre accents greus.
- **Text actual:** de 3 a 15 paraules copiades **exactament** del fitxer font, entre accents greus. Si hi ha etiquetes
  HTML pel mig, tria un fragment que no en tingui. Si conté una barra vertical `|`, escriu-la `\|`.
- **Tipus:** `ortografia` · `gramàtica` · `puntuació` · `estil` · `coherència` · `[REVISAR]`.
- Una fila per canvi. Numera les files seguides dins de cada fitxer de lliurament.

**3. Registre** — taula: fitxer · formes de «tu» · formes de «vosaltres» · un exemple literal de cada.

**4. Proposta de glossari** — taula: terme preferit · variants trobades (i on) · recomanació · motiu. Com a mínim:
pimes / pymes; DPO / DPD / delegat de protecció de dades; AI Act / Reglament d'IA / Reglament europeu d'IA;
RGPD / LOPDGDD; IA / intel·ligència artificial (i majúscules); AEPD i APDCat (si es despleguen a la primera menció).

**5. Notes** — què has deixat amb `[REVISAR]` i per què.

## Comprova abans de lliurar

```
npm run revisio -- docs/revisio/WEB-L01a-revisio.md     → «N/N propostes amb el text actual trobat literalment»
```
Si alguna fila surt amb ✗, corregeix el «Text actual» d'aquella fila (copia'l exactament del fitxer).

Després: `git add docs/revisio/WEB-L01a-revisio.md`, commit `WEB-L01: revisió lingüística, lot A` i push.
El lot B, igual, en una altra sessió i a la mateixa branca.

## Criteris d'acceptació

- `npm run revisio` en verd per als dos fitxers.
- Cap proposta canvia el registre ni el contingut jurídic (aquests casos, només `[REVISAR]`).
- Cap fitxer de la web modificat.

## Fora d'abast

Traduccions, canvis de disseny, formularis, textos de rgpd-tool.
