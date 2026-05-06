import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import ParroquiaFilters from './ParroquiaFilters'

export const metadata = {
  title: 'Parroquias — Control Electoral',
}

type SearchParams = Promise<{ estado?: string; tipo?: string }>

export default async function ParroquiasPage(props: { searchParams: SearchParams }) {
  const searchParams = await props.searchParams
  const supabase = await createClient()

  const estadoFilter = searchParams.estado ?? 'Activo'
  const tipoFilter = searchParams.tipo ?? ''

  let query = supabase
    .from('parroquias')
    .select(`
      id, nombre, tipo, estado,
      recintos!recintos_id_parroquia_fkey (
        id,
        juntas!juntas_id_recinto_fkey ( id )
      )
    `)
    .order('nombre')

  if (estadoFilter && estadoFilter !== 'Todos') {
    query = query.eq('estado', estadoFilter)
  }
  if (tipoFilter && tipoFilter !== 'Todos') {
    query = query.eq('tipo', tipoFilter)
  }

  const { data: parroquias, error } = await query

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Parroquias</h1>
          <p className="page-subtitle">{parroquias?.length ?? 0} parroquias encontradas</p>
        </div>
        <Link href="/parroquias/nueva" className="btn btn-primary" id="btn-nueva-parroquia">
          ＋ Nueva parroquia
        </Link>
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
              <th>Tipo</th>
              <th># Recintos</th>
              <th># Juntas</th>
              <th>Estado</th>
              <th style={{ textAlign: 'right' }}>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {(!parroquias || parroquias.length === 0) ? (
              <tr>
                <td colSpan={6}>
                  <div className="empty-state">
                    <div className="empty-state-icon">🏘️</div>
                    <div>No se encontraron parroquias</div>
                  </div>
                </td>
              </tr>
            ) : parroquias.map(p => {
              const numRecintos = p.recintos?.length ?? 0
              const numJuntas = p.recintos?.reduce((sum: number, r: { juntas?: { id: string }[] }) => sum + (r.juntas?.length ?? 0), 0) ?? 0
              return (
                <tr key={p.id}>
                  <td style={{ fontWeight: 500 }}>{p.nombre}</td>
                  <td>
                    <span className={`badge ${p.tipo === 'Urbana' ? 'badge-blue' : 'badge-green'}`}>
                      {p.tipo}
                    </span>
                  </td>
                  <td>{numRecintos}</td>
                  <td>{numJuntas}</td>
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
                      <Link href={`/parroquias/${p.id}?edit=true`} className="btn btn-ghost btn-xs">
                        Editar
                      </Link>
                    </div>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}
