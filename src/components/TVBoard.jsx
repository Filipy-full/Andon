import React, { useState, useEffect, useRef } from 'react';
import { useApp } from '../context/AppContext';
import { TIPOS_ALERTA } from '../data/initialData';
import { Tv, CheckCircle, Zap, AlignLeft } from 'lucide-react';

function useClock() {
  const [time, setTime] = useState(new Date());
  useEffect(() => {
    const id = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(id);
  }, []);
  return time;
}

function timeAgo(iso) {
  const m = Math.floor((Date.now() - new Date(iso).getTime()) / 60000);
  if (m < 1)  return 'ahora';
  if (m < 60) return `${m}min`;
  return `${Math.floor(m / 60)}h${m % 60}min`;
}

export function TVBoard() {
  const { state } = useApp();
  const now = useClock();
  const [galponFilter, setGalponFilter] = useState('all');

  // Track pending alerts to trigger notifications only for this screen's galpón
  const prevAlertsCount = useRef(0);

  const activeAlerts = state.alertas.filter(a => {
    if (a.estado === 'Resuelto') return false;
    if (galponFilter !== 'all' && a.galpon_id !== galponFilter) return false;
    return true;
  });

  const currentPendingCount = activeAlerts.filter(a => a.estado === 'Pendiente').length;

  useEffect(() => {
    if (currentPendingCount > prevAlertsCount.current) {
      if (typeof navigator !== 'undefined' && navigator.vibrate) {
         navigator.vibrate([300, 150, 300, 150, 300]); // Vibración más fuerte en TV
      }
    }
    prevAlertsCount.current = currentPendingCount;
  }, [currentPendingCount]);

  const caminoCount    = activeAlerts.filter(a => a.estado === 'En camino').length;
  const selectedGalpon = state.galpones.find(g => g.id === galponFilter);

  return (
    <div className="tv-board" style={{ fontFamily: "'Outfit', sans-serif" }}>

      {/* ── Header bar ──────────────────────────────────────────────── */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20, flexWrap: 'wrap', gap: 12 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ width: 44, height: 44, background: 'linear-gradient(135deg, #06b6d4, #3b82f6)', borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 0 20px rgba(6,182,212,0.4)' }}>
            <Zap size={24} color="#000" strokeWidth={3} />
          </div>
          <div>
            <div style={{ fontSize: '1.2rem', fontWeight: 900, color: '#f1f5f9', letterSpacing: '-0.02em' }}>
              ANDON <span style={{ color: '#06b6d4' }}>PRO</span>
              {selectedGalpon && <span style={{ color: selectedGalpon.color, marginLeft: 12 }}>— {selectedGalpon.nombre.split('—')[0].trim()}</span>}
            </div>
            <div style={{ fontSize: '0.72rem', color: '#3f3f46', fontWeight: 500 }}>Panel de Control Industrial · Modo TV</div>
          </div>
        </div>

        {/* Galpón selector */}
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', alignItems: 'center' }}>
          <span style={{ fontSize: '0.7rem', color: '#71717a', fontWeight: 700, textTransform: 'uppercase', marginRight: 8 }}>Vincular TV a:</span>
          {[{ id: 'all', nombre: 'Toda la Planta', color: '#71717a' }, ...state.galpones].map(g => (
            <button
              key={g.id}
              onClick={() => setGalponFilter(g.id)}
              style={{
                padding: '6px 14px', borderRadius: 8, border: `1px solid ${galponFilter === g.id ? g.color : 'rgba(255,255,255,0.08)'}`,
                background: galponFilter === g.id ? `${g.color}20` : 'rgba(255,255,255,0.03)',
                color: galponFilter === g.id ? (g.id === 'all' ? '#f1f5f9' : g.color) : '#71717a',
                fontWeight: 700, fontSize: '0.78rem', cursor: 'pointer', fontFamily: 'inherit',
                transition: 'all 0.15s'
              }}
            >
              {g.nombre.includes('—') ? g.nombre.split('—')[0].trim() : g.nombre}
            </button>
          ))}
        </div>

        {/* Clock */}
        <div style={{ textAlign: 'right' }}>
          <div style={{ fontSize: '2.4rem', fontWeight: 900, color: '#f1f5f9', fontFamily: 'JetBrains Mono, monospace', lineHeight: 1 }}>
            {now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
          </div>
          <div style={{ fontSize: '0.65rem', color: '#3f3f46', marginTop: 2 }}>{now.toLocaleDateString([], { weekday: 'long', day: '2-digit', month: 'long' })}</div>
        </div>
      </div>

      {/* ── KPI Stripe ────────────────────────────────────────────── */}
      <div style={{ display: 'flex', gap: 12, marginBottom: 20 }}>
        {[
          { label: 'PENDIENTES', value: currentPendingCount, color: '#ef4444', bg: 'rgba(239,68,68,0.08)', border: 'rgba(239,68,68,0.2)' },
          { label: 'EN CAMINO',  value: caminoCount,  color: '#60a5fa', bg: 'rgba(59,130,246,0.08)', border: 'rgba(59,130,246,0.2)' },
          { label: 'ALERTAS ACTIVAS', value: activeAlerts.length, color: '#f1f5f9', bg: 'rgba(255,255,255,0.03)', border: 'rgba(255,255,255,0.06)' },
        ].map(({ label, value, color, bg, border }) => (
          <div key={label} style={{ flex: 1, background: bg, border: `1px solid ${border}`, borderRadius: 12, padding: '14px 20px', textAlign: 'center' }}>
            <div style={{ fontSize: '2rem', fontWeight: 900, color, fontFamily: 'monospace', lineHeight: 1 }}>{value}</div>
            <div style={{ fontSize: '0.65rem', fontWeight: 700, color: '#52525b', marginTop: 4, letterSpacing: '0.08em' }}>{label}</div>
          </div>
        ))}
      </div>

      {/* ── Alerts Grid ───────────────────────────────────────────── */}
      {activeAlerts.length === 0 ? (
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 16 }}>
          <div style={{ width: 100, height: 100, borderRadius: '50%', background: 'rgba(16,185,129,0.08)', border: '1px solid rgba(16,185,129,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <CheckCircle size={52} color="#34d399" />
          </div>
          <h2 style={{ fontSize: '2rem', fontWeight: 900, color: '#34d399' }}>ZONA OPERATIVA</h2>
          <p style={{ color: '#52525b', fontSize: '1rem' }}>No hay incidencias activas para {selectedGalpon ? selectedGalpon.nombre.split('—')[0].trim() : 'la planta'}.</p>
        </div>
      ) : (
        <div className="tv-grid">
          {activeAlerts.map(alerta => {
            const galpon  = state.galpones.find(g => g.id === alerta.galpon_id);
            const zona    = state.zonas.find(z => z.id === alerta.zona_id);
            const maquina = state.maquinas.find(m => m.id === alerta.maquina_id);
            const tipo    = TIPOS_ALERTA.find(t => t.id === alerta.tipo_alerta) || { label: alerta.tipo_alerta, emoji: '⚡', color: '#64748b' };
            const isPending  = alerta.estado === 'Pendiente';

            return (
              <div
                key={alerta.id}
                className="tv-card"
                style={{
                  borderColor:     isPending ? `${tipo.color}44` : 'rgba(59,130,246,0.3)',
                  background:      isPending ? `${tipo.color}08` : 'rgba(59,130,246,0.06)',
                  boxShadow:       isPending ? `0 0 40px ${tipo.color}18` : '0 0 30px rgba(59,130,246,0.1)',
                  position:        'relative',
                  overflow:        'hidden',
                }}
              >
                {/* Left accent */}
                <div style={{ position: 'absolute', top: 0, left: 0, width: 5, height: '100%', background: isPending ? tipo.color : '#3b82f6', borderRadius: '3px 0 0 3px' }} className={isPending ? 'blink-bar' : ''} />

                <div style={{ paddingLeft: 8 }}>
                  {/* Top: status + time */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                    <span style={{ fontSize: '0.8rem', fontWeight: 800, padding: '4px 12px', borderRadius: 100, background: isPending ? 'rgba(239,68,68,0.12)' : 'rgba(59,130,246,0.12)', color: isPending ? '#f87171' : '#60a5fa', border: `1px solid ${isPending ? 'rgba(239,68,68,0.25)' : 'rgba(59,130,246,0.25)'}` }}>
                      {isPending ? '🔴 PENDIENTE' : '🔵 EN CAMINO'}
                    </span>
                    <span style={{ fontFamily: 'monospace', fontSize: '1.1rem', color: '#52525b', fontWeight: 700 }}>{timeAgo(alerta.created_at)}</span>
                  </div>

                  {/* Galpón */}
                  {galpon && (
                    <div style={{ fontSize: '0.75rem', fontWeight: 700, color: galpon.color, marginBottom: 6, display: 'flex', alignItems: 'center', gap: 6 }}>
                      <span style={{ width: 8, height: 8, borderRadius: '50%', background: galpon.color, display: 'inline-block' }} />
                      {galpon.nombre}
                    </div>
                  )}

                  {/* Zone */}
                  <div style={{ fontSize: '1.6rem', fontWeight: 900, color: '#f1f5f9', lineHeight: 1.1, marginBottom: 6 }}>
                    {zona?.nombre || '—'}
                  </div>

                  {/* Machine */}
                  <div style={{ fontSize: '1rem', color: '#71717a', marginBottom: 10 }}>
                    {maquina?.nombre} · <span style={{ fontFamily: 'monospace', fontSize: '0.85rem' }}>{maquina?.qr_code}</span>
                  </div>

                  {/* Alert type */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: alerta.descripcion ? 8 : 0 }}>
                    <span style={{ fontSize: '1.8rem' }}>{tipo.emoji}</span>
                    <span style={{ fontSize: '1.1rem', fontWeight: 800, color: tipo.color }}>{tipo.label}</span>
                  </div>

                  {/* Text Description */}
                  {alerta.descripcion && (
                    <div style={{ background: 'rgba(0,0,0,0.3)', padding: '10px 14px', borderRadius: 8, fontSize: '0.9rem', color: '#cbd5e1', display: 'flex', gap: 8, border: '1px solid rgba(255,255,255,0.05)', marginTop: 4 }}>
                      <AlignLeft size={16} style={{ color: '#64748b', marginTop: 2, flexShrink: 0 }} />
                      <span style={{ lineHeight: 1.4 }}>{alerta.descripcion}</span>
                    </div>
                  )}

                  {/* Photo */}
                  {alerta.foto_base64 && (
                    <div style={{ marginTop: 12, borderRadius: 10, overflow: 'hidden', height: 100 }}>
                      <img src={alerta.foto_base64} alt="Evidencia" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
