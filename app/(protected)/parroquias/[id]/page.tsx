import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import ParroquiaDetail from './ParroquiaDetail'

type Params = Promise<{ id: string }>
type SearchParams = Promise<{ edit?: string }>

export default async function ParroquiaPage(props: { params: Params, searchParams: SearchParams }) {
  const params = await props.params
  const searchParams = await props.searchParams
  const supabase = await createClient()

  const { data: parroquia, error } = await supabase
    .from('parroquias')
    .select(`
      id, nombre, tipo, estado, created_at, created_by, updated_at, updated_by,
      cantones!parroquias_id_canton_fkey ( nombre ),
      recintos!recintos_id_parroquia_fkey (
        id, nombre, estado,
        juntas!juntas_id_recinto_fkey ( id )
      )
    `)
    .eq('id', params.id)
    .single()

  if (error || !parroquia) notFound()

  const userIds = [parroquia.created_by, parroquia.updated_by].filter(Boolean) as string[]
  let createdByName: string | null = null
  let updatedByName: string | null = null

  if (userIds.length > 0) {
    const { data: profiles } = await supabase
      .from('user_profiles')
      .select('id, display_name, email')
      .in('id', userIds)

    if (profiles) {
      const profileMap = new Map(profiles.map(p => [p.id, p.display_name || p.email || p.id]))
      if (parroquia.created_by) createdByName = profileMap.get(parroquia.created_by) ?? null
      if (parroquia.updated_by) updatedByName = profileMap.get(parroquia.updated_by) ?? null
    }
  }

  const numRecintos = parroquia.recintos?.length ?? 0
  const numJuntas = parroquia.recintos?.reduce(
    (sum: number, r: { juntas?: { id: string }[] }) => sum + (r.juntas?.length ?? 0),
    0
  ) ?? 0

  return (
    <ParroquiaDetail
      parroquia={{
        ...parroquia,
        num_recintos: numRecintos,
        num_juntas: numJuntas,
        canton_nombre: (parroquia.cantones as { nombre: string } | null)?.nombre ?? null,
        created_by_name: createdByName,
        updated_by_name: updatedByName,
      }}
      initEditing={searchParams.edit === 'true'}
    />
  )
}
