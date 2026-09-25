import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { Plus, Pencil, Trash2, X, Factory, MapPin, Cpu } from 'lucide-react';

// ── Helper to generate a simple QR code string ──────────────────────────
const genQR = () => 'QR-' + Math.random().toString(36).slice(2, 7).toUpperCase();
const genId = () => crypto.randomUUID();

// ── Confirm delete utility ──────────────────────────────────────────────
function useConfirm() {
  return (msg) => window.confirm(msg);
}

// ── Modal wrapper ──────────────────────────────────────────────────────
function Modal({ title, onClose, onSave, saveLabel = 'Guardar', children }) {
  return (
    <div className="modal-overlay animate-fade" onClick={onClose}>
      <div className="modal-box animate-scale" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h3 style={{ fontWeight: 800, fontSize: '1rem' }}>{title}</h3>
          <button className="btn-icon" onClick={onClose}><X size={16} /></button>
        </div>
        <div className="modal-body">{children}</div>
        <div className="modal-footer">
          <button className="btn btn-ghost" onClick={onClose}>Cancelar</button>
          <button className="btn btn-primary" onClick={onSave}>{saveLabel}</button>
        </div>
      </div>
    </div>
  );
}

// ── Section tabs ────────────────────────────────────────────────────────
const TABS = [
  { id: 'galpones', label: 'Galpones',  icon: Factory },
  { id: 'zonas',    label: 'Zonas',     icon: MapPin  },
  { id: 'maquinas', label: 'Máquinas',  icon: Cpu     },
];

