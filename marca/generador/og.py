"""Genera la imatge per compartir de la web (og:image, 1200×630).

Ús:
    python og.py                                  # escriu og-image.png a l'arrel de la web
    python og.py --sortida sortida/og-prova.png   # a un altre lloc
    python og.py --titol "Una altra *frase*." --peu "madeinhuman.cat/xarxes"

La plantilla és `og` de plantilles.py (fons blau nit, quadrat en crema i el lema).
"""
import argparse
import asyncio
import os
import sys
from pathlib import Path

from playwright.async_api import async_playwright

import plantilles as P

# A Windows la consola pot no ser UTF-8: evita errors en imprimir accents i «✓»
if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8", errors="replace")

ARREL = Path(__file__).parent
WEB = ARREL.parent.parent  # arrel del repositori de la web


async def renderitzar(doc: str, desti: Path) -> None:
    desti.parent.mkdir(parents=True, exist_ok=True)
    tmp = ARREL / "sortida" / "_og.html"
    tmp.parent.mkdir(parents=True, exist_ok=True)
    tmp.write_text(doc, encoding="utf-8")
    async with async_playwright() as p:
        nav = await p.chromium.launch(executable_path=os.environ.get("CHROME_PATH") or None,
                                      args=["--allow-file-access-from-files"])
        pg = await nav.new_page(viewport={"width": P.OW, "height": P.OH})
        await pg.goto(tmp.as_uri())
        await pg.evaluate("document.fonts.ready")
        await pg.screenshot(path=str(desti))
        await nav.close()
    tmp.unlink()


def main() -> int:
    ap = argparse.ArgumentParser(description="Genera la imatge per compartir (og:image).")
    per_defecte = WEB / "og-image.png" if (WEB / "index.html").exists() else ARREL / "sortida" / "og-image.png"
    ap.add_argument("--sortida", type=Path, default=per_defecte, help=f"fitxer PNG (per defecte, {per_defecte.name} a l'arrel de la web)")
    ap.add_argument("--titol", help="titular amb marcatge (*cursiva*); per defecte, «Protegir és *avançar*.»")
    ap.add_argument("--peu", help="text petit de sota (per defecte, madeinhuman.cat)")
    a = ap.parse_args()
    d = {k: v for k, v in (("titol", a.titol), ("peu", a.peu)) if v}
    asyncio.run(renderitzar(P.og(d), a.sortida))
    print(f"✓ Imatge per compartir: {a.sortida}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
