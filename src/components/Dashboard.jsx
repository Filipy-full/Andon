import React, { useState, useEffect, useRef } from 'react';
import { useApp } from '../context/AppContext';
import { supabase } from '../supabaseClient';
import { TIPOS_ALERTA } from '../data/initialData';
import { ShieldAlert, Rocket, CheckCircle, Search, AlignLeft, AlertCircle, Play, Check } from 'lucide-react';
import { IconResolver } from './IconResolver';

function timeAgo(iso) {
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1)  return '0m';
  if (m < 60) return `${m}m`;
  return `${Math.floor(m / 60)}h ${m % 60}m`;
}

function calculateMTTR(alertas) {
  const resueltas = alertas.filter(a => a.estado === 'Resuelto' && a.created_at && a.resolved_at);
  if (resueltas.length === 0) return '—';
  
  const totalMs = resueltas.reduce((acc, a) => {
    return acc + (new Date(a.resolved_at).getTime() - new Date(a.created_at).getTime());
  }, 0);
  
  const avgMs = totalMs / resueltas.length;
  const m = Math.floor(avgMs / 60000);
  return `${m}m`;
}

function AlertCard({ alerta, onStatus }) {
  const { state } = useApp();
  const maquina = state.maquinas.find(m => m.id === alerta.maquina_id);
  const zona    = state.zonas.find(z => z.id === alerta.zona_id);
  const galpon  = state.galpones.find(g => g.id === alerta.galpon_id);
  const tipo    = TIPOS_ALERTA.find(t => t.id === alerta.tipo_alerta) || { label: alerta.tipo_alerta, icon: 'zap', color: '#64748b' };

  const isPending   = alerta.estado === 'Pendiente';
  const isEnCamino  = alerta.estado === 'En camino';
  const isResuelto  = alerta.estado === 'Resuelto';

  const [expanded, setExpanded] = useState(false);

  return (
    <div className={`alert-card animate-slide-up ${isPending ? 'urgent' : ''}`} style={{ opacity: isResuelto ? 0.6 : 1, borderColor: isPending ? tipo.color : 'var(--border-subtle)' }}>
      <div
        className="alert-accent-bar"
        style={{ background: isPending ? tipo.color : isEnCamino ? 'var(--accent-blue)' : 'var(--accent-emerald)' }}
      />

      <div className="alert-body">
        {/* Top row */}
        <div className="flex items-center justify-between">
          <span className={`chip ${isPending ? 'chip-pending' : isEnCamino ? 'chip-camino' : 'chip-resuelto'}`}>
            {isPending && <AlertCircle size={12} />}
            {isEnCamino && <Play size={12} />}
            {isResuelto && <Check size={12} />}
            {alerta.estado}
          </span>
          <span className="text-xs mono text-muted">T+{timeAgo(alerta.created_at)}</span>
        </div>

        {/* Galpón badge */}
        {galpon && (
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: '0.75rem', fontWeight: 600, color: galpon.color, marginTop: 4 }}>
            <span style={{ width: 6, height: 6, borderRadius: '1px', background: galpon.color }} />
            {galpon.nombre.split('—')[0].trim()}
          </span>
        )}

        {/* Zone & Machine */}
        <div>
          <div style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-main)', lineHeight: 1.2 }}>
            {zona?.nombre || '—'}
          </div>
          <div className="text-sm text-muted mt-1 flex items-center gap-2">
            {maquina?.nombre || alerta.maquina_id}
            <span className="mono" style={{ background: 'var(--bg-base)', padding: '2px 6px', border: '1px solid var(--border-subtle)', borderRadius: 4, fontSize: '0.7rem' }}>
              {maquina?.qr_code}
            </span>
          </div>
        </div>

        {/* Alert type */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: tipo.color, fontWeight: 600, fontSize: '0.95rem' }}>
          <IconResolver name={tipo.icon} size={18} />
          <span>{tipo.label}</span>
        </div>

        {/* Text Description */}
        {alerta.descripcion && (
          <div style={{ background: 'var(--bg-base)', padding: '10px 12px', borderRadius: 4, fontSize: '0.85rem', color: 'var(--text-main)', display: 'flex', gap: 8, border: '1px solid var(--border-subtle)' }}>
            <AlignLeft size={14} style={{ color: 'var(--text-faint)', marginTop: 2, flexShrink: 0 }} />
            <span style={{ lineHeight: 1.4, opacity: 0.9 }}>{alerta.descripcion}</span>
          </div>
        )}

        {/* Photo thumbnail */}
        {alerta.foto_base64 && (
          <>
            <div
              onClick={() => setExpanded(true)}
              style={{
                width: '100%', height: 100, borderRadius: 4, overflow: 'hidden',
                cursor: 'pointer', border: '1px solid var(--border-strong)',
                background: `url(${alerta.foto_base64}) center/cover no-repeat`,
                position: 'relative',
              }}
            >
              <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: 0, transition: '0.2s' }}
                onMouseEnter={e => e.currentTarget.style.opacity = 1}
                onMouseLeave={e => e.currentTarget.style.opacity = 0}>
                <span style={{ fontSize: '0.72rem', fontWeight: 600, background: 'rgba(0,0,0,0.8)', border: '1px solid var(--border-strong)', color: '#fff', padding: '6px 12px', borderRadius: 4 }}>INSPECCIONAR IMAGEN</span>
              </div>
            </div>
            {expanded && (
              <div className="modal-overlay" onClick={() => setExpanded(false)}>
                <div style={{ maxWidth: 800, width: '100%', border: '1px solid var(--border-strong)', background: '#000', padding: 4 }} onClick={e => e.stopPropagation()}>
                  <img src={alerta.foto_base64} alt="Evidencia" style={{ width: '100%', maxHeight: '85vh', objectFit: 'contain' }} />
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Action footer */}
      <div className="alert-footer">
        {isPending && (
          <button className="btn btn-primary w-full" style={{ padding: '10px' }} onClick={() => onStatus(alerta.id, 'En camino')}>
            <Rocket size={16} /> ASIGNAR A RECURSO
          </button>
        )}
        {isEnCamino && (
          <button className="btn btn-success w-full" style={{ padding: '10px' }} onClick={() => onStatus(alerta.id, 'Resuelto')}>
            <CheckCircle size={16} /> MARCAR COMO RESUELTO
          </button>
        )}
        {isResuelto && (
          <div className="text-center text-xs text-muted" style={{ padding: '4px 0', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Incidencia Cerrada</div>
        )}
      </div>
    </div>
  );
}

export function Dashboard() {
  const { state, dispatch } = useApp();
  const [galponFilter, setGalponFilter] = useState('all');
  const [estadoFilter, setEstadoFilter] = useState('all');

  const prevAlertsCount = useRef(0);
  
  const filtered = state.alertas.filter(a => {
    if (galponFilter !== 'all' && a.galpon_id !== galponFilter) return false;
    if (estadoFilter !== 'all' && a.estado !== estadoFilter) return false;
    return true;
  });

  const currentPendingCount = filtered.filter(a => a.estado === 'Pendiente').length;

  useEffect(() => {
    if (currentPendingCount > prevAlertsCount.current) {
      if (typeof navigator !== 'undefined' && navigator.vibrate) {
         navigator.vibrate([200, 100, 200]);
      }
    }
    prevAlertsCount.current = currentPendingCount;
  }, [currentPendingCount]);

  const handleStatus = async (id, estado) => {
    dispatch({ type: 'UPDATE_ALERTA_STATUS', id, estado });
    try {
      await supabase.from('alertas').update({ estado }).eq('id', id);
    } catch { /* local only */ }
  };

  const pendingCount   = state.alertas.filter(a => a.estado === 'Pendiente').length;
  const caminoCount    = state.alertas.filter(a => a.estado === 'En camino').length;
  const mttrValue      = calculateMTTR(state.alertas);
  const resueltaHoy    = state.alertas.filter(a => {
    if (a.estado !== 'Resuelto') return false;
    const d = new Date(a.created_at);
    const now = new Date();
    return d.getDate() === now.getDate() && d.getMonth() === now.getMonth();
  }).length;

  return (
    <div className="flex flex-col" style={{ minHeight: '100vh' }}>
      <div className="page-header">
        <div className="flex items-center justify-between" style={{ paddingBottom: 20 }}>
          <div>
            <h1 style={{ fontSize: '1.4rem', fontWeight: 700, letterSpacing: '-0.02em', color: 'var(--text-main)' }}>
              Centro de Mando <span style={{ color: 'var(--text-faint)' }}>/ Logística</span>
            </h1>
          </div>
          <div className="flex items-center gap-2">
            <span className="mono" style={{ fontSize: '0.8rem', color: 'var(--text-muted)', background: 'var(--bg-base)', padding: '6px 12px', borderRadius: 4, border: '1px solid var(--border-subtle)' }}>
              SYSTEM CLOCK: {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </span>
          </div>
        </div>

        {/* Filters */}
        <div className="flex items-center gap-4" style={{ paddingBottom: 16, flexWrap: 'wrap' }}>
          <div style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-faint)', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'flex', alignItems: 'center', gap: 6 }}>
            <Search size={14} /> Filtro de Planta:
          </div>
          <div className="tab-bar">
            <button className={`tab-btn ${galponFilter === 'all' ? 'active' : ''}`} onClick={() => setGalponFilter('all')}>
              Vista Global
            </button>
            {state.galpones.map(g => (
              <button
                key={g.id}
                className={`tab-btn ${galponFilter === g.id ? 'active' : ''}`}
                onClick={() => setGalponFilter(g.id)}
                style={galponFilter === g.id ? { color: g.color } : {}}
              >
                <span style={{ width: 6, height: 6, borderRadius: '1px', background: g.color, display: 'inline-block', marginRight: 6 }} />
                {g.nombre.split('—')[0].trim()}
              </button>
            ))}
          </div>

          <div className="tab-bar" style={{ marginLeft: 'auto' }}>
            {[['all', 'Todos'], ['Pendiente', 'Pendiente'], ['En camino', 'En progreso'], ['Resuelto', 'Resuelto']].map(([v, l]) => (
              <button key={v} className={`tab-btn ${estadoFilter === v ? 'active' : ''}`} onClick={() => setEstadoFilter(v)}>{l}</button>
            ))}
          </div>
        </div>
      </div>

      <div className="page-content">
        {/* KPIs Industriales */}
        <div className="kpi-grid">
          {[
            { label: 'Eventos Pendientes', value: pendingCount, color: 'var(--accent-red)',     sub: 'Atención requerida', border: 'var(--accent-red)' },
            { label: 'Recursos Desplegados',value: caminoCount,  color: 'var(--accent-blue)',    sub: 'En tránsito', border: 'var(--accent-blue)' },
            { label: 'Incidentes Resueltos',value: resueltaHoy,  color: 'var(--text-main)', sub: 'Turno actual', border: 'var(--text-muted)' },
            { label: 'MTTR Global',        value: mttrValue,    color: 'var(--accent-emerald)', sub: 'Mean Time to Repair', border: 'var(--accent-emerald)' },
          ].map(({ label, value, color, sub, border }) => (
            <div key={label} className="kpi-card" style={{ '--kpi-color': border }}>
              <div className="kpi-value" style={{ color }}>{value}</div>
              <div className="kpi-label">{label}</div>
              <div style={{ fontSize: '0.7rem', color: 'var(--text-faint)', textTransform: 'uppercase' }}>{sub}</div>
            </div>
          ))}
        </div>

        {/* Alerts grid */}
        {filtered.length === 0 ? (
          <div className="empty-state">
            <ShieldAlert size={48} style={{ color: 'var(--text-faint)', opacity: 0.5 }} />
            <h3 style={{ fontWeight: 600, color: 'var(--text-muted)' }}>SISTEMA NOMINAL</h3>
            <p style={{ fontSize: '0.85rem' }}>No se detectan anomalías operativas en la selección actual.</p>
          </div>
        ) : (
          <div className="alerts-grid">
            {filtered.map(a => (
              <AlertCard key={a.id} alerta={a} onStatus={handleStatus} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
