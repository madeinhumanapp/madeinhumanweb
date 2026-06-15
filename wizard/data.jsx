/* Static data for the RGPD wizard — provinces, questionnaire, sec checklist, etc. */

const PROVINCIES = [
  "Àlaba","Albacete","Alacant","Almeria","Astúries","Àvila","Badajoz","Barcelona",
  "Biscaia","Burgos","Càceres","Càdis","Cantàbria","Castelló","Ciudad Real","Còrdova",
  "La Corunya","Conca","Girona","Granada","Guadalajara","Guipúscoa","Huelva","Osca",
  "Illes Balears","Jaén","Lleida","Lleó","La Rioja","Lugo","Madrid","Màlaga",
  "Múrcia","Navarra","Ourense","Palència","Las Palmas","Pontevedra","Salamanca",
  "Santa Cruz de Tenerife","Segòvia","Sevilla","Sòria","Tarragona","Terol","Toledo",
  "València","Valladolid","Saragossa","Zamora","Ceuta","Melilla",
];

// Questionari Pas 2 — agrupat en 4 blocs
const Q_BLOC_A = [
  { k: "geolocalitzacio", q: "Geolocalitzeu els treballadors?", i: "📍", t: "GPS vehicles, apps de rutes…" },
  { k: "byod", q: "Treballadors amb dispositius personals?", i: "📱", t: "Mòbils, portàtils propis" },
  { k: "fotos_treballadors", q: "Feu servir fotos dels treballadors?", i: "📸", t: "Web, directori, targetes…" },
  { k: "contacte_personal", q: "Disposeu de dades de contacte personal?", i: "📇", t: "Mòbil personal, email personal" },
  { k: "firma_digital", q: "Feu servir signatura digital?", i: "✍️", t: "Signaturit, DocuSign…" },
  { k: "gestio_clients", q: "Gestioneu dades de clients?", i: "👥", t: "Facturació, CRM, contractes" },
  { k: "gestio_proveidors", q: "Gestioneu dades de proveïdors?", i: "🏭", t: "Comandes, factures" },
  { k: "seleccio_personal", q: "Realitzeu processos de selecció?", i: "🎯", t: "CVs, entrevistes" },
  { k: "videovigilancia", q: "Disposeu de videovigilància?", i: "📹", t: "Càmeres de seguretat" },
  { k: "control_acces_alarmes", q: "Teniu control d'accés o alarmes?", i: "🔐", t: "Targetes, codis, alarmes" },
  { k: "registre_visites", q: "Porteu registre de visites?", i: "📋", t: "Llibre de visites" },
  { k: "formacio_externa", q: "Oferiu formació externa?", i: "🎓", t: "Cursos a tercers" },
  { k: "newsletter", q: "Envieu comunicacions comercials?", i: "✉️", t: "Newsletter, email màrqueting" },
  { k: "control_horari", q: "Teniu control horari?", i: "⏰", t: "Fitxatge, registre jornada" },
  { k: "clients_potencials_crm", q: "Gestioneu leads / CRM?", i: "📊", t: "Oportunitats comercials" },
  { k: "ecommerce", q: "Teniu botiga online?", i: "🛒", t: "E-commerce" },
  { k: "whatsapp_empresa", q: "Feu servir WhatsApp corporatiu?", i: "💬", t: "Clients / treballadors" },
  { k: "tractament_menors", q: "Tracteu dades de menors?", i: "👶", t: "Menors de 14 anys" },
  { k: "canal_denuncia", q: "Disposeu de canal de denúncies?", i: "🔔", t: "Whistleblowing" },
  { k: "app_mobil", q: "Teniu aplicació mòbil?", i: "📲", t: "App per clients/treballadors" },
  { k: "pacients", q: "Tracteu dades de pacients?", i: "🏥", t: "Centre mèdic, clínica" },
  { k: "voluntaris", q: "Gestioneu voluntaris?", i: "🤝", t: "ONG, associacions" },
  { k: "blanqueig_capitals", q: "Estem subjectes a Llei 10/2010?", i: "🏦", t: "Blanqueig de capitals" },
  { k: "grabacio_trucades", q: "Graveu trucades telefòniques?", i: "📞", t: "Centraleta, atenció client" },
  { k: "marketing_directe", q: "Realitzeu màrqueting directe?", i: "📢", t: "Campanyes, mailings" },
  { k: "prevencio_riscos_laborals", q: "Gestioneu PRL internament?", i: "⚠️", t: "Riscos laborals propis" },
  { k: "subcontractacio", q: "Subcontracteu serveis?", i: "🔗", t: "Serveis externalitzats" },
  { k: "targetes_fidelitzacio", q: "Programa de fidelització?", i: "💳", t: "Targetes de punts" },
  { k: "delictes_sexuals", q: "El personal treballa amb menors?", i: "🛡️", t: "Certificat delictes sexuals" },
  { k: "collaboradors_externs", q: "Treballeu amb freelance / col·laboradors?", i: "🤝", t: "Autònoms" },
];

