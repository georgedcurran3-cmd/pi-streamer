CREATE TABLE public.pairings (
  code TEXT PRIMARY KEY,
  device_name TEXT NOT NULL DEFAULT 'Curran TV',
  remote_name TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  last_seen TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.pairings TO anon, authenticated;
GRANT ALL ON public.pairings TO service_role;
ALTER TABLE public.pairings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "pairings_open" ON public.pairings FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

CREATE TABLE public.my_list (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT NOT NULL,
  item_key TEXT NOT NULL,
  media_type TEXT NOT NULL,
  tmdb_id BIGINT,
  video_id TEXT,
  title TEXT NOT NULL,
  poster TEXT,
  backdrop TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (code, item_key)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.my_list TO anon, authenticated;
GRANT ALL ON public.my_list TO service_role;
ALTER TABLE public.my_list ENABLE ROW LEVEL SECURITY;
CREATE POLICY "my_list_open" ON public.my_list FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

CREATE TABLE public.watch_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT NOT NULL,
  item_key TEXT NOT NULL,
  media_type TEXT NOT NULL,
  tmdb_id BIGINT,
  video_id TEXT,
  season INTEGER,
  episode INTEGER,
  title TEXT NOT NULL,
  subtitle TEXT,
  poster TEXT,
  backdrop TEXT,
  position_seconds INTEGER NOT NULL DEFAULT 0,
  duration_seconds INTEGER NOT NULL DEFAULT 0,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (code, item_key)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.watch_progress TO anon, authenticated;
GRANT ALL ON public.watch_progress TO service_role;
ALTER TABLE public.watch_progress ENABLE ROW LEVEL SECURITY;
CREATE POLICY "watch_progress_open" ON public.watch_progress FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

CREATE TABLE public.device_settings (
  code TEXT PRIMARY KEY,
  settings JSONB NOT NULL DEFAULT '{}'::jsonb,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.device_settings TO anon, authenticated;
GRANT ALL ON public.device_settings TO service_role;
ALTER TABLE public.device_settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "device_settings_open" ON public.device_settings FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

ALTER PUBLICATION supabase_realtime ADD TABLE public.watch_progress;
ALTER PUBLICATION supabase_realtime ADD TABLE public.my_list;