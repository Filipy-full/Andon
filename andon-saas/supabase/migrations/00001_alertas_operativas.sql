CREATE TABLE IF NOT EXISTS public.alertas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  maquina_id TEXT,
  zona_id TEXT,
  galpon_id TEXT,
  tipo_alerta TEXT NOT NULL,
  descripcion TEXT,
  estado TEXT NOT NULL DEFAULT 'Pendiente',
  foto_base64 TEXT,
  operario_id TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.alertas ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "alertas_public_select" ON public.alertas;
CREATE POLICY "alertas_public_select" ON public.alertas
  FOR SELECT TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "alertas_public_insert" ON public.alertas;
CREATE POLICY "alertas_public_insert" ON public.alertas
  FOR INSERT TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "alertas_public_update" ON public.alertas;
CREATE POLICY "alertas_public_update" ON public.alertas
  FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime'
      AND schemaname = 'public'
      AND tablename = 'alertas'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.alertas;
  END IF;
END
$$;