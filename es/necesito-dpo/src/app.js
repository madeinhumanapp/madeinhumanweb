// =============================================================================
// Interfície de «Necessito DPO?»: una pregunta per pantalla i el resultat.
// Llegeix els textos de dades/regles.js i la lògica de src/avaluar.js.
// Vegeu AGENTS.md, apartat 6. Res d'emmagatzematge ni de xarxa.
// =============================================================================
import { avaluar, preguntesAFer } from './avaluar.js'
import { PREGUNTES, SECTORS, SECTOR_CAP, MOTIUS, VEREDICTES, TEXTOS, ETIQUETES_OPCIO } from '../dades/regles.js'

const PREGUNTES_PER_ID = new Map(PREGUNTES.map(p => [p.id, p]))
const SECTORS_PER_ID = new Map(SECTORS.map(s => [s.id, s]))

const vista = document.getElementById('vista')
const progres = document.getElementById('progres')

const estat = { respostes: {}, fase: 'entrada', pas: 0 }

function el(tag, attrs = {}, ...fills) {
  const node = document.createElement(tag)
  for (const [k, v] of Object.entries(attrs)) {
    if (k === 'class') node.className = v
    else node.setAttribute(k, v)
  }
  node.append(...fills)
  return node
}

// Text amb marcatge *paraula* → <em>, tot via textContent (cap innerHTML amb text).
function ambEnfasis(node, text) {
  String(text).split('*').forEach((part, i) => {
    if (i % 2 === 1) {
      const em = document.createElement('em')
      em.textContent = part
      node.append(em)
    } else if (part) {
      node.append(document.createTextNode(part))
    }
  })
  return node
}

function textPregunta(id) {
  if (id === 'sectorCondicio') return SECTORS_PER_ID.get(estat.respostes.sector)?.condicio?.text ?? ''
  return PREGUNTES_PER_ID.get(id)?.text ?? ''
}

function opcionsDe(id) {
  if (id === 'sector') return [...SECTORS, SECTOR_CAP].map(s => ({ valor: s.id, etiqueta: s.text }))
  return PREGUNTES_PER_ID.get(id).opcions.map(v => ({ valor: v, etiqueta: ETIQUETES_OPCIO[v] }))
}

function mostraEntrada() {
  estat.fase = 'entrada'
  estat.pas = 0
  progres.hidden = true
  progres.textContent = ''
  vista.replaceChildren()
  const h1 = el('h1', { tabindex: '-1' })
  ambEnfasis(h1, TEXTOS.titol)
  const boto = el('button', { class: 'boto boto-principal', type: 'button' })
  boto.textContent = TEXTOS.comencar
  boto.addEventListener('click', () => mostraPregunta(0))
  vista.append(
    el('section', { class: 'pantalla entrada' }, h1,
      el('p', { class: 'entrada' }, TEXTOS.entrada),
      el('p', { class: 'durada' }, TEXTOS.durada),
      boto),
  )
  h1.focus()
}

function mostraPregunta(i) {
  const llista = preguntesAFer(estat.respostes)
  if (i >= llista.length) return mostraResultat()
  estat.fase = 'pregunta'
  estat.pas = i
  const id = llista[i]
  progres.hidden = false
  progres.textContent = `Pregunta ${i + 1} de ${llista.length}`
  vista.replaceChildren()
  const h2 = el('h2', { id: 'titol-pregunta', tabindex: '-1' })
  ambEnfasis(h2, textPregunta(id))
  const sec = el('section', { class: 'pantalla pregunta' }, h2)
  const ajuda = PREGUNTES_PER_ID.get(id)?.ajuda
  if (ajuda) sec.append(el('p', { class: 'ajuda' }, ajuda))
  sec.append(mostraOpcions(id, i))
  if (i > 0) {
    const enrere = el('button', { class: 'boto boto-enrere', type: 'button' })
    enrere.textContent = TEXTOS.enrere
    enrere.addEventListener('click', () => mostraPregunta(i - 1))
    sec.append(enrere)
  }
  vista.append(sec)
  h2.focus()
}

