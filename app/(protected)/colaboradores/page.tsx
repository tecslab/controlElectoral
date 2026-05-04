import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import ColaboradorFilters from './ColaboradorFilters'

export const metadata = { title: 'Colaboradores — Control Electoral' }

const PAGE_SIZE = 100

type SearchParams = Promise<{
  nombre?: string
  contactado?: string
  rol?: string
  recinto?: string
  parroquia?: string
  capacitacion?: string
  page?: string
}>

export default async function ColaboradoresPage(props: { searchParams: SearchParams }) {
  const searchParams = await props.searchParams
  const supabase = await createClient()

  const page = parseInt(searchParams.page ?? '1') - 1
  const from = page * PAGE_SIZE
  const to = from + PAGE_SIZE - 1

  // Load filter data
  const [{ data: parroquias }, { data: recintos }] = await Promise.all([
    supabase.from('parroquias').select('id, nombre').eq('estado', 'Activo').order('nombre'),
    supabase.from('recintos').select('id, nombre').eq('estado', 'Activo').order('nombre'),
  ])

  let query = supabase
    .from('colaboradores')
    .select(`
      id, apellidos, nombres, whatsapp, ya_contactado, rol,
      asiste_capacitacion,
      recintos_asignado:recintos!colaboradores_id_recinto_asignado_fkey ( id, nombre, id_parroquia,
        parroquias!recintos_id_parroquia_fkey ( nombre )
      ),
      asignacion_juntas!asignacion_juntas_id_colaborador_fkey (
        estado,
        juntas!asignacion_juntas_id_junta_fkey ( numero, sexo )
      )
    `, { count: 'exact' })
    .order('apellidos')
    .range(from, to)

  if (searchParams.nombre) {
    query = query.ilike('apellidos', `%${searchParams.nombre}%`)
  }
  if (searchParams.contactado && searchParams.contactado !== 'Todos') {
    query = query.eq('ya_contactado', searchParams.contactado)
  }
  if (searchParams.rol && searchParams.rol !== 'Todos') {
    query = query.eq('rol', searchParams.rol)
  }
  if (searchParams.recinto) {
    query = query.eq('id_recinto_asignado', searchParams.recinto)
  }
  if (searchParams.capacitacion && searchParams.capacitacion !== 'Todos') {
    query = query.eq('asiste_capacitacion', searchParams.capacitacion)
  }

  const { data: colaboradores, count, error } = await query

  const totalPages = Math.ceil((count ?? 0) / PAGE_SIZE)

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Colaboradores</h1>
          <p className="page-subtitle">{count ?? 0} colaboradores encontrados</p>
        </div>
        <Link href="/colaboradores/nuevo" className="btn btn-primary" id="btn-nuevo-colaborador">
          ＋ Nuevo colaborador
        </Link>
      </div>

      <ColaboradorFilters
        filters={searchParams as Record<string, string>}
        parroquias={parroquias ?? []}
        recintos={recintos ?? []}
      />

      {error && (
        <div style={{ color: 'var(--color-danger)', marginBottom: '1rem' }}>
          Error: {error.message}
        </div>
      )}

      <div className="table-wrapper">
        <table>
          <thead>
            <tr>
              <th>Nombre</th>
              <th>WhatsApp</th>
              <th>Ya contactado</th>
              <th>Rol</th>
              <th>Recinto</th>
              <th>Parroquia</th>
              <th>Juntas asignadas</th>
              <th style={{ textAlign: 'right' }}>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {(!colaboradores || colaboradores.length === 0) ? (
              <tr>
                <td colSpan={8}>
                  <div className="empty-state">
                    <div className="empty-state-icon">👥</div>
                    <div>No se encontraron colaboradores</div>
                  </div>
                </td>
              </tr>
            ) : colaboradores.map(c => {
              const recinto = c.recintos_asignado as { nombre?: string; parroquias?: { nombre?: string } } | null
              const parroquiaNombre = recinto?.parroquias?.nombre ?? '—'
              const recintoNombre = recinto?.nombre ?? 'No asignado'

              // Compute junta range display
              const juntas = (c.asignacion_juntas ?? [])
                .filter((a: { estado: string }) => a.estado === 'Activo')
                .map((a: { juntas: { numero: number; sexo: string } | null }) => a.juntas)
                .filter(Boolean) as { numero: number; sexo: string }[]

              const juntasRange = computeJuntasRange(juntas)

              const contactadoBadge: Record<string, string> = {
                'Sí': 'badge-green',
                'No': 'badge-gray',
                'No responde': 'badge-red',
                'Volver a contactar': 'badge-yellow',
              }

              return (
                <tr key={c.id}>
                  <td style={{ fontWeight: 500 }}>{c.apellidos} {c.nombres}</td>
                  <td style={{ fontFamily: 'monospace', fontSize: '0.85rem' }}>{c.whatsapp}</td>
                  <td>
                    <span className={`badge ${contactadoBadge[c.ya_contactado] ?? 'badge-gray'}`}>
                      {c.ya_contactado}
                    </span>
                  </td>
                  <td>
                    <span className={`badge ${c.rol === 'MJRV' ? 'badge-blue' : 'badge-gray'}`}>
                      {c.rol}
                    </span>
                  </td>
                  <td style={{ color: recinto ? 'var(--color-text)' : 'var(--color-text-faint)' }}>
                    {recintoNombre}
                  </td>
                  <td style={{ color: 'var(--color-text-muted)' }}>{parroquiaNombre}</td>
                  <td style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', fontFamily: 'monospace' }}>
                    {juntasRange || '—'}
                  </td>
                  <td style={{ textAlign: 'right' }}>
                    <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
                      <Link href={`/colaboradores/${c.id}`} className="btn btn-secondary btn-xs">Ver</Link>
                      <Link href={`/colaboradores/${c.id}/editar`} className="btn btn-ghost btn-xs">Editar</Link>
                    </div>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="pagination">
          <span>Página {page + 1} de {totalPages}</span>
          {page > 0 && (
            <Link href={`/colaboradores?page=${page}`} className="btn btn-secondary btn-xs">← Anterior</Link>
          )}
          {page + 1 < totalPages && (
            <Link href={`/colaboradores?page=${page + 2}`} className="btn btn-secondary btn-xs">Siguiente →</Link>
          )}
        </div>
      )}
    </div>
  )
}

function computeJuntasRange(juntas: { numero: number; sexo: string }[]): string {
  if (!juntas.length) return ''

  const byGender: Record<string, number[]> = { M: [], F: [] }
  juntas.forEach(j => {
    if (!byGender[j.sexo]) byGender[j.sexo] = []
    byGender[j.sexo].push(j.numero)
  })

  const parts: string[] = []
  for (const sexo of ['M', 'F']) {
    const nums = byGender[sexo]?.sort((a, b) => a - b) ?? []
    if (!nums.length) continue
    parts.push(`${nums[0]}${sexo}–${nums[nums.length - 1]}${sexo}`)
  }

  return parts.join(', ')
}
