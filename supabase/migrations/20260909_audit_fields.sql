-- 1. Trigger Function for Audit Fields
CREATE OR REPLACE FUNCTION public.handle_audit_fields()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    NEW.created_by := COALESCE(NEW.created_by, auth.uid());
    NEW.updated_by := COALESCE(NEW.updated_by, auth.uid());
    NEW.created_at := COALESCE(NEW.created_at, now());
    NEW.updated_at := COALESCE(NEW.updated_at, now());
  ELSIF TG_OP = 'UPDATE' THEN
    NEW.updated_by := auth.uid();
    NEW.updated_at := now();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. Add Audit Columns to Tables

-- Parroquias
ALTER TABLE public.parroquias 
  ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL DEFAULT auth.uid(),
  ADD COLUMN IF NOT EXISTS updated_by UUID REFERENCES auth.users(id) ON DELETE SET NULL DEFAULT auth.uid(),
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT now();

-- Recintos
ALTER TABLE public.recintos 
  ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL DEFAULT auth.uid(),
  ADD COLUMN IF NOT EXISTS updated_by UUID REFERENCES auth.users(id) ON DELETE SET NULL DEFAULT auth.uid(),
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT now();

-- Colaboradores
ALTER TABLE public.colaboradores 
  ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL DEFAULT auth.uid(),
  ADD COLUMN IF NOT EXISTS updated_by UUID REFERENCES auth.users(id) ON DELETE SET NULL DEFAULT auth.uid(),
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT now();

-- Asignacion Juntas
ALTER TABLE public.asignacion_juntas 
  ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL DEFAULT auth.uid(),
  ADD COLUMN IF NOT EXISTS updated_by UUID REFERENCES auth.users(id) ON DELETE SET NULL DEFAULT auth.uid(),
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT now();

-- Observaciones Colaboradores
ALTER TABLE public.observaciones_colaboradores 
  ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL DEFAULT auth.uid(),
  ADD COLUMN IF NOT EXISTS updated_by UUID REFERENCES auth.users(id) ON DELETE SET NULL DEFAULT auth.uid(),
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT now();

-- Juntas
ALTER TABLE public.juntas 
  ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL DEFAULT auth.uid(),
  ADD COLUMN IF NOT EXISTS updated_by UUID REFERENCES auth.users(id) ON DELETE SET NULL DEFAULT auth.uid(),
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT now();

-- 3. Attach Triggers to Tables

DROP TRIGGER IF EXISTS trg_audit_parroquias ON public.parroquias;
CREATE TRIGGER trg_audit_parroquias BEFORE INSERT OR UPDATE ON public.parroquias
  FOR EACH ROW EXECUTE FUNCTION public.handle_audit_fields();

DROP TRIGGER IF EXISTS trg_audit_recintos ON public.recintos;
CREATE TRIGGER trg_audit_recintos BEFORE INSERT OR UPDATE ON public.recintos
  FOR EACH ROW EXECUTE FUNCTION public.handle_audit_fields();

DROP TRIGGER IF EXISTS trg_audit_colaboradores ON public.colaboradores;
CREATE TRIGGER trg_audit_colaboradores BEFORE INSERT OR UPDATE ON public.colaboradores
  FOR EACH ROW EXECUTE FUNCTION public.handle_audit_fields();

DROP TRIGGER IF EXISTS trg_audit_asignacion_juntas ON public.asignacion_juntas;
CREATE TRIGGER trg_audit_asignacion_juntas BEFORE INSERT OR UPDATE ON public.asignacion_juntas
  FOR EACH ROW EXECUTE FUNCTION public.handle_audit_fields();

DROP TRIGGER IF EXISTS trg_audit_observaciones_colaboradores ON public.observaciones_colaboradores;
CREATE TRIGGER trg_audit_observaciones_colaboradores BEFORE INSERT OR UPDATE ON public.observaciones_colaboradores
  FOR EACH ROW EXECUTE FUNCTION public.handle_audit_fields();

DROP TRIGGER IF EXISTS trg_audit_juntas ON public.juntas;
CREATE TRIGGER trg_audit_juntas BEFORE INSERT OR UPDATE ON public.juntas
  FOR EACH ROW EXECUTE FUNCTION public.handle_audit_fields();

-- 4. User Profiles View
CREATE OR REPLACE VIEW public.user_profiles AS
SELECT 
  id,
  email,
  COALESCE(raw_user_meta_data->>'full_name', email) AS display_name
FROM auth.users;

GRANT SELECT ON public.user_profiles TO authenticated;
