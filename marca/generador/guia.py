"""Genera la guia de marca de madeinhuman (pàgines 1080×1350) a sortida/guia/."""
import asyncio
import sys
from pathlib import Path

from playwright.async_api import async_playwright
import os

import plantilles as P
from marca import NIT, DAURAT, CREMA, BRONZE, GRIS, GRIS_FOSC, tema

# A Windows la consola pot no ser UTF-8: evita errors en imprimir accents i «✓»
if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8", errors="replace")

OUT = Path(__file__).parent / "sortida" / "guia"
SORT = Path(__file__).parent / "sortida"
L = tema(False)
D = tema(True)


def lab(t, c=BRONZE, mt=0):
    return f"<div style='font-family:MONO;font-size:21px;letter-spacing:5px;color:{c};margin-top:{mt}px'>{t}</div>"


def h(t, size=60, mt=14, tm=L):
    return f"<div style='font-family:PF;font-weight:500;font-size:{size}px;line-height:1.12;margin-top:{mt}px'>{P.md(t, tm, True, 6)}</div>"


def p(t, size=31, mt=14, c=None, tm=L):
    col = f"color:{c};" if c else ""
    return f"<div style='font-family:SANS;font-size:{size}px;line-height:1.48;margin-top:{mt}px;{col}'>{P.md(t, tm, False, 4)}</div>"


def bloc(inner, top=170, bottom=150):
    return f"<div style='position:absolute;left:90px;right:90px;top:{top}px;bottom:{bottom}px'>{inner}</div>"


def hr(mt=26, mb=24):
    return f"<div style='height:2px;background:{L['linia']};margin:{mt}px 0 {mb}px'></div>"


TOTAL = 8


def pg1():
    cos = P.centre(
        f"{P.logo_bloc(330, CREMA, NIT, DAURAT)}"
        f"<div style='font-family:PF;font-weight:500;font-size:110px;line-height:1;margin-top:90px'>Guia de <i style='color:{DAURAT}'>marca</i></div>"
        f"<div style='font-family:MONO;font-size:24px;letter-spacing:5px;color:{GRIS_FOSC};margin-top:34px'>VERSIÓ 2 · NOVEMBRE 2026</div>"
        f"<div style='font-family:SANS;font-size:40px;line-height:1.45;color:{GRIS_FOSC};margin-top:70px'>La IA hi ajuda.<br><span style='color:{CREMA}'>Una persona en respon.</span></div>")
    return P.marc(cos, D, "Madeinhuman", 1, TOTAL, peu=False)


def pg2():
    cos = bloc(
        lab("IDEA CENTRAL") + h("La IA hi ajuda. ==Una persona== en respon.", 56)
        + p("Fem servir tecnologia i ajudem els clients a fer-la servir. Però el criteri, la revisió i la signatura són d'una persona. Això és *made in human*.", 28, 18, GRIS)
        + hr()
        + lab("POSICIONAMENT")
        + p("Per a startups, botigues online i pimes que comencen a treballar amb IA, madeinhuman és la consultoria de protecció de dades i IA que fa **fàcil complir sense frenar el negoci**: s'implanta ràpid, s'explica en clar i hi ha una persona que en respon.", 28)
        + hr()
        + "<div style='display:flex;gap:50px'>"
        + "<div style='flex:1'>" + lab("PROMESA") + p("Compleixes, ho entens i continues avançant.", 28) + "</div>"
        + "<div style='flex:1'>" + lab("LEMA DE LA WEB") + h("Protegir és *avançar.*", 44, 14) + "</div></div>"
        + hr()
        + lab("TRES VALORS")
        + "<div style='display:flex;gap:34px;margin-top:20px'>"
        + "".join(f"<div style='flex:1'><div style='font-family:PF;font-style:italic;font-size:40px;color:{BRONZE}'>{t}</div>"
                  f"<div style='font-family:SANS;font-size:25px;line-height:1.4;margin-top:8px;color:{GRIS}'>{d}</div></div>"
                  for t, d in [("Fàcil", "S'implanta ràpid, sense aturar l'activitat."),
                               ("Clar", "Si no ho entens, no estàs complint."),
                               ("Humà", "Una persona revisa, decideix i signa.")])
        + "</div>")
    return P.marc(cos, L, "Plataforma de marca", 2, TOTAL)


