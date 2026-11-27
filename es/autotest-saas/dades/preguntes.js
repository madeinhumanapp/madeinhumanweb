// =============================================================================
// Preguntas, paquetes, avisos y textos del autotest SaaS (borrador, WEB-G06f).
// Registro «vosotros» en castellano. Cada afirmación jurídica lleva [REVISAR]
// para su validación antes de publicar la herramienta.
// =============================================================================

export const PREGUNTES = [
  {
    id: 'clientes',
    text: '¿Qué tipo de clientes utiliza vuestro *SaaS*?',
    opcions: [
      { valor: 'b2c', etiqueta: 'Particulares (B2C)' },
      { valor: 'b2b', etiqueta: 'Empresas u organizaciones (B2B)' },
      { valor: 'mixto', etiqueta: 'Mixto (particulares y empresas)' },
    ],
  },
  {
    id: 'equipo',
    text: '¿Cuál es el tamaño actual de vuestro *equipo*?',
    opcions: [
      { valor: 'solitario', etiqueta: 'En solitario' },
      { valor: '2_5', etiqueta: 'Entre 2 y 5 personas' },
      { valor: 'mas_5', etiqueta: 'Más de 5 personas' },
    ],
  },
  {
    id: 'jurisdiccion',
    text: '¿En qué *jurisdicción* está establecida vuestra empresa o proyecto?',
    opcions: [
      { valor: 'espana', etiqueta: 'España' },
      { valor: 'ue', etiqueta: 'Otro país de la Unión Europea' },
      { valor: 'fuera_ue', etiqueta: 'Fuera de la Unión Europea' },
    ],
  },
  {
    id: 'datos',
    text: '¿Qué tipo de *datos personales* tratáis en la plataforma?',
    opcions: [
      { valor: 'cuenta', etiqueta: 'Solo datos de cuenta (registro, acceso y facturación)' },
      { valor: 'operativos', etiqueta: 'Datos operativos del día a día de clientes o usuarios' },
      { valor: 'sensibles', etiqueta: 'Datos sensibles o de categoría especial (salud, biometría, etc.)' },
    ],
  },
  {
    id: 'infraestructura',
    text: '¿Dónde se aloja vuestra *infraestructura* (stack técnico)?',
    opcions: [
      { valor: 'ue', etiqueta: 'Unión Europea (UE)' },
      { valor: 'eeuu', etiqueta: 'Estados Unidos (EE. UU.)' },
      { valor: 'desconocida', etiqueta: 'Desconocida o sin mapear' },
    ],
  },
  {
    id: 'ia',
    text: '¿Incorporáis *inteligencia artificial* en el producto?',
    opcions: [
      { valor: 'no', etiqueta: 'No' },
      { valor: 'api_terceros', etiqueta: 'Sí, mediante API de terceros' },
      { valor: 'modelo_propio', etiqueta: 'Sí, con modelo propio' },
    ],
  },
  {
    id: 'decisiones',
    text: '¿El sistema toma *decisiones automatizadas* con efectos sobre personas?',
    ajuda: 'Por ejemplo, descartes automáticos, puntuaciones que bloquean acceso o condiciones contractuales sin revisión humana.',
    opcions: [
      { valor: 'si', etiqueta: 'Sí' },
      { valor: 'no', etiqueta: 'No' },
    ],
  },
  {
    id: 'dpa',
    text: '¿Tenéis *DPA* (contrato de encargado del tratamiento) para vuestros clientes B2B?',
    opcions: [
      { valor: 'si', etiqueta: 'Sí' },
      { valor: 'no', etiqueta: 'No' },
      { valor: 'no_se', etiqueta: 'No lo sé' },
    ],
  },
  {
    id: 'borrado',
    text: '¿Tenéis definidos el *borrado*, los registros (logs) y las copias de seguridad?',
    opcions: [
      { valor: 'definidos', etiqueta: 'Definidos' },
      { valor: 'parcialmente', etiqueta: 'Parcialmente' },
      { valor: 'no', etiqueta: 'No' },
    ],
  },
  {
    id: 'cookies',
    text: '¿Qué *cookies y analítica* utilizáis en la web y en la aplicación?',
    opcions: [
      { valor: 'ninguna', etiqueta: 'Ninguna' },
      { valor: 'propias', etiqueta: 'Solo propias' },
      { valor: 'terceros', etiqueta: 'De terceros' },
    ],
  },
  {
    id: 'documentacion',
    text: '¿Cuál es el *estado documental* actual de vuestro proyecto?',
    opcions: [
      { valor: 'completo', etiqueta: 'Completo' },
      { valor: 'parcial', etiqueta: 'Parcial' },
      { valor: 'nada', etiqueta: 'Nada todavía' },
    ],
  },
  {
    id: 'momento',
    text: '¿En qué *momento* se encuentra vuestro SaaS?',
    opcions: [
      { valor: 'prelanzamiento', etiqueta: 'Prelanzamiento' },
      { valor: 'produccion', etiqueta: 'En producción' },
      { valor: 'bloqueo_b2b', etiqueta: 'Un cliente B2B bloquea la venta' },
    ],
  },
];

