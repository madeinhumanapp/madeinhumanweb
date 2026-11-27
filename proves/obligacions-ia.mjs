// Proves del «Test d’obligacions d’IA» (WEB-T08), sense navegador: prova la
// lògica pura d’obligacions-ia/src/avaluar.js amb combinacions de respostes.
// Ús: node proves/obligacions-ia.mjs
import { avaluar, preguntesAFer } from '../obligacions-ia/src/avaluar.js'

let fallades = 0
const ok = (nom, cond, detall = '') => {
  if (!cond) fallades++
  console.log(`${cond ? '✓' : '✗'} ${nom}${!cond && detall ? ' — ' + detall : ''}`)
}

const base = { usaIa: 'no', xatClients: 'no', contingutIa: 'no', biometria: 'no', desenvolupaIa: 'no' }

// 1. No fan servir IA de cap manera → cap obligació ni dubte
{
  const r = avaluar({ ...base })
  ok('cap IA: cap obligació', r.obligacions.length === 0, JSON.stringify(r.obligacions))
  ok('cap IA: cap dubte', r.dubtes.length === 0, JSON.stringify(r.dubtes))
}

// 2. L’equip fa servir IA → art. 4 (alfabetització en IA)
{
  const r = avaluar({ ...base, usaIa: 'si' })
  ok('equip que usa IA: surt l’art. 4', JSON.stringify(r.obligacions) === JSON.stringify(['art4']), JSON.stringify(r.obligacions))
}

// 3. Xat o assistent automàtic amb clients → art. 50 (transparència)
{
  const r = avaluar({ ...base, xatClients: 'si' })
  ok('xat amb clients: surt l’art. 50', r.obligacions.includes('art50-xat'), JSON.stringify(r.obligacions))
}

// 4. Contingut audiovisual generat amb IA → art. 50.2; si el sistema ja era al
//    mercat, hi ha període transitori fins al 2/12/2026
{
  const r = avaluar({ ...base, contingutIa: 'media', sistemesMercat: 'si' })
  ok('contingut audiovisual: surt l’art. 50.2', r.obligacions.includes('art50-2'), JSON.stringify(r.obligacions))
  ok('sistema ja al mercat: transitori fins al 2/12/2026', r.transitori === true, String(r.transitori))
  ok('sistemesMercat només es demana amb contingut audiovisual o ambdós',
    !preguntesAFer({ ...base, contingutIa: 'no' }).includes('sistemesMercat')
      && preguntesAFer({ ...base, contingutIa: 'media' }).includes('sistemesMercat')
      && preguntesAFer({ ...base, contingutIa: 'ambdos' }).includes('sistemesMercat'))
}

// 5. Textos i audiovisual → art. 50.2 + revisió dels textos; sistema nou → sense transitori
{
  const r = avaluar({ ...base, contingutIa: 'ambdos', sistemesMercat: 'no' })
  ok('ambdós continguts: art. 50.2 i revisió de textos',
    r.obligacions.includes('art50-2') && r.obligacions.includes('revisar-textos'), JSON.stringify(r.obligacions))
  ok('sistema nou: no hi ha transitori', r.transitori === false, String(r.transitori))
}

// 6. Biometria i desenvolupar sistemes d’IA → punts a confirmar amb [REVISAR]
{
  const r = avaluar({ ...base, biometria: 'si', desenvolupaIa: 'si' })
  ok('biometria: revisió a confirmar', r.obligacions.includes('revisar-biometria'), JSON.stringify(r.obligacions))
  ok('desenvolupar IA a tercers: revisió a confirmar', r.obligacions.includes('revisar-proveidor'), JSON.stringify(r.obligacions))
}

// 7. «No ho sé» a tot → dubtes, però cap obligació afirmada
{
  const r = avaluar({ usaIa: 'nsnc', xatClients: 'nsnc', contingutIa: 'nsnc', biometria: 'nsnc', desenvolupaIa: 'nsnc' })
  ok('«no ho sé» a tot: tots els dubtes',
    JSON.stringify(r.dubtes) === JSON.stringify(['usaIa', 'xatClients', 'contingutIa', 'biometria', 'desenvolupaIa']),
    JSON.stringify(r.dubtes))
  ok('«no ho sé» a tot: cap obligació', r.obligacions.length === 0, JSON.stringify(r.obligacions))
}

// 8. Validació: valor no vàlid o resposta que falta → TypeError
{
  let e1 = null
  try { avaluar({ ...base, usaIa: 'potser' }) } catch (e) { e1 = e }
  ok('valor no vàlid: TypeError', e1 instanceof TypeError, String(e1))
  let e2 = null
  try { avaluar({ usaIa: 'si' }) } catch (e) { e2 = e }
  ok('resposta que falta: TypeError', e2 instanceof TypeError, String(e2))
}

console.log(fallades ? `\n${fallades} comprovacions fallides` : "\ntotes les comprovacions del test d'IA correctes")
process.exit(fallades ? 1 : 0)