def pg3():
    si = ["Tuteig i frases curtes", "Exemples del dia a dia: la botiga online, el ChatGPT de l'equip", "Xifres oficials, sempre amb la font", "Una mica d'humor, mai sobre sancions ni víctimes"]
    no = ["La por com a ganxo principal", "Tecnicismes sense traduir", "Prometre «compliment del 100%»", "Vendre «adequació a cost zero»"]
    col = lambda titol, items, c, mark: (
        f"<div style='flex:1'>{lab(titol, c)}" + "".join(
            f"<div style='display:flex;gap:16px;align-items:flex-start;margin-top:16px'>{mark}"
            f"<div style='font-family:SANS;font-size:26px;line-height:1.38'>{P.md(i, L, False)}</div></div>" for i in items) + "</div>")
    creu = (f"<svg viewBox='0 0 50 50' width='38' height='38' style='flex:none'><path d='M10,10 L40,40 M40,10 L10,40' stroke='{GRIS}' "
            f"stroke-width='6' stroke-linecap='round'/></svg>")
    cos = bloc(
        lab("PERSONALITAT I TO") + h("Seriós en el fons, *distès* en la forma.", 54)
        + "<div style='display:flex;gap:50px;margin-top:26px'>" + col("SÍ", si, BRONZE, P.tic(BRONZE, 38)) + col("NO", no, GRIS, creu) + "</div>"
        + hr(30, 22) + lab("EXEMPLE")
        + p("~~Els responsables del tractament han de facilitar la informació de l'article 13 del RGPD de forma concisa.~~", 24, 12, GRIS)
        + p("**La teva política de privacitat ha d'explicar què fas amb les dades. En clar.**", 28, 14)
        + hr(26, 20) + lab("NORMES D'ESTIL")
        + p("Català com a llengua principal; castellà en subtítols i algunes publicacions · 2 emojis com a màxim · 3–5 etiquetes (#) per publicació · cita la font de cada dada.", 24, 10, GRIS))
    return P.marc(cos, L, "Veu de la marca", 3, TOTAL)


def pg4():
    seg = [
        ("Startups", "«Privacitat des del primer dia, no quan arribi el primer inversor.»", "Adequació a mida, textos i contractes, DPO extern quan creixin"),
        ("Botigues online", "«Ven online sense sustos: cookies, formularis i newsletters ben fets.»", "Textos legals i formularis web, consentiments, revisió d'eines"),
        ("Empreses que comencen amb IA", "«Porta la IA al teu equip amb normes clares.»", "Política d'ús d'IA, formació per a l'equip, assessorament"),
        ("Pimes de Girona", "«Compleix sense paperassa inútil.»", "Diagnòstic gratuït, adequació RGPD, manteniment"),
    ]
    items = "".join(
        f"<div style='padding:30px 0;border-top:2px solid {L['linia']}'>"
        f"<div style='font-family:PF;font-weight:500;font-size:40px'>{a}</div>"
        f"<div style='font-family:PF;font-style:italic;font-size:31px;line-height:1.35;color:{BRONZE};margin-top:10px'>{b}</div>"
        f"<div style='font-family:SANS;font-size:25px;line-height:1.4;color:{GRIS};margin-top:10px'>Entrada: {c}</div></div>"
        for a, b, c in seg)
    cos = bloc(lab("PÚBLICS I MISSATGES") + h("A qui parlem, i *què* els diem", 58) + f"<div style='margin-top:34px'>{items}</div>")
    return P.marc(cos, L, "Públics", 4, TOTAL)


