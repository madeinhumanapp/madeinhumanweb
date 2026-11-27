// Proves de l'eina d'informe de registre «tu» / «vosaltres» (WEB-G07c):
// comprova l'extracció de text visible, la detecció en català i castellà, els falsos positius,
// l'execució amb i sense --sense-esborranys i que no modifica cap fitxer del repositori.
// Ús: node proves/registre.mjs
import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { extreureTextVisible, analitzarRegistre, classificarRegistre } from '../eines/registre.mjs';

const ARREL = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const INFORME = path.join(ARREL, 'captures/registre/informe.md');

let fallades = 0;
const ok = (nom, cond, detall = '') => {
  if (!cond) fallades++;
  console.log(`${cond ? '✓' : '✗'} ${nom}${!cond && detall ? ' — ' + detall : ''}`);
};

// 1. Extracció de text visible (ignora script/style/atributs interns, inclou aria-label, alt, placeholder i title)
{
  const html = `<!doctype html><html lang="ca"><head><title>Capçalera</title><style>.x{content:"tens"}</style></head>
  <body>
    <script>var missatge = "vostre tu us";</script>
    <!-- comentari amb vosaltres -->
    <p data-intern="tens vostre">Text visible principal.</p>
    <button aria-label="Escriu-nos per dubtes" title="Demana ajuda">Enviar</button>
    <img src="x.png" alt="El teu equip" />
    <input placeholder="Com et dius?" />
    <pre hidden>Text ocult amb vosaltres</pre>
  </body></html>`;
  const text = extreureTextVisible(html);
  ok('extreureTextVisible ignora <script>, <style>, comentaris, <pre hidden> i atributs interns',
    !text.includes('missatge') && !text.includes('comentari') && !text.includes('Text ocult') && !text.includes('data-intern'));
  ok('extreureTextVisible inclou text del cos i atributs aria-label, alt, placeholder i title',
    text.includes('Text visible principal.')
    && text.includes('Escriu-nos per dubtes')
    && text.includes('Demana ajuda')
    && text.includes('El teu equip')
    && text.includes('Com et dius?'));
}

// 2. Català: «tu», «vosaltres», «mixt» i «cap»
{
  const resTu = analitzarRegistre(
    "Si tu tens dubtes sobre la teva empresa, et podem ajudar-te i t'expliquem el que necessites. Descobreix com pots millorar i escriu-nos.",
    'ca',
  );
  ok('català «tu» detecta pronoms, possessius, clítics i verbs 2sg sense falsos positius de «vosaltres»',
    resTu.registre === 'tu' && resTu.tu.length >= 8 && resTu.vosaltres.length === 0,
    `tu=${resTu.tu.length}, vosaltres=${resTu.vosaltres.length}`);

  const resVos = analitzarRegistre(
    'Si vosaltres teniu dubtes sobre la vostra empresa, us podem ajudar-vos i podeu revisar el vostre diagnòstic. Escriviu-nos o demaneu cita.',
    'ca',
  );
  ok('català «vosaltres» detecta pronoms, possessius, clítics i verbs 2pl sense falsos positius de «tu»',
    resVos.registre === 'vosaltres' && resVos.vosaltres.length >= 8 && resVos.tu.length === 0,
    `tu=${resVos.tu.length}, vosaltres=${resVos.vosaltres.length}`);

  const resMixt = analitzarRegistre(
    'Revisa el teu protocol i després podeu reservar una trucada amb el vostre equip.',
    'ca',
  );
  ok('català mixt es classifica com a «mixt» i conserva el context amb la forma marcada',
    resMixt.registre === 'mixt' && resMixt.tu.length >= 1 && resMixt.vosaltres.length >= 2
    && resMixt.tu[0].context.includes('**'),
    JSON.stringify({ reg: resMixt.registre, tu: resMixt.tu.map(x => x.forma), vos: resMixt.vosaltres.map(x => x.forma) }));

  const resNeutre = analitzarRegistre('Consultoria especialitzada en protecció de dades i intel·ligència artificial.', 'ca');
  ok('text neutre en català es classifica com a «cap»', resNeutre.registre === 'cap');
}

