// Pàgina /reserva/ (WEB-G05a): marc interior en català, noindex/nofollow, fora del mapa del lloc.
// Sense token ?t= o amb ACTIVA = false a reserva.js, mostra el missatge d'entrada cap al diagnòstic i contacte.
import { marcInterior } from './serveis.mjs';
import { t } from './textos.mjs';

export function paginaReserva(lloc, dades) {
  const m = marcInterior(lloc, dades);
  const { WEB, e } = m;
  const c = dades.COMU.ca;
  const ruta = '/reserva/';
  const nom = t('ca', 'reserva.nom');
  const molla = t('ca', 'reserva.molla');
  const ld = {
    '@context': 'https://schema.org',
    '@graph': [
      m.empresa_ld(),
      { '@type': 'WebPage', name: nom, url: WEB + ruta, inLanguage: 'ca' },
      { '@type': 'BreadcrumbList', itemListElement: [
        { '@type': 'ListItem', position: 1, name: c.inici, item: WEB + c.home },
        { '@type': 'ListItem', position: 2, name: molla, item: WEB + ruta },
      ] },
    ],
  };

  return ['reserva/index.html',
    m.cap('ca', t('ca', 'reserva.titol_seo'), t('ca', 'reserva.desc'), ruta,
      [['ca', ruta], ['x-default', ruta]], ld, { comentari: false, robots: 'noindex, nofollow' })
    + m.nav('ca', '/es/') + `  <main id="contingut" class="pagina" tabindex="-1">
    <div class="container pagina-contingut legal-content">
      <nav class="molles" aria-label="${e(t('ca', 'comu.ruta'))}"><a href="${c.home}">${e(c.inici)}</a> › <span aria-current="page">${e(molla)}</span></nav>
      <span class="eyebrow">${e(t('ca', 'reserva.eyebrow'))}</span>
      <h1 class="section-title pagina-h1">${e(nom)}</h1>
      <div id="reserva-pagina" class="reserva-contenidor" data-reserva-pagina data-idioma="ca">
        <p class="pagina-lede">${e(t('ca', 'reserva.lede'))}</p>
        <div class="reserva-accions">
          <a class="btn btn-primary reserva-accio" href="/diagnostic">${e(t('ca', 'comu.cta_diagnostic'))}</a>
          <a class="btn btn-ghost reserva-accio" href="/#contacte">${e(t('ca', 'reserva.cta_contacte'))}</a>
        </div>
      </div>
    </div>
  </main>
` + m.peu('ca').replace('<script src="/menu.js" defer></script>', '<script src="/reserva.js" defer></script>\n<script src="/menu.js" defer></script>')];
}