def pg5():
    cos = bloc(
        lab("LOGO")
        + "<div style='display:flex;gap:40px;align-items:flex-end;margin-top:26px'>"
        + f"<div>{P.logo_bloc(300, NIT, CREMA, DAURAT)}<div style='font-family:MONO;font-size:19px;letter-spacing:3px;color:{GRIS};margin-top:14px'>PRINCIPAL</div></div>"
        + f"<div><div style='background:{NIT};padding:34px'>{P.logo_bloc(200, CREMA, NIT, DAURAT)}</div><div style='font-family:MONO;font-size:19px;letter-spacing:3px;color:{GRIS};margin-top:14px'>SOBRE FONS FOSC</div></div>"
        + "</div>"
        + lab("SIMPLIFICAT · PER SOTA DE 80 PX", mt=50)
        + "<div style='display:flex;gap:28px;align-items:flex-end;margin-top:22px'>"
        + P.logo_mini(130, L) + P.logo_mini(70, L) + P.logo_mini(36, L) + "</div>"
        + hr(46, 30) + lab("NORMES")
        + "".join(f"<div style='display:flex;gap:16px;align-items:flex-start;margin-top:18px'>{P.tic(BRONZE, 34)}"
                  f"<div style='font-family:SANS;font-size:28px;line-height:1.4'>{t}</div></div>"
                  for t in ["Deixa aire al voltant: com a mínim ¼ del costat del quadrat.",
                            "No el deformis, no el giris i no hi afegeixis efectes.",
                            "El cursor és sempre daurat: és l'únic accent del logo.",
                            "Sobre fons fosc, quadrat crema; sobre fons clar, quadrat blau nit."]))
    return P.marc(cos, L, "Identitat visual", 5, TOTAL)


def pg6():
    sw = [(NIT, "Blau nit", NIT, "Fons fosc i text principal", "16,8:1 sobre crema"),
          (DAURAT, "Daurat", DAURAT, "Accent només sobre blau nit", "7,2:1 sobre blau nit"),
          (CREMA, "Crema", CREMA, "Fons clar i text sobre blau nit", "16,8:1 sobre blau nit"),
          (BRONZE, "Bronze", BRONZE, "Accent i text destacat sobre crema", "5,0:1 sobre crema"),
          (GRIS, "Gris", GRIS, "Text secundari sobre crema", "5,0:1 sobre crema")]
    sws = "".join(
        f"<div style='display:flex;gap:24px;align-items:center;margin-top:18px'>"
        f"<div style='width:90px;height:90px;background:{c};box-shadow:0 0 0 1px rgba(10,14,26,.15);flex:none'></div>"
        f"<div><div style='font-family:SANS;font-weight:700;font-size:28px'>{n} <span style='font-family:MONO;font-weight:400;font-size:22px;color:{GRIS};margin-left:8px'>{hx}</span></div>"
        f"<div style='font-family:SANS;font-size:24px;color:{GRIS};margin-top:4px'>{u} · contrast {k}</div></div></div>"
        for c, n, hx, u, k in sw)
    cos = bloc(
        lab("COLOR") + sws
        + f"<div style='margin-top:26px;padding:22px 26px;border-left:6px solid {BRONZE};background:rgba(127,96,68,.08);font-family:SANS;font-size:26px;line-height:1.45'>"
          f"El daurat sobre crema només arriba a 2,3:1 i no es llegeix bé. Sobre fons clar, fes servir el <b>bronze</b>.</div>"
        + hr(36, 26) + lab("TIPOGRAFIA")
        + f"<div style='font-family:PF;font-weight:500;font-size:46px;margin-top:16px'>Playfair Display <i style='color:{BRONZE}'>cursiva</i></div>"
        + p("Titulars. La cursiva en bronze o daurat marca la paraula clau.", 24, 4, GRIS)
        + "<div style='display:flex;gap:40px;margin-top:20px'>"
        + f"<div style='flex:1'><div style='font-family:SANS;font-size:36px'>DM Sans</div>{p('Text corrent.', 24, 4, GRIS)}</div>"
        + f"<div style='flex:1'><div style='font-family:MONO;font-weight:500;font-size:30px;letter-spacing:4px'>DM MONO</div>{p('Etiquetes, dades i fonts.', 24, 4, GRIS)}</div>"
        + f"<div style='flex:1'><div style='font-family:MA;font-weight:600;font-size:46px;color:{BRONZE}'>Caveat</div>{p('Només anotacions curtes.', 24, 4, GRIS)}</div>"
        + "</div>", 160, 140)
    return P.marc(cos, L, "Identitat visual", 6, TOTAL)


