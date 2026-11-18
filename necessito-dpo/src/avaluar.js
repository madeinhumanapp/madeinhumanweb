// =============================================================================
// Lògica de «Necessito DPO?» (funcions pures, sense DOM).
// Les regles exactes són a AGENTS.md, apartat 5; les proves a
// tests/acceptacio/avaluar.test.js. Tot el contingut ve de dades/regles.js.
// =============================================================================
import { PREGUNTES, SECTORS } from '../dades/regles.js'

const PREGUNTES_PER_ID = new Map(PREGUNTES.map(p => [p.id, p]))
const SECTORS_PER_ID = new Map(SECTORS.map(s => [s.id, s]))

function esObjecte(v) {
  return typeof v === 'object' && v !== null && !Array.isArray(v)
}

/**
 * Llista ordenada dels `id` de pregunta que cal fer amb les respostes que hi
 * ha fins ara (les preguntes condicionals només hi surten quan toca).
 * @param {Record<string, string>} respostes
 * @returns {string[]}
 */
export function preguntesAFer(respostes) {
  const r = esObjecte(respostes) ? respostes : {}
  const sector = SECTORS_PER_ID.get(r.sector)
  const llista = ['public', 'sector']
  if (sector && sector.condicio) llista.push('sectorCondicio')
  llista.push('seguiment', 'sensibles')
  if (r.seguiment === 'si' || r.seguiment === 'nsnc' || r.sensibles === 'si' || r.sensibles === 'nsnc') {
    llista.push('granEscala')
  }
  return llista
}

function valorValid(id, valor) {
  if (id === 'sector') return valor === 'cap' || SECTORS_PER_ID.has(valor)
  const opcions = PREGUNTES_PER_ID.get(id)?.opcions
  return Array.isArray(opcions) && opcions.includes(valor)
}

/**
 * Avalua les respostes completes.
 * @param {Record<string, string>} respostes
 * @returns {{ veredicte: 'obligatori'|'cal-revisar'|'recomanable'|'no-obligatori',
 *             motius: string[], dubtes: string[], sector: null | { id: string, article: string } }}
 * @throws {TypeError} si falta una resposta necessària o algun valor no és vàlid
 */
export function avaluar(respostes) {
  if (!esObjecte(respostes)) throw new TypeError('respostes ha de ser un objecte')
  const llista = preguntesAFer(respostes)
  for (const id of llista) {
    if (!valorValid(id, respostes[id])) {
      throw new TypeError(`Resposta no vàlida per a «${id}»: ${String(respostes[id])}`)
    }
  }
  const sector = SECTORS_PER_ID.get(respostes.sector) || null

  const motius = []
  if (respostes.public === 'si') motius.push('art37-1-a')
  let sectorResultat = null
  if (sector && (!sector.condicio || respostes.sectorCondicio === 'si')) {
    motius.push('lopdgdd-34-1')
    sectorResultat = { id: sector.id, article: sector.article }
  }
  if (respostes.seguiment === 'si' && respostes.granEscala === 'si') motius.push('art37-1-b')
  if (respostes.sensibles === 'si' && respostes.granEscala === 'si') motius.push('art37-1-c')

  if (motius.length > 0) {
    return { veredicte: 'obligatori', motius, dubtes: [], sector: sectorResultat }
  }

  const granEscalaDemanada = llista.includes('granEscala')
  const granEscalaIncerta = respostes.granEscala === 'si' || respostes.granEscala === 'nsnc'
  const dubtes = []
  if (respostes.public === 'nsnc') dubtes.push('public')
  if (sector && sector.condicio && respostes.sectorCondicio === 'nsnc') dubtes.push('sectorCondicio')
  if (respostes.seguiment === 'nsnc' && granEscalaIncerta) dubtes.push('seguiment')
  if (respostes.sensibles === 'nsnc' && granEscalaIncerta) dubtes.push('sensibles')
  if (granEscalaDemanada && respostes.granEscala === 'nsnc') dubtes.push('granEscala')

  if (dubtes.length > 0) {
    return { veredicte: 'cal-revisar', motius: [], dubtes, sector: null }
  }
  if (granEscalaDemanada && respostes.granEscala === 'no') {
    return { veredicte: 'recomanable', motius: [], dubtes: [], sector: null }
  }
  return { veredicte: 'no-obligatori', motius: [], dubtes: [], sector: null }
}
