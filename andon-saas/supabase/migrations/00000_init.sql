-- 1. TENANTS (Empresas Clientes)
CREATE TABLE tenants (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(255) NOT NULL,
  stripe_customer_id VARCHAR(255),
  subscription_status VARCHAR(50) DEFAULT 'active',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. USERS / PROFILES (Usuarios con Roles)
CREATE TABLE profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE NOT NULL,
  role VARCHAR(50) NOT NULL CHECK (role IN ('admin', 'operator', 'logistics')),
  full_name VARCHAR(255),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. JERARQUÍA INDUSTRIAL
CREATE TABLE zones (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE NOT NULL,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE machines (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE NOT NULL,
  zone_id UUID REFERENCES zones(id) ON DELETE CASCADE NOT NULL,
  name VARCHAR(255) NOT NULL,
  type VARCHAR(100),
  qr_code VARCHAR(255) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (tenant_id, qr_code)
);

-- 4. ALERTAS (Incidencias Andon)
CREATE TABLE alerts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE NOT NULL,
  machine_id UUID REFERENCES machines(id) ON DELETE CASCADE NOT NULL,
  reported_by UUID REFERENCES profiles(id),
  assigned_to UUID REFERENCES profiles(id),
  
  type VARCHAR(100) NOT NULL,
  description TEXT,
  photo_url TEXT,
  
  status VARCHAR(50) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'resolved')),
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  acknowledged_at TIMESTAMPTZ,
  resolved_at TIMESTAMPTZ
);

-- HABILITACIÓN DE RLS (Row Level Security) - MULTI-TENANCY
ALTER TABLE tenants ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE zones ENABLE ROW LEVEL SECURITY;
ALTER TABLE machines ENABLE ROW LEVEL SECURITY;
ALTER TABLE alerts ENABLE ROW LEVEL SECURITY;

-- POLÍTICAS RLS (Cada usuario ve solo los datos de su tenant_id)
-- Tenants
CREATE POLICY "Usuarios ven su propio tenant" ON tenants FOR SELECT USING (id = (SELECT tenant_id FROM profiles WHERE id = auth.uid()));

-- Profiles
CREATE POLICY "Usuarios ven perfiles de su tenant" ON profiles FOR SELECT USING (tenant_id = (SELECT tenant_id FROM profiles WHERE id = auth.uid()));
CREATE POLICY "Usuarios actualizan su perfil" ON profiles FOR UPDATE USING (id = auth.uid());

-- Zonas y Máquinas
CREATE POLICY "Zonas por tenant" ON zones FOR ALL USING (tenant_id = (SELECT tenant_id FROM profiles WHERE id = auth.uid()));
CREATE POLICY "Máquinas por tenant" ON machines FOR ALL USING (tenant_id = (SELECT tenant_id FROM profiles WHERE id = auth.uid()));

-- Alertas
CREATE POLICY "Alertas por tenant" ON alerts FOR ALL USING (tenant_id = (SELECT tenant_id FROM profiles WHERE id = auth.uid()));

-- BUCKET PARA EVIDENCIAS FOTOGRÁFICAS
INSERT INTO storage.buckets (id, name, public) VALUES ('evidences', 'evidences', false);
CREATE POLICY "Evidencias aisladas por tenant" ON storage.objects FOR ALL USING (bucket_id = 'evidences' AND auth.role() = 'authenticated');