const Q_BLOC_B = [
  { k: "te_web", q: "Teniu pàgina web?", i: "🌐" },
  { k: "formulari_contacte", q: "La web té formulari de contacte?", i: "📝" },
  { k: "google_drive", q: "Feu servir Google Drive / Workspace?", i: "☁️" },
  { k: "xarxes_socials", q: "Teniu presència a xarxes socials?", i: "📱" },
];

const Q_BLOC_C = [
  { k: "registre_activitats", q: "Teniu Registre d'Activitats de Tractament?", i: "📄" },
  { k: "contractes_encarregats", q: "Teniu contractes amb encarregats?", i: "📑" },
  { k: "clausules_treballadors", q: "Clàusules de confidencialitat als treballadors?", i: "📋" },
  { k: "seguretat_dades", q: "Mesures de seguretat documentades?", i: "🔒" },
];

const Q_BLOC_D = [
  { k: "teletreball", q: "Hi ha teletreball habitual?", i: "🏠" },
  { k: "servidor_local", q: "Teniu un servidor físic propi?", i: "🖥️", t: "Ordinador-servidor o NAS a les vostres instal·lacions" },
  { k: "dades_paper", q: "Conserveu documentació en paper?", i: "📂", t: "Expedients, arxivadors físics…" },
  { k: "dades_salut_treballadors", q: "Tracteu dades de salut dels treballadors?", i: "❤️", t: "Baixes, reconeixements mèdics…" },
  { k: "control_horari_biometric", q: "Fitxatge amb empremta o cara?", i: "👆", t: "Sistemes biomètrics" },
];

const Q_BLOCS = [
  { code: "A", title: "Tractaments interns", subtitle: "Treballadors i gestió", items: Q_BLOC_A },
  { code: "B", title: "Web i presència digital", subtitle: "Canals online", items: Q_BLOC_B },
  { code: "C", title: "Estat documental actual", subtitle: "Quina documentació RGPD ja teniu", items: Q_BLOC_C },
  { code: "D", title: "Context operatiu", subtitle: "Determina mesures addicionals", items: Q_BLOC_D },
];

// Encarregats — Categories de dades
const CAT_BASIQUES = ["Nom i cognoms","DNI/NIF","Telèfon","Correu electrònic","Direcció postal","Imatge/Foto","Firma","Nº Seg. Social","Localització"];
const CAT_SENSIBLES = ["Salut","Biomètriques","Afiliació sindical","Religió/Creences","Origen ètnic","Vida sexual","Genètiques","Menors","Antecedents penals"];
const CAT_PROFESSIONALS = ["Professió/Càrrec","Formació/Titulacions","Historial laboral","Experiència professional"];
const CAT_ECONOMIQUES = ["Ingressos/Nòmina","Dades bancàries","Impostos","Préstecs/Hipoteques","Assegurances","Béns patrimonials"];

const SERVEIS_HABITUALS = [
  "Assessorament laboral","Assessorament fiscal","Assessorament legal",
  "Prevenció de riscos laborals","Manteniment IT","Hosting web","Correu electrònic",
  "Software CRM","Software comptabilitat","Gestió de nòmines","Formació","Neteja",
  "Seguretat/alarmes","Destrucció documentació","Medicina del treball",
];

const TIPUS_CONTRACTE = ["Genèric","Manteniment IT","Software/SaaS","Formació"];

const TIPUS_DISPOSITIU = ["Servidor","NAS","Ordinador","Portàtil","Smartphone","Tablet","Impressora/Multifunció","Router/Firewall","Altre"];

const SO_LIST = ["Windows 11","Windows 10","Windows Server 2022","macOS Sonoma","Linux Ubuntu","Android 14","iOS 17","N/A"];

const TIPUS_COOKIE = ["Tècnica (necessària)","Analítica","Màrqueting/Publicitat","Preferències","Xarxes socials"];

const TIPUS_EQUIP_VIDEO = ["Càmera","Gravador (DVR/NVR)","App visualització","App gravació","Altre"];

