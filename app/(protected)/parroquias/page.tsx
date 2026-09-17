import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import ParroquiaFilters from './ParroquiaFilters'
import { ENABLE_ELECTORAL_STRUCTURE_CREATION, ENABLE_ELECTORAL_STRUCTURE_EDITING } from '@/lib/features'

export const metadata = {
  title: 'Parroquias — Control Electoral',
}

const PAGE_SIZE = 50
type SearchParams = Promise<{ estado?: string; tipo?: string; page?: string }>

export default async function ParroquiasPage(props: { searchParams: SearchParams }) {
  const searchParams = await props.searchParams
  const supabase = await createClient()

  const estadoFilter = searchParams.estado ?? 'Activo'
  const tipoFilter = searchParams.tipo ?? ''
  const page = Math.max(1, Number(searchParams.page) || 1)
  const from = (page - 1) * PAGE_SIZE

  let query = supabase
    .from('parroquias_list_summary')
    .select('*', { count: 'exact' })
    .order('nombre')

  if (estadoFilter && estadoFilter !== 'Todos') {
    query = query.eq('estado', estadoFilter)
  }
  if (tipoFilter && tipoFilter !== 'Todos') {
    query = query.eq('tipo', tipoFilter)
  }

  const { data: parroquias, error, count } = await query.range(from, from + PAGE_SIZE - 1)
  const totalPages = Math.max(1, Math.ceil((count ?? 0) / PAGE_SIZE))
  const pageHref = (nextPage: number) => {
    const params = new URLSearchParams()
    if (estadoFilter !== 'Activo') params.set('estado', estadoFilter)
    if (tipoFilter) params.set('tipo', tipoFilter)
    params.set('page', String(nextPage))
    return `/parroquias?${params}`
  }

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Parroquias</h1>
          <p className="page-subtitle">{count ?? 0} parroquias encontradas</p>
        </div>
        {ENABLE_ELECTORAL_STRUCTURE_CREATION && (
          <Link href="/parroquias/nueva" className="btn btn-primary" id="btn-nueva-parroquia">
            ＋ Nueva parroquia
          </Link>
        )}
      </div>

      <ParroquiaFilters estadoFilter={estadoFilter} tipoFilter={tipoFilter} />

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
              <th>Cantón</th>
              <th>Tipo</th>
              <th># Recintos</th>
              <th># Juntas</th>
              <th>Juntas no asignadas</th>
              <th>Estado</th>
              <th style={{ textAlign: 'right' }}>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {(!parroquias || parroquias.length === 0) ? (
              <tr>
                <td colSpan={8}>
                  <div className="empty-state">
                    <div className="empty-state-icon">🏘️</div>
                    <div>No se encontraron parroquias</div>
                  </div>
                </td>
              </tr>
            ) : parroquias.map(p => {
              return (
                <tr key={p.id}>
                  <td style={{ fontWeight: 500 }}>{p.nombre}</td>
                  <td style={{ color: 'var(--color-text-muted)' }}>
                    {p.canton_nombre ?? '—'}
                  </td>
                  <td>
                    <span className={`badge ${p.tipo === 'Urbana' ? 'badge-blue' : 'badge-green'}`}>
                      {p.tipo}
                    </span>
                  </td>
                  <td>{p.num_recintos}</td>
                  <td>{p.num_juntas}</td>
                  <td>{p.juntas_no_asignadas}</td>
                  <td>
                    <span className={`badge ${p.estado === 'Activo' ? 'badge-green' : 'badge-red'}`}>
                      {p.estado}
                    </span>
                  </td>
                  <td style={{ textAlign: 'right' }}>
                    <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
                      <Link href={`/parroquias/${p.id}`} className="btn btn-secondary btn-xs">
                        Ver
                      </Link>
                      {ENABLE_ELECTORAL_STRUCTURE_EDITING && (
                        <Link href={`/parroquias/${p.id}?edit=true`} className="btn btn-ghost btn-xs">
                          Editar
                        </Link>
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