export const PAQUETS = {
  base_saas: {
    id: 'base_saas',
    nom: 'Base SaaS',
    descripcio: 'Base documental y operativa para operar el SaaS con orden en privacidad y proveedores [REVISAR: alcance exacto de entregables del paquete Base SaaS].',
  },
  trust_pack_b2b: {
    id: 'trust_pack_b2b',
    nom: 'Trust Pack B2B',
    descripcio: 'Preparación para procesos de compra B2B: DPA, relación de subencargados y paquete de diligencia debida [REVISAR: entregables y cláusulas tipo del Trust Pack B2B].',
  },
  addon_ia: {
    id: 'addon_ia',
    nom: 'Add-on IA',
    descripcio: 'Revisión de los flujos de inteligencia artificial, transparencia y evaluación de decisiones automatizadas [REVISAR: encaje con el Reglamento europeo de IA y el RGPD].',
  },
};

export const PERFIL_SOLITARIO = {
  nom: 'Fundador en solitario',
  descripcio: 'Trabajáis en solitario, sin datos sensibles ni decisiones automatizadas: conviene un enfoque proporcionado, claro y sin burocracia innecesaria [REVISAR: criterios del perfil Fundador en solitario].',
};

export const SEMAFORS = {
  verde: {
    nivell: 'verde',
    etiqueta: 'Semáforo verde: base encaminada',
    titol: 'Base *encaminada*',
    resum: 'Vuestro punto de partida es razonablemente ordenado. Conviene cerrar los ajustes pendientes antes de escalar.',
  },
  ambar: {
    nivell: 'ambar',
    etiqueta: 'Semáforo ámbar: revisión necesaria',
    titol: 'Revisión *necesaria*',
    resum: 'Existen frentes abiertos en documentación, contratos o infraestructura que conviene ordenar cuanto antes.',
  },
  rojo: {
    nivell: 'rojo',
    etiqueta: 'Semáforo rojo: acción prioritaria',
    titol: 'Acción *prioritaria*',
    resum: 'Hay factores de riesgo alto o bloqueos comerciales activos que requieren atención prioritaria.',
  },
};

export const AVISOS = {
  eipd: {
    id: 'eipd',
    titol: 'EIPD (Evaluación de Impacto en Protección de Datos): probable, a valorar',
    text: 'Por el tipo de datos o de tratamiento indicado, una EIPD resulta probable y conviene valorarla caso por caso; no puede afirmarse como obligatoria de forma automática porque depende de los criterios del art. 35.3 del RGPD y de las listas de las autoridades de control [REVISAR: redacción jurídica sobre la valoración de EIPD y art. 35.3 RGPD].',
  },
  art27: {
    id: 'art27',
    titol: 'Representante en la UE (art. 27 RGPD): probable, a valorar',
    text: 'Al estar establecidos fuera de la Unión Europea, la designación de representante en la UE es probable y debe valorarse; no siempre es exigible, ya que el art. 27.2 del RGPD prevé excepciones según la naturaleza, el volumen y el riesgo del tratamiento [REVISAR: redacción jurídica sobre el art. 27 y las excepciones del art. 27.2 RGPD].',
  },
};

