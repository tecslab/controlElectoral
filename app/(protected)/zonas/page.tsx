import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { ENABLE_ELECTORAL_STRUCTURE_CREATION, ENABLE_ELECTORAL_STRUCTURE_EDITING } from '@/lib/features'

export const metadata = { title: 'Zonas — Control Electoral' }

export default async function ZonasPage() {
  const supabase = await createClient()

  const { data: zonas } = await supabase
    .from('zonas')
    .select(`
      id, codigo, nombre, estado, id_parroquia, created_at,
      parroquias ( nombre ),
      recintos ( id )
    `)
    .order('nombre')

  return (
    <div>
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 className="page-title">Zonas Electorales</h1>
          <p className="page-subtitle">Subdivisión de parroquias para asignación de recintos</p>
        </div>
        {ENABLE_ELECTORAL_STRUCTURE_CREATION && (
          <Link href="/zonas/nueva" className="btn btn-primary">
            ＋ Nueva Zona
          </Link>
        )}
      </div>

      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        <table className="table">
          <thead>
            <tr>
              <th>Código</th>
              <th>Nombre de la Zona</th>
              <th>Parroquia</th>
              <th>Recintos</th>
              <th>Estado</th>
              <th style={{ textAlign: 'right' }}>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {(!zonas || zonas.length === 0) ? (
              <tr>
                <td colSpan={6} style={{ textAlign: 'center', color: 'var(--color-text-muted)', padding: '2rem' }}>
                  No hay zonas registradas.
                </td>
              </tr>
            ) : (
              zonas.map(z => (
                <tr key={z.id}>
                  <td>{z.codigo || '—'}</td>
                  <td style={{ fontWeight: 600 }}>{z.nombre}</td>
                  <td>{(z.parroquias as { nombre: string } | null)?.nombre ?? '—'}</td>
                  <td>{z.recintos?.length ?? 0}</td>
                  <td>
                    <span className={`badge ${z.estado === 'Activo' ? 'badge-green' : 'badge-red'}`}>
                      {z.estado}
                    </span>
                  </td>
                  <td style={{ textAlign: 'right' }}>
                    <Link href={`/zonas/${z.id}`} className="btn btn-secondary btn-sm">
                      {ENABLE_ELECTORAL_STRUCTURE_EDITING ? 'Ver / Editar' : 'Ver'}
                    </Link>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
