-- 1. Tabla Cantones
CREATE TABLE IF NOT EXISTS public.cantones (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nombre VARCHAR(255) NOT NULL,
  estado VARCHAR(20) NOT NULL DEFAULT 'Activo',
  created_at TIMESTAMPTZ DEFAULT now(),
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL DEFAULT auth.uid(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  updated_by UUID REFERENCES auth.users(id) ON DELETE SET NULL DEFAULT auth.uid()
);

-- 2. Tabla Circunscripciones
CREATE TABLE IF NOT EXISTS public.circunscripciones (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  id_canton UUID NOT NULL REFERENCES public.cantones(id) ON DELETE CASCADE,
  nombre VARCHAR(255) NOT NULL,
  tipo VARCHAR(20) NOT NULL CHECK (tipo IN ('Urbana', 'Rural')),
  estado VARCHAR(20) NOT NULL DEFAULT 'Activo',
  created_at TIMESTAMPTZ DEFAULT now(),
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL DEFAULT auth.uid(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  updated_by UUID REFERENCES auth.users(id) ON DELETE SET NULL DEFAULT auth.uid()
);

-- 3. Actualizar Parroquias (id_canton e id_circunscripcion)
ALTER TABLE public.parroquias
  ADD COLUMN IF NOT EXISTS id_canton UUID REFERENCES public.cantones(id) ON DELETE RESTRICT,
  ADD COLUMN IF NOT EXISTS id_circunscripcion UUID REFERENCES public.circunscripciones(id) ON DELETE RESTRICT;

-- 4. Tabla Zonas
CREATE TABLE IF NOT EXISTS public.zonas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  id_parroquia UUID NOT NULL REFERENCES public.parroquias(id) ON DELETE CASCADE,
  codigo VARCHAR(50),
  nombre VARCHAR(255) NOT NULL,
  estado VARCHAR(20) NOT NULL DEFAULT 'Activo',
  created_at TIMESTAMPTZ DEFAULT now(),
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL DEFAULT auth.uid(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  updated_by UUID REFERENCES auth.users(id) ON DELETE SET NULL DEFAULT auth.uid()
);

-- 5. Actualizar Recintos (id_zona opcional)
ALTER TABLE public.recintos
  ADD COLUMN IF NOT EXISTS id_zona UUID REFERENCES public.zonas(id) ON DELETE RESTRICT;

-- 6. Trigger para herencia de 'tipo' de la Circunscripción en Parroquias
CREATE OR REPLACE FUNCTION public.handle_parroquia_tipo_inheritance()
RETURNS TRIGGER AS $$
DECLARE
  v_tipo VARCHAR(20);
BEGIN
  IF NEW.id_circunscripcion IS NOT NULL THEN
    SELECT tipo INTO v_tipo FROM public.circunscripciones WHERE id = NEW.id_circunscripcion;
    IF v_tipo IS NOT NULL THEN
      NEW.tipo := v_tipo;
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_parroquia_tipo_inheritance ON public.parroquias;
CREATE TRIGGER trg_parroquia_tipo_inheritance
BEFORE INSERT OR UPDATE ON public.parroquias
FOR EACH ROW EXECUTE FUNCTION public.handle_parroquia_tipo_inheritance();

-- 7. Triggers de Auditoría
DROP TRIGGER IF EXISTS trg_audit_cantones ON public.cantones;
CREATE TRIGGER trg_audit_cantones BEFORE INSERT OR UPDATE ON public.cantones
  FOR EACH ROW EXECUTE FUNCTION public.handle_audit_fields();

DROP TRIGGER IF EXISTS trg_audit_circunscripciones ON public.circunscripciones;
CREATE TRIGGER trg_audit_circunscripciones BEFORE INSERT OR UPDATE ON public.circunscripciones
  FOR EACH ROW EXECUTE FUNCTION public.handle_audit_fields();

DROP TRIGGER IF EXISTS trg_audit_zonas ON public.zonas;
CREATE TRIGGER trg_audit_zonas BEFORE INSERT OR UPDATE ON public.zonas
  FOR EACH ROW EXECUTE FUNCTION public.handle_audit_fields();
