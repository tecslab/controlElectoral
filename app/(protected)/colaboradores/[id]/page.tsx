import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import ColaboradorDetail from './ColaboradorDetail'

type Params = Promise<{ id: string }>
type SearchParams = Promise<{ edit?: string }>

export default async function ColaboradorPage(props: { params: Params, searchParams: SearchParams }) {
  const params = await props.params
  const searchParams = await props.searchParams
  const supabase = await createClient()

  const [
    { data: colab, error },
    { data: recintos },
    { data: parroquias },
  ] = await Promise.all([
    supabase
      .from('colaboradores')
      .select(`
        id, apellidos, nombres, whatsapp, email, cedula, ya_contactado, rol,
        id_recinto_votacion, id_recinto_asignado, asiste_capacitacion,
        created_at, created_by, updated_at, updated_by,
        asignacion_juntas!asignacion_juntas_id_colaborador_fkey (
          id, estado,
          juntas!asignacion_juntas_id_junta_fkey ( id, numero, sexo )
        ),
        observaciones_colaboradores!observaciones_colaboradores_id_colaborador_fkey (
          id, texto, created_at
        )
      `)
      .eq('id', params.id)
      .single(),
    supabase.from('recintos').select('id, nombre, id_parroquia, parroquias!recintos_id_parroquia_fkey(nombre)')
      .eq('estado', 'Activo').order('nombre'),
    supabase.from('parroquias').select('id, nombre').eq('estado', 'Activo').order('nombre'),
  ])

  if (error || !colab) notFound()

  const userIds = [colab.created_by, colab.updated_by].filter(Boolean) as string[]
  let createdByName: string | null = null
  let updatedByName: string | null = null

  if (userIds.length > 0) {
    const { data: profiles } = await supabase
      .from('user_profiles')
      .select('id, display_name, email')
      .in('id', userIds)

    if (profiles) {
      const profileMap = new Map(profiles.map(p => [p.id, p.display_name || p.email || p.id]))
      if (colab.created_by) createdByName = profileMap.get(colab.created_by) ?? null
      if (colab.updated_by) updatedByName = profileMap.get(colab.updated_by) ?? null
    }
  }

  const colabWithAudit = {
    ...colab,
    created_by_name: createdByName,
    updated_by_name: updatedByName,
  }

  return <ColaboradorDetail colaborador={colabWithAudit as ColaboradorRaw} recintos={recintos ?? []} parroquias={parroquias ?? []} initEditing={searchParams.edit === 'true'} />
}

// Type exported for use in client component
export type ColaboradorRaw = {
  id: string
  apellidos: string
  nombres: string
  whatsapp: string
  email: string | null
  cedula: string | null
  ya_contactado: string
  rol: string
  id_recinto_votacion: string | null
  id_recinto_asignado: string | null
  asiste_capacitacion: string
  created_at?: string
  created_by?: string | null
  created_by_name?: string | null
  updated_at?: string
  updated_by?: string | null
  updated_by_name?: string | null
  asignacion_juntas: {
    id: string
    estado: string
    juntas: { id: string; numero: number; sexo: string } | null
  }[]
  observaciones_colaboradores: {
    id: string
    texto: string
    created_at: string
  }[]
}
