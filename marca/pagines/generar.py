"""Genera les pàgines de servei (català i castellà) i la portada en castellà.

Ús (des de l'arrel del repositori de la web):
    python marca/pagines/generar.py

El contingut és a contingut.py. Aquest fitxer només munta l'HTML (menú, peu,
dades estructurades i enllaços entre idiomes). Sortida:
    serveis/<slug>/index.html, es/servicios/<slug>/index.html, es/index.html
"""
import html
import json
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent))
from contingut import COMU, NAP, PAGINES, PORTADA_ES, SERVEIS, SLUG, ZONA  # noqa: E402

if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8", errors="replace")

ARREL = Path(__file__).resolve().parent.parent.parent
WEB = "https://madeinhuman.cat"
CARPETA = {"ca": "serveis", "es": "es/servicios"}


def url_servei(lang, clau):
    return f"/{CARPETA[lang]}/{SLUG[lang][clau]}/"


def e(t):
    return html.escape(t, quote=True)


def zona_text(lang):
    llista = ", ".join(ZONA[1:-1]) + (" i " if lang == "ca" else " y ") + ZONA[-1]
    return COMU[lang]["zona_text"].format(zona=llista)


def empresa_ld():
    """Entitat de l'empresa (la mateixa @id que a la portada)."""
    return {
        "@type": "ProfessionalService",
        "@id": f"{WEB}/#empresa",
        "name": NAP["nom"],
        "url": WEB + "/",
        "telephone": NAP["telefon"],
        "email": NAP["correu"],
        "image": f"{WEB}/og-image.png",
        "address": {"@type": "PostalAddress", "streetAddress": NAP["carrer"], "postalCode": NAP["cp"],
                    "addressLocality": NAP["ciutat"], "addressRegion": "Girona", "addressCountry": "ES"},
        "areaServed": [{"@type": "AdministrativeArea", "name": z} for z in ZONA],
    }


def cap(lang, titol, descripcio, canonical, alternates, ld):
    c = COMU[lang]
    alt = "".join(f'  <link rel="alternate" hreflang="{l}" href="{WEB}{u}" />\n' for l, u in alternates)
    return f"""<!DOCTYPE html>
<html lang="{c['lang']}">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <!-- Pàgina generada amb marca/pagines/generar.py: edita contingut.py, no aquest fitxer -->
  <title>{e(titol)}</title>
  <meta name="description" content="{e(descripcio)}" />
  <meta name="robots" content="index, follow, max-image-preview:large" />
  <link rel="canonical" href="{WEB}{canonical}" />
{alt}  <meta property="og:title" content="{e(titol)}" />
  <meta property="og:description" content="{e(descripcio)}" />
  <meta property="og:type" content="website" />
  <meta property="og:url" content="{WEB}{canonical}" />
  <meta property="og:locale" content="{c['locale']}" />
  <meta property="og:site_name" content="Madeinhuman" />
  <meta property="og:image" content="{WEB}/og-image.png" />
  <meta property="og:image:width" content="1200" />
  <meta property="og:image:height" content="630" />
  <meta name="twitter:card" content="summary_large_image" />
  <meta name="theme-color" content="#0A0E1A" />
  <link rel="icon" href="/favicon.ico" sizes="32x32" />
  <link rel="icon" href="/favicon.svg" type="image/svg+xml" />
  <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
  <link rel="preload" href="/fonts/dm-sans-latin.woff2" as="font" type="font/woff2" crossorigin />
  <link rel="preload" href="/fonts/playfair-display-latin.woff2" as="font" type="font/woff2" crossorigin />
  <link rel="stylesheet" href="/marca.css" />
  <link rel="stylesheet" href="/styles.css" />
  <link rel="stylesheet" href="/pagines.css" />
  <script type="application/ld+json">
{json.dumps(ld, ensure_ascii=False, indent=2)}
  </script>
</head>
<body class="pagina-interior">
"""


def nav(lang, url_altre):
    c = COMU[lang]
    enllacos = "".join(f'<a href="{u}">{e(t)}</a>' for t, u in c["nav"])
    idioma_t, idioma_l = c["altre_idioma"]
    idioma = f'<a href="{url_altre}" hreflang="{idioma_l}" lang="{idioma_l}" class="nav-idioma">{e(idioma_t)}</a>'
    mobil = "".join(f'<a href="{u}">{e(t)}</a>' for t, u in c["nav"])
    return f"""  <nav class="nav scrolled" id="navbar">
    <div class="container nav-inner">
      <a href="{c['home']}" class="nav-logo">Madein<span>human</span></a>
      <div class="nav-links">{enllacos}{idioma}</div>
      <a href="{c['cta_nav'][1]}" class="nav-cta">{e(c['cta_nav'][0])}</a>
      <button class="nav-burger" aria-label="{'Menú' if lang == 'ca' else 'Menú'}" onclick="document.getElementById('navMobile').classList.toggle('open')">
        <span></span><span></span><span></span>
      </button>
    </div>
    <div class="nav-mobile" id="navMobile">{mobil}<a href="{c['cta_nav'][1]}">{e(c['cta_nav'][0])}</a>{idioma}</div>
  </nav>
"""


