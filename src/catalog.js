// Pick-list content. Every bullet carries BOTH languages so a Spanish intake can produce an English resume
// (and the reverse) without machine translation. Bullets are stored in a profile by id, never by text.

/** @typedef {{ id: string, en: string, es: string }} Text */

export const TRADES = [
  { id: 'electrical', en: 'Electrical', es: 'Electricidad' },
  { id: 'wind', en: 'Wind turbine technician', es: 'Técnico de turbinas eólicas' },
  { id: 'warehouse', en: 'Warehouse / forklift', es: 'Almacén / montacargas' },
  { id: 'construction', en: 'Construction / general labor', es: 'Construcción / mano de obra general' },
  { id: 'hvac', en: 'HVAC', es: 'Climatización (HVAC)' },
  { id: 'plumbing', en: 'Plumbing', es: 'Plomería' },
  { id: 'welding', en: 'Welding / fabrication', es: 'Soldadura / fabricación' },
  { id: 'manufacturing', en: 'Manufacturing / production', es: 'Manufactura / producción' },
  { id: 'driving', en: 'CDL driving / delivery', es: 'Conducción CDL / reparto' },
]

/** Duty bullets per trade, written the way postings phrase them (keywords agencies scan for). */
export const BULLETS = {
  electrical: [
    { id: 'el-troubleshoot', en: 'Troubleshot and repaired electrical circuits, motors and controls using multimeters and schematics', es: 'Diagnostiqué y reparé circuitos eléctricos, motores y controles con multímetro y diagramas' },
    { id: 'el-install', en: 'Installed conduit, wiring, panels and devices to NEC code', es: 'Instalé tubería conduit, cableado, tableros y dispositivos según el código NEC' },
    { id: 'el-loto', en: 'Followed lockout/tagout (LOTO) and NFPA 70E safety procedures', es: 'Seguí los procedimientos de bloqueo y etiquetado (LOTO) y de seguridad NFPA 70E' },
    { id: 'el-plc', en: 'Assisted with PLC and motor-control troubleshooting on production equipment', es: 'Apoyé en el diagnóstico de PLC y control de motores en equipo de producción' },
    { id: 'el-blueprints', en: 'Read blueprints and wiring diagrams to plan and complete jobs', es: 'Interpreté planos y diagramas eléctricos para planear y terminar trabajos' },
  ],
  wind: [
    { id: 'wd-maint', en: 'Performed scheduled maintenance and inspections on wind turbines', es: 'Realicé mantenimiento programado e inspecciones de turbinas eólicas' },
    { id: 'wd-climb', en: 'Climbed towers and worked at height using fall-protection and rescue equipment', es: 'Subí torres y trabajé en altura con equipo de protección contra caídas y rescate' },
    { id: 'wd-troubleshoot', en: 'Troubleshot electrical, hydraulic and mechanical faults in nacelle and tower systems', es: 'Diagnostiqué fallas eléctricas, hidráulicas y mecánicas en la góndola y la torre' },
    { id: 'wd-torque', en: 'Completed torque and tensioning of bolted connections to specification', es: 'Realicé apriete y tensado de conexiones atornilladas según especificación' },
    { id: 'wd-reports', en: 'Documented work orders and reported findings to site leads', es: 'Documenté órdenes de trabajo y reporté hallazgos a los líderes del sitio' },
  ],
  warehouse: [
    { id: 'wh-forklift', en: 'Operated forklift, reach truck and pallet jack safely', es: 'Operé montacargas, reach truck y patín hidráulico de forma segura' },
    { id: 'wh-pick', en: 'Picked, packed and shipped orders accurately to meet daily targets', es: 'Surtí, empaqué y envié pedidos con precisión para cumplir metas diarias' },
    { id: 'wh-receive', en: 'Received, checked and put away inbound freight', es: 'Recibí, revisé y acomodé mercancía entrante' },
    { id: 'wh-rf', en: 'Used RF scanners and warehouse management systems', es: 'Usé escáneres RF y sistemas de administración de almacén' },
    { id: 'wh-inventory', en: 'Performed cycle counts and kept work areas clean and safe', es: 'Hice conteos cíclicos y mantuve las áreas de trabajo limpias y seguras' },
  ],
  construction: [
    { id: 'cn-site', en: 'Prepared job sites, loaded and unloaded materials, and cleaned up', es: 'Preparé obras, cargué y descargué materiales y limpié el área' },
    { id: 'cn-tools', en: 'Operated hand and power tools safely', es: 'Usé herramientas manuales y eléctricas de forma segura' },
    { id: 'cn-assist', en: 'Assisted skilled trades with framing, concrete and finish work', es: 'Apoyé a oficiales en estructura, concreto y acabados' },
    { id: 'cn-safety', en: 'Followed OSHA safety rules and wore required PPE', es: 'Seguí las normas de seguridad de OSHA y usé el EPP requerido' },
  ],
  hvac: [
    { id: 'hv-service', en: 'Serviced and repaired heating and cooling systems', es: 'Di servicio y reparé sistemas de calefacción y aire acondicionado' },
    { id: 'hv-install', en: 'Installed ductwork, thermostats and split systems', es: 'Instalé ductos, termostatos y sistemas minisplit' },
    { id: 'hv-refrig', en: 'Handled refrigerant following EPA 608 requirements', es: 'Manejé refrigerante siguiendo los requisitos de EPA 608' },
    { id: 'hv-pm', en: 'Performed preventive maintenance and replaced filters, belts and motors', es: 'Hice mantenimiento preventivo y cambié filtros, bandas y motores' },
  ],
  plumbing: [
    { id: 'pl-install', en: 'Installed and repaired water, drain and gas piping', es: 'Instalé y reparé tubería de agua, drenaje y gas' },
    { id: 'pl-fixtures', en: 'Set fixtures, water heaters and valves', es: 'Instalé muebles de baño, calentadores de agua y válvulas' },
    { id: 'pl-leaks', en: 'Located and fixed leaks and clogs', es: 'Localicé y reparé fugas y tapones' },
    { id: 'pl-code', en: 'Worked to local plumbing code', es: 'Trabajé según el código de plomería local' },
  ],
  welding: [
    { id: 'wl-processes', en: 'Welded with MIG, TIG and stick processes', es: 'Soldé con procesos MIG, TIG y electrodo revestido' },
    { id: 'wl-blueprints', en: 'Read blueprints and weld symbols to fabricate parts', es: 'Interpreté planos y símbolos de soldadura para fabricar piezas' },
    { id: 'wl-cut', en: 'Cut, fit and ground steel using torch and plasma', es: 'Corté, ajusté y esmerilé acero con soplete y plasma' },
    { id: 'wl-inspect', en: 'Inspected welds for quality and corrected defects', es: 'Inspeccioné soldaduras y corregí defectos' },
  ],
  manufacturing: [
    { id: 'mf-machine', en: 'Operated production machines and kept them running', es: 'Operé máquinas de producción y las mantuve funcionando' },
    { id: 'mf-quality', en: 'Checked parts against quality specifications', es: 'Revisé piezas según las especificaciones de calidad' },
    { id: 'mf-line', en: 'Worked on assembly lines to meet production rates', es: 'Trabajé en líneas de ensamble cumpliendo metas de producción' },
    { id: 'mf-5s', en: 'Followed safety, 5S and lockout procedures', es: 'Seguí procedimientos de seguridad, 5S y bloqueo de energía' },
  ],
  driving: [
    { id: 'dr-routes', en: 'Drove assigned routes safely and on time', es: 'Manejé rutas asignadas de forma segura y puntual' },
    { id: 'dr-inspect', en: 'Completed pre-trip and post-trip vehicle inspections', es: 'Realicé inspecciones del vehículo antes y después del viaje' },
    { id: 'dr-loads', en: 'Loaded, secured and delivered freight', es: 'Cargué, aseguré y entregué mercancía' },
    { id: 'dr-logs', en: 'Kept accurate logs and delivery paperwork', es: 'Llevé bitácoras y documentos de entrega con precisión' },
  ],
}

