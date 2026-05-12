import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import RecintoFilters from './RecintoFilters'

export const metadata = { title: 'Recintos — Control Electoral' }

type SearchParams = Promise<{ estado?: string; parroquia?: string; nombre?: string }>

export default async function RecintosPage(props: { searchParams: SearchParams }) {
  const searchParams = await props.searchParams
  const supabase = await createClient()

  const estadoFilter = searchParams.estado ?? 'Activo'
  const parroquiaFilter = searchParams.parroquia ?? ''
  const nombreFilter = searchParams.nombre ?? ''

  // Load parroquias for filter dropdown
  const { data: parroquias } = await supabase
    .from('parroquias')
    .select('id, nombre')
    .eq('estado', 'Activo')
    .order('nombre')

  let query = supabase
    .from('recintos')
    .select(`
      id, nombre, estado,
      parroquias!recintos_id_parroquia_fkey ( nombre ),
      juntas!juntas_id_recinto_fkey (
        id,
        estado,
        asignacion_juntas!asignacion_juntas_id_junta_fkey ( id )
      )
    `)
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

  const { data: recintos, error } = await query

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Recintos</h1>
          <p className="page-subtitle">{recintos?.length ?? 0} recintos encontrados</p>
        </div>
        <Link href="/recintos/nuevo" className="btn btn-primary" id="btn-nuevo-recinto">
          ＋ Nuevo recinto
        </Link>
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
              const juntasActivas = (r.juntas ?? []).filter((j: { estado: string }) => j.estado === 'Activo').length
              const juntasNoAsignadas = (r.juntas ?? []).filter((j: any) => !j.asignacion_juntas || j.asignacion_juntas.length === 0).length
              const parroquiaNombre = (r.parroquias as { nombre: string } | null)?.nombre ?? '—'
              return (
                <tr key={r.id}>
                  <td style={{ fontWeight: 500 }}>{r.nombre}</td>
                  <td style={{ color: 'var(--color-text-muted)' }}>{parroquiaNombre}</td>
                  <td>{juntasActivas}</td>
                  <td>{juntasNoAsignadas}</td>
                  <td>
                    <span className={`badge ${r.estado === 'Activo' ? 'badge-green' : 'badge-red'}`}>
                      {r.estado}
                    </span>
                  </td>
                  <td style={{ textAlign: 'right' }}>
                    <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
                      <Link href={`/recintos/${r.id}`} className="btn btn-secondary btn-xs">Ver</Link>
                      <Link href={`/recintos/${r.id}?edit=true`} className="btn btn-ghost btn-xs">Editar</Link>
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
