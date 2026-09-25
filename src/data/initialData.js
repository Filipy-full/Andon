export const initialGalpones = [
  { id: 'g1', nombre: 'Nave A — Ensamblaje', color: '#3b82f6', descripcion: 'Línea de ensamblaje principal' },
  { id: 'g2', nombre: 'Nave B — Mecanizado', color: '#06b6d4', descripcion: 'Tornos y fresadoras CNC' },
  { id: 'g3', nombre: 'Nave C — Logística',  color: '#8b5cf6', descripcion: 'Almacén central y expedición' },
  { id: 'g4', nombre: 'Nave D — Pintura',    color: '#10b981', descripcion: 'Cabinas de pintura y secado' }
];

export const initialZonas = [
  { id: 'z1', galpon_id: 'g1', nombre: 'Línea Ensamblaje 01', descripcion: 'Puestos 1 al 10' },
  { id: 'z2', galpon_id: 'g1', nombre: 'Control de Calidad',  descripcion: 'Revisión final' },
  { id: 'z3', galpon_id: 'g2', nombre: 'Sección Tornos CNC',  descripcion: 'Piezas cilíndricas' },
  { id: 'z4', galpon_id: 'g2', nombre: 'Sección Fresadoras',  descripcion: 'Bloques de motor' }
];

export const initialMaquinas = [
  { id: 'm1', galpon_id: 'g1', zona_id: 'z1', nombre: 'Puesto Montaje A1', tipo: 'Manual', qr_code: 'QA-001' },
  { id: 'm2', galpon_id: 'g1', zona_id: 'z1', nombre: 'Puesto Montaje A2', tipo: 'Manual', qr_code: 'QA-002' },
  { id: 'm3', galpon_id: 'g1', zona_id: 'z2', nombre: 'Mesa de Calidad',   tipo: 'Inspección', qr_code: 'QC-001' },
  { id: 'm4', galpon_id: 'g2', zona_id: 'z3', nombre: 'Torno CNC Mazak 1', tipo: 'CNC',    qr_code: 'M-101' },
  { id: 'm5', galpon_id: 'g2', zona_id: 'z4', nombre: 'Fresa Haas VF2',    tipo: 'CNC',    qr_code: 'M-201' }
];

export const TIPOS_ALERTA = [
  { id: 't1', label: 'Falta de Material',        icon: 'package-x',   color: '#3b82f6', severity: 'normal' },
  { id: 't2', label: 'Fallo de Máquina',         icon: 'settings',    color: '#ef4444', severity: 'critical' },
  { id: 't3', label: 'Defecto de Calidad',       icon: 'shield-alert',color: '#f59e0b', severity: 'warning' },
  { id: 't4', label: 'Atasco / Obstrucción',     icon: 'ban',         color: '#ef4444', severity: 'critical' },
  { id: 't5', label: 'Herramienta Desgastada',   icon: 'tool',        color: '#f97316', severity: 'warning' },
  { id: 't6', label: 'Riesgo Seguridad',         icon: 'alert-triangle', color: '#dc2626', severity: 'critical' },
];

export const initialAlerts = [];
