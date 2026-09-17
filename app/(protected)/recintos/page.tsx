import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import RecintoFilters from './RecintoFilters'
import { ENABLE_ELECTORAL_STRUCTURE_CREATION, ENABLE_ELECTORAL_STRUCTURE_EDITING } from '@/lib/features'

export const metadata = { title: 'Recintos — Control Electoral' }

const PAGE_SIZE = 50
type SearchParams = Promise<{ estado?: string; parroquia?: string; nombre?: string; page?: string }>

export default async function RecintosPage(props: { searchParams: SearchParams }) {
  const searchParams = await props.searchParams
  const supabase = await createClient()

  const estadoFilter = searchParams.estado ?? 'Activo'
  const parroquiaFilter = searchParams.parroquia ?? ''
  const nombreFilter = searchParams.nombre ?? ''
  const page = Math.max(1, Number(searchParams.page) || 1)
  const from = (page - 1) * PAGE_SIZE

  // Load parroquias for filter dropdown
  const { data: parroquias } = await supabase
    .from('parroquias')
    .select('id, nombre')
    .eq('estado', 'Activo')
    .order('nombre')

  let query = supabase
    .from('recintos_list_summary')
    .select('*', { count: 'exact' })
    .order('nombre')

  if (estadoFilter && estadoFilter !== 'Todos') {
    query = query.eq('estado', estadoFilter)
  }
  if (parroquiaFilter) {
    query = query.eq('id_parroquia', parroquiaFilter)
  }
  if (nombreFilter) {
    query = query.ilike('nombre', `%${nombreFilter}%`)
  }

  const { data: recintos, error, count } = await query.range(from, from + PAGE_SIZE - 1)
  const totalPages = Math.max(1, Math.ceil((count ?? 0) / PAGE_SIZE))
  const pageHref = (nextPage: number) => {
    const params = new URLSearchParams()
    if (estadoFilter !== 'Activo') params.set('estado', estadoFilter)
    if (parroquiaFilter) params.set('parroquia', parroquiaFilter)
    if (nombreFilter) params.set('nombre', nombreFilter)
    params.set('page', String(nextPage))
    return `/recintos?${params}`
  }

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Recintos</h1>
          <p className="page-subtitle">{count ?? 0} recintos encontrados</p>
        </div>
        {ENABLE_ELECTORAL_STRUCTURE_CREATION && (
          <Link href="/recintos/nuevo" className="btn btn-primary" id="btn-nuevo-recinto">
            ＋ Nuevo recinto
          </Link>
        )}
      </div>

      <RecintoFilters
        estadoFilter={estadoFilter}
        parroquiaFilter={parroquiaFilter}
        nombreFilter={nombreFilter}
        parroquias={parroquias ?? []}
      />

      {error && (
        <div style={{ color: 'var(--color-danger)', marginBottom: '1rem' }}>
          Error cargando datos: {error.message}
        </div>
      )}

      <div className="table-wrapper">
        <table>
          <thead>
            <tr>
              <th>Nombre</th>
              <th>Parroquia</th>
              <th># Juntas Activas</th>
              <th>Juntas no asignadas</th>
              <th>Estado</th>
              <th style={{ textAlign: 'right' }}>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {(!recintos || recintos.length === 0) ? (
              <tr>
                <td colSpan={6}>
                  <div className="empty-state">
                    <div className="empty-state-icon">🏫</div>
                    <div>No se encontraron recintos</div>
                  </div>
                </td>
              </tr>
            ) : recintos.map(r => {
              return (
                <tr key={r.id}>
                  <td style={{ fontWeight: 500 }}>{r.nombre}</td>
                  <td style={{ color: 'var(--color-text-muted)' }}>{r.parroquia_nombre ?? '—'}</td>
                  <td>{r.juntas_activas}</td>
                  <td>{r.juntas_no_asignadas}</td>
                  <td>
                    <span className={`badge ${r.estado === 'Activo' ? 'badge-green' : 'badge-red'}`}>
                      {r.estado}
                    </span>
                  </td>
                  <td style={{ textAlign: 'right' }}>
                    <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
                      <Link href={`/recintos/${r.id}`} className="btn btn-secondary btn-xs">Ver</Link>
                      {ENABLE_ELECTORAL_STRUCTURE_EDITING && (
                        <Link href={`/recintos/${r.id}?edit=true`} className="btn btn-ghost btn-xs">Editar</Link>
                      )}
                    </div>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
      {totalPages > 1 && (
        <div className="pagination">
          <span>Página {page} de {totalPages}</span>
          {page > 1 && <Link href={pageHref(page - 1)} className="btn btn-secondary btn-xs">← Anterior</Link>}
          {page < totalPages && <Link href={pageHref(page + 1)} className="btn btn-secondary btn-xs">Siguiente →</Link>}
        </div>
      )}
    </div>
  )
}
