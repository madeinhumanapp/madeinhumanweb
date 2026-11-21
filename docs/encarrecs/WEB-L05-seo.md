# WEB-L05 — Títols i descripcions per a Google

**Branca base:** `claude/website-control-panel-iz6s7h` · **Branca de treball:** `mistral/WEB-L05`

## Objectiu

Cada pàgina té un títol i una descripció per a Google (`<title>` i `meta description`). Ara n'hi ha de massa
llargs (Google talla els títols a uns 60–65 caràcters i les descripcions a uns 155–160) i alguns no diuen prou bé
què hi trobarà la persona. Proposa'n millores en un document de revisió. **No canviïs cap fitxer del contingut**:
Claude aplica les propostes aprovades.

## Què has de llegir (només llegir)

| Fitxer | Camps |
|---|---|
| `contingut/serveis.json` | `PAGINES.<servei>.<ca|es>.titol_seo` i `.descripcio` (10 pàgines) i `PORTADA_ES.titol_seo` i `.descripcio` |
| `contingut/pagines/portada.ca.json` | `cap.titol`, `cap.descripcio`, `cap.og.titol`, `cap.og.descripcio`, `cap.twitter.titol`, `cap.twitter.descripcio` |
| `contingut/pagines/avis-legal.json`, `politica-privacitat.json`, `politica-cookies.json` | `cap.titol`, `cap.descripcio` |

Per veure on surt cada pàgina: el camp `ruta` o la taula `SLUG` de `serveis.json`.

## Què has de fer

1. Per a cada camp de la taula, compta'n els caràcters.
2. Escriu `docs/revisio/WEB-L05-seo.md` amb una introducció de 2 línies i **una sola taula**:

   | # | Fitxer | On | Text actual | Proposta | Tipus | Motiu |
   |---|---|---|---|---|---|---|

   - `#`: número de fila (1, 2, 3…). `Fitxer`: el camí, p. ex. `contingut/serveis.json`.
   - `On`: el camp, p. ex. `PAGINES.dpo.ca.descripcio`.
   - `Text actual`: **exactament** el valor del fitxer (la comprovació el cerca tal qual). Si conté `|`, escriu `\|`.
   - `Tipus`: `llargada`, `claredat` o `coherència`. `Motiu`: inclou la llargada abans → després (p. ex. «81 → 62»).
3. Normes de les propostes:
   - Títol: 50–65 caràcters, amb el servei primer i «Madeinhuman» al final quan hi càpiga (p. ex. «DPO extern a
     Girona · Madeinhuman»). Descripció: 120–160 caràcters, una frase que digui què s'hi troba.
   - Català a les pàgines `ca`, castellà a les `es` (glossari d'`AGENTS.md`: «pimes» / «pymes», «DPO», «RGPD»).
   - Res inventat: ni preus, ni terminis, ni xifres que no surtin al contingut de la mateixa pàgina.
   - No proposis canvis als que ja compleixen les normes i són clars.
4. `npm run revisio -- docs/revisio/WEB-L05-seo.md` ha de dir `N/N propostes amb el text actual trobat literalment`.
5. `git add docs/revisio/WEB-L05-seo.md`, commit `WEB-L05: títols i descripcions per a Google` i push.

## Lliurament

Només `docs/revisio/WEB-L05-seo.md`.

## Criteris d'acceptació

- `npm run revisio` en verd (N/N).
- Cada proposta dins dels límits de caràcters i amb la llargada al motiu.

## Fora d'abast

Canviar `contingut/`, plantilles o `.html`; el contingut visible de les pàgines (això és WEB-L06 i WEB-L01).
