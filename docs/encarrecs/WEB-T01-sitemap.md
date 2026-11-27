---
id: WEB-T01
assignat: gemini
zona: verda
base: main
branca: gemini/WEB-T01
estat: obert
fase: 0 (prova de l'equip)
---
# WEB-T01 · Mapa del lloc (`sitemap.xml`) generat sencer

## Objectiu
Que el generador escrigui `dist/sitemap.xml` sencer a partir de les pàgines que genera, en lloc de copiar el fitxer
fix de l'arrel i afegir-hi les notícies.

## Context (llegeix-ho abans)
- `AGENTS.md` (normes i procediment) i `eines/LLEGEIX-ME.md`.
- `eines/construir.mjs`: avui copia `sitemap.xml` de l'arrel a `dist/` i hi afegeix les notícies amb
  `ambNoticiesAlMapa` (`plantilles/actualitat.mjs`).
- `sitemap.xml` (arrel): és una llista feta a mà. Hi ha una entrada `/diagnostic.html`, però Cloudflare Pages
  redirigeix `/pagina.html` a `/pagina`: al mapa hi ha d'anar l'adreça final, sense redirecció.
- Proves que llegeixen el mapa: `proves/actualitat.mjs` (llistat i article, no la breu) i `proves/pagina-faq.mjs`.

## Abast
- **Pots tocar:** `eines/construir.mjs`, `plantilles/actualitat.mjs` (només `ambNoticiesAlMapa` o el que el substitueixi),
  un fitxer nou `proves/sitemap.mjs`, `proves/actualitat.mjs` (només si cal adaptar la comprovació del mapa),
  `package.json` (només per afegir l'ordre `sitemap` i posar-la dins de `comprovar`). Pots **esborrar** `sitemap.xml` de l'arrel.
- **NO pots tocar:** `diagnostic.html`, `recollida.html`, `necessito-dpo/`, `wizard/`, `_headers`, `robots.txt`,
  `.github/`, `contingut/`, `plantilles/formularis/`, `proves/contractes/`, ni cap altre fitxer.

## Què has de fer
1. Després de generar totes les pàgines (i de copiar els fitxers fixos), recorre els `.html` de la carpeta de sortida i
   construeix el mapa amb aquesta regla:
   - entra al mapa tota pàgina que tingui `<link rel="canonical" href="…">` **i** no tingui `noindex` al `<meta name="robots">`;
   - l'adreça que hi va és la **canònica** de la pàgina (no la ruta del fitxer);
   - si una canònica acaba en `.html`, posa-hi l'adreça sense `.html` (p. ex. `https://madeinhuman.cat/diagnostic`);
   - sense duplicats, ordenades alfabèticament, i ignorant `_previsualitzacio/`.
2. `lastmod`: només a les notícies amb pàgina i al llistat d'actualitat (la data de la notícia més recent), com ara.
   A la resta de pàgines, **sense** `lastmod`. Treu `changefreq` i `priority` de totes les entrades (Google no els fa servir).
3. XML vàlid, amb els caràcters especials escapats, i la mateixa capçalera `urlset` que el fitxer actual.
4. Esborra `sitemap.xml` de l'arrel i fes que ja no es copiï.
5. Prova nova `proves/sitemap.mjs` (sense navegador, com `proves/actualitat.mjs`), que llegeixi `dist/` i comprovi:
   - cada pàgina indexable de `dist/` (amb canònica i sense `noindex`) hi és, i cap pàgina `noindex` no hi és;
   - cap adreça acaba en `.html`; totes comencen per `https://madeinhuman.cat/`; no hi ha duplicats;
   - el llistat `/actualitat/` hi és amb `lastmod`; cap altra pàgina que no sigui una notícia té `lastmod`;
   - l'XML es pot analitzar (p. ex. comptant `<url>` i `</url>` i validant que cada `<loc>` és una URL).
   En acabar, ha d'escriure exactament: `totes les comprovacions del mapa del lloc correctes`.
6. Afegeix `"sitemap": "node proves/sitemap.mjs"` a `package.json` i posa `npm run sitemap` dins de `comprovar`, just després de `npm run construir`.

## Criteris d'acceptació
1. `npm run construir` acaba sense errors.
2. `node proves/sitemap.mjs` → `totes les comprovacions del mapa del lloc correctes`.
3. `npm run actualitat` i `node proves/pagina-faq.mjs` continuen correctes.
4. `npm run comprovar` en verd.
5. `/diagnostic.html` ja no apareix al mapa. `/diagnostic` hi apareixerà quan Claude canviï la canònica de
   `diagnostic.html` (no és feina teva): la teva prova no ha de fallar ni abans ni després d'aquest canvi.

## Restriccions
- Sense dependències noves, secrets, rastrejadors ni tercers.
- Sense dades reals: només el contingut públic de la web.
- Comentaris i missatges en català.

## Lliurament
Commit `WEB-T01: mapa del lloc generat sencer` a `gemini/WEB-T01`, `git push`, i el resum final d'`AGENTS.md`.
