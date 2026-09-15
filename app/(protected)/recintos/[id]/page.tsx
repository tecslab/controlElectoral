import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import RecintoDetail from './RecintoDetail'

type Params = Promise<{ id: string }>
type SearchParams = Promise<{ edit?: string }>

export default async function RecintoPage(props: { params: Params, searchParams: SearchParams }) {
  const params = await props.params
  const searchParams = await props.searchParams
  const supabase = await createClient()

  const [{ data: recinto, error }, { data: parroquias }, { data: zonas }] = await Promise.all([
    supabase
      .from('recintos')
      .select(`
        id, nombre, estado, id_parroquia, id_zona, created_at, created_by, updated_at, updated_by,
        parroquias!recintos_id_parroquia_fkey ( nombre ),
        zonas!recintos_id_zona_fkey ( id, nombre, codigo ),
        juntas!juntas_id_recinto_fkey ( id, numero, sexo, estado )
      `)
      .eq('id', params.id)
      .single(),
    supabase.from('parroquias').select('id, nombre').neq('estado', 'Inactivo').order('nombre'),
    supabase.from('zonas').select('id, nombre, codigo, id_parroquia').neq('estado', 'Inactivo').order('nombre'),
  ])

  if (error || !recinto) notFound()

  const userIds = [recinto.created_by, recinto.updated_by].filter(Boolean) as string[]
  let createdByName: string | null = null
  let updatedByName: string | null = null

  if (userIds.length > 0) {
    const { data: profiles } = await supabase
      .from('user_profiles')
      .select('id, display_name, email')
      .in('id', userIds)

    if (profiles) {
      const profileMap = new Map(profiles.map(p => [p.id, p.display_name || p.email || p.id]))
      if (recinto.created_by) createdByName = profileMap.get(recinto.created_by) ?? null
      if (recinto.updated_by) updatedByName = profileMap.get(recinto.updated_by) ?? null
    }
  }

  const juntasM = (recinto.juntas ?? []).filter((j: { sexo: string; estado: string }) => j.sexo === 'M' && j.estado === 'Activo').length
  const juntasF = (recinto.juntas ?? []).filter((j: { sexo: string; estado: string }) => j.sexo === 'F' && j.estado === 'Activo').length

  return (
    <RecintoDetail
      recinto={{
        ...recinto,
        juntas_m: juntasM,
        juntas_f: juntasF,
        parroquia_nombre: (recinto.parroquias as { nombre: string } | null)?.nombre ?? '—',
        zona_nombre: (recinto.zonas as { nombre: string; codigo?: string | null } | null)?.nombre ?? null,
        created_by_name: createdByName,
        updated_by_name: updatedByName,
      }}
      parroquias={parroquias ?? []}
      zonas={zonas ?? []}
      initEditing={searchParams.edit === 'true'}
    />
  )
}
