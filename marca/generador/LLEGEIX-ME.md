# Generador de publicacions de madeinhuman

Escrius el contingut en un fitxer de text (YAML) i el generador en fa les imatges amb la marca aplicada: carrusels 4:5, story i portada de vídeo 9:16, a més del peu de foto, el text alternatiu i l'enllaç amb UTM.

Viu al repositori de la web, a `marca/generador/`, però **no es publica** (és a `.assetsignore`) i la carpeta `sortida/` no es puja a git (és a `.gitignore`).

## Instal·lació (una sola vegada)

Des d'aquesta carpeta (`marca/generador/`):

```bash
pip install -r requirements.txt
playwright install chromium
```

A **Windows**, si `pip` o `playwright` no es troben, fes servir el llançador de Python:

```powershell
py -m pip install -r requirements.txt
py -m playwright install chromium
```

(i, a sota, `py` en lloc de `python`). Si ja tens un Chrome o Chromium instal·lat i no vols descarregar-ne un altre, pots indicar-ne la ruta amb la variable `CHROME_PATH`.

## Ús

```bash
python nova.py p10 "El formulari de contacte: 4 errors"   # crea contingut/p10-....yaml
python generar.py                              # totes les publicacions de contingut/
python generar.py contingut/p10-el-formulari-de-contacte-4-errors.yaml   # només una
python guia.py                                 # torna a generar la guia de marca
```

`nova.py` admet `--pilar "Errors habituals"` i `--enllac diagnostic|adequacio|contacte|serveis|web`. Crea el fitxer amb una portada, tres punts i el tancament: omple'l i genera'n les imatges.

Les imatges surten a `sortida/<id>/`: `01.png`, `02.png`… i `text.txt`. La guia surt a `sortida/guia/` i fa servir miniatures de p01, p04 i p06: genera les publicacions abans.

## Fitxers

| Fitxer | Què fa |
|---|---|
| `marca.py` | Colors, tipografies i contrast. Si canvies un valor aquí, canvia a totes les plantilles. |
| `plantilles.py` | Els tipus de diapositiva i les anotacions fetes a mà. |
| `generar.py` | Llegeix els YAML, genera les imatges i escriu `text.txt`. |
| `guia.py` | Genera la guia de marca. |
| `nova.py` | Crea una publicació nova a `contingut/` a partir de la plantilla. |
| `requirements.txt` | Dependències de Python (playwright i pyyaml). |
| `contingut/` | Una publicació per fitxer YAML. Copia'n una i adapta-la. |
| `fonts/` | Tipografies (llicència SIL Open Font License). |

## Estructura d'una publicació

```yaml
id: p10
pilar: Errors habituals          # surt a dalt a l'esquerra
quan: Setmana 5 · dijous
enllac: diagnostic               # diagnostic | adequacio | contacte | serveis | web
fonts: ["LSSI, art. 10"]         # opcional: surten a text.txt
slides:
  - tipus: portada               # fons blau nit
    titol: "El formulari de contacte: ==4 errors=="
    subtitol: "Text curt de context."
    nota: "guarda-ho"            # opcional: nota escrita a mà
  - tipus: punt                  # punt numerat (num és opcional)
    num: 1
    titol: "Títol del punt"
    text: "Explicació en dues o tres frases."
  - tipus: dada                  # xifra gran amb font
    xifra: "30.931"
    etiqueta: "reclamacions el 2025"
    text: "Context de la xifra."
    font: "AEPD, MEMÒRIA 2025"
  - tipus: llista
    titol: "Títol"
    items: ["Primer", "Segon", "Tercer"]
  - tipus: mite
    mite: "Frase falsa que la gent creu."
    realitat: "El que diu realment la norma."
  - tipus: tancament             # el quadrat i la crida a l'acció
    titol: "Vols que *ho revisem*?"
    text: "Una frase."
    boto: "Diagnòstic gratuït · 4 min"   # opcional
peu: |
  Peu de foto en català.
peu_es: |
  Peu de foto en castellà (opcional).
story:                           # opcional: story 9:16
  etiqueta: Nou carrusel
  titol: "Títol"
  text: "Text"
video:                           # opcional: portada de vídeo 9:16
  etiqueta: Errors habituals
  titol: "Títol"
```

Opcions de mida: afegeix `mida: 96` (o el valor que vulguis) a una diapositiva si el títol és molt llarg.

## Marcatge dins dels textos

| Escrius | Surt |
|---|---|
| `*paraula*` | cursiva destacada en bronze o daurat |
| `**paraula**` | negreta |
| `==paraula==` | subratllat fet a mà |
| `((paraula))` | cercle fet a mà |
| `~~paraula~~` | ratllat fet a mà |

Fes servir una o dues anotacions per diapositiva com a màxim, i sempre sobre la idea clau.

## Consells

- 6 o 7 diapositives per carrusel. La portada ha de prometre exactament el que dona el carrusel.
- Cita la font de cada dada al text (`font:` a les diapositives de dada i `fonts:` al YAML).
- Revisa la normativa abans de publicar: les dates del Reglament d'IA ja han canviat una vegada.
