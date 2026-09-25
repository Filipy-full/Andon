import React, { useState, useRef, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { supabase } from '../supabaseClient';
import { TIPOS_ALERTA } from '../data/initialData';
import { QrCode, Camera, Send, CheckCircle, X, AlertTriangle, Truck, ShieldAlert } from 'lucide-react';
import { IconResolver } from './IconResolver';

export function OperatorTerminal() {
  const { state, dispatch } = useApp();

  // ── Wizard state ─────────────────────────────────────────────────────
  const [step, setStep]           = useState(1);
  const [galponId, setGalponId]   = useState('');
  const [zonaId, setZonaId]       = useState('');
  const [maquinaId, setMaquinaId] = useState('');
  const [tipoId, setTipoId]       = useState('');
  const [descripcion, setDescripcion] = useState('');
  const [photo, setPhoto]         = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // ── Camera ───────────────────────────────────────────────────────────
  const videoRef  = useRef(null);
  const canvasRef = useRef(null);
  const [stream, setStream]           = useState(null);
  const [cameraActive, setCameraActive] = useState(false);

  useEffect(() => () => { stream?.getTracks().forEach(t => t.stop()); }, [stream]);

  const [sentId, setSentId] = useState(null);
  const activeAlert = state.alertas.find(a => a.id === sentId) || null;

  const galpon  = state.galpones.find(g => g.id === galponId);
  const zona    = state.zonas.find(z => z.id === zonaId);
  const maquina = state.maquinas.find(m => m.id === maquinaId);
  const tipo    = TIPOS_ALERTA.find(t => t.id === tipoId);

  const handleQRScan = () => {
    if (state.maquinas.length === 0) { alert('SISTEMA: No hay activos configurados en la base de datos.'); return; }
    const maq = state.maquinas[Math.floor(Math.random() * state.maquinas.length)];
    setGalponId(maq.galpon_id);
    setZonaId(maq.zona_id);
    setMaquinaId(maq.id);
    setStep(2);
    if (typeof navigator !== 'undefined' && navigator.vibrate) navigator.vibrate(50);
  };

  const selectManualMachine = (m) => {
    setGalponId(m.galpon_id);
    setZonaId(m.zona_id);
    setMaquinaId(m.id);
    setStep(2);
  };

  const startCamera = async () => {
    try {
      const ms = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
      setStream(ms); setCameraActive(true);
      setTimeout(() => { if (videoRef.current) videoRef.current.srcObject = ms; }, 80);
    } catch { alert('SISTEMA: Acceso a cámara denegado o hardware no detectado.'); }
  };

  const capturePhoto = () => {
    const v = videoRef.current, c = canvasRef.current;
    if (!v || !c) return;
    c.width = v.videoWidth; c.height = v.videoHeight;
    c.getContext('2d').drawImage(v, 0, 0);
    setPhoto(c.toDataURL('image/jpeg', 0.6));
    stopCamera();
  };

  const stopCamera = () => {
    stream?.getTracks().forEach(t => t.stop());
    setStream(null); setCameraActive(false);
  };

  const handleSend = async () => {
    if (!maquinaId || !tipoId) return;
    setIsSubmitting(true);
    const newId = crypto.randomUUID();
    const payload = {
      id: newId,
      maquina_id:  maquinaId,
      zona_id:     zonaId,
      galpon_id:   galponId,
      tipo_alerta: tipoId,
      descripcion: descripcion,
      estado:      'Pendiente',
      foto_base64: photo,
      operario_id: 'operador-movil',
      created_at:  new Date().toISOString(),
    };
    try {
      const { data, error } = await supabase.from('alertas').insert([payload]).select();
      if (error) throw error;
      dispatch({ type: 'ADD_ALERTA', payload: { ...data[0], foto_base64: photo } });
      setSentId(data[0].id);
    } catch {
      dispatch({ type: 'ADD_ALERTA', payload });
      setSentId(newId);
    } finally { setIsSubmitting(false); }
  };

  const resetAll = () => {
    setSentId(null); setGalponId(''); setZonaId(''); setMaquinaId('');
    setTipoId(''); setDescripcion(''); setPhoto(null); setStep(1);
  };

  if (sentId && activeAlert) {
    const { estado } = activeAlert;
    const screens = {
      'Pendiente': {
        border: 'var(--accent-red)', bg: 'rgba(220,38,38,0.05)',
        icon: <ShieldAlert size={48} color="var(--accent-red)" />,
        title: 'REPORTE EMITIDO',
        body: 'Alerta de prioridad transmitida. A la espera de recursos logísticos.',
        color: 'var(--accent-red)',
      },
      'En camino': {
        border: 'var(--accent-blue)', bg: 'rgba(59,130,246,0.05)',
        icon: <Truck size={48} color="var(--accent-blue)" />,
        title: 'RECURSO ASIGNADO',
        body: 'Operativo logístico en ruta hacia su sector.',
        color: 'var(--accent-blue)',
      },
      'Resuelto': {
        border: 'var(--accent-emerald)', bg: 'rgba(16,185,129,0.05)',
        icon: <CheckCircle size={48} color="var(--accent-emerald)" />,
        title: 'INCIDENCIA CERRADA',
        body: 'Situación normalizada. Protocolo concluido.',
        color: 'var(--accent-emerald)',
      },
    };
    const s = screens[estado] || screens['Pendiente'];
    return (
      <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', padding: 24, justifyContent: 'center' }}>
        <div className="animate-scale" style={{ textAlign: 'center', maxWidth: 400, margin: '0 auto', width: '100%', border: `1px solid ${s.border}`, background: s.bg, borderRadius: 8, padding: 32 }}>
          <div style={{ marginBottom: 24, display: 'inline-flex', padding: 20, borderRadius: '50%', background: 'rgba(0,0,0,0.3)', border: `1px solid ${s.color}` }}>
            {s.icon}
          </div>
          <h2 style={{ fontSize: '1.4rem', fontWeight: 700, color: s.color, marginBottom: 12, letterSpacing: '0.05em' }}>{s.title}</h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', lineHeight: 1.5, marginBottom: 24 }}>{s.body}</p>
          
          {maquina && galpon && (
            <div style={{ textAlign: 'left', padding: '16px', borderRadius: 6, border: `1px solid var(--border-strong)`, background: 'var(--bg-base)', marginBottom: 24 }}>
              <div style={{ fontSize: '0.7rem', color: 'var(--text-faint)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>ID Incidencia: {sentId.split('-')[0].toUpperCase()}</div>
              <div style={{ fontWeight: 600, color: 'var(--text-main)', marginTop: 4 }}>{galpon.nombre.split('—')[0].trim()} / {maquina.nombre}</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.8rem', color: s.color, marginTop: 8, fontWeight: 600 }}>
                <IconResolver name={tipo?.icon} size={14} /> {tipo?.label}
              </div>
            </div>
          )}
          {estado === 'Resuelto' && (
            <button className="btn btn-ghost w-full" style={{ padding: '14px', fontSize: '0.9rem', border: '1px solid var(--border-subtle)' }} onClick={resetAll}>
              RETORNAR A OPERACIÓN
            </button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border-subtle)', background: 'var(--glass-bg)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'sticky', top: 0, zIndex: 50, backdropFilter: 'blur(12px)' }}>
        <div>
          <div style={{ fontSize: '0.65rem', fontWeight: 700, color: 'var(--text-faint)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Interfaz HMI — Operario</div>
          <div style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--text-main)' }}>Reporte de Estado</div>
        </div>
        {step === 2 && (
          <button className="btn btn-ghost" style={{ padding: '6px 12px', fontSize: '0.75rem' }} onClick={resetAll}>
            CANCELAR
          </button>
        )}
      </div>

      <div style={{ padding: '20px', maxWidth: 500, margin: '0 auto', width: '100%', display: 'flex', flexDirection: 'column', gap: 20 }}>
        {step === 1 && (
          <div className="animate-fade">
            <button 
              onClick={handleQRScan}
              style={{
                width: '100%', padding: '40px 20px', borderRadius: 8, border: '1px solid var(--accent-blue)',
                background: 'rgba(59,130,246,0.1)', color: 'var(--accent-blue)',
                cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16,
                marginBottom: 24, transition: 'all 0.15s'
              }}
              onActive={e => e.currentTarget.style.background = 'rgba(59,130,246,0.2)'}
            >
              <QrCode size={48} />
              <div>
                <div style={{ fontSize: '1.2rem', fontWeight: 700, letterSpacing: '0.05em' }}>ESCANEAR CÓDIGO QR</div>
                <div style={{ fontSize: '0.8rem', opacity: 0.8, marginTop: 4 }}>Vincular puesto automáticamente</div>
              </div>
            </button>

            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
              <div style={{ flex: 1, height: 1, background: 'var(--border-subtle)' }} />
              <div style={{ color: 'var(--text-faint)', fontSize: '0.7rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.1em' }}>Selección Manual</div>
              <div style={{ flex: 1, height: 1, background: 'var(--border-subtle)' }} />
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {state.maquinas.map(m => (
                <button key={m.id} className="kiosk-btn" onClick={() => selectManualMachine(m)}>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 600 }}>{m.nombre}</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: 2 }}>{state.galpones.find(g => g.id === m.galpon_id)?.nombre.split('—')[0].trim()} · {m.tipo}</div>
                  </div>
                  <span className="mono" style={{ fontSize: '0.7rem', color: 'var(--text-faint)' }}>{m.qr_code}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="animate-slide-up" style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            
            <div style={{ padding: '14px 16px', background: 'var(--bg-card)', border: '1px solid var(--border-strong)', borderRadius: 6, display: 'flex', alignItems: 'center', gap: 12 }}>
              <CheckCircle size={20} color="var(--accent-cyan)" />
              <div>
                <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase' }}>Activo Identificado</div>
                <div style={{ fontSize: '0.95rem', fontWeight: 600, color: 'var(--text-main)' }}>{maquina?.nombre} <span className="mono text-faint ml-2">[{maquina?.qr_code}]</span></div>
              </div>
            </div>

            <div>
              <div style={{ fontWeight: 600, fontSize: '0.85rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 12 }}>Clasificación del Evento</div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                {TIPOS_ALERTA.map(t => (
                  <button
                    key={t.id}
                    className={`kiosk-btn ${tipoId === t.id ? 'active' : ''}`}
                    style={tipoId === t.id ? { borderColor: t.color, color: t.color, background: `${t.color}15` } : { padding: '14px 12px', flexDirection: 'column', alignItems: 'flex-start', gap: 8 }}
                    onClick={() => setTipoId(t.id)}
                  >
                    <IconResolver name={t.icon} size={22} color={tipoId === t.id ? t.color : 'var(--text-muted)'} />
                    <span style={{ fontSize: '0.85rem', lineHeight: 1.2 }}>{t.label}</span>
                  </button>
                ))}
              </div>
            </div>

            <div>
              <div style={{ fontWeight: 600, fontSize: '0.85rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 12 }}>Datos Complementarios (Opcional)</div>
              <textarea 
                className="form-textarea" 
                placeholder="Introduzca observaciones adicionales..." 
                value={descripcion} 
                onChange={e => setDescripcion(e.target.value)}
                style={{ minHeight: 80, marginBottom: 12 }}
              />

              {!cameraActive && !photo && (
                <button className="btn btn-ghost w-full" style={{ padding: '14px', fontSize: '0.9rem', color: 'var(--text-muted)' }} onClick={startCamera}>
                  <Camera size={18} /> CAPTURAR EVIDENCIA VISUAL
                </button>
              )}
              {cameraActive && (
                <div style={{ position: 'relative', borderRadius: 4, overflow: 'hidden', border: '1px solid var(--accent-blue)' }}>
                  <video ref={videoRef} autoPlay playsInline style={{ width: '100%', height: 200, objectFit: 'cover', display: 'block' }} />
                  <button onClick={stopCamera} style={{ position: 'absolute', top: 8, right: 8, width: 32, height: 32, borderRadius: '50%', background: 'rgba(0,0,0,0.8)', border: '1px solid var(--border-strong)', color: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <X size={16} />
                  </button>
                  <button onClick={capturePhoto} style={{ position: 'absolute', bottom: 12, left: '50%', transform: 'translateX(-50%)', width: 50, height: 50, borderRadius: '50%', background: 'var(--accent-blue)', border: 'none', color: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Camera size={22} />
                  </button>
                </div>
              )}
              {photo && !cameraActive && (
                <div style={{ position: 'relative', borderRadius: 4, overflow: 'hidden', border: '1px solid var(--border-subtle)' }}>
                  <img src={photo} alt="Evidencia" style={{ width: '100%', height: 120, objectFit: 'cover', display: 'block' }} />
                  <button onClick={() => setPhoto(null)} style={{ position: 'absolute', top: 8, right: 8, width: 28, height: 28, borderRadius: '50%', background: 'rgba(0,0,0,0.8)', border: '1px solid var(--border-strong)', color: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <X size={14} />
                  </button>
                </div>
              )}
              <canvas ref={canvasRef} style={{ display: 'none' }} />
            </div>

            <button
              className="btn animate-slide-up"
              onClick={handleSend}
              disabled={isSubmitting || !tipoId}
              style={{
                width: '100%', padding: '20px',
                fontSize: '1rem', fontWeight: 600, letterSpacing: '0.05em',
                borderRadius: 6, border: 'none',
                background: !tipoId ? 'var(--bg-card)' : (tipo?.severity === 'critical' ? 'var(--accent-red)' : 'var(--accent-emerald)'),
                color: !tipoId ? 'var(--text-faint)' : '#fff',
                marginTop: 10
              }}
            >
              <Send size={18} style={{ marginRight: 8 }} />
              {isSubmitting ? 'TRANSMITIENDO...' : 'TRANSMITIR REPORTE'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
