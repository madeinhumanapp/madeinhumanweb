---
id: WEB-T04
assignat: mistral
zona: verda
base: main
branca: mistral/WEB-T04
estat: obert
fase: 0 (prova de l'equip)
---
# WEB-T04 · Descripcions per a Google de 155 caràcters com a màxim

## Objectiu
Escurçar a 155 caràcters com a màxim les quatre descripcions (`descripcio`) de `contingut/serveis.json` que ara en
passen, sense perdre el sentit ni les paraules clau.

## Context (llegeix-ho abans)
- `AGENTS.md` (sobretot «Termes i estil»).
- `docs/encarrecs/WEB-L05-seo.md`: com es van escriure els títols i les descripcions.
- Les quatre descripcions que passen de 155 caràcters (mesurades sobre el text, no sobre l'HTML):

| Camí dins de `contingut/serveis.json` | Caràcters ara |
|---|---|
| `PAGINES.adequacio.ca.descripcio` | 161 |
| `PAGINES.ia.ca.descripcio` | 160 |
| `PAGINES.ia.es.descripcio` | 157 |
| `PORTADA_ES.descripcio` | 157 |

## Abast
- **Pots tocar:** només aquests quatre valors de `contingut/serveis.json`.
- **NO pots tocar:** cap altre camp ni cap altre fitxer.

## Què has de fer
1. Reescriu cada descripció a **155 caràcters o menys** (millor entre 140 i 155):
   - manté el servei, la zona (Girona) quan hi és i la idea principal;
   - manté el registre que ja té la pàgina (tu/vosaltres; en castellà, el mateix que ara);
   - català normatiu (glossari d'`AGENTS.md`) i castellà correcte a les dues en castellà;
   - res inventat: ni xifres, ni terminis, ni promeses noves.
2. Comprova les llargades amb aquesta ordre, que ha de mostrar quatre línies amb un número ≤ 155:
   ```
   node -e 'const d=require("./contingut/serveis.json");for(const p of [d.PAGINES.adequacio.ca,d.PAGINES.ia.ca,d.PAGINES.ia.es,d.PORTADA_ES])console.log(p.descripcio.length, p.descripcio)'
   ```

## Criteris d'acceptació
1. L'ordre anterior mostra quatre línies, totes amb ≤ 155.
2. `npm run serveis` → `totes les comprovacions dels serveis i dels blocs correctes`.
3. `npm run construir` i `npm run comprovar` en verd.
4. Al resum, una taula amb el text d'abans i el de després de cadascuna.

## Restriccions
- Només aquests quatre textos. Sense HTML (només el text enriquit permès).

## Lliurament
Commit `WEB-T04: descripcions de 155 caràcters com a màxim` a `mistral/WEB-T04`, `git push`, i el resum final d'`AGENTS.md`.
