// =============================================================================
// Evaluación pura del autotest SaaS (WEB-G06f). Sin DOM, sin red ni estado.
// =============================================================================
import { PREGUNTES, PAQUETS, PERFIL_SOLITARIO, SEMAFORS, AVISOS, PUNTS } from '../dades/preguntes.js';

const IDS_PREGUNTES = PREGUNTES.map(p => p.id);

/**
 * Evalúa las 12 respuestas del autotest SaaS y devuelve el semáforo, los paquetes,
 * el perfil opcional, los avisos «probables, a valorar» y los puntos a revisar.
 * @param {Record<string, string>} respostes
 */
export function avaluar(respostes = {}) {
  const r = respostes || {};

  // 1. Paquetes que se activarían
  const paquets = [PAQUETS.base_saas];
  const activaTrustB2b = r.clientes === 'b2b'
    || r.clientes === 'mixto'
    || r.dpa === 'no'
    || r.dpa === 'no_se'
    || r.momento === 'bloqueo_b2b';
  if (activaTrustB2b) paquets.push(PAQUETS.trust_pack_b2b);

  const activaAddonIa = r.ia === 'api_terceros'
    || r.ia === 'modelo_propio'
    || r.decisiones === 'si';
  if (activaAddonIa) paquets.push(PAQUETS.addon_ia);

  // 2. Perfil «Fundador en solitario»
  const perfil = r.equipo === 'solitario'
    && r.datos !== 'sensibles'
    && r.decisiones !== 'si'
    ? PERFIL_SOLITARIO
    : null;

  // 3. Avisos probables, a valorar (nunca obligatorios)
  const avisos = [];
  if (r.datos === 'sensibles' || r.decisiones === 'si' || r.ia === 'modelo_propio') {
    avisos.push(AVISOS.eipd);
  }
  if (r.jurisdiccion === 'fuera_ue') {
    avisos.push(AVISOS.art27);
  }

  // 4. Puntos a revisar y puntuación orientativa de riesgo
  const punts = [];
  let puntuacio = 0;

  if (r.momento === 'bloqueo_b2b') {
    punts.push(PUNTS.bloqueo_b2b);
    puntuacio += 4;
  }
  if ((r.clientes === 'b2b' || r.clientes === 'mixto' || r.momento === 'bloqueo_b2b')
    && (r.dpa === 'no' || r.dpa === 'no_se')) {
    punts.push(PUNTS.dpa_falta);
    puntuacio += r.momento === 'produccion' ? 3 : 2;
  }
  if (r.datos === 'sensibles') {
    punts.push(PUNTS.datos_sensibles);
    puntuacio += 3;
  }
  if (r.decisiones === 'si') {
    punts.push(PUNTS.decisiones);
    puntuacio += 3;
  }
  if (r.documentacion === 'nada') {
    punts.push(PUNTS.documentacion_nada);
    puntuacio += r.momento === 'produccion' ? 3 : 2;
  } else if (r.documentacion === 'parcial') {
    punts.push(PUNTS.documentacion_parcial);
    puntuacio += 1;
  }
  if (r.infraestructura === 'eeuu' || r.infraestructura === 'desconocida') {
    punts.push(PUNTS.transferencias);
    puntuacio += r.infraestructura === 'desconocida' ? 2 : 1;
  }
  if (r.borrado === 'no') {
    punts.push(PUNTS.borrado_logs);
    puntuacio += 2;
  } else if (r.borrado === 'parcialmente') {
    punts.push(PUNTS.borrado_logs);
    puntuacio += 1;
  }
  if (r.ia === 'modelo_propio') {
    punts.push(PUNTS.ia_propio);
    puntuacio += 2;
  } else if (r.ia === 'api_terceros') {
    punts.push(PUNTS.ia_terceros);
    puntuacio += 1;
  }
  if (r.cookies === 'terceros') {
    punts.push(PUNTS.cookies_terceros);
    puntuacio += 1;
  }
  if (r.jurisdiccion === 'fuera_ue') {
    puntuacio += 2;
  }

  if (punts.length === 0) {
    punts.push(PUNTS.base_orden);
  }

  // 5. Nivel de semáforo
  const esVermell = r.momento === 'bloqueo_b2b'
    || (r.datos === 'sensibles' && (r.documentacion !== 'completo' || r.borrado !== 'definidos'))
    || (r.decisiones === 'si' && r.documentacion !== 'completo')
    || (r.momento === 'produccion' && r.documentacion === 'nada')
    || ((r.clientes === 'b2b' || r.clientes === 'mixto') && r.dpa === 'no' && r.momento === 'produccion')
    || puntuacio >= 6;

  const clauSemafor = esVermell ? 'rojo' : (puntuacio >= 2 ? 'ambar' : 'verde');

  return {
    semaforo: SEMAFORS[clauSemafor],
    paquets,
    perfil,
    avisos,
    punts,
    puntuacio,
    completes: IDS_PREGUNTES.every(id => Boolean(r[id])),
  };
}