def peu(lang):
    c = COMU[lang]
    serveis = "".join(f'<li><a href="{url_servei(lang, k)}">{e(PAGINES[k][lang]["curt"])}</a></li>' for k in SERVEIS)
    eines = "".join(f'<li><a href="{u}">{e(t)}</a></li>' for t, u in c["peu_eines"])
    legal = "".join(f'<li><a href="{u}">{e(t)}</a></li>' for t, u in c["legal"])
    return f"""  <footer>
    <div class="container">
      <div class="footer-grid footer-grid-4">
        <div>
          <div class="footer-logo">Madein<span>human</span></div>
          <p class="footer-desc">{e(c['peu_desc'])}</p>
        </div>
        <div class="footer-col">
          <div class="footer-col-title">{e(c['peu_serveis'])}</div>
          <ul>{serveis}{eines}</ul>
        </div>
        <div class="footer-col">
          <div class="footer-col-title">{e(c['peu_contacte'])}</div>
          <ul>
            <li><a href="mailto:{NAP['correu']}">{NAP['correu']}</a></li>
            <li><a href="tel:{NAP['telefon']}">{NAP['telefon_visible']}</a> · <a href="https://wa.me/{NAP['telefon'].lstrip('+')}" target="_blank" rel="noopener">WhatsApp</a></li>
            <li><address>{e(NAP['carrer'])}<br>{NAP['cp']} {NAP['ciutat']}</address></li>
          </ul>
        </div>
        <div class="footer-col">
          <div class="footer-col-title">{e(c['peu_legal'])}</div>
          <ul>{legal}</ul>
        </div>
      </div>
      <div class="footer-bottom">
        <span>{e(c['copy'])}</span>
        <span class="made"><span class="dot-live"></span> RGPD · LOPDGDD · AI Act 2025–2028</span>
      </div>
    </div>
  </footer>
</body>
</html>
"""


def bloc_final(lang, clau_actual=None):
    c = COMU[lang]
    passos = "".join(f'<li><span class="pas-num">{i:02d}</span><strong>{e(t)}</strong><span>{e(d)}</span></li>' for i, (t, d) in enumerate(c["metode"], 1))
    altres = "".join(f'<li><a href="{url_servei(lang, k)}">{e(PAGINES[k][lang]["curt"])}</a></li>' for k in SERVEIS if k != clau_actual)
    return f"""      <section class="pagina-seccio">
        <h2>{e(c['metode_titol'])}</h2>
        <ol class="passos-metode">{passos}</ol>
      </section>
      <section class="pagina-seccio">
        <h2>{e(c['zona_titol'])}</h2>
        <p>{e(zona_text(lang))}</p>
      </section>
      <aside class="pagina-cta">
        <h2>{e(c['cta_titol'])}</h2>
        <p>{e(c['cta_text'])}</p>
        <div class="pagina-cta-botons">
          <a class="btn btn-primary" href="{c['cta_1'][1]}">{e(c['cta_1'][0])}</a>
          <a class="btn btn-ghost" href="{c['cta_2'][1]}">{e(c['cta_2'][0])}</a>
        </div>
      </aside>
      <nav class="pagina-seccio" aria-label="{e(c['altres'])}">
        <h2>{e(c['altres'])}</h2>
        <ul class="pagina-altres">{altres}</ul>
      </nav>
"""


