// =============================================================================
// Interfaz del autotest SaaS en castellano (borrador, WEB-G06f).
// Sin envío de datos (ningún fetch), sin localStorage, sessionStorage ni cookies.
// =============================================================================
import { PREGUNTES, TEXTOS } from '../dades/preguntes.js';
import { avaluar } from './avaluar.js';

const vista = document.getElementById('vista');
const progres = document.getElementById('progres');

const estat = { respostes: {}, fase: 'entrada', pas: 0 };

function el(tag, attrs = {}, ...fills) {
  const node = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs)) {
    if (k === 'class') node.className = v;
    else node.setAttribute(k, v);
  }
  node.append(...fills);
  return node;
}

// Convierte *palabra* en <em> usando solo nodos de texto (sin innerHTML).
function ambEnfasis(node, text) {
  String(text).split('*').forEach((part, i) => {
    if (i % 2 === 1) {
      const em = document.createElement('em');
      em.textContent = part;
      node.append(em);
    } else if (part) {
      node.append(document.createTextNode(part));
    }
  });
  return node;
}

function mostraEntrada() {
  estat.fase = 'entrada';
  estat.pas = 0;
  progres.hidden = true;
  progres.textContent = '';
  vista.replaceChildren();

  const h1 = el('h1', { tabindex: '-1' });
  ambEnfasis(h1, TEXTOS.titol);
  const boto = el('button', { class: 'boto boto-principal', type: 'button' }, TEXTOS.comencar);
  boto.addEventListener('click', () => mostraPregunta(0));

  vista.append(
    el('section', { class: 'pantalla entrada' },
      h1,
      el('p', { class: 'entrada-text' }, TEXTOS.entrada),
      el('p', { class: 'durada' }, TEXTOS.durada),
      boto),
  );
  h1.focus();
}

function mostraOpcions(pregunta, index) {
  const grup = el('div', {
    class: 'opcions',
    role: 'radiogroup',
    'aria-labelledby': 'titol-pregunta',
  });
  const actual = estat.respostes[pregunta.id];
  const botons = pregunta.opcions.map(op => {
    const b = el('button', {
      type: 'button',
      class: 'opcio',
      role: 'radio',
      'aria-checked': actual === op.valor ? 'true' : 'false',
      'data-valor': op.valor,
      tabindex: '-1',
    }, op.etiqueta);
    b.addEventListener('click', () => {
      estat.respostes[pregunta.id] = op.valor;
      mostraPregunta(index + 1);
    });
    return b;
  });

  const parada = botons.find(b => b.getAttribute('aria-checked') === 'true') || botons[0];
  parada.setAttribute('tabindex', '0');

  const mouFocus = b => {
    botons.forEach(x => x.setAttribute('tabindex', x === b ? '0' : '-1'));
    b.focus();
  };

  grup.addEventListener('keydown', e => {
    if (!['ArrowDown', 'ArrowRight', 'ArrowUp', 'ArrowLeft'].includes(e.key)) return;
    const idx = botons.indexOf(document.activeElement);
    if (idx === -1) return;
    e.preventDefault();
    const delta = e.key === 'ArrowDown' || e.key === 'ArrowRight' ? 1 : -1;
    mouFocus(botons[(idx + delta + botons.length) % botons.length]);
  });

  grup.append(...botons);
  return grup;
}

function mostraPregunta(index) {
  if (index >= PREGUNTES.length) return mostraResultat();
  estat.fase = 'pregunta';
  estat.pas = index;
  const p = PREGUNTES[index];

  progres.hidden = false;
  progres.textContent = `Pregunta ${index + 1} de ${PREGUNTES.length}`;
  vista.replaceChildren();

  const h1 = el('h1', { id: 'titol-pregunta', class: 'titol-pas', tabindex: '-1' });
  ambEnfasis(h1, p.text);

  const sec = el('section', { class: 'pantalla pregunta' }, h1);
  if (p.ajuda) sec.append(el('p', { class: 'ajuda' }, p.ajuda));
  sec.append(mostraOpcions(p, index));

  const enrere = el('button', { class: 'boto boto-enrere', type: 'button' }, TEXTOS.enrere);
  enrere.addEventListener('click', () => (index > 0 ? mostraPregunta(index - 1) : mostraEntrada()));
  sec.append(enrere);

  vista.append(sec);
  h1.focus();
}

