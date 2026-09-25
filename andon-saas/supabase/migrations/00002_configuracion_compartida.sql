CREATE TABLE IF NOT EXISTS public.app_state (
  id TEXT PRIMARY KEY,
  payload JSONB NOT NULL DEFAULT '{}'::jsonb,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.app_state ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "app_state_public_select" ON public.app_state;
CREATE POLICY "app_state_public_select" ON public.app_state
  FOR SELECT TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "app_state_public_insert" ON public.app_state;
CREATE POLICY "app_state_public_insert" ON public.app_state
  FOR INSERT TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "app_state_public_update" ON public.app_state;
CREATE POLICY "app_state_public_update" ON public.app_state
  FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime'
      AND schemaname = 'public'
      AND tablename = 'app_state'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.app_state;
  END IF;
END
$$;