// 3. Castellà: «tú», «vosotros» i «mixt»
{
  const resTuEs = analitzarRegistre(
    'Si tú tienes dudas sobre tu empresa, te ayudamos a ver qué necesitas y cómo puedes cumplir. Escríbenos hoy.',
    'es',
  );
  ok('castellà «tú» detecta pronoms, possessius i verbs 2sg sense falsos positius de «vosotros»',
    resTuEs.registre === 'tu' && resTuEs.tu.length >= 6 && resTuEs.vosaltres.length === 0,
    `tu=${resTuEs.tu.length}, vosaltres=${resTuEs.vosaltres.length}`);

  const resVosEs = analitzarRegistre(
    'Si vosotros tenéis dudas sobre vuestro negocio, os ayudamos a revisar qué necesitáis y podéis elegir hora. Escribidnos.',
    'es',
  );
  ok('castellà «vosotros» detecta pronoms, possessius i verbs 2pl sense falsos positius de «tú»',
    resVosEs.registre === 'vosaltres' && resVosEs.vosaltres.length >= 7 && resVosEs.tu.length === 0,
    `tu=${resVosEs.tu.length}, vosaltres=${resVosEs.vosaltres.length}`);

  const resMixtEs = analitzarRegistre(
    'Si tu empresa trata datos de clientes, podéis empezar con una revisión breve.',
    'es',
  );
  ok('castellà mixt es classifica com a «mixt»', resMixtEs.registre === 'mixt');
}

// 4. Falsos positius evitats (us dins paraula, US, et al./et cetera/nom propi, te substantiu, -te final, OS, homògrafs 3sg)
{
  const fpCa = analitzarRegistre(
    "L'usuari fa un ús just de les eines als US. Segons García et al. (2025), et cetera, la casa Louis Et Fils fa les primeres passes. Comença a aplicar-se la norma i una persona en respon amb una consulta clara.",
    'ca',
  );
  ok('català evita falsos positius (usuari, ús, just, US, et al., et cetera, nom propi, primeres passes, 3sg)',
    fpCa.registre === 'cap' && fpCa.tu.length === 0 && fpCa.vosaltres.length === 0,
    JSON.stringify({ tu: fpCa.tu.map(x => x.forma), vos: fpCa.vosaltres.map(x => x.forma) }));

  const fpEs = analitzarRegistre(
    'Un té verde o el te de la tarde no afecta al cliente ni a la parte técnica de un OS moderno. Todos los datos personales sobre el frente legal son claros; el sistema responde automáticamente.',
    'es',
  );
  ok('castellà evita falsos positius (té, el te, cliente, parte, OS, todos, datos, 3sg)',
    fpEs.registre === 'cap' && fpEs.tu.length === 0 && fpEs.vosaltres.length === 0,
    JSON.stringify({ tu: fpEs.tu.map(x => x.forma), vos: fpEs.vosaltres.map(x => x.forma) }));

  ok('classificarRegistre retorna cap/tu/vosaltres/mixt correctament',
    classificarRegistre(0, 0) === 'cap'
    && classificarRegistre(3, 0) === 'tu'
    && classificarRegistre(0, 2) === 'vosaltres'
    && classificarRegistre(1, 1) === 'mixt');
}

// 5. Execució real (amb i sense --sense-esborranys) i garantia de només lectura (git status idèntic)
{
  const gitAbans = execFileSync('git', ['status', '--porcelain'], { cwd: ARREL, encoding: 'utf8' });

  const outSense = execFileSync(process.execPath, [path.join(ARREL, 'eines/registre.mjs'), '--sense-esborranys'], {
    cwd: ARREL,
    encoding: 'utf8',
  });
  const mdSense = fs.readFileSync(INFORME, 'utf8');
  const mSense = /pàgines:\s*(\d+)/.exec(outSense);
  const nSense = mSense ? Number(mSense[1]) : 0;
  ok('--sense-esborranys genera l\'informe sense files d\'esborranys',
    nSense > 0 && mdSense.includes('## Resum') && !mdSense.includes('| Esborranys (ca) |'));

  const outAmb = execFileSync(process.execPath, [path.join(ARREL, 'eines/registre.mjs')], {
    cwd: ARREL,
    encoding: 'utf8',
  });
  const mdAmb = fs.readFileSync(INFORME, 'utf8');
  const mAmb = /pàgines:\s*(\d+)/.exec(outAmb);
  const nAmb = mAmb ? Number(mAmb[1]) : 0;
  ok('execució per defecte inclou esborranys (> publicades) i escriu les 4 seccions a captures/registre/informe.md',
    nAmb > nSense
    && mdAmb.includes('## Resum')
    && mdAmb.includes('## Frases d\'interfície comunes')
    && mdAmb.includes('## Inventari per pàgina')
    && mdAmb.includes('## Pàgines mixtes'));

  const gitDespres = execFileSync('git', ['status', '--porcelain'], { cwd: ARREL, encoding: 'utf8' });
  ok('eines/registre.mjs no modifica ni crea cap fitxer seguit per git (git status --porcelain idèntic)',
    gitAbans === gitDespres,
    `abans=${JSON.stringify(gitAbans)} vs despres=${JSON.stringify(gitDespres)}`);
}

console.log(fallades ? `\n${fallades} comprovacions fallides` : '\ntotes les comprovacions de l\'informe de registre correctes');
process.exit(fallades ? 1 : 0);