def pg7():
    thumbs = [SORT / "p01" / "01.png", SORT / "p04" / "03.png", SORT / "p06" / "02.png"]
    imgs = "".join(f"<img src='{t.as_uri()}' style='width:280px;height:350px;box-shadow:0 6px 24px rgba(10,14,26,.18)'>" for t in thumbs)
    mostres = (f"<div style='display:flex;flex-wrap:wrap;gap:20px 46px;font-family:PF;font-weight:500;font-size:44px;margin-top:24px'>"
               f"<span>{P.md('==subratllat==', L, True, 6)}</span><span>{P.md('((cercle))', L, True, 6)}</span><span>{P.md('~~ratllat~~', L, True, 6)}</span>"
               f"<span style='font-family:MA;font-weight:600;color:{BRONZE}'>nota!</span></div>")
    cos = bloc(
        lab("ELEMENT PROPI") + h("Anotacions *fetes a mà*", 62)
        + p("Com un consultor que revisa un document. És la idea «una persona en respon», feta visible.", 30, 18, GRIS)
        + mostres
        + p("Una o dues per diapositiva, com a màxim, i sempre sobre la idea clau. En bronze sobre crema, en daurat sobre blau nit.", 27, 26)
        + hr(40, 30) + lab("PLANTILLES")
        + f"<div style='display:flex;gap:30px;margin-top:22px'>{imgs}</div>"
        + p("Carrusel 4:5 · portada en blau nit · contingut en crema · tancament amb el quadrat i la crida a l'acció.", 25, 22, GRIS))
    return P.marc(cos, L, "Identitat visual", 7, TOTAL)


def pg8():
    pilars = [("En clar", "30%", "Una norma explicada en un carrusel"),
              ("Errors habituals", "30%", "L'error, el problema i la solució"),
              ("IA amb criteri", "25%", "IA a la feina, amb normes clares"),
              ("Com treballem", "15%", "Procés, serveis i diagnòstic: la part que ven")]
    files = "".join(
        f"<div style='display:flex;align-items:baseline;gap:22px;padding:12px 0;border-top:2px solid {L['linia']}'>"
        f"<div style='font-family:PF;font-style:italic;font-size:44px;color:{BRONZE};width:120px'>{pc}</div>"
        f"<div><div style='font-family:PF;font-weight:500;font-size:36px'>{n}</div>"
        f"<div style='font-family:SANS;font-size:25px;color:{GRIS};margin-top:4px'>{d}</div></div></div>" for n, pc, d in pilars)
    cos = bloc(
        lab("CONTINGUT") + h("Quatre temes, *dos cops* per setmana", 50)
        + f"<div style='margin-top:18px'>{files}</div>"
        + hr(26, 26)
        + "<div style='display:flex;gap:44px'>"
        + "<div style='flex:1'>" + lab("CANALS") + p("**Instagram**, el canal principal · **Perfil de Google**, per a cerques i ressenyes · **TikTok**, amb els mateixos vídeos.", 24, 10) + "</div>"
        + "<div style='flex:1'>" + lab("QUÈ MESUREM") + p("Desats i enviaments per missatge, visites al perfil, clics a l'enllaç i diagnòstics fets (amb UTM).", 24, 10) + "</div></div>"
        + hr(26, 22) + lab("ENLLAÇOS")
        + p("Una pàgina pròpia, **madeinhuman.cat/xarxes**, en lloc de Linktree: sense rastrejadors de tercers, coherent amb el que venem.", 24, 10, GRIS))
    return P.marc(cos, L, "Contingut i canals", 8, TOTAL)


async def main():
    falten = [t for t in (SORT / "p01" / "01.png", SORT / "p04" / "03.png", SORT / "p06" / "02.png") if not t.exists()]
    if falten:
        print("La guia fa servir miniatures de p01, p04 i p06. Genera-les primer amb: python generar.py")
        sys.exit(1)
    OUT.mkdir(parents=True, exist_ok=True)
    async with async_playwright() as pw:
        nav = await pw.chromium.launch(executable_path=os.environ.get("CHROME_PATH") or None, args=["--allow-file-access-from-files"])
        pg = await nav.new_page(viewport={"width": P.W, "height": P.H})
        for i, f in enumerate([pg1, pg2, pg3, pg4, pg5, pg6, pg7, pg8], 1):
            tmp = OUT / "_tmp.html"
            tmp.write_text(f(), encoding="utf-8")
            await pg.goto(tmp.as_uri())
            await pg.evaluate("document.fonts.ready")
            await pg.screenshot(path=str(OUT / f"guia-{i:02d}.png"))
            tmp.unlink()
        await nav.close()
    print("✓ guia generada")


if __name__ == "__main__":
    asyncio.run(main())
