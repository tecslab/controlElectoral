import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import CircunscripcionDetail from './CircunscripcionDetail'

type Params = Promise<{ id: string }>
type SearchParams = Promise<{ edit?: string }>

export default async function CircunscripcionPage(props: { params: Params; searchParams: SearchParams }) {
  const params = await props.params
  const searchParams = await props.searchParams
  const supabase = await createClient()

  const [{ data: circunscripcion, error }, { data: cantones }] = await Promise.all([
    supabase
      .from('circunscripciones')
      .select(`
        id, nombre, tipo, estado, id_canton, created_at, created_by, updated_at, updated_by,
        cantones!circunscripciones_id_canton_fkey ( nombre ),
        parroquias ( id )
      `)
      .eq('id', params.id)
      .single(),
    supabase.from('cantones').select('id, nombre').eq('estado', 'Activo').order('nombre'),
  ])

  if (error || !circunscripcion) notFound()

  const userIds = [circunscripcion.created_by, circunscripcion.updated_by].filter(Boolean) as string[]
  let createdByName: string | null = null
  let updatedByName: string | null = null

  if (userIds.length > 0) {
    const { data: profiles } = await supabase
      .from('user_profiles')
      .select('id, display_name, email')
      .in('id', userIds)

    if (profiles) {
      const profileMap = new Map(profiles.map(p => [p.id, p.display_name || p.email || p.id]))
      if (circunscripcion.created_by) createdByName = profileMap.get(circunscripcion.created_by) ?? null
      if (circunscripcion.updated_by) updatedByName = profileMap.get(circunscripcion.updated_by) ?? null
    }
  }

  return (
    <CircunscripcionDetail
      circunscripcion={{
        ...circunscripcion,
        canton_nombre: (circunscripcion.cantones as { nombre: string } | null)?.nombre ?? '—',
        num_parroquias: circunscripcion.parroquias?.length ?? 0,
        created_by_name: createdByName,
        updated_by_name: updatedByName,
      }}
      cantones={cantones ?? []}
      initEditing={searchParams.edit === 'true'}
    />
  )
}