function mostraOpcions(id, i) {
  const grup = el('div', { class: 'opcions', role: 'radiogroup', 'aria-labelledby': 'titol-pregunta' })
  const actual = estat.respostes[id]
  const botons = opcionsDe(id).map(op => {
    const b = el('button', {
      type: 'button',
      class: 'opcio',
      role: 'radio',
      'aria-checked': actual === op.valor ? 'true' : 'false',
      tabindex: '-1',
    })
    b.textContent = op.etiqueta
    b.addEventListener('click', () => {
      estat.respostes[id] = op.valor
      mostraPregunta(i + 1)
    })
    return b
  })
  // Una sola parada de tabulador per grup: l'opció triada o, si no n'hi ha, la primera
  const parada = botons.find(b => b.getAttribute('aria-checked') === 'true') || botons[0]
  parada.setAttribute('tabindex', '0')
  const mouFocus = b => {
    botons.forEach(x => x.setAttribute('tabindex', x === b ? '0' : '-1'))
    b.focus()
  }
  grup.addEventListener('keydown', e => {
    if (!['ArrowDown', 'ArrowRight', 'ArrowUp', 'ArrowLeft'].includes(e.key)) return
    const idx = botons.indexOf(document.activeElement)
    if (idx === -1) return
    e.preventDefault()
    const delta = e.key === 'ArrowDown' || e.key === 'ArrowRight' ? 1 : -1
    mouFocus(botons[(idx + delta + botons.length) % botons.length])
  })
  grup.append(...botons)
  return grup
}

function mostraResultat() {
  estat.fase = 'resultat'
  progres.hidden = true
  progres.textContent = ''
  const res = avaluar(estat.respostes)
  const v = VEREDICTES[res.veredicte]
  vista.replaceChildren()
  const h2 = el('h2', { tabindex: '-1' })
  ambEnfasis(h2, v.titol)
  const sec = el('section', { class: 'pantalla resultat' }, h2,
    el('p', { class: 'text-resultat' }, v.text))
  if (res.veredicte === 'obligatori') {
    const ul = el('ul', { class: 'llista-motius' })
    for (const m of res.motius) {
      const text = el('p', { class: 'motiu-text' })
      ambEnfasis(text, MOTIUS[m].text)
      const li = el('li', {}, text, el('p', { class: 'article' }, MOTIUS[m].article))
      if (m === 'lopdgdd-34-1' && res.sector) {
        const s = SECTORS_PER_ID.get(res.sector.id)
        li.append(el('p', { class: 'article' }, `${s.text} · ${res.sector.article}`))
      }
      ul.append(li)
    }
    sec.append(ul)
  }
  if (res.veredicte === 'cal-revisar') {
    const ul = el('ul', { class: 'llista-dubtes' })
    for (const d of res.dubtes) ul.append(el('li', {}, textPregunta(d)))
    sec.append(ul)
  }
  const passos = el('ol', { class: 'passos' })
  for (const pas of v.passos) passos.append(el('li', {}, pas))
  sec.append(passos)
  sec.append(el('p', { class: 'avis' }, TEXTOS.avis))
  sec.append(el('p', { class: 'ctas' },
    el('a', { class: 'boto boto-principal', href: TEXTOS.ctaPrincipal.url }, TEXTOS.ctaPrincipal.text),
    el('a', { class: 'boto boto-secundari', href: TEXTOS.ctaSecundari.url }, TEXTOS.ctaSecundari.text)))
  const tornar = el('button', { class: 'boto boto-enrere', type: 'button' }, TEXTOS.tornar)
  tornar.addEventListener('click', () => {
    estat.respostes = {}
    mostraEntrada()
  })
  sec.append(tornar)
  vista.append(sec)
  h2.focus()
}

mostraEntrada()
