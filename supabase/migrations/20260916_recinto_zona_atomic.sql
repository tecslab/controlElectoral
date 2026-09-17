-- Include the optional zone in the same transaction that creates a recinto and its juntas.
DROP FUNCTION IF EXISTS public.create_recinto_with_juntas(VARCHAR, UUID, INT, INT, INT, INT);

CREATE FUNCTION public.create_recinto_with_juntas(
  p_nombre VARCHAR(255),
  p_id_parroquia UUID,
  p_juntas_m_desde INT DEFAULT 0,
  p_juntas_m_hasta INT DEFAULT 0,
  p_juntas_f_desde INT DEFAULT 0,
  p_juntas_f_hasta INT DEFAULT 0,
  p_id_zona UUID DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
  v_recinto_id UUID;
  i INT;
BEGIN
  IF p_id_zona IS NOT NULL AND NOT EXISTS (
    SELECT 1
    FROM public.zonas
    WHERE id = p_id_zona
      AND id_parroquia = p_id_parroquia
      AND estado <> 'Inactivo'
  ) THEN
    RAISE EXCEPTION 'La zona debe estar activa y pertenecer a la parroquia seleccionada';
  END IF;

  INSERT INTO public.recintos (nombre, id_parroquia, id_zona)
  VALUES (p_nombre, p_id_parroquia, p_id_zona)
  RETURNING id INTO v_recinto_id;

  IF p_juntas_m_desde > 0 AND p_juntas_m_hasta >= p_juntas_m_desde THEN
    FOR i IN p_juntas_m_desde..p_juntas_m_hasta LOOP
      INSERT INTO public.juntas (id_recinto, numero, sexo, estado)
      VALUES (v_recinto_id, i, 'M', 'Activo');
    END LOOP;
  END IF;

  IF p_juntas_f_desde > 0 AND p_juntas_f_hasta >= p_juntas_f_desde THEN
    FOR i IN p_juntas_f_desde..p_juntas_f_hasta LOOP
      INSERT INTO public.juntas (id_recinto, numero, sexo, estado)
      VALUES (v_recinto_id, i, 'F', 'Activo');
    END LOOP;
  END IF;

  RETURN v_recinto_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION public.create_recinto_with_juntas(VARCHAR, UUID, INT, INT, INT, INT, UUID)
  TO anon, authenticated, service_role;