export const PUNTS = {
  bloqueo_b2b: 'Desbloquear la venta B2B preparando DPA, listado de subencargados y respuestas claras de seguridad y privacidad [REVISAR: documentación exigida habitualmente por clientes B2B bajo el RGPD].',
  dpa_falta: 'Preparar o revisar un DPA (contrato de encargado del tratamiento) para clientes B2B y controlar la cadena de subencargados [REVISAR: contenido mínimo del art. 28 RGPD para SaaS B2B].',
  datos_sensibles: 'Verificar la base jurídica reforzada y las medidas técnicas y organizativas para el tratamiento de datos sensibles [REVISAR: condiciones del art. 9 RGPD y medidas proporcionales].',
  decisiones: 'Analizar las decisiones automatizadas con efectos sobre personas para confirmar si se requieren salvaguardas específicas e intervención humana [REVISAR: aplicabilidad del art. 22 RGPD al caso concreto].',
  documentacion_nada: 'Elaborar la documentación esencial de privacidad: política de privacidad, avisos informativos y registro de actividades de tratamiento [REVISAR: obligaciones documentales mínimas del RGPD y la LOPDGDD].',
  documentacion_parcial: 'Completar y alinear la documentación actual de privacidad con los flujos reales del producto [REVISAR: alcance de la actualización documental según RGPD y LOPDGDD].',
  transferencias: 'Mapear el stack técnico y revisar las garantías jurídicas aplicables a posibles transferencias internacionales fuera del EEE [REVISAR: encaje del capítulo V del RGPD, cláusulas contractuales tipo y marco UE-EE. UU.].',
  borrado_logs: 'Definir y documentar los plazos de conservación, el borrado efectivo, la retención de registros (logs) y las copias de seguridad [REVISAR: principio de limitación del plazo de conservación del RGPD].',
  ia_terceros: 'Revisar los términos de los proveedores de IA por API (no entrenamiento con datos de clientes, confidencialidad y transparencia) [REVISAR: obligaciones del RGPD y del Reglamento europeo de IA para proveedores que integran APIs].',
  ia_propio: 'Revisar el origen y la licitud de los datos del modelo propio, su gobierno interno y la clasificación de riesgo aplicable [REVISAR: obligaciones del RGPD y del Reglamento europeo de IA para modelos propios].',
  cookies_terceros: 'Adecuar el aviso y la gestión del consentimiento previo para cookies y analítica de terceros antes de su carga [REVISAR: requisitos de la LSSI-CE y guías vigentes de la Agencia Española de Protección de Datos (AEPD)].',
  base_orden: 'Mantener actualizada la documentación base y el inventario de proveedores conforme evoluciona el producto [REVISAR: frecuencia recomendada de revisión periódica].',
};

export const TEXTOS = {
  franja: 'Borrador: pendiente de validación',
  titol: 'Autotest *SaaS* de privacidad e IA',
  entrada: 'Responded 12 preguntas breves para obtener una orientación inicial sobre vuestros puntos a revisar, paquetes aplicables y avisos a valorar.',
  durada: '12 preguntas · 3 minutos · sin envío de datos ni registro',
  comencar: 'Empezar autotest',
  enrere: 'Atrás',
  tornar: 'Volver a empezar',
  seccioPaquets: 'Paquetes que se activarían',
  seccioPerfil: 'Perfil detectado',
  seccioAvisos: 'Avisos probables, a valorar',
  seccioPunts: 'Puntos a revisar',
  avisLegal: 'Este resultado es orientativo y corresponde a un borrador pendiente de validación jurídica; no constituye asesoramiento legal ni sustituye una revisión del caso concreto [REVISAR: texto del aviso legal del autotest].',
  cta: { text: 'Hablemos', href: '/es/#contacto' },
};
