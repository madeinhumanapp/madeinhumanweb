// =============================================================================
// Lògica del «Test d’obligacions d’IA» (funcions pures, sense DOM).
// Només es fan servir les dades jurídiques permeses de dades/regles.js
// (art. 4 i art. 50 del Reglament d’IA); la resta queda com a [REVISAR].
// Les proves estan a proves/obligacions-ia.mjs.
// =============================================================================
import { PREGUNTES } from '../dades/regles.js'

const PREGUNTES_PER_ID = new Map(PREGUNTES.map(p => [p.id, p]))

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
  const llista = []
  for (const p of PREGUNTES) {
    if (!p.nomesSi) { llista.push(p.id); continue }
    if (p.nomesSi.valors.includes(r[p.nomesSi.pregunta])) llista.push(p.id)
  }
  return llista
}

function valorValid(id, valor) {
  const opcions = PREGUNTES_PER_ID.get(id)?.opcions
  return Array.isArray(opcions) && opcions.includes(valor)
}

/**
 * Avalua les respostes completes.
 * @param {Record<string, string>} respostes
 * @returns {{ obligacions: string[], transitori: boolean|null, dubtes: string[] }}
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

  const obligacions = []
  const dubtes = []
  let transitori = null

  if (respostes.usaIa === 'si') obligacions.push('art4')
  else if (respostes.usaIa === 'nsnc') dubtes.push('usaIa')

  if (respostes.xatClients === 'si') obligacions.push('art50-xat')
  else if (respostes.xatClients === 'nsnc') dubtes.push('xatClients')

  if (respostes.contingutIa === 'media' || respostes.contingutIa === 'ambdos') {
    obligacions.push('art50-2')
    if (respostes.sistemesMercat === 'si') transitori = true
    else if (respostes.sistemesMercat === 'no') transitori = false
    else dubtes.push('sistemesMercat')
  }
  if (respostes.contingutIa === 'textos' || respostes.contingutIa === 'ambdos') obligacions.push('revisar-textos')
  if (respostes.contingutIa === 'nsnc') dubtes.push('contingutIa')

  if (respostes.biometria === 'si') obligacions.push('revisar-biometria')
  else if (respostes.biometria === 'nsnc') dubtes.push('biometria')

  if (respostes.desenvolupaIa === 'si') obligacions.push('revisar-proveidor')
  else if (respostes.desenvolupaIa === 'nsnc') dubtes.push('desenvolupaIa')

  return { obligacions, transitori, dubtes }
}
