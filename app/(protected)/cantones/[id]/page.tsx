import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import CantonDetail from './CantonDetail'

type Params = Promise<{ id: string }>
type SearchParams = Promise<{ edit?: string }>

export default async function CantonPage(props: { params: Params; searchParams: SearchParams }) {
  const params = await props.params
  const searchParams = await props.searchParams
  const supabase = await createClient()

  const { data: canton, error } = await supabase
    .from('cantones')
    .select(`
      id, nombre, estado, created_at, created_by, updated_at, updated_by,
      circunscripciones ( id ),
      parroquias ( id )
    `)
    .eq('id', params.id)
    .single()

  if (error || !canton) notFound()

  const userIds = [canton.created_by, canton.updated_by].filter(Boolean) as string[]
  let createdByName: string | null = null
  let updatedByName: string | null = null

  if (userIds.length > 0) {
    const { data: profiles } = await supabase
      .from('user_profiles')
      .select('id, display_name, email')
      .in('id', userIds)

    if (profiles) {
      const profileMap = new Map(profiles.map(p => [p.id, p.display_name || p.email || p.id]))
      if (canton.created_by) createdByName = profileMap.get(canton.created_by) ?? null
      if (canton.updated_by) updatedByName = profileMap.get(canton.updated_by) ?? null
    }
  }

  return (
    <CantonDetail
      canton={{
        ...canton,
        num_circunscripciones: canton.circunscripciones?.length ?? 0,
        num_parroquias: canton.parroquias?.length ?? 0,
        created_by_name: createdByName,
        updated_by_name: updatedByName,
      }}
      initEditing={searchParams.edit === 'true'}
    />
  )
}
