# WEB-L06 — Revisió lingüística de les pàgines en castellà

**Branca base:** `claude/website-control-panel-iz6s7h` · **Branca de treball:** `mistral/WEB-L06`

## Objectiu

Les pàgines en castellà (`/es/` i les 5 de `/es/servicios/`) no han tingut mai una revisió com la de WEB-L01 en
català. Revisa'n el text i proposa'n correccions en un document. **No canviïs cap fitxer del contingut.**

## Què has de llegir (només llegir)

| Fitxer | Camps |
|---|---|
| `contingut/serveis.json` | `PAGINES.<servei>.es` (tots els camps, també `seccions`), `PORTADA_ES`, `COMU.es` |
| `contingut/lloc.json` | `menu.es` i `peu.es` |

Si vols veure les pàgines muntades: `npm run construir` i obre `dist/es/index.html` i `dist/es/servicios/…`.

## Què has de fer

1. Llegeix-ho tot com ho llegiria una persona que dirigeix una pyme.
2. Escriu `docs/revisio/WEB-L06-castella.md` amb un resum (quantes propostes de cada tipus i les 3 més importants)
   i **una sola taula**, amb el mateix format que `docs/revisio/WEB-L01a-revisio.md`:

   | # | Fitxer | On | Text actual | Proposta | Tipus | Motiu |
   |---|---|---|---|---|---|---|

   - `Text actual`: **exactament** el text del fitxer, el tros mínim que inclogui el canvi (la comprovació el cerca
     tal qual). Al Markdown de les seccions, copia'l tal com és dins del JSON (els salts de línia són `\n`: tria un
     tros que no en tingui).
   - `Tipus`: `ortografia`, `gramàtica`, `puntuació`, `coherència`, `estil` o `traducció` (calc del català).
3. Normes: castellà normatiu i planer; «pymes» (mai «pimes» en castellà); «DPO», «RGPD», «LOPDGDD»; mantén el
   tractament que ja té cada pàgina; cap canvi de contingut jurídic, xifres o terminis; cometes «» o "" segons
   el que ja facin servir les pàgines en castellà (tria'n un i justifica-ho al resum).
4. `npm run revisio -- docs/revisio/WEB-L06-castella.md` → `N/N propostes amb el text actual trobat literalment`.
5. `git add docs/revisio/WEB-L06-castella.md`, commit `WEB-L06: revisió de les pàgines en castellà` i push.

## Lliurament

Només `docs/revisio/WEB-L06-castella.md`.

## Criteris d'acceptació

- `npm run revisio` en verd (N/N). Com a màxim 60 propostes: prioritza les que més es noten.

## Fora d'abast

Els títols i descripcions per a Google (WEB-L05), les pàgines legals en castellà (WEB-L04) i el català.
