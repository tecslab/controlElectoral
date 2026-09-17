import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { ENABLE_ELECTORAL_STRUCTURE_CREATION, ENABLE_ELECTORAL_STRUCTURE_EDITING } from '@/lib/features'

export const metadata = { title: 'Circunscripciones — Control Electoral' }

export default async function CircunscripcionesPage() {
  const supabase = await createClient()

  const { data: circunscripciones } = await supabase
    .from('circunscripciones')
    .select(`
      id, nombre, tipo, estado, id_canton, created_at,
      cantones ( nombre ),
      parroquias ( id )
    `)
    .order('nombre')

  return (
    <div>
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 className="page-title">Circunscripciones</h1>
          <p className="page-subtitle">División electoral por circunscripción de los cantones</p>
        </div>
        {ENABLE_ELECTORAL_STRUCTURE_CREATION && (
          <Link href="/circunscripciones/nueva" className="btn btn-primary">
            ＋ Nueva Circunscripción
          </Link>
        )}
      </div>

      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        <table className="table">
          <thead>
            <tr>
              <th>Nombre</th>
              <th>Cantón</th>
              <th>Tipo</th>
              <th>Parroquias</th>
              <th>Estado</th>
              <th style={{ textAlign: 'right' }}>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {(!circunscripciones || circunscripciones.length === 0) ? (
              <tr>
                <td colSpan={6} style={{ textAlign: 'center', color: 'var(--color-text-muted)', padding: '2rem' }}>
                  No hay circunscripciones registradas.
                </td>
              </tr>
            ) : (
              circunscripciones.map(c => (
                <tr key={c.id}>
                  <td style={{ fontWeight: 600 }}>{c.nombre}</td>
                  <td>{(c.cantones as { nombre: string } | null)?.nombre ?? '—'}</td>
                  <td>
                    <span className={`badge ${c.tipo === 'Urbana' ? 'badge-blue' : 'badge-green'}`}>
                      {c.tipo}
                    </span>
                  </td>
                  <td>{c.parroquias?.length ?? 0}</td>
                  <td>
                    <span className={`badge ${c.estado === 'Activo' ? 'badge-green' : 'badge-red'}`}>
                      {c.estado}
                    </span>
                  </td>
                  <td style={{ textAlign: 'right' }}>
                    <Link href={`/circunscripciones/${c.id}`} className="btn btn-secondary btn-sm">
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