export function AdminPanel() {
  const { state, dispatch } = useApp();
  const confirm = useConfirm();
  const [activeTab, setActiveTab] = useState('galpones');

  // ── Galpon modal state ────────────────────────────────────────────
  const [galponModal, setGalponModal]   = useState(false);
  const [editGalpon, setEditGalpon]     = useState(null); // null = new
  const [gForm, setGForm] = useState({ nombre: '', color: '#3b82f6', descripcion: '' });

  const openGalpon = (g = null) => {
    setEditGalpon(g);
    setGForm(g ? { nombre: g.nombre, color: g.color, descripcion: g.descripcion } : { nombre: '', color: '#3b82f6', descripcion: '' });
    setGalponModal(true);
  };

  const saveGalpon = () => {
    if (!gForm.nombre.trim()) return alert('El nombre es obligatorio.');
    if (editGalpon) {
      dispatch({ type: 'UPDATE_GALPON', payload: { ...editGalpon, ...gForm } });
    } else {
      dispatch({ type: 'ADD_GALPON', payload: { id: genId(), ...gForm } });
    }
    setGalponModal(false);
  };

  const deleteGalpon = (g) => {
    if (!confirm(`¿Eliminar "${g.nombre}"?\nSe eliminarán también todas sus zonas y máquinas.`)) return;
    dispatch({ type: 'DELETE_GALPON', id: g.id });
  };

  // ── Zona modal state ──────────────────────────────────────────────
  const [zonaModal, setZonaModal]   = useState(false);
  const [editZona, setEditZona]     = useState(null);
  const [zForm, setZForm] = useState({ galpon_id: '', nombre: '', descripcion: '' });

  const openZona = (z = null) => {
    setEditZona(z);
    setZForm(z ? { galpon_id: z.galpon_id, nombre: z.nombre, descripcion: z.descripcion } : { galpon_id: state.galpones[0]?.id || '', nombre: '', descripcion: '' });
    setZonaModal(true);
  };

  const saveZona = () => {
    if (!zForm.galpon_id || !zForm.nombre.trim()) return alert('Galpón y nombre son obligatorios.');
    if (editZona) {
      dispatch({ type: 'UPDATE_ZONA', payload: { ...editZona, ...zForm } });
    } else {
      dispatch({ type: 'ADD_ZONA', payload: { id: genId(), ...zForm } });
    }
    setZonaModal(false);
  };

  const deleteZona = (z) => {
    if (!confirm(`¿Eliminar zona "${z.nombre}"?\nSe eliminarán también sus máquinas.`)) return;
    dispatch({ type: 'DELETE_ZONA', id: z.id });
  };

  // ── Maquina modal state ───────────────────────────────────────────
  const [maqModal, setMaqModal]     = useState(false);
  const [editMaq, setEditMaq]       = useState(null);
  const [mForm, setMForm] = useState({ galpon_id: '', zona_id: '', nombre: '', tipo: '', qr_code: '' });

  const openMaquina = (m = null) => {
    setEditMaq(m);
    setMForm(m
      ? { galpon_id: m.galpon_id, zona_id: m.zona_id, nombre: m.nombre, tipo: m.tipo, qr_code: m.qr_code }
      : { galpon_id: state.galpones[0]?.id || '', zona_id: '', nombre: '', tipo: '', qr_code: genQR() }
    );
    setMaqModal(true);
  };

  const saveMaquina = () => {
    if (!mForm.zona_id || !mForm.nombre.trim()) return alert('Zona y nombre son obligatorios.');
    const qr = mForm.qr_code || genQR();
    if (editMaq) {
      dispatch({ type: 'UPDATE_MAQUINA', payload: { ...editMaq, ...mForm, qr_code: qr } });
    } else {
      dispatch({ type: 'ADD_MAQUINA', payload: { id: genId(), ...mForm, qr_code: qr } });
    }
    setMaqModal(false);
  };

  const deleteMaquina = (m) => {
    if (!confirm(`¿Eliminar "${m.nombre}"?`)) return;
    dispatch({ type: 'DELETE_MAQUINA', id: m.id });
  };

  // ── Derived filtered zonas for maquina form ───────────────────────
  const zonasDeMaq = state.zonas.filter(z => z.galpon_id === mForm.galpon_id);

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      {/* Page Header */}
      <div className="page-header">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingBottom: 16 }}>
          <div>
            <h1 style={{ fontSize: '1.4rem', fontWeight: 900, letterSpacing: '-0.03em' }}>Configuración</h1>
            <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginTop: 2 }}>Gestiona galpones, zonas y máquinas de tu planta</p>
          </div>
          {activeTab === 'galpones' && <button className="btn btn-primary" onClick={() => openGalpon()}><Plus size={16} /> Nuevo Galpón</button>}
          {activeTab === 'zonas'    && <button className="btn btn-primary" onClick={() => openZona()}><Plus size={16} /> Nueva Zona</button>}
          {activeTab === 'maquinas' && <button className="btn btn-primary" onClick={() => openMaquina()}><Plus size={16} /> Nueva Máquina</button>}
        </div>

        {/* Tabs */}
        <div className="tab-bar" style={{ marginBottom: 0 }}>
          {TABS.map(({ id, label, icon: Icon }) => (
            <button key={id} className={`tab-btn ${activeTab === id ? 'active' : ''}`} onClick={() => setActiveTab(id)} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <Icon size={14} /> {label}
              <span style={{ background: 'rgba(255,255,255,0.08)', borderRadius: 100, fontSize: '0.65rem', padding: '1px 7px', fontWeight: 800, marginLeft: 2 }}>
                {id === 'galpones' ? state.galpones.length : id === 'zonas' ? state.zonas.length : state.maquinas.length}
              </span>
            </button>
          ))}
        </div>
      </div>

      <div className="page-content">

        {/* ── GALPONES ────────────────────────────────────────────── */}
        {activeTab === 'galpones' && (
          <div>
            {state.galpones.length === 0 ? (
              <div className="empty-state glass-panel">
                <Factory size={48} />
                <h3>Sin galpones</h3>
                <p>Añade el primer galpón para comenzar.</p>
                <button className="btn btn-primary mt-2" onClick={() => openGalpon()}><Plus size={16} /> Añadir Galpón</button>
              </div>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 14 }}>
                {state.galpones.map(g => {
                  const zonasCnt  = state.zonas.filter(z => z.galpon_id === g.id).length;
                  const maqCnt    = state.maquinas.filter(m => m.galpon_id === g.id).length;
                  const alertCnt  = state.alertas.filter(a => a.galpon_id === g.id && a.estado === 'Pendiente').length;
                  return (
                    <div key={g.id} style={{ background: 'var(--bg-card)', border: '1px solid var(--border-subtle)', borderRadius: 14, overflow: 'hidden', transition: 'border-color 0.15s' }}
                      onMouseEnter={e => e.currentTarget.style.borderColor = 'var(--border-strong)'}
                      onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--border-subtle)'}
                    >
                      <div style={{ height: 5, background: g.color }} />
                      <div style={{ padding: '14px 16px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 }}>
                          <div>
                            <div style={{ fontWeight: 800, fontSize: '1rem', color: 'var(--text-main)' }}>{g.nombre}</div>
                            <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: 3 }}>{g.descripcion}</div>
                          </div>
                          {alertCnt > 0 && (
                            <span style={{ background: 'rgba(239,68,68,0.12)', color: '#f87171', border: '1px solid rgba(239,68,68,0.25)', borderRadius: 100, fontSize: '0.65rem', fontWeight: 800, padding: '3px 8px' }}>
                              {alertCnt} alerta{alertCnt > 1 ? 's' : ''}
                            </span>
                          )}
                        </div>
                        <div style={{ display: 'flex', gap: 8, fontSize: '0.72rem', color: 'var(--text-faint)', marginBottom: 12 }}>
                          <span>🗂 {zonasCnt} zona{zonasCnt !== 1 ? 's' : ''}</span>
                          <span>⚙️ {maqCnt} máquina{maqCnt !== 1 ? 's' : ''}</span>
                        </div>
                        <div style={{ display: 'flex', gap: 6 }}>
                          <button className="btn btn-ghost" style={{ flex: 1, padding: '7px', fontSize: '0.8rem' }} onClick={() => openGalpon(g)}>
                            <Pencil size={13} /> Editar
                          </button>
                          <button className="btn-icon danger" onClick={() => deleteGalpon(g)}>
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* ── ZONAS ───────────────────────────────────────────────── */}
        {activeTab === 'zonas' && (
          <div>
            {state.zonas.length === 0 ? (
              <div className="empty-state glass-panel">
                <MapPin size={48} />
                <h3>Sin zonas</h3>
                <p>Añade zonas dentro de tus galpones.</p>
                <button className="btn btn-primary mt-2" onClick={() => openZona()}><Plus size={16} /> Añadir Zona</button>
              </div>
            ) : (
              <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-subtle)', borderRadius: 14, overflow: 'hidden' }}>
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Zona</th>
                      <th>Galpón</th>
                      <th>Descripción</th>
                      <th>Máquinas</th>
                      <th style={{ textAlign: 'right' }}>Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {state.zonas.map(z => {
                      const galpon = state.galpones.find(g => g.id === z.galpon_id);
                      const maqCnt = state.maquinas.filter(m => m.zona_id === z.id).length;
                      return (
                        <tr key={z.id}>
                          <td style={{ fontWeight: 700 }}>{z.nombre}</td>
                          <td>
                            {galpon && (
                              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: '0.8rem' }}>
                                <span style={{ width: 7, height: 7, borderRadius: '50%', background: galpon.color }} />
                                {galpon.nombre.split('—')[0].trim()}
                              </span>
                            )}
                          </td>
                          <td style={{ color: 'var(--text-muted)', fontSize: '0.82rem' }}>{z.descripcion}</td>
                          <td style={{ fontFamily: 'monospace', color: 'var(--text-muted)' }}>{maqCnt}</td>
                          <td>
                            <div style={{ display: 'flex', gap: 6, justifyContent: 'flex-end' }}>
                              <button className="btn-icon" onClick={() => openZona(z)}><Pencil size={13} /></button>
                              <button className="btn-icon danger" onClick={() => deleteZona(z)}><Trash2 size={13} /></button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* ── MÁQUINAS ────────────────────────────────────────────── */}
        {activeTab === 'maquinas' && (
          <div>
            {state.maquinas.length === 0 ? (
              <div className="empty-state glass-panel">
                <Cpu size={48} />
                <h3>Sin máquinas</h3>
                <p>Añade máquinas y puestos de trabajo.</p>
                <button className="btn btn-primary mt-2" onClick={() => openMaquina()}><Plus size={16} /> Añadir Máquina</button>
              </div>
            ) : (
              <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-subtle)', borderRadius: 14, overflow: 'hidden' }}>
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Máquina / Puesto</th>
                      <th>Tipo</th>
                      <th>Zona</th>
                      <th>Galpón</th>
                      <th>Código QR</th>
                      <th style={{ textAlign: 'right' }}>Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {state.maquinas.map(m => {
                      const zona   = state.zonas.find(z => z.id === m.zona_id);
                      const galpon = state.galpones.find(g => g.id === m.galpon_id);
                      return (
                        <tr key={m.id}>
                          <td style={{ fontWeight: 700 }}>{m.nombre}</td>
                          <td style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{m.tipo}</td>
                          <td style={{ fontSize: '0.82rem' }}>{zona?.nombre || '—'}</td>
                          <td>
                            {galpon && (
                              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: '0.8rem' }}>
                                <span style={{ width: 7, height: 7, borderRadius: '50%', background: galpon.color }} />
                                {galpon.nombre.split('—')[0].trim()}
                              </span>
                            )}
                          </td>
                          <td>
                            <span style={{ fontFamily: 'monospace', fontSize: '0.78rem', background: 'rgba(255,255,255,0.04)', border: '1px solid var(--border-subtle)', padding: '3px 8px', borderRadius: 6 }}>
                              {m.qr_code}
                            </span>
                          </td>
                          <td>
                            <div style={{ display: 'flex', gap: 6, justifyContent: 'flex-end' }}>
                              <button className="btn-icon" onClick={() => openMaquina(m)}><Pencil size={13} /></button>
                              <button className="btn-icon danger" onClick={() => deleteMaquina(m)}><Trash2 size={13} /></button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </div>

      {/* ── MODALS ──────────────────────────────────────────────────────── */}

      {/* Galpón Modal */}
      {galponModal && (
        <Modal title={editGalpon ? 'Editar Galpón' : 'Nuevo Galpón'} onClose={() => setGalponModal(false)} onSave={saveGalpon}>
          <div className="form-group">
            <label className="form-label">Nombre *</label>
            <input className="form-input" placeholder="Ej: Galpón E — Tratamientos" value={gForm.nombre} onChange={e => setGForm(f => ({ ...f, nombre: e.target.value }))} />
          </div>
          <div className="form-group">
            <label className="form-label">Descripción</label>
            <input className="form-input" placeholder="Descripción breve del área" value={gForm.descripcion} onChange={e => setGForm(f => ({ ...f, descripcion: e.target.value }))} />
          </div>
          <div className="form-group">
            <label className="form-label">Color identificativo</label>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <input type="color" value={gForm.color} onChange={e => setGForm(f => ({ ...f, color: e.target.value }))} style={{ width: 44, height: 44, borderRadius: 8, border: '1px solid var(--border-strong)', background: 'transparent', cursor: 'pointer', padding: 2 }} />
              <div style={{ flex: 1, height: 36, borderRadius: 8, background: gForm.color, opacity: 0.3 }} />
              <code style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontFamily: 'monospace' }}>{gForm.color}</code>
            </div>
          </div>
        </Modal>
      )}

      {/* Zona Modal */}
      {zonaModal && (
        <Modal title={editZona ? 'Editar Zona' : 'Nueva Zona'} onClose={() => setZonaModal(false)} onSave={saveZona}>
          <div className="form-group">
            <label className="form-label">Galpón *</label>
            <select className="form-select" value={zForm.galpon_id} onChange={e => setZForm(f => ({ ...f, galpon_id: e.target.value }))}>
              <option value="">— Selecciona un galpón —</option>
              {state.galpones.map(g => <option key={g.id} value={g.id}>{g.nombre}</option>)}
            </select>
          </div>
          <div className="form-group">
            <label className="form-label">Nombre de la Zona *</label>
            <input className="form-input" placeholder="Ej: Zona Prensas" value={zForm.nombre} onChange={e => setZForm(f => ({ ...f, nombre: e.target.value }))} />
          </div>
          <div className="form-group">
            <label className="form-label">Descripción</label>
            <input className="form-input" placeholder="Descripción breve" value={zForm.descripcion} onChange={e => setZForm(f => ({ ...f, descripcion: e.target.value }))} />
          </div>
        </Modal>
      )}

      {/* Máquina Modal */}
      {maqModal && (
        <Modal title={editMaq ? 'Editar Máquina' : 'Nueva Máquina'} onClose={() => setMaqModal(false)} onSave={saveMaquina}>
          <div className="form-group">
            <label className="form-label">Galpón *</label>
            <select className="form-select" value={mForm.galpon_id} onChange={e => setMForm(f => ({ ...f, galpon_id: e.target.value, zona_id: '' }))}>
              <option value="">— Selecciona un galpón —</option>
              {state.galpones.map(g => <option key={g.id} value={g.id}>{g.nombre}</option>)}
            </select>
          </div>
          <div className="form-group">
            <label className="form-label">Zona *</label>
            <select className="form-select" value={mForm.zona_id} onChange={e => setMForm(f => ({ ...f, zona_id: e.target.value }))} disabled={!mForm.galpon_id}>
              <option value="">— Selecciona una zona —</option>
              {zonasDeMaq.map(z => <option key={z.id} value={z.id}>{z.nombre}</option>)}
            </select>
          </div>
          <div className="form-group">
            <label className="form-label">Nombre de la Máquina / Puesto *</label>
            <input className="form-input" placeholder="Ej: Prensa Hidráulica 01" value={mForm.nombre} onChange={e => setMForm(f => ({ ...f, nombre: e.target.value }))} />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div className="form-group">
              <label className="form-label">Tipo</label>
              <input className="form-input" placeholder="CNC, Manual, Soldadura…" value={mForm.tipo} onChange={e => setMForm(f => ({ ...f, tipo: e.target.value }))} />
            </div>
            <div className="form-group">
              <label className="form-label">Código QR</label>
              <div style={{ display: 'flex', gap: 6 }}>
                <input className="form-input" style={{ fontFamily: 'monospace', fontSize: '0.85rem' }} value={mForm.qr_code} onChange={e => setMForm(f => ({ ...f, qr_code: e.target.value }))} />
                <button type="button" className="btn btn-ghost" style={{ padding: '8px', flexShrink: 0, fontSize: '0.7rem' }} onClick={() => setMForm(f => ({ ...f, qr_code: genQR() }))}>
                  Auto
                </button>
              </div>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
