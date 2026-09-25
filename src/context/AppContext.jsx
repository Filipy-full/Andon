import React, { createContext, useContext, useReducer, useEffect } from 'react';
import { initialGalpones, initialZonas, initialMaquinas, initialAlerts } from '../data/initialData';
import { supabase } from '../supabaseClient';

const AppContext = createContext(null);

const STORAGE_KEY = 'andon-pro-state-v2';

function loadState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      return {
        galpones: parsed.galpones || initialGalpones,
        zonas:    parsed.zonas    || initialZonas,
        maquinas: parsed.maquinas || initialMaquinas,
        alertas:  parsed.alertas  || initialAlerts,
      };
    }
  } catch { /* ignore */ }
  return { 
    galpones: initialGalpones, 
    zonas: initialZonas, 
    maquinas: initialMaquinas, 
    alertas: initialAlerts 
  };
}

function reducer(state, action) {
  switch (action.type) {
    case 'SYNC_STATE':
      return action.payload;

    /* ── Alertas ─────────────────────────────────────────────────────── */
    case 'ADD_ALERTA':
      if (state.alertas.some(a => a.id === action.payload.id)) return state;
      return { ...state, alertas: [action.payload, ...state.alertas] };

    case 'UPDATE_ALERTA_STATUS':
      return {
        ...state,
        alertas: state.alertas.map(a =>
          a.id === action.id ? { ...a, estado: action.estado } : a
        ),
      };

    case 'REMOVE_ALERTA':
      return { ...state, alertas: state.alertas.filter(a => a.id !== action.id) };

    /* ── Galpones CRUD ───────────────────────────────────────────────── */
    case 'ADD_GALPON':
      return { ...state, galpones: [...state.galpones, action.payload] };
    case 'UPDATE_GALPON':
      return { ...state, galpones: state.galpones.map(g => g.id === action.payload.id ? action.payload : g) };
    case 'DELETE_GALPON':
      return {
        ...state,
        galpones: state.galpones.filter(g => g.id !== action.id),
        zonas:    state.zonas.filter(z => z.galpon_id !== action.id),
        maquinas: state.maquinas.filter(m => m.galpon_id !== action.id),
      };

    /* ── Zonas CRUD ──────────────────────────────────────────────────── */
    case 'ADD_ZONA':
      return { ...state, zonas: [...state.zonas, action.payload] };
    case 'UPDATE_ZONA':
      return { ...state, zonas: state.zonas.map(z => z.id === action.payload.id ? action.payload : z) };
    case 'DELETE_ZONA':
      return {
        ...state,
        zonas:    state.zonas.filter(z => z.id !== action.id),
        maquinas: state.maquinas.filter(m => m.zona_id !== action.id),
      };

    /* ── Máquinas CRUD ───────────────────────────────────────────────── */
    case 'ADD_MAQUINA':
      return { ...state, maquinas: [...state.maquinas, action.payload] };
    case 'UPDATE_MAQUINA':
      return { ...state, maquinas: state.maquinas.map(m => m.id === action.payload.id ? action.payload : m) };
    case 'DELETE_MAQUINA':
      return { ...state, maquinas: state.maquinas.filter(m => m.id !== action.id) };

    default:
      return state;
  }
}

export function AppProvider({ children }) {
  const [state, dispatch] = useReducer(reducer, undefined, loadState);

  useEffect(() => {
    let channel;

    async function syncAlerts() {
      const { data, error } = await supabase
        .from('alertas')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.warn('No se pudieron cargar las alertas desde Supabase.', error.message);
        return;
      }

      dispatch({
        type: 'SYNC_STATE',
        payload: { ...loadState(), alertas: data || [] },
      });
    }

    syncAlerts();
    channel = supabase
      .channel('alertas-sync')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'alertas' }, ({ new: alerta }) => {
        dispatch({ type: 'ADD_ALERTA', payload: alerta });
      })
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'alertas' }, ({ new: alerta }) => {
        dispatch({ type: 'UPDATE_ALERTA_STATUS', id: alerta.id, estado: alerta.estado });
      })
      .on('postgres_changes', { event: 'DELETE', schema: 'public', table: 'alertas' }, ({ old: alerta }) => {
        dispatch({ type: 'REMOVE_ALERTA', id: alerta.id });
      })
      .subscribe();

    return () => {
      if (channel) supabase.removeChannel(channel);
    };
  }, []);

  // 1. Guardar cualquier cambio de estado localmente para persistencia
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch (e) { 
      console.warn("Storage limits exceeded", e);
    }
  }, [state]);

  // 2. Escuchar cambios de otras pestañas
  useEffect(() => {
    const handleStorageChange = (e) => {
      if (e.key === STORAGE_KEY && e.newValue) {
        try {
          const newState = JSON.parse(e.newValue);
          dispatch({ type: 'SYNC_STATE', payload: newState });
        } catch { /* ignore parse error */ }
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  return <AppContext.Provider value={{ state, dispatch }}>{children}</AppContext.Provider>;
}

export const useApp = () => {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used within AppProvider');
  return ctx;
};
