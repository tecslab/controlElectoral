import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import ZonaDetail from './ZonaDetail'

type Params = Promise<{ id: string }>
type SearchParams = Promise<{ edit?: string }>

export default async function ZonaPage(props: { params: Params; searchParams: SearchParams }) {
  const params = await props.params
  const searchParams = await props.searchParams
  const supabase = await createClient()

  const [{ data: zona, error }, { data: parroquias }] = await Promise.all([
    supabase
      .from('zonas')
      .select(`
        id, nombre, codigo, estado, id_parroquia, created_at, created_by, updated_at, updated_by,
        parroquias!zonas_id_parroquia_fkey ( nombre ),
        recintos ( id )
      `)
      .eq('id', params.id)
      .single(),
    supabase.from('parroquias').select('id, nombre').eq('estado', 'Activo').order('nombre'),
  ])

  if (error || !zona) notFound()

  const userIds = [zona.created_by, zona.updated_by].filter(Boolean) as string[]
  let createdByName: string | null = null
  let updatedByName: string | null = null

  if (userIds.length > 0) {
    const { data: profiles } = await supabase
      .from('user_profiles')
      .select('id, display_name, email')
      .in('id', userIds)

    if (profiles) {
      const profileMap = new Map(profiles.map(p => [p.id, p.display_name || p.email || p.id]))
      if (zona.created_by) createdByName = profileMap.get(zona.created_by) ?? null
      if (zona.updated_by) updatedByName = profileMap.get(zona.updated_by) ?? null
    }
  }

  return (
    <ZonaDetail
      zona={{
        ...zona,
        parroquia_nombre: (zona.parroquias as { nombre: string } | null)?.nombre ?? '—',
        num_recintos: zona.recintos?.length ?? 0,
        created_by_name: createdByName,
        updated_by_name: updatedByName,
      }}
      parroquias={parroquias ?? []}
      initEditing={searchParams.edit === 'true'}
    />
  )
}