function semaforNode(semaforo) {
  const llums = ['rojo', 'ambar', 'verde'].map(color => el('span', {
    class: `llum llum-${color}${semaforo.nivell === color ? ' activa' : ''}`,
    'aria-hidden': 'true',
  }));
  return el('div', {
    class: 'semafor',
    role: 'img',
    'aria-label': semaforo.etiqueta,
  }, ...llums);
}

function mostraResultat() {
  estat.fase = 'resultat';
  progres.hidden = true;
  progres.textContent = '';
  const res = avaluar(estat.respostes);
  vista.replaceChildren();

  const h1 = el('h1', { class: 'titol-pas', tabindex: '-1' });
  ambEnfasis(h1, res.semaforo.titol);

  const badge = el('span', { class: `etiqueta-semafor etiqueta-${res.semaforo.nivell}` }, res.semaforo.etiqueta);
  const targeta = el('div', { class: 'semafor-card' },
    semaforNode(res.semaforo),
    el('div', { class: 'semafor-info' },
      badge,
      el('p', { class: 'semafor-frase' }, res.semaforo.resum)));

  const sec = el('section', { class: 'pantalla resultat' }, h1, targeta);

  // Paquetes
  const llistaPaquets = el('ul', { class: 'llista-blocs' });
  for (const pq of res.paquets) {
    llistaPaquets.append(
      el('li', {},
        el('strong', { class: 'bloc-titol' }, pq.nom),
        el('p', { class: 'bloc-text' }, pq.descripcio)),
    );
  }
  sec.append(el('h2', {}, TEXTOS.seccioPaquets), llistaPaquets);

  // Perfil «Fundador en solitario» (si aplica)
  if (res.perfil) {
    sec.append(
      el('h2', {}, TEXTOS.seccioPerfil),
      el('div', { class: 'caixa-perfil' },
        el('strong', { class: 'bloc-titol' }, res.perfil.nom),
        el('p', { class: 'bloc-text' }, res.perfil.descripcio)),
    );
  }

  // Avisos probables, a valorar (EIPD y art. 27 RGPD)
  if (res.avisos.length) {
    const llistaAvisos = el('ul', { class: 'llista-avisos' });
    for (const av of res.avisos) {
      llistaAvisos.append(
        el('li', {},
          el('strong', { class: 'bloc-titol' }, av.titol),
          el('p', { class: 'bloc-text' }, av.text)),
      );
    }
    sec.append(el('h2', {}, TEXTOS.seccioAvisos), llistaAvisos);
  }

  // Puntos a revisar
  const llistaPunts = el('ul', { class: 'llista-punts' });
  for (const punt of res.punts) {
    llistaPunts.append(el('li', {}, punt));
  }
  sec.append(el('h2', {}, TEXTOS.seccioPunts), llistaPunts);

  sec.append(el('p', { class: 'avis-legal' }, TEXTOS.avisLegal));

  const accions = el('div', { class: 'ctas' },
    el('a', { class: 'boto boto-principal', href: TEXTOS.cta.href }, TEXTOS.cta.text));
  const tornar = el('button', { class: 'boto boto-enrere', type: 'button' }, TEXTOS.tornar);
  tornar.addEventListener('click', () => {
    estat.respostes = {};
    mostraEntrada();
  });
  accions.append(tornar);
  sec.append(accions);

  vista.append(sec);
  h1.focus();
}

mostraEntrada();
