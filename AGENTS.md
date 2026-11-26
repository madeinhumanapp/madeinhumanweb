# Instruccions per a Mistral (Vibe) i Gemini (Antigravity) — web de madeinhuman.cat

Aquest fitxer és per a Mistral (Vibe) i Gemini (Antigravity). Claude fa servir `CLAUDE.md`. Llegeix-lo sencer abans de fer res.

On diu `<agent>`, posa-hi `mistral` si ets Mistral o `gemini` si ets Gemini. Fes només els encàrrecs assignats a tu
(camp `assignat` de l'encàrrec).

## Qui fa què

- **Claude** és l'arquitecte: escriu els encàrrecs, revisa el que lliures i ho integra.
- **Tu (Mistral o Gemini)** fas encàrrecs concrets, un cada vegada, en una branca pròpia.
- **La persona responsable** (la propietària de madeinhuman) t'obre la sessió, aprova les ordres que demanen permís i
  valida el que és jurídic o editorial.

Només treballes per encàrrecs escrits a `docs/encarrecs/WEB-xxx-….md`. Si et demanen una feina sense encàrrec,
respon que necessites l'ID de l'encàrrec i atura't.

## Procediment de cada encàrrec (sempre en aquest ordre)

1. **Llegeix l'encàrrec sencer.** Si alguna cosa no s'entén, tria l'opció més conservadora i anota-ho per al resum.
2. **Comprova que el repositori està net:** `git status` ha de dir «nothing to commit, working tree clean».
   Si no ho diu, **para i avisa**: no barregis canvis d'altres.
3. **Posa't a la branca base** que diu l'encàrrec (camp `base`; si no en diu cap, `main`):
   ```
   git fetch origin
   git switch main
   git pull --ff-only
   ```
4. **Crea la branca de treball** que diu l'encàrrec: `git switch -c <agent>/WEB-xxx`
   (si ja existeix perquè reprens la feina: `git switch <agent>/WEB-xxx`).
5. **Eines:** el primer cop en aquest ordinador, `npm ci` i `npm run navegador`. Després, només si l'encàrrec ho diu.
6. **Fes la feina** de l'apartat «Què has de fer», tocant **només** els fitxers de l'apartat «Lliurament».
7. **Comprova:** executa les ordres d'acceptació de l'encàrrec. Han de donar exactament el resultat que diu.
8. **Desa:** `git add` només dels fitxers del lliurament (mai `git add -A` ni `git add .`), i
   `git commit -m "WEB-xxx: descripció curta en català"`.
9. **Puja:** `git push -u origin <agent>/WEB-xxx`. No obris cap PR: l'obre Claude quan revisa.
10. **Escriu el resum final** (format al final d'aquest fitxer) i atura't. No comencis cap altre encàrrec.

## Normes que no es poden saltar

**Git**
- Només treballes a `<agent>/WEB-xxx`. Mai a `main`, a cap `claude/…` ni a la branca de l'altre agent.
- Mai `git push --force`, `git merge`, `git rebase`, `git reset --hard` ni `git clean`.
- Mai esborris branques ni etiquetes.

**Fitxers que no toques mai** (encara que et sembli que cal)
- `wizard/`, `fonts/`, `vendor/`, `recollida.html`
- `plantilles/formularis/` i `proves/contractes/` (són el contracte amb rgpd-tool: si canvien, es perden leads)
- Els atributs `name=""` i els **valors** de les opcions de qualsevol formulari (són dades de l'API, no text)
- `.github/`, `_headers`, `robots.txt`, `sitemap.xml`, `AGENTS.md`, `CLAUDE.md`, `package.json`, `package-lock.json`
- No esborris cap fitxer si l'encàrrec no ho diu. No instal·lis paquets nous (`npm install <paquet>`, `pip install`…).

**Contingut**
- Des del tall (22/11/2026) la web es publica des de `contingut/` i el contingut s'edita des del panell de rgpd-tool.
  Només toques `contingut/` si l'encàrrec ho diu explícitament, i mai a `main`: el panell i tu podríeu trepitjar-vos.
- Res inventat: ni dates, ni xifres, ni articles de llei, ni noms d'organismes. Si falta una dada, escriu
  `[REVISAR: què falta]` i continua.
- Cap dada personal real (clients, leads, persones). Només el contingut públic de la web o dades inventades.
- Cap etiqueta HTML dins del contingut (`contingut/`): només `*cursiva*`, `**negreta**`, salt de línia i
  `[text](/ruta)`. El validador ho rebutja.
- Català normatiu i planer. Castellà només si l'encàrrec ho demana.
- Si l'encàrrec et fa canviar `esquema/*.mjs`, executa `npm run exportar-esquema` i afegeix `esquema/esquema.json`
  al lliurament (el panell el llegeix; la comprovació falla si no està al dia).

**Quan alguna cosa falla**
- Si una ordre falla amb un error de programa (`TypeError`, `ReferenceError`, `Cannot find module`, `SyntaxError`…)
  dins d'un fitxer que **no** és del teu lliurament: **para**. No ho intentis arreglar; explica-ho al resum. És
  un error de la base i el corregeix Claude.
- Si una comprovació diu que el resultat no és idèntic: llegeix la línia que indica, corregeix **el teu** fitxer
  (mai l'original) i torna-ho a provar. Després de 3 intents sense èxit: desa, puja i explica-ho al resum.

## Ordres del repositori

| Ordre | Què fa | Resultat correcte |
|---|---|---|
| `npm run construir` | genera la web a `dist/` des de `contingut/` i `plantilles/` | `dist/: N pàgines generades, …` |
| `npm run contractes` | omple els formularis i comprova què s'envia a rgpd-tool | 4 línies `ok` |
| `npm run previsualitzacio` | seguretat de la vista prèvia del panell | `9/9 comprovacions correctes` |
| `npm run comprovar` | totes les comprovacions seguides | tot el que diu aquesta taula |
| `npm run sense-html` | cap HTML dins de `contingut/` | `cap HTML al contingut` |
| `npm run serveis` | esquema de les pàgines de servei (`contingut/serveis.json`) | `totes les comprovacions dels serveis i dels blocs correctes` |
| `npm run exportar-esquema` | regenera `esquema/esquema.json` (el llegeix el panell); amb `-- --comprovar` només comprova | `esquema.json al dia` |
| `npm run csp` | cada pàgina amb les capçaleres de `_headers`: cap infracció de seguretat | `N/N sense cap infracció de la CSP` |
| `npm run actualitat` | proves de les notícies (llistat, pàgines, RSS, validacions) | `totes les comprovacions de l'actualitat correctes` |


## Mapa del repositori

| Carpeta o fitxer | Què hi ha |
|---|---|
| `contingut/` | Text de la web: `lloc.json` (contacte, menú, peu), `pagines/*.json` (blocs de cada pàgina) i `actualitat/*.md` (notícies; format a `eines/LLEGEIX-ME.md`) |
| `esquema/blocs.mjs` | Quins blocs hi ha, quins camps tenen, etiquetes en català i límits |
| `plantilles/` | Disseny: `base.mjs` (cap, menú, peu), `blocs.mjs` (un bloc = una funció), `text.mjs` |
| `eines/` | `construir.mjs` (generador), `exportar-esquema.mjs`, `sense-html.mjs`, `previsualitzacio/` (vista prèvia del panell) |
| `proves/` | Comprovacions (contractes, vista prèvia, CSP, notícies, serveis) |
| `docs/encarrecs/` | Els encàrrecs. `docs/encarrecs/LLEGEIX-ME.md` diu quins hi ha i en quin estat |
| `diagnostic.html`, `recollida.html`, `necessito-dpo/` | Aplicacions (fitxers fixos, connectors amb rgpd-tool). No les toquis mai |

## Termes i estil (glossari aprovat, WEB-L02)

- **pimes** als textos en català; **pymes** només als textos en castellà.
- **DPO** com a sigla; al text, «delegat de protecció de dades (DPO)», en minúscules.
- **intel·ligència artificial** en minúscules (nom comú); **IA** com a sigla. Per al Reglament: «Reglament d'IA» o
  «Reglament europeu d'IA»; «AI Act» només com a sigla.
- **RGPD** i **LOPDGDD**; «LOPD» només per parlar de la llei antiga. La Llei 34/2002 és la **LSSI-CE**.
- **AEPD** i **APDCat**: desplegades a la primera menció visible d'una pàgina.
- Noms comuns en minúscula («protecció de dades», «política de privacitat» dins del text).
- Cometes catalanes «…», mai rectes "…". Rangs amb guió llarg: «4–8 setmanes». «p. ex.», no «ex:».
- Registre: encara no hi ha decisió (la portada i els serveis tracten de «tu»; el diagnòstic, de «vosaltres»).
  Mantén el registre que ja té cada pàgina.

## Resum final (escriu-lo sempre en acabar, també si no has acabat)

```
WEB-xxx — <títol de l'encàrrec>
Estat: fet | fet amb dubtes | aturat (motiu)
Branca: <agent>/WEB-xxx · commit <hash curt>
Fitxers canviats: <llista>
Ordres d'acceptació:
  <enganxa la sortida de cada ordre>
[REVISAR]: <llista, o «cap»>
Notes per a Claude: <què has decidit tu i per què, problemes, coses que caldria canviar a la base>
```
