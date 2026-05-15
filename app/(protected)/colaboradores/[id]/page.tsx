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
        id, apellidos, nombres, whatsapp, ya_contactado, rol,
        id_recinto_votacion, id_recinto_asignado, asiste_capacitacion,
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

  return <ColaboradorDetail colaborador={colab as ColaboradorRaw} recintos={recintos ?? []} parroquias={parroquias ?? []} initEditing={searchParams.edit === 'true'} />
}

// Type exported for use in client component
export type ColaboradorRaw = {
  id: string
  apellidos: string
  nombres: string
  whatsapp: string
  ya_contactado: string
  rol: string
  id_recinto_votacion: string | null
  id_recinto_asignado: string | null
  asiste_capacitacion: string
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
