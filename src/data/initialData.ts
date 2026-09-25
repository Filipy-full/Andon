import { Zone, Machine, Alert, AlertType } from '@/types';

export const INITIAL_ZONES: Zone[] = [
  { id: 'z1', tenant_id: 'demo', name: 'Línea Ensamblaje 01', description: 'Puestos 1 al 10', created_at: new Date().toISOString() },
  { id: 'z2', tenant_id: 'demo', name: 'Control de Calidad', description: 'Revisión final', created_at: new Date().toISOString() },
  { id: 'z3', tenant_id: 'demo', name: 'Sección Tornos CNC', description: 'Piezas cilíndricas', created_at: new Date().toISOString() },
  { id: 'z4', tenant_id: 'demo', name: 'Sección Fresadoras', description: 'Bloques de motor', created_at: new Date().toISOString() },
];

export const INITIAL_MACHINES: Machine[] = [
  { id: 'm1', tenant_id: 'demo', zone_id: 'z1', name: 'Puesto Montaje A1', type: 'Manual', qr_code: 'QA-001', created_at: new Date().toISOString() },
  { id: 'm2', tenant_id: 'demo', zone_id: 'z1', name: 'Puesto Montaje A2', type: 'Manual', qr_code: 'QA-002', created_at: new Date().toISOString() },
  { id: 'm3', tenant_id: 'demo', zone_id: 'z2', name: 'Mesa de Calidad',   type: 'Inspección', qr_code: 'QC-001', created_at: new Date().toISOString() },
  { id: 'm4', tenant_id: 'demo', zone_id: 'z3', name: 'Torno CNC Mazak 1', type: 'CNC', qr_code: 'M-101', created_at: new Date().toISOString() },
  { id: 'm5', tenant_id: 'demo', zone_id: 'z4', name: 'Fresa Haas VF2',    type: 'CNC', qr_code: 'M-201', created_at: new Date().toISOString() },
];

export const ALERT_TYPES: AlertType[] = [
  { id: 't1', label: 'Falta de Material',      icon: 'package-x',      color: '#3b82f6', severity: 'normal' },
  { id: 't2', label: 'Fallo de Máquina',       icon: 'settings',       color: '#ef4444', severity: 'critical' },
  { id: 't3', label: 'Defecto de Calidad',     icon: 'shield-alert',   color: '#f59e0b', severity: 'warning' },
  { id: 't4', label: 'Atasco / Obstrucción',   icon: 'ban',            color: '#ef4444', severity: 'critical' },
  { id: 't5', label: 'Herramienta Desgastada', icon: 'wrench',         color: '#f97316', severity: 'warning' },
  { id: 't6', label: 'Riesgo de Seguridad',    icon: 'alert-triangle', color: '#dc2626', severity: 'critical' },
];

export const INITIAL_ALERTS: Alert[] = [];
