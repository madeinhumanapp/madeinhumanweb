// Generador de /llms.txt (WEB-G05e), seguint el format d'llmstxt.org:
// # Madeinhuman, línia > amb la descripció de lloc.json, i seccions amb enllaços absoluts
// només de les pàgines publicades i indexables (s'ometen les seccions buides).

const SECCIONS_CA = [
  ['Serveis', p => p.url === '/' || p.url.startsWith('/serveis/') || p.url === '/diagnostic' || p.url === '/necessito-dpo/'],
  ['Preguntes freqüents', p => p.url.startsWith('/preguntes-frequents/')],
  ['Actualitat', p => p.url.startsWith('/actualitat/')],
  ['Sectors', p => p.url.startsWith('/sectors/')],
  ['Legal', p => /^\/(avis-legal|politica-privacitat|politica-cookies)/.test(p.url)],
];

const liniaEntrada = p => `- [${p.titol}](${p.loc})${p.descripcio ? `: ${p.descripcio}` : ''}`;

/** Genera el contingut de /llms.txt a partir de lloc.json i les pàgines publicades i indexables. */
export function generarLlmsTxt(lloc, paginesIndexables) {
  const nom = lloc?.nom || 'Madeinhuman';
  const desc = lloc?.peu?.ca?.descripcio || '';
  const blocs = [`# ${nom}`, ...(desc ? [`> ${desc}`] : [])];

  const ca = (paginesIndexables || []).filter(p => p.lang !== 'es');
  const es = (paginesIndexables || []).filter(p => p.lang === 'es');

  for (const [titol, filtre] of SECCIONS_CA) {
    const entrades = ca.filter(filtre);
    if (!entrades.length) continue;
    blocs.push(`## ${titol}\n\n${entrades.map(liniaEntrada).join('\n')}`);
  }

  if (es.length) {
    blocs.push(`## Español\n\n${es.map(liniaEntrada).join('\n')}`);
  }

  return blocs.join('\n\n') + '\n';
}
