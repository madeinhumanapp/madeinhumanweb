// Generador de /llms.txt (WEB-G05e), seguint el format d'llmstxt.org:
// # Madeinhuman, línia > amb la descripció de lloc.json, i seccions amb enllaços absoluts
// només de les pàgines publicades i indexables (s'ometen les seccions buides).
import { t } from './textos.mjs';

const SECCIONS_CA = [
  ['llms.sec_serveis', p => p.url === '/' || p.url.startsWith('/serveis/') || p.url === '/diagnostic' || p.url === '/necessito-dpo/'],
  ['llms.sec_faq', p => p.url.startsWith('/preguntes-frequents/')],
  ['llms.sec_actualitat', p => p.url.startsWith('/actualitat/')],
  ['llms.sec_sectors', p => p.url.startsWith('/sectors/')],
  ['llms.sec_legal', p => /^\/(avis-legal|politica-privacitat|politica-cookies)/.test(p.url)],
];

const liniaEntrada = p => `- [${p.titol}](${p.loc})${p.descripcio ? `: ${p.descripcio}` : ''}`;

/** Genera el contingut de /llms.txt a partir de lloc.json i les pàgines publicades i indexables. */
export function generarLlmsTxt(lloc, paginesIndexables) {
  const nom = lloc?.nom || 'Madeinhuman';
  const desc = lloc?.peu?.ca?.descripcio || '';
  const blocs = [`# ${nom}`, ...(desc ? [`> ${desc}`] : [])];

  const ca = (paginesIndexables || []).filter(p => p.lang !== 'es');
  const es = (paginesIndexables || []).filter(p => p.lang === 'es');

  for (const [clauTitol, filtre] of SECCIONS_CA) {
    const entrades = ca.filter(filtre);
    if (!entrades.length) continue;
    blocs.push(`## ${t('ca', clauTitol)}\n\n${entrades.map(liniaEntrada).join('\n')}`);
  }

  if (es.length) {
    blocs.push(`## ${t('ca', 'llms.sec_es')}\n\n${es.map(liniaEntrada).join('\n')}`);
  }

  return blocs.join('\n\n') + '\n';
}
