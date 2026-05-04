import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import RecintoDetail from './RecintoDetail'

type Params = Promise<{ id: string }>

export default async function RecintoPage(props: { params: Params }) {
  const params = await props.params
  const supabase = await createClient()

  const [{ data: recinto, error }, { data: parroquias }] = await Promise.all([
    supabase
      .from('recintos')
      .select(`
        id, nombre, estado, id_parroquia,
        parroquias!recintos_id_parroquia_fkey ( nombre ),
        juntas!juntas_id_recinto_fkey ( id, numero, sexo, estado )
      `)
      .eq('id', params.id)
      .single(),
    supabase.from('parroquias').select('id, nombre').eq('estado', 'Activo').order('nombre'),
  ])

  if (error || !recinto) notFound()

  const juntasM = (recinto.juntas ?? []).filter((j: { sexo: string; estado: string }) => j.sexo === 'M' && j.estado === 'Activo').length
  const juntasF = (recinto.juntas ?? []).filter((j: { sexo: string; estado: string }) => j.sexo === 'F' && j.estado === 'Activo').length

  return (
    <RecintoDetail
      recinto={{
        ...recinto,
        juntas_m: juntasM,
        juntas_f: juntasF,
        parroquia_nombre: (recinto.parroquias as { nombre: string } | null)?.nombre ?? '—',
      }}
      parroquias={parroquias ?? []}
    />
  )
}