const DEPARTAMENTS = ["Administració","Comercial","Direcció","Finances","IT","Legal","Logística","Màrqueting","Operacions","RRHH"];

// Pas 9 — Mesures de seguretat (llenguatge planer per a no-tècnics)
const SEC_CATEGORIES = [
  { name: "Contrasenyes i accés", items: [
    "Cada persona té el seu usuari i contrasenya",
    "Les contrasenyes són llargues (mínim 8 caràcters)",
    "Demanem un segon codi (SMS, app o email) per entrar a les eines clau",
  ] },
  { name: "Ordinadors i xarxa", items: [
    "Tots els ordinadors tenen antivirus actiu",
    "El router té contrasenya i no és la que portava de fàbrica",
    "Les actualitzacions de Windows / macOS estan al dia",
  ] },
  { name: "Còpies de seguretat", items: [
    "Fem còpies de seguretat regularment",
    "Les còpies es guarden en més d'un lloc (disc extern, núvol…)",
    "Algun cop hem comprovat que la còpia es pot restaurar",
  ] },
  { name: "Paper i destrucció", items: [
    "Els papers amb dades personals es destrueixen (destructora, contenidor segur…)",
    "Els arxivadors amb informació es tanquen amb clau",
  ] },
  { name: "Espai físic", items: [
    "L'accés a l'oficina està controlat (porta amb clau, alarma…)",
    "Els despatxos sensibles tenen pany",
    "Tenim alarma o sistema antiincendis",
  ] },
  { name: "Persones i procediments", items: [
    "Els treballadors han signat un acord de confidencialitat",
    "Hem fet formació bàsica sobre protecció de dades al personal",
    "Tenim un procediment per saber què fer si hi ha un problema (robatori, virus, error…)",
  ] },
  { name: "Proveïdors", items: [
    "Tenim contracte signat amb la gestoria",
    "Tenim contracte signat amb l'informàtic / empresa IT",
  ] },
];

const SEC_TOTAL = SEC_CATEGORIES.reduce((acc, c) => acc + c.items.length, 0);

// Steps definition
const STEPS = [
  { id: 1, code: "01", short: "Empresa", title: "Dades de l'empresa", em: "l'empresa", lede: "Identificació, contacte, representant legal, branding i auditoria." },
  { id: 2, code: "02", short: "Qüestionari", title: "Qüestionari d'activitats", em: "d'activitats", lede: "Marqueu les activitats que es duen a terme. Determinarà els RAT i mesures aplicables." },
  { id: 3, code: "03", short: "Treballadors", title: "Treballadors", em: "Treballadors", lede: "Llista de treballadors amb dades i permisos. Importable des d'Excel." },
  { id: 4, code: "04", short: "Encarregats", title: "Encarregats de tractament", em: "de tractament", lede: "Proveïdors que tracten dades personals per compte de l'empresa." },
  { id: 5, code: "05", short: "Aplicacions", title: "Aplicacions i serveis", em: "Aplicacions", lede: "Software, plataformes i serveis SaaS que tracten dades." },
  { id: 6, code: "06", short: "Dispositius", title: "Dispositius", em: "Dispositius", lede: "Inventari de maquinari que emmagatzema o processa dades personals." },
  { id: 7, code: "07", short: "Web i Cookies", title: "Web i cookies", em: "cookies", lede: "Llocs web i les seves cookies. Pas opcional si no teniu web." },
  { id: 8, code: "08", short: "Videovigilància", title: "Videovigilància", em: "Videovigilància", lede: "Equips, configuració i protocols de gravació." },
  { id: 9, code: "09", short: "Seguretat", title: "Esquema de xarxa i seguretat", em: "seguretat", lede: "Infraestructura i mesures de seguretat actuals." },
  { id: 10, code: "10", short: "Resum", title: "Resum i enviament", em: "enviament", lede: "Revisió de totes les dades abans d'enviar a Madeinhuman." },
];

Object.assign(window, {
  PROVINCIES, Q_BLOCS, CAT_BASIQUES, CAT_SENSIBLES, CAT_PROFESSIONALS, CAT_ECONOMIQUES,
  SERVEIS_HABITUALS, TIPUS_CONTRACTE, TIPUS_DISPOSITIU, SO_LIST, TIPUS_COOKIE,
  TIPUS_EQUIP_VIDEO, DEPARTAMENTS, SEC_CATEGORIES, SEC_TOTAL, STEPS,
});
