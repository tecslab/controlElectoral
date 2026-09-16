-- Grants and RLS policies for Geografia Electoral tables

GRANT ALL ON TABLE public.cantones TO anon, authenticated, service_role, postgres;
GRANT ALL ON TABLE public.circunscripciones TO anon, authenticated, service_role, postgres;
GRANT ALL ON TABLE public.zonas TO anon, authenticated, service_role, postgres;

ALTER TABLE public.cantones ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.circunscripciones ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.zonas ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow read/write on cantones" ON public.cantones;
CREATE POLICY "Allow read/write on cantones" ON public.cantones FOR ALL TO authenticated, anon USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow read/write on circunscripciones" ON public.circunscripciones;
CREATE POLICY "Allow read/write on circunscripciones" ON public.circunscripciones FOR ALL TO authenticated, anon USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow read/write on zonas" ON public.zonas;
CREATE POLICY "Allow read/write on zonas" ON public.zonas FOR ALL TO authenticated, anon USING (true) WITH CHECK (true);
