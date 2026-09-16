-- Migration for range-based Juntas generation and updates

CREATE OR REPLACE FUNCTION public.create_recinto_with_juntas(
  p_nombre VARCHAR(255),
  p_id_parroquia UUID,
  p_juntas_m_desde INT DEFAULT 0,
  p_juntas_m_hasta INT DEFAULT 0,
  p_juntas_f_desde INT DEFAULT 0,
  p_juntas_f_hasta INT DEFAULT 0
)
RETURNS UUID AS $$
DECLARE
  v_recinto_id UUID;
  i INT;
BEGIN
  INSERT INTO public.recintos (nombre, id_parroquia)
  VALUES (p_nombre, p_id_parroquia)
  RETURNING id INTO v_recinto_id;

  -- Create Masculine juntas
  IF p_juntas_m_desde > 0 AND p_juntas_m_hasta >= p_juntas_m_desde THEN
    FOR i IN p_juntas_m_desde..p_juntas_m_hasta LOOP
      INSERT INTO public.juntas (id_recinto, numero, sexo, estado)
      VALUES (v_recinto_id, i, 'M', 'Activo');
    END LOOP;
  END IF;

  -- Create Feminine juntas
  IF p_juntas_f_desde > 0 AND p_juntas_f_hasta >= p_juntas_f_desde THEN
    FOR i IN p_juntas_f_desde..p_juntas_f_hasta LOOP
      INSERT INTO public.juntas (id_recinto, numero, sexo, estado)
      VALUES (v_recinto_id, i, 'F', 'Activo');
    END LOOP;
  END IF;

  RETURN v_recinto_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.update_juntas_range(
  p_id_recinto UUID,
  p_m_desde INT DEFAULT 0,
  p_m_hasta INT DEFAULT 0,
  p_f_desde INT DEFAULT 0,
  p_f_hasta INT DEFAULT 0
)
RETURNS VOID AS $$
DECLARE
  i INT;
BEGIN
  -- Handle Masculine Juntas
  IF p_m_desde > 0 AND p_m_hasta >= p_m_desde THEN
    UPDATE public.juntas
    SET estado = 'Inactivo'
    WHERE id_recinto = p_id_recinto AND sexo = 'M' AND (numero < p_m_desde OR numero > p_m_hasta);

    FOR i IN p_m_desde..p_m_hasta LOOP
      INSERT INTO public.juntas (id_recinto, numero, sexo, estado)
      VALUES (p_id_recinto, i, 'M', 'Activo')
      ON CONFLICT (id_recinto, numero, sexo) DO UPDATE SET estado = 'Activo';
    END LOOP;
  ELSE
    UPDATE public.juntas SET estado = 'Inactivo' WHERE id_recinto = p_id_recinto AND sexo = 'M';
  END IF;

  -- Handle Feminine Juntas
  IF p_f_desde > 0 AND p_f_hasta >= p_f_desde THEN
    UPDATE public.juntas
    SET estado = 'Inactivo'
    WHERE id_recinto = p_id_recinto AND sexo = 'F' AND (numero < p_f_desde OR numero > p_f_hasta);

    FOR i IN p_f_desde..p_f_hasta LOOP
      INSERT INTO public.juntas (id_recinto, numero, sexo, estado)
      VALUES (p_id_recinto, i, 'F', 'Activo')
      ON CONFLICT (id_recinto, numero, sexo) DO UPDATE SET estado = 'Activo';
    END LOOP;
  ELSE
    UPDATE public.juntas SET estado = 'Inactivo' WHERE id_recinto = p_id_recinto AND sexo = 'F';
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION public.create_recinto_with_juntas TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.update_juntas_range TO anon, authenticated, service_role;
