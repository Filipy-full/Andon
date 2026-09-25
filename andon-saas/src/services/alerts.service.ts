import { createClient } from '@/lib/supabase/server';
import { Database } from '@/types/database.types';

// En un proyecto real, generarás database.types.ts usando supabase CLI
type Alert = any; // Reemplazar con Database['public']['Tables']['alerts']['Row']

export class AlertService {
  /**
   * Operario escanea QR y reporta problema.
   */
  static async createAlert(machineId: string, type: string, description?: string, photoBase64?: string) {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) throw new Error('Usuario no autenticado.');

    // 1. Subir foto a Supabase Storage (Si existe)
    let photoUrl = null;
    if (photoBase64) {
      const fileName = `alerts/${Date.now()}-${user.id}.jpg`;
      const base64Data = photoBase64.replace(/^data:image\/\w+;base64,/, "");
      const buffer = Buffer.from(base64Data, 'base64');
      
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('evidences')
        .upload(fileName, buffer, { contentType: 'image/jpeg' });
        
      if (!uploadError && uploadData) {
        photoUrl = uploadData.path;
      }
    }

    // 2. Crear registro (tenant_id se infiere de forma segura vía RLS)
    const { data, error } = await supabase.from('alerts').insert({
      machine_id: machineId,
      reported_by: user.id,
      type: type,
      description: description || null,
      photo_url: photoUrl,
      status: 'pending'
    }).select().single();

    if (error) throw new Error(`Error al crear incidencia: ${error.message}`);
    return data;
  }

  /**
   * Logística pulsa "🚀 Voy para allá"
   */
  static async acknowledgeAlert(alertId: string) {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();

    const { data, error } = await supabase.from('alerts')
      .update({
        status: 'in_progress',
        assigned_to: user?.id,
        acknowledged_at: new Date().toISOString(), // TIMESTAMP 1: Reacción
      })
      .eq('id', alertId)
      .select().single();

    if (error) throw error;
    return data;
  }

  /**
   * Logística llega físicamente y pulsa "✅ Resuelto"
   */
  static async resolveAlert(alertId: string) {
    const supabase = createClient();
    const { data, error } = await supabase.from('alerts')
      .update({
        status: 'resolved',
        resolved_at: new Date().toISOString(), // TIMESTAMP 2: Resolución (Para MTTR)
      })
      .eq('id', alertId)
      .select().single();

    if (error) throw error;
    return data;
  }
}