/** General bullets offered whatever the trade. */
export const GENERAL_BULLETS = [
  { id: 'gn-reliable', en: 'Reliable attendance; showed up on time for every shift', es: 'Asistencia confiable; llegué puntual a cada turno' },
  { id: 'gn-team', en: 'Worked well with crews and supervisors', es: 'Trabajé bien con cuadrillas y supervisores' },
  { id: 'gn-safety', en: 'Kept a safe work record', es: 'Mantuve un historial de trabajo seguro' },
  { id: 'gn-train', en: 'Trained new workers on procedures', es: 'Capacité a trabajadores nuevos en los procedimientos' },
]

/** Certifications and licenses agencies look for first. `expires: true` = the card normally carries an expiry date. */
export const CERTS = [
  { id: 'osha10', en: 'OSHA 10', es: 'OSHA 10', expires: false },
  { id: 'osha30', en: 'OSHA 30', es: 'OSHA 30', expires: false },
  { id: 'twic', en: 'TWIC card', es: 'Tarjeta TWIC', expires: true },
  { id: 'cdl-a', en: 'CDL Class A', es: 'Licencia CDL clase A', expires: true },
  { id: 'cdl-b', en: 'CDL Class B', es: 'Licencia CDL clase B', expires: true },
  { id: 'forklift', en: 'Forklift operator certification', es: 'Certificación de operador de montacargas', expires: true },
  { id: 'firstaid', en: 'First Aid / CPR', es: 'Primeros auxilios / RCP', expires: true },
  { id: 'journeyman', en: 'Journeyman electrician license', es: 'Licencia de electricista oficial (journeyman)', expires: true },
  { id: 'master', en: 'Master electrician license', es: 'Licencia de electricista maestro', expires: true },
  { id: 'nfpa70e', en: 'NFPA 70E electrical safety', es: 'Seguridad eléctrica NFPA 70E', expires: true },
  { id: 'gwo-bst', en: 'GWO Basic Safety Training', es: 'Capacitación básica de seguridad GWO', expires: true },
  { id: 'mewp', en: 'Aerial lift (MEWP) operator', es: 'Operador de plataforma elevadora (MEWP)', expires: true },
  { id: 'epa608', en: 'EPA 608 certification', es: 'Certificación EPA 608', expires: false },
  { id: 'aws', en: 'AWS welding certification', es: 'Certificación de soldadura AWS', expires: true },
]

const ALL_BULLETS = [...Object.values(BULLETS).flat(), ...GENERAL_BULLETS]
export const bulletById = id => ALL_BULLETS.find(b => b.id === id)
export const certById = id => CERTS.find(c => c.id === id)
export const tradeById = id => TRADES.find(t => t.id === id)
export const allBulletIds = () => ALL_BULLETS.map(b => b.id)
/** Bullets to offer for a job, given the worker's trades: trade bullets first, then the general ones. */
export const bulletsForTrades = tradeIds => [...tradeIds.flatMap(t => BULLETS[t] ?? []), ...GENERAL_BULLETS]
