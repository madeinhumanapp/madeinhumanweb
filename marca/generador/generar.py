"""Genera les imatges i els textos de les publicacions de madeinhuman.

Ús:
    python generar.py                 # totes les publicacions de contingut/
    python generar.py contingut/p03.yaml   # només una

Sortida a sortida/<id>/: 01.png, 02.png... i text.txt (peu de foto, text alternatiu i enllaç).
"""
import asyncio
import os
import re
import sys
from pathlib import Path
from urllib.parse import urlencode

import yaml
from playwright.async_api import async_playwright

import plantilles as P

# A Windows la consola pot no ser UTF-8: evita errors en imprimir accents i «✓»
if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8", errors="replace")

ARREL = Path(__file__).parent
SORTIDA = ARREL / "sortida"

DESTINS = {
    "web": "https://madeinhuman.cat/",
    "diagnostic": "https://madeinhuman.cat/diagnostic.html",
    "adequacio": "https://madeinhuman.cat/#adequacio",
    "contacte": "https://madeinhuman.cat/#contacte",
    "serveis": "https://madeinhuman.cat/#serveis",
}
CAMPANYA = "llancament-2026"


def utm(desti: str, contingut: str, font: str = "instagram") -> str:
    url = DESTINS.get(desti, desti)
    base, _, frag = url.partition("#")
    q = urlencode({"utm_source": font, "utm_medium": "social", "utm_campaign": CAMPANYA, "utm_content": contingut})
    return f"{base}?{q}" + (f"#{frag}" if frag else "")


def net(text: str) -> str:
    """Treu el marcatge per al text alternatiu."""
    return re.sub(r"(\*\*|\*|==|~~|\(\(|\)\))", "", str(text)).replace("\n", " ").strip()


def alt_text(d: dict) -> str:
    camps = [d.get(k) for k in ("titol", "xifra", "etiqueta", "subtitol", "mite", "realitat", "text")]
    if d.get("items"):
        camps += d["items"]
    return " · ".join(net(c) for c in camps if c)


def pagines(post: dict):
    slides = post["slides"]
    total = len(slides)
    etiqueta = post.get("pilar", "")
    for i, d in enumerate(slides, 1):
        yield f"{i:02d}.png", P.TIPUS[d["tipus"]](d, i, total, etiqueta), (P.W, P.H)
    if post.get("story"):
        yield "story.png", P.story(post["story"]), (P.SW, P.SH)
    if post.get("video"):
        yield "portada-video.png", P.portada_video(post["video"]), (P.SW, P.SH)


def text_post(post: dict) -> str:
    enllac = utm(post.get("enllac", "diagnostic"), post["id"])
    alts = "\n".join(f"{i:02d}. {alt_text(d)}" for i, d in enumerate(post["slides"], 1))
    parts = [
        f"{post['id'].upper()} · {post.get('pilar', '').upper()} · {net(post['slides'][0]['titol'])}",
        f"Quan: {post.get('quan', '-')}",
        "",
        "PEU DE FOTO (copia-ho tal qual)",
        "-" * 32,
        post["peu"].strip(),
        "",
    ]
    if post.get("peu_es"):
        parts += ["PEU DE FOTO EN CASTELLÀ (opcional)", "-" * 32, post["peu_es"].strip(), ""]
    parts += [
        "ENLLAÇ (bio, pàgina d'enllaços o adhesiu d'story)",
        "-" * 32,
        enllac,
        "",
        "TEXT ALTERNATIU (Instagram > Configuració avançada > Text alternatiu)",
        "-" * 32,
        alts,
    ]
    if post.get("fonts"):
        parts += ["", "FONTS", "-" * 32] + [f"· {f}" for f in post["fonts"]]
    return "\n".join(parts) + "\n"


async def renderitzar(fitxers):
    async with async_playwright() as p:
        nav = await p.chromium.launch(executable_path=os.environ.get("CHROME_PATH") or None,
                                    args=["--allow-file-access-from-files"])
        pg = await nav.new_page()
        for f in fitxers:
            post = yaml.safe_load(Path(f).read_text(encoding="utf-8"))
            dest = SORTIDA / post["id"]
            dest.mkdir(parents=True, exist_ok=True)
            for nom, doc, (w, h) in pagines(post):
                tmp = dest / "_tmp.html"
                tmp.write_text(doc, encoding="utf-8")
                await pg.set_viewport_size({"width": w, "height": h})
                await pg.goto(tmp.as_uri())
                await pg.evaluate("document.fonts.ready")
                await pg.screenshot(path=str(dest / nom))
                tmp.unlink()
            (dest / "text.txt").write_text(text_post(post), encoding="utf-8")
            print(f"✓ {post['id']}: {len(post['slides'])} diapositives")
        await nav.close()


if __name__ == "__main__":
    fitxers = sys.argv[1:] or sorted(str(f) for f in (ARREL / "contingut").glob("*.yaml"))
    asyncio.run(renderitzar(fitxers))
