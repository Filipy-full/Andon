// Global TypeScript types for Andon Pro SaaS
// These mirror the Supabase database schema

export type AlertStatus = 'pending' | 'in_progress' | 'resolved';

export interface Tenant {
  id: string;
  name: string;
  stripe_customer_id?: string;
  subscription_status: 'active' | 'past_due' | 'canceled';
  created_at: string;
}

export interface Profile {
  id: string;
  tenant_id: string;
  role: 'admin' | 'operator' | 'logistics';
  full_name: string;
  created_at: string;
}

export interface Zone {
  id: string;
  tenant_id: string;
  name: string;
  description?: string;
  created_at: string;
}

export interface Machine {
  id: string;
  tenant_id: string;
  zone_id: string;
  name: string;
  type?: string;
  qr_code: string;
  created_at: string;
}

export interface Alert {
  id: string;
  tenant_id: string;
  machine_id: string;
  reported_by?: string;
  assigned_to?: string;
  type: string;
  description?: string;
  photo_url?: string;
  status: AlertStatus;
  created_at: string;
  acknowledged_at?: string;
  resolved_at?: string;
  // Client-side enriched fields (joined)
  zone_id?: string;
  zone_name?: string;
  machine_name?: string;
  machine_qr?: string;
}

export interface AlertType {
  id: string;
  label: string;
  icon: string;
  color: string;
  severity: 'normal' | 'warning' | 'critical';
}
