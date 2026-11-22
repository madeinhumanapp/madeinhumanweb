# WEB-H04 — Port del generador de les pàgines de servei (Python → Node)

**Branca base:** `claude/website-control-panel-iz6s7h` · **Branca de treball:** `mistral/WEB-H04`
**Durada orientativa:** una sessió llarga. Feina mecànica amb una comprovació que diu exactament si està bé.

## Objectiu

Que les 11 pàgines que avui genera `marca/pagines/generar.py` (5 serveis en català, 5 en castellà i la portada en
castellà) les generi el mateix generador que la portada (`npm run construir`), **idèntiques byte a byte o, com a
mínim, idèntiques per a la paritat**. Així la web té un sol generador i el panell podrà editar aquestes pàgines.

## Context (llegeix-ho abans d'escriure codi)

- `eines/LLEGEIX-ME.md` — com funciona el generador.
- `marca/pagines/generar.py` — el que has de portar. Funcions: `url_servei`, `e`, `zona_text`, `empresa_ld`, `cap`,
  `nav`, `peu`, `bloc_final`, `pagina_servei`, `portada_es`. S'ha comprovat que reprodueix exactament les pàgines
  publicades: el teu port ha de fer el mateix.
- `marca/pagines/contingut.py` — les dades.
- `eines/construir.mjs`, apartat «2b»: si existeix `plantilles/serveis.mjs`, crida `paginesServei(lloc, dades)` i
  escriu cada `[ruta, html]` que retorna. Mentre existeixi aquest fitxer, les 11 pàgines originals **no** es copien a
  `dist/`: si en falta alguna, la paritat diu «falta a dist».
- **Atenció a l'escapament:** `e()` de Python és `html.escape(t, quote=True)`, que converteix `&`, `<`, `>`, `"` i
  també l'apòstrof `'` en `&#x27;`. `esc()` de `plantilles/text.mjs` **no** escapa l'apòstrof. Escriu dins de
  `plantilles/serveis.mjs` una funció `e()` pròpia que faci el mateix que Python.
- **Atenció als salts de línia:** les f-strings de Python porten salts de línia i sagnats; reprodueix-los igual amb
  plantilles de text de JavaScript (`` `…` ``). El JSON-LD de `generar.py` és
  `json.dumps(ld, ensure_ascii=False, indent=2)`: a JavaScript, `JSON.stringify(ld, null, 2)` dona el mateix format.

## Què has de fer

1. **Dades.** Executa l'exportador (escriu `contingut/serveis.json`):
   - Windows: `py eines/exportar-serveis.py`
   - macOS / Linux: `python3 eines/exportar-serveis.py`

   `NAP` (dades de contacte) **no** s'exporta: llegeix-les de `lloc.contacte` (`contingut/lloc.json`); el
   `telefon_visible` de Python és `telefonVisible`. Si et cal el nom de l'empresa, afegeix `"nom": "Madeinhuman"` al
   primer nivell de `contingut/lloc.json` (és l'únic canvi permès en aquest fitxer).
2. **Plantilles.** Crea `plantilles/serveis.mjs` amb:
   ```js
   export function paginesServei(lloc, dades) {
     // retorna [[ruta, html], …] amb aquestes 11 rutes:
     // serveis/<slug>/index.html (5), es/servicios/<slug>/index.html (5), es/index.html
   }
   ```
   Porta cada funció de Python a una funció de JavaScript amb el mateix nom i el mateix ordre. No facis servir cap
   paquet ni `import` fora de `node:` i dels fitxers de `plantilles/`.
3. **Comprova** (enganxa la sortida al resum):
   ```
   npm run construir      → ha de dir «12 pàgines generades»
   npm run paritat        → «19/19 pàgines idèntiques»
   npm run contractes     → 4 línies «ok»
   ```
   Si la paritat falla en una pàgina, compara-la directament, per exemple:
   `git diff --no-index serveis/dpo-extern/index.html dist/serveis/dpo-extern/index.html`
   La primera línia diferent et diu què has de corregir al port.
4. `git add contingut/serveis.json plantilles/serveis.mjs` (i `contingut/lloc.json` si l'has tocat),
   commit `WEB-H04: pàgines de servei amb el generador de Node` i `git push -u origin mistral/WEB-H04`.

## Lliurament

Només: `contingut/serveis.json`, `plantilles/serveis.mjs` i, si cal, `contingut/lloc.json` (només el camp `nom`).
**No** esborris `marca/pagines/` ni cap `.html`: ho farà Claude després de revisar.

## Criteris d'acceptació

- `npm run construir`: 12 pàgines generades.
- `npm run paritat`: 19/19 pàgines idèntiques, sense cap «falta a dist».
- `npm run contractes`: 4 `ok`.
- Les dades de contacte només surten de `contingut/lloc.json` (cap telèfon, correu ni adreça escrits al port).
- Cap altre fitxer tocat.

## Com ho revisarà Claude

Torna a passar les tres ordres en un clon net, llegeix el port, comprova que el contacte surt de `lloc.json` i, si tot
és correcte, ho integra a la base i retira `marca/pagines/` en un commit a part.

## Fora d'abast

Canviar el disseny o els textos, convertir aquestes pàgines en blocs (vindrà després), tocar la portada catalana.
