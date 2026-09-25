import React, { useEffect, useState } from 'react';
import { supabase } from '../supabaseClient';
import {
  LayoutDashboard, Clock, CheckCircle, ShieldAlert, Zap, Rocket, X
} from 'lucide-react';

const ZONA_MAP = {
  'uuid-plegadora-01': 'Plegadora Axial 01',
  'uuid-soldadura-02': 'Cabina Soldadura 02',
  'uuid-ensamblaje-03': 'Línea Ensamblaje 03',
  'uuid-remaches-02': 'Zona Remaches 02'
};

export function SupervisorDashboard({ alerts = [], onStatusChange }) {
  const [isConnected, setIsConnected] = useState(false);
  const [expandedImage, setExpandedImage] = useState(null);

  // ── Supabase real-time (UPDATE propagado al padre si está disponible) ─────
  useEffect(() => {
    let channel;
    try {
      channel = supabase
        .channel('public:alertas')
        .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'alertas' }, (payload) => {
          onStatusChange(payload.new.id, payload.new.estado);
        })
        .subscribe((status) => { if (status === 'SUBSCRIBED') setIsConnected(true); });
    } catch {
      console.warn('Supabase realtime no configurado.');
    }
    return () => { if (channel) supabase.removeChannel(channel); };
  }, [onStatusChange]);

  const updateStatus = async (id, newStatus) => {
    // Primero actualizamos localmente (reactividad inmediata)
    onStatusChange(id, newStatus);
    // Luego intentamos sincronizar con Supabase
    try {
      const { error } = await supabase.from('alertas').update({ estado: newStatus }).eq('id', id);
      if (error) throw error;
    } catch (e) {
      console.warn('Sin conexión a Supabase, estado guardado localmente.');
    }
  };

  const getAlertAccent = (tipo) => {
    if (tipo?.includes('Urgente')) return { color: '#ef4444', ring: 'rgba(239,68,68,0.35)', badge: 'bg-red-500/15 text-red-400 border-red-500/30' };
    if (tipo?.includes('defecto')) return { color: '#f97316', ring: 'rgba(249,115,22,0.25)', badge: 'bg-orange-500/15 text-orange-400 border-orange-500/30' };
    return { color: '#f59e0b', ring: 'rgba(245,158,11,0.25)', badge: 'bg-amber-500/15 text-amber-400 border-amber-500/30' };
  };

  const pendingCount = alerts.filter(a => a.estado === 'Pendiente').length;
  const enCaminoCount = alerts.filter(a => a.estado === 'En camino').length;

  return (
    <div className="min-h-screen bg-zinc-950 text-white flex flex-col">

      {/* Top bar */}
      <div className="sticky top-0 z-40 bg-zinc-950/90 backdrop-blur-xl border-b border-zinc-800 px-4 py-4 lg:px-8 flex justify-between items-center gap-4 shadow-2xl">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-blue-500/15 text-blue-400">
            <LayoutDashboard size={26} />
          </div>
          <div>
            <h1 className="text-lg lg:text-xl font-black tracking-tight leading-none">Logística · Reponedor</h1>
            <div className="flex items-center gap-2 mt-1">
              <span className={`flex items-center gap-1 text-xs font-bold px-2 py-0.5 rounded-full ${isConnected ? 'bg-emerald-500/15 text-emerald-400' : 'bg-zinc-800 text-zinc-500'}`}>
                {isConnected ? <Zap size={11} /> : <Clock size={11} />}
                {isConnected ? 'LIVE' : 'SIN CONEXIÓN'}
              </span>
            </div>
          </div>
        </div>

        {/* KPIs */}
        <div className="flex items-center gap-3">
          <div className="text-center">
            <div className="text-2xl font-black text-red-500 leading-none">{pendingCount}</div>
            <div className="text-[10px] font-bold uppercase tracking-wider text-zinc-600 mt-0.5">Pendiente</div>
          </div>
          <div className="w-px h-8 bg-zinc-800" />
          <div className="text-center">
            <div className="text-2xl font-black text-blue-400 leading-none">{enCaminoCount}</div>
            <div className="text-[10px] font-bold uppercase tracking-wider text-zinc-600 mt-0.5">En camino</div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 p-4 lg:p-8 max-w-6xl mx-auto w-full">

        {alerts.length === 0 && (
          <div className="flex flex-col items-center justify-center py-32 gap-4">
            <ShieldAlert size={64} className="text-zinc-700" />
            <h3 className="text-xl font-bold text-zinc-500">Sin alertas activas</h3>
            <p className="text-zinc-600 text-sm">La planta opera con normalidad.</p>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
          {alerts.map(alerta => {
            const accent = getAlertAccent(alerta.tipo_alerta);
            const isPending = alerta.estado === 'Pendiente';
            const isEnCamino = alerta.estado === 'En camino';
            const isResuelto = alerta.estado === 'Resuelto';

            return (
              <div
                key={alerta.id}
                className={`relative overflow-hidden rounded-2xl border transition-all duration-500 flex flex-col ${
                  isResuelto
                    ? 'bg-zinc-900/40 border-zinc-800 opacity-60'
                    : isEnCamino
                      ? 'bg-zinc-900 border-blue-500/40 shadow-[0_0_30px_rgba(59,130,246,0.15)]'
                      : 'bg-zinc-900 border-zinc-700 shadow-[0_8px_30px_rgba(0,0,0,0.5)]'
                }`}
              >
                {/* Barra lateral de color */}
                <div
                  className="absolute top-0 left-0 w-1 h-full"
                  style={{
                    background: isResuelto ? '#27272a' : isEnCamino ? '#3b82f6' : accent.color,
                    boxShadow: isPending ? `0 0 16px ${accent.ring}` : 'none',
                    animation: isPending ? 'none' : 'none'
                  }}
                />

                <div className="p-5 pl-6 flex flex-col flex-1 gap-3">
                  {/* Header: estado + hora */}
                  <div className="flex justify-between items-center">
                    <span className={`text-xs font-black uppercase tracking-widest px-3 py-1 rounded-full border ${
                      isPending ? 'bg-red-500/15 text-red-400 border-red-500/30' :
                      isEnCamino ? 'bg-blue-500/15 text-blue-400 border-blue-500/30' :
                      'bg-emerald-500/15 text-emerald-400 border-emerald-500/30'
                    }`}>
                      {isPending && '🔴 '}
                      {isEnCamino && '🔵 '}
                      {isResuelto && '✅ '}
                      {alerta.estado}
                    </span>
                    <span className="mono text-zinc-500 text-sm">
                      {new Date(alerta.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>

                  {/* Zona */}
                  <h3 className="text-xl font-black text-white leading-tight">
                    {ZONA_MAP[alerta.zona_id] || alerta.zona_id}
                  </h3>

                  {/* Tipo de alerta */}
                  <span className={`self-start text-sm font-bold px-3 py-1.5 rounded-lg border ${accent.badge}`}>
                    {alerta.tipo_alerta}
                  </span>

                  {/* Foto */}
                  {alerta.foto_base64 && (
                    <div
                      className="relative w-full h-36 rounded-xl overflow-hidden cursor-pointer border border-zinc-700 hover:border-zinc-500 transition-colors group"
                      onClick={() => setExpandedImage(alerta.foto_base64)}
                    >
                      <img src={alerta.foto_base64} alt="Evidencia" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                      <div className="absolute inset-0 bg-black/30 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                        <span className="bg-black/70 text-white px-3 py-1 rounded-full text-xs font-bold backdrop-blur-sm">
                          Ampliar foto
                        </span>
                      </div>
                    </div>
                  )}

                  {/* BOTONES DE ACCIÓN */}
                  <div className="mt-auto pt-4 border-t border-zinc-800">
                    {isPending && (
                      <button
                        onClick={() => updateStatus(alerta.id, 'En camino')}
                        className="w-full btn text-white font-black text-lg rounded-2xl border-none transition-all active:scale-95"
                        style={{
                          padding: '22px',
                          background: 'linear-gradient(135deg, #2563eb, #1d4ed8)',
                          boxShadow: '0 0 30px rgba(37,99,235,0.4)'
                        }}
                      >
                        <Rocket size={24} className="mr-3" /> 🚀 VOY PARA ALLÁ
                      </button>
                    )}

                    {isEnCamino && (
                      <button
                        onClick={() => updateStatus(alerta.id, 'Resuelto')}
                        className="w-full btn text-white font-black text-lg rounded-2xl border-none transition-all active:scale-95"
                        style={{
                          padding: '22px',
                          background: 'linear-gradient(135deg, #059669, #047857)',
                          boxShadow: '0 0 25px rgba(16,185,129,0.35)'
                        }}
                      >
                        <CheckCircle size={24} className="mr-3" /> ✅ ENTREGADO / RESUELTO
                      </button>
                    )}

                    {isResuelto && (
                      <div className="text-center py-3 text-zinc-500 text-sm font-bold">
                        Incidencia cerrada
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Modal imagen ampliada */}
      {expandedImage && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/95 p-4 backdrop-blur-md"
          onClick={() => setExpandedImage(null)}
        >
          <div className="relative max-w-4xl w-full" onClick={e => e.stopPropagation()}>
            <button
              className="absolute -top-12 right-0 p-2 bg-zinc-800 rounded-full hover:bg-zinc-700 text-white"
              onClick={() => setExpandedImage(null)}
            >
              <X size={24} />
            </button>
            <img
              src={expandedImage}
              alt="Evidencia ampliada"
              className="w-full max-h-[85vh] object-contain rounded-2xl border border-zinc-700"
            />
          </div>
        </div>
      )}
    </div>
  );
}