def pagina_servei(lang, clau):
    p = PAGINES[clau][lang]
    c = COMU[lang]
    altre = "es" if lang == "ca" else "ca"
    url = url_servei(lang, clau)
    url_altre = url_servei(altre, clau)
    alternates = [("ca", url_servei("ca", clau)), ("es", url_servei("es", clau)), ("x-default", url_servei("ca", clau))]
    ld = {"@context": "https://schema.org", "@graph": [
        empresa_ld(),
        {"@type": "Service", "name": p["curt"], "description": p["descripcio"], "url": WEB + url,
         "serviceType": p["curt"], "provider": {"@id": f"{WEB}/#empresa"},
         "areaServed": [{"@type": "AdministrativeArea", "name": z} for z in ZONA], "inLanguage": lang},
        {"@type": "BreadcrumbList", "itemListElement": [
            {"@type": "ListItem", "position": 1, "name": c["inici"], "item": WEB + c["home"]},
            {"@type": "ListItem", "position": 2, "name": c["serveis"], "item": WEB + c["breadcrumb_serveis"]},
            {"@type": "ListItem", "position": 3, "name": p["curt"], "item": WEB + url}]},
    ]}
    seccions = "".join(f'      <section class="pagina-seccio">\n        <h2>{e(t)}</h2>\n        {cos}\n      </section>\n' for t, cos in p["seccions"])
    cos = f"""  <main class="pagina">
    <div class="container pagina-contingut legal-content">
      <nav class="molles" aria-label="{'Ruta' if lang == 'ca' else 'Ruta'}"><a href="{c['home']}">{e(c['inici'])}</a> › <a href="{c['breadcrumb_serveis']}">{e(c['serveis'])}</a> › <span aria-current="page">{e(p['curt'])}</span></nav>
      <span class="eyebrow">{e(p['eyebrow'])}</span>
      <h1 class="section-title pagina-h1">{p['h1']}</h1>
      <p class="pagina-lede">{e(p['lede'])}</p>
{seccions}{bloc_final(lang, clau)}    </div>
  </main>
"""
    return cap(lang, p["titol_seo"], p["descripcio"], url, alternates, ld) + nav(lang, url_altre) + cos + peu(lang)


def portada_es():
    p = PORTADA_ES
    ld = {"@context": "https://schema.org", "@graph": [dict(empresa_ld(), description=p["descripcio"], inLanguage="es")]}
    alternates = [("ca", "/"), ("es", "/es/"), ("x-default", "/")]
    targetes = "".join(
        f'<li><a href="{url_servei("es", k)}"><strong>{e(PAGINES[k]["es"]["curt"])}</strong><span>{e(PAGINES[k]["es"]["lede"])}</span></a></li>'
        for k in SERVEIS)
    c = COMU["es"]
    passos = "".join(f'<li><span class="pas-num">{i:02d}</span><strong>{e(t)}</strong><span>{e(d)}</span></li>' for i, (t, d) in enumerate(c["metode"], 1))
    cos = f"""  <main class="pagina">
    <div class="container pagina-contingut legal-content">
      <span class="eyebrow">{e(p['eyebrow'])}</span>
      <h1 class="section-title pagina-h1 pagina-h1-gran">{p['h1']}</h1>
      <p class="pagina-lede">{e(p['lede'])}</p>
      <section class="pagina-seccio" id="servicios">
        <h2>{e(p['serveis_titol'])}</h2>
        <ul class="pagina-serveis">{targetes}</ul>
      </section>
      <section class="pagina-seccio" id="metodo">
        <h2>{e(c['metode_titol'])}</h2>
        <ol class="passos-metode">{passos}</ol>
      </section>
      <section class="pagina-seccio">
        <h2>{e(c['zona_titol'])}</h2>
        <p>{e(zona_text('es'))}</p>
      </section>
      <aside class="pagina-cta" id="contacto">
        <h2>{e(p['contacte_titol'])}</h2>
        <p>{e(p['contacte_text'])}</p>
        <p><a href="mailto:{NAP['correu']}">{NAP['correu']}</a> · <a href="tel:{NAP['telefon']}">{NAP['telefon_visible']}</a> · {e(NAP['carrer'])}, {NAP['cp']} {NAP['ciutat']}</p>
        <div class="pagina-cta-botons">
          <a class="btn btn-primary" href="mailto:{NAP['correu']}">Escríbenos</a>
          <a class="btn btn-ghost" href="https://wa.me/{NAP['telefon'].lstrip('+')}" target="_blank" rel="noopener">WhatsApp</a>
        </div>
      </aside>
    </div>
  </main>
"""
    return cap("es", p["titol_seo"], p["descripcio"], "/es/", alternates, ld) + nav("es", "/") + cos + peu("es")


def escriu(rel, text):
    f = ARREL / rel
    f.parent.mkdir(parents=True, exist_ok=True)
    f.write_text(text, encoding="utf-8")
    print(f"✓ {rel}")


if __name__ == "__main__":
    for lang in ("ca", "es"):
        for clau in SERVEIS:
            escriu(f"{CARPETA[lang]}/{SLUG[lang][clau]}/index.html", pagina_servei(lang, clau))
    escriu("es/index.html", portada_es())
