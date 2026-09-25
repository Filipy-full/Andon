import React, { useState, useRef, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import {
  Camera, Send, CheckCircle, QrCode, X, Truck, AlertTriangle
} from 'lucide-react';

const ZONA_MAP = {
  'uuid-plegadora-01': 'Plegadora Axial 01',
  'uuid-soldadura-02': 'Cabina Soldadura 02',
  'uuid-ensamblaje-03': 'Línea Ensamblaje 03',
  'uuid-remaches-02': 'Zona Remaches 02'
};

export function OperatorMobileTerminal({ onAlertCreated, alerts = [] }) {
  const [zonaId, setZonaId] = useState('');
  const [tipoAlerta, setTipoAlerta] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [sentAlertId, setSentAlertId] = useState(null);

  // Camera State
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const [stream, setStream] = useState(null);
  const [photo, setPhoto] = useState(null);
  const [cameraActive, setCameraActive] = useState(false);

  useEffect(() => {
    return () => { if (stream) stream.getTracks().forEach(t => t.stop()); };
  }, [stream]);

  // Watchdog: state of the last sent alert (driven by shared alerts array)
  const activeAlert = alerts.find(a => a.id === sentAlertId) || null;
  const alertEstado = activeAlert?.estado || null;

  // Determine background mode based on active alert state
  const isEnCamino = alertEstado === 'En camino';
  const isResuelto = alertEstado === 'Resuelto';

  const startCamera = async () => {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
      setStream(mediaStream);
      setCameraActive(true);
      setTimeout(() => { if (videoRef.current) videoRef.current.srcObject = mediaStream; }, 100);
    } catch {
      alert("No se pudo acceder a la cámara. Revisa los permisos.");
    }
  };

  const takePhoto = () => {
    if (videoRef.current && canvasRef.current) {
      const v = videoRef.current, c = canvasRef.current;
      c.width = v.videoWidth; c.height = v.videoHeight;
      c.getContext('2d').drawImage(v, 0, 0);
      setPhoto(c.toDataURL('image/jpeg', 0.7));
      stopCamera();
    }
  };

  const stopCamera = () => {
    if (stream) { stream.getTracks().forEach(t => t.stop()); setStream(null); }
    setCameraActive(false);
  };

  const handleScanQR = () => {
    const zonas = Object.keys(ZONA_MAP);
    const random = zonas[Math.floor(Math.random() * zonas.length)];
    setTimeout(() => {
      setZonaId(random);
      alert(`✅ QR Escaneado\nZona detectada: ${ZONA_MAP[random]}`);
    }, 500);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!zonaId || !tipoAlerta) return;
    setIsSubmitting(true);

    const newId = crypto.randomUUID();
    const payload = {
      id: newId,
      zona_id: zonaId,
      tipo_alerta: tipoAlerta,
      descripcion: '',
      estado: 'Pendiente',
      foto_base64: photo,
      created_at: new Date().toISOString()
    };

    try {
      const { data, error } = await supabase.from('alertas').insert([payload]).select();
      if (error) throw error;
      onAlertCreated({ ...data[0], foto_base64: photo });
      setSentAlertId(data[0].id);
    } catch {
      onAlertCreated(payload);
      setSentAlertId(newId);
    } finally {
      setIsSubmitting(false);
      setTipoAlerta('');
      setPhoto(null);
    }
  };

  // ──────────────────────────────────────────────────────────────────────────
  // ESTADO: El operario esperando respuesta (aviso ya enviado)
  // ──────────────────────────────────────────────────────────────────────────
  if (sentAlertId && activeAlert && !isResuelto) {
    return (
      <div
        className="min-h-screen flex flex-col items-center justify-center p-6 transition-colors duration-1000"
        style={{
          background: isEnCamino
            ? 'radial-gradient(ellipse at center, #1e3a5f 0%, #0a0a1a 100%)'
            : 'radial-gradient(ellipse at center, #3b0000 0%, #0a0a0a 100%)'
        }}
      >
        <div
          className="w-full max-w-sm text-center animate-slide-up rounded-3xl p-8 border backdrop-blur-xl"
          style={{
            background: isEnCamino ? 'rgba(30, 58, 92, 0.5)' : 'rgba(80, 10, 10, 0.4)',
            borderColor: isEnCamino ? 'rgba(59, 130, 246, 0.5)' : 'rgba(239, 68, 68, 0.4)',
            boxShadow: isEnCamino
              ? '0 0 60px rgba(59,130,246,0.3), inset 0 1px 1px rgba(255,255,255,0.05)'
              : '0 0 60px rgba(239,68,68,0.3), inset 0 1px 1px rgba(255,255,255,0.05)'
          }}
        >
          {isEnCamino ? (
            <>
              <div
                className="w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-6"
                style={{
                  background: 'rgba(59,130,246,0.2)',
                  boxShadow: '0 0 40px rgba(59,130,246,0.5)',
                  animation: 'pulseBlue 2s infinite'
                }}
              >
                <Truck size={48} className="text-blue-400" />
              </div>
              <h2 className="text-3xl font-black text-white mb-3 leading-tight">
                El reponedor<br />está en camino
              </h2>
              <p className="text-blue-300 text-lg">Sigue trabajando con lo que tienes.<br />Enseguida llega la reposición.</p>
              <div className="mt-6 px-4 py-2 rounded-full text-sm font-bold text-blue-300 border border-blue-500/30 bg-blue-500/10 inline-block">
                📍 {ZONA_MAP[activeAlert.zona_id]}
              </div>
            </>
          ) : (
            <>
              <div
                className="w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-6"
                style={{
                  background: 'rgba(239,68,68,0.2)',
                  animation: 'pulseGlow 1.5s infinite'
                }}
              >
                <AlertTriangle size={48} className="text-red-400" />
              </div>
              <h2 className="text-3xl font-black text-white mb-3 leading-tight">
                ¡AVISO ENVIADO!
              </h2>
              <p className="text-red-300 text-lg">Alerta enviada a logística.<br />En espera de confirmación…</p>
              <div className="mt-6 px-4 py-2 rounded-full text-sm font-bold text-red-300 border border-red-500/30 bg-red-500/10 inline-block">
                📍 {ZONA_MAP[activeAlert.zona_id]} &nbsp;·&nbsp; {activeAlert.tipo_alerta}
              </div>
            </>
          )}
        </div>

        <button
          onClick={() => { setSentAlertId(null); setZonaId(''); setTipoAlerta(''); }}
          className="mt-8 text-zinc-500 text-sm hover:text-zinc-300 transition-colors underline underline-offset-4"
        >
          Emitir nueva alerta
        </button>

        <style>{`
          @keyframes pulseBlue {
            0%, 100% { box-shadow: 0 0 20px rgba(59,130,246,0.4); }
            50% { box-shadow: 0 0 60px rgba(59,130,246,0.8); }
          }
        `}</style>
      </div>
    );
  }

  // ESTADO: Resuelto — pantalla verde de confirmación
  if (sentAlertId && isResuelto) {
    return (
      <div
        className="min-h-screen flex flex-col items-center justify-center p-6"
        style={{ background: 'radial-gradient(ellipse at center, #052e16 0%, #0a0a0a 100%)' }}
      >
        <div className="text-center animate-slide-up">
          <div
            className="w-28 h-28 rounded-full flex items-center justify-center mx-auto mb-6"
            style={{ background: 'rgba(16,185,129,0.2)', boxShadow: '0 0 60px rgba(16,185,129,0.5)' }}
          >
            <CheckCircle size={56} className="text-emerald-400" />
          </div>
          <h2 className="text-4xl font-black text-white mb-3">¡RESUELTO!</h2>
          <p className="text-emerald-300 text-lg mb-8">El reponedor ha hecho la entrega.<br/>Puedes seguir produciendo con normalidad.</p>
          <button
            onClick={() => { setSentAlertId(null); setZonaId(''); }}
            className="btn bg-emerald-700 hover:bg-emerald-600 text-white px-10 py-5 rounded-2xl text-lg font-bold border-none"
          >
            Nueva Incidencia
          </button>
        </div>
      </div>
    );
  }

  // ──────────────────────────────────────────────────────────────────────────
  // ESTADO NORMAL: Formulario de incidencia
  // ──────────────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-zinc-950 flex flex-col w-full justify-start items-center p-4 py-6">
      <div className="w-full max-w-md animate-slide-up">

        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-bold uppercase tracking-widest text-zinc-500">Terminal Operario</span>
            <span className="text-xs mono text-zinc-600">· TERMINAL MÓVIL</span>
          </div>
          <h2 className="text-3xl font-black text-white">Emitir Incidencia</h2>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-5">

          {/* PASO 1: Zona */}
          <div className="rounded-2xl bg-zinc-900 border border-zinc-800 p-5">
            <label className="text-xs font-bold uppercase tracking-widest text-zinc-500 block mb-3">
              Paso 1 · Puesto / Zona
            </label>
            <button
              type="button"
              onClick={handleScanQR}
              className="btn w-full border-2 border-dashed border-zinc-700 hover:border-cyan-500 text-white bg-transparent transition-all"
              style={{ padding: '20px', fontSize: '1.15rem' }}
            >
              <QrCode size={24} className="text-cyan-400" /> Escanear QR del puesto
            </button>
            {zonaId && (
              <div className="mt-3 flex items-center justify-center gap-2 px-4 py-3 bg-emerald-500/10 border border-emerald-500/30 rounded-xl text-emerald-400 font-bold">
                📍 {ZONA_MAP[zonaId]}
                <button type="button" onClick={() => setZonaId('')} className="ml-auto text-zinc-500 hover:text-zinc-300">
                  <X size={16} />
                </button>
              </div>
            )}
          </div>

          {/* PASO 2: Tipo de incidencia */}
          <div className="rounded-2xl bg-zinc-900 border border-zinc-800 p-5">
            <label className="text-xs font-bold uppercase tracking-widest text-zinc-500 block mb-3">
              Paso 2 · ¿Qué ocurre?
            </label>
            <div className="flex flex-col gap-3">
              {[
                { id: 'Falta material', label: '📦  Falta material', accent: 'amber' },
                { id: 'Pieza con defecto', label: '⚙️  Pieza con defecto', accent: 'orange' },
                { id: 'Urgente: Quedan < 4 uds', label: '🚨  Quedan 4 uds — URGENTE', accent: 'red' },
              ].map(({ id, label, accent }) => {
                const active = tipoAlerta === id;
                const colors = {
                  amber: { active: 'bg-amber-500/20 border-amber-500 text-amber-300', idle: 'border-zinc-700 text-zinc-300 hover:border-amber-700' },
                  orange: { active: 'bg-orange-500/20 border-orange-500 text-orange-300', idle: 'border-zinc-700 text-zinc-300 hover:border-orange-700' },
                  red: { active: 'bg-red-500/20 border-red-500 text-red-300 alert-pulse', idle: 'border-zinc-700 text-zinc-300 hover:border-red-700' },
                };
                return (
                  <button
                    key={id}
                    type="button"
                    onClick={() => setTipoAlerta(id)}
                    className={`btn text-left justify-start border-2 font-bold transition-all ${active ? colors[accent].active : colors[accent].idle} bg-transparent`}
                    style={{ padding: '20px', fontSize: '1.15rem', borderRadius: '14px' }}
                  >
                    {label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* PASO 3: Foto */}
          <div className="rounded-2xl bg-zinc-900 border border-zinc-800 p-5">
            <label className="text-xs font-bold uppercase tracking-widest text-zinc-500 block mb-3">
              Paso 3 · Foto (opcional)
            </label>

            {!cameraActive && !photo && (
              <button
                type="button"
                onClick={startCamera}
                className="btn w-full text-white border-2 border-blue-500/50 bg-blue-600/20 hover:bg-blue-600/40 transition-all"
                style={{ padding: '20px', fontSize: '1.15rem' }}
              >
                <Camera size={26} className="text-blue-400" /> 📸 FOTO-INCIDENCIA
              </button>
            )}

            {cameraActive && (
              <div className="relative rounded-xl overflow-hidden border-2 border-blue-500">
                <video ref={videoRef} autoPlay playsInline className="w-full h-64 object-cover" />
                <button type="button" onClick={stopCamera} className="absolute top-2 right-2 p-2 bg-black/60 rounded-full text-white">
                  <X size={20} />
                </button>
                <button
                  type="button"
                  onClick={takePhoto}
                  className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-blue-600 rounded-full p-4 border-4 border-white shadow-xl active:scale-90 transition-transform"
                >
                  <Camera size={30} />
                </button>
              </div>
            )}

            {photo && !cameraActive && (
              <div className="relative rounded-xl overflow-hidden border-2 border-zinc-600 group">
                <img src={photo} alt="Evidencia" className="w-full h-40 object-cover" />
                <button type="button" onClick={() => setPhoto(null)} className="absolute top-2 right-2 p-2 bg-black/60 rounded-full text-white opacity-0 group-hover:opacity-100 transition-opacity">
                  <X size={18} />
                </button>
              </div>
            )}
            <canvas ref={canvasRef} style={{ display: 'none' }} />
          </div>

          {/* BOTÓN ENVIAR */}
          <button
            type="submit"
            disabled={isSubmitting || !zonaId || !tipoAlerta}
            className={`btn w-full rounded-2xl text-white text-xl font-black uppercase tracking-widest border-none transition-all
              ${!zonaId || !tipoAlerta
                ? 'bg-zinc-800 text-zinc-600 cursor-not-allowed'
                : tipoAlerta.includes('Urgente')
                  ? 'bg-red-600 hover:bg-red-500 shadow-[0_0_30px_rgba(220,38,38,0.6)] alert-pulse'
                  : 'bg-emerald-600 hover:bg-emerald-500 shadow-[0_0_20px_rgba(16,185,129,0.4)]'
              }`}
            style={{ padding: '26px' }}
          >
            {isSubmitting ? 'ENVIANDO…' : <><Send size={26} className="mr-3" /> EMITIR ALERTA</>}
          </button>

        </form>
      </div>
    </div>
  );
}
