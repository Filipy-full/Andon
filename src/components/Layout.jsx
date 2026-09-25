import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { LayoutDashboard, Settings, Tv, Smartphone, Zap, ExternalLink } from 'lucide-react';
import { useApp } from '../context/AppContext';

export function Layout({ children }) {
  const location = useLocation();
  const { state } = useApp();

  const pendingCount = state.alertas.filter(a => a.estado === 'Pendiente').length;

  const navMain = [
    { path: '/',      icon: LayoutDashboard, label: 'Dashboard',          badge: pendingCount || null },
    { path: '/tv',    icon: Tv,              label: 'TV Andon Board',      external: true },
    { path: '/operario', icon: Smartphone,   label: 'Terminal Operario',   external: true },
  ];

  const navAdmin = [
    { path: '/admin', icon: Settings, label: 'Configuración' },
  ];

  const isActive = (path) => location.pathname === path;

  const galponesConAlerta = [...new Set(
    state.alertas.filter(a => a.estado === 'Pendiente').map(a => a.galpon_id)
  )];

  return (
    <div className="app-shell">
      {/* ── Sidebar ─────────────────────────────────────────────── */}
      <nav className="sidebar">
        <div className="sidebar-logo">
          <div className="logo-icon">
            <Zap size={18} color="#000" strokeWidth={3} />
          </div>
          <div>
            <div style={{ fontSize: '1rem', fontWeight: 900, color: 'var(--text-main)', letterSpacing: '-0.03em' }}>ANDON <span style={{ color: 'var(--accent-cyan)' }}>PRO</span></div>
            <div style={{ fontSize: '0.63rem', color: 'var(--text-faint)', fontWeight: 500 }}>Sistema Industrial v2.0</div>
          </div>
        </div>

        <div className="sidebar-nav">
          <div className="nav-section-label">Aplicación</div>
          {navMain.map(({ path, icon: Icon, label, badge, external }) =>
            external ? (
              <a key={path} href={`#${path}`} target="_blank" rel="noreferrer" className={`nav-link ${isActive(path) ? 'active' : ''}`}>
                <Icon size={16} />
                <span style={{ flex: 1 }}>{label}</span>
                <ExternalLink size={12} style={{ color: 'var(--text-faint)' }} />
              </a>
            ) : (
              <Link key={path} to={path} className={`nav-link ${isActive(path) ? 'active' : ''}`}>
                <Icon size={16} />
                <span style={{ flex: 1 }}>{label}</span>
                {badge && (
                  <span style={{ background: 'var(--accent-red)', color: '#fff', borderRadius: '100px', fontSize: '0.65rem', fontWeight: 800, padding: '2px 7px', lineHeight: 1 }}>
                    {badge}
                  </span>
                )}
              </Link>
            )
          )}

          {/* Galpones con alertas activas */}
          {galponesConAlerta.length > 0 && (
            <>
              <div className="nav-section-label" style={{ marginTop: 12 }}>Activos ahora</div>
              {galponesConAlerta.map(gid => {
                const g = state.galpones.find(x => x.id === gid);
                if (!g) return null;
                const cnt = state.alertas.filter(a => a.galpon_id === gid && a.estado === 'Pendiente').length;
                return (
                  <div key={gid} className="nav-link" style={{ cursor: 'default' }}>
                    <span style={{ width: 8, height: 8, borderRadius: '50%', background: g.color, flexShrink: 0, boxShadow: `0 0 8px ${g.color}88` }} />
                    <span style={{ flex: 1, fontSize: '0.82rem' }}>{g.nombre.split('—')[0].trim()}</span>
                    <span style={{ background: 'rgba(239,68,68,0.15)', color: '#f87171', borderRadius: '100px', fontSize: '0.65rem', fontWeight: 800, padding: '2px 7px' }}>{cnt}</span>
                  </div>
                );
              })}
            </>
          )}

          <div className="nav-section-label" style={{ marginTop: 12 }}>Sistema</div>
          {navAdmin.map(({ path, icon: Icon, label }) => (
            <Link key={path} to={path} className={`nav-link ${isActive(path) ? 'active' : ''}`}>
              <Icon size={16} />
              {label}
            </Link>
          ))}
        </div>

        <div className="sidebar-footer">
          <div style={{ background: 'rgba(255,255,255,0.03)', borderRadius: 10, padding: '10px 12px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
              <span style={{ width: 7, height: 7, borderRadius: '50%', background: 'var(--accent-emerald)', boxShadow: '0 0 8px rgba(16,185,129,0.6)' }} />
              <span style={{ fontSize: '0.78rem', fontWeight: 700 }}>Centro de operaciones</span>
            </div>
            <div style={{ fontSize: '0.67rem', color: 'var(--text-faint)', lineHeight: 1.4 }}>
              {state.galpones.length} plantas · {state.zonas.length} zonas · {state.maquinas.length} activos
            </div>
          </div>
        </div>
      </nav>

      {/* ── Main Content ─────────────────────────────────────────── */}
      <main className="main-shell">
        {children}
      </main>
    </div>
  );
}
