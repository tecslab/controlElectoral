-- Indexes for list filters and summary joins.
CREATE EXTENSION IF NOT EXISTS pg_trgm;
CREATE INDEX IF NOT EXISTS recintos_estado_parroquia_idx ON public.recintos (estado, id_parroquia);
CREATE INDEX IF NOT EXISTS recintos_nombre_trgm_idx ON public.recintos USING gin (nombre gin_trgm_ops);
CREATE INDEX IF NOT EXISTS juntas_recinto_estado_idx ON public.juntas (id_recinto, estado);
CREATE INDEX IF NOT EXISTS asignacion_juntas_junta_estado_idx ON public.asignacion_juntas (id_junta, estado);
CREATE INDEX IF NOT EXISTS parroquias_estado_tipo_idx ON public.parroquias (estado, tipo);
CREATE INDEX IF NOT EXISTS zonas_parroquia_idx ON public.zonas (id_parroquia);

CREATE OR REPLACE VIEW public.recintos_list_summary WITH (security_invoker = true) AS
SELECT
  r.id,
  r.nombre,
  r.estado,
  r.id_parroquia,
  p.nombre AS parroquia_nombre,
  COUNT(j.id)::INTEGER AS juntas_activas,
  COUNT(j.id) FILTER (
    WHERE NOT EXISTS (
      SELECT 1 FROM public.asignacion_juntas aj
      WHERE aj.id_junta = j.id AND aj.estado = 'Activo'
    )
  )::INTEGER AS juntas_no_asignadas
FROM public.recintos r
LEFT JOIN public.parroquias p ON p.id = r.id_parroquia
LEFT JOIN public.juntas j ON j.id_recinto = r.id AND j.estado = 'Activo'
GROUP BY r.id, r.nombre, r.estado, r.id_parroquia, p.nombre;

CREATE OR REPLACE VIEW public.parroquias_list_summary WITH (security_invoker = true) AS
SELECT
  p.id,
  p.nombre,
  p.tipo,
  p.estado,
  p.id_canton,
  c.nombre AS canton_nombre,
  COUNT(DISTINCT r.id)::INTEGER AS num_recintos,
  COUNT(j.id)::INTEGER AS num_juntas,
  COUNT(j.id) FILTER (
    WHERE NOT EXISTS (
      SELECT 1 FROM public.asignacion_juntas aj
      WHERE aj.id_junta = j.id AND aj.estado = 'Activo'
    )
  )::INTEGER AS juntas_no_asignadas
FROM public.parroquias p
LEFT JOIN public.cantones c ON c.id = p.id_canton
LEFT JOIN public.recintos r ON r.id_parroquia = p.id
LEFT JOIN public.juntas j ON j.id_recinto = r.id
GROUP BY p.id, p.nombre, p.tipo, p.estado, p.id_canton, c.nombre;

CREATE OR REPLACE VIEW public.zonas_list_summary WITH (security_invoker = true) AS
SELECT
  z.id,
  z.codigo,
  z.nombre,
  z.estado,
  z.id_parroquia,
  p.nombre AS parroquia_nombre,
  COUNT(r.id)::INTEGER AS num_recintos
FROM public.zonas z
LEFT JOIN public.parroquias p ON p.id = z.id_parroquia
LEFT JOIN public.recintos r ON r.id_zona = z.id
GROUP BY z.id, z.codigo, z.nombre, z.estado, z.id_parroquia, p.nombre;

GRANT SELECT ON public.recintos_list_summary, public.parroquias_list_summary, public.zonas_list_summary
  TO anon, authenticated, service_role;
