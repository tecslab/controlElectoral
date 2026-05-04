import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import ParroquiaDetail from './ParroquiaDetail'

type Params = Promise<{ id: string }>

export default async function ParroquiaPage(props: { params: Params }) {
  const params = await props.params
  const supabase = await createClient()

  const { data: parroquia, error } = await supabase
    .from('parroquias')
    .select(`
      id, nombre, tipo, estado,
      recintos!recintos_id_parroquia_fkey (
        id, nombre, estado,
        juntas!juntas_id_recinto_fkey ( id )
      )
    `)
    .eq('id', params.id)
    .single()

  if (error || !parroquia) notFound()

  const numRecintos = parroquia.recintos?.length ?? 0
  const numJuntas = parroquia.recintos?.reduce(
    (sum: number, r: { juntas?: { id: string }[] }) => sum + (r.juntas?.length ?? 0),
    0
  ) ?? 0

  return (
    <ParroquiaDetail
      parroquia={{ ...parroquia, num_recintos: numRecintos, num_juntas: numJuntas }}
    />
  )
}
