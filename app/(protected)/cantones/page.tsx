import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'

export const metadata = { title: 'Cantones — Control Electoral' }

export default async function CantonesPage() {
  const supabase = await createClient()

  const { data: cantones } = await supabase
    .from('cantones')
    .select(`
      id, nombre, estado, created_at,
      circunscripciones ( id ),
      parroquias ( id )
    `)
    .order('nombre')

  return (
    <div>
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 className="page-title">Cantones</h1>
          <p className="page-subtitle">Listado de ciudades / cantones registrados</p>
        </div>
        <Link href="/cantones/nuevo" className="btn btn-primary">
          ＋ Nuevo Cantón
        </Link>
      </div>

      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        <table className="table">
          <thead>
            <tr>
              <th>Nombre</th>
              <th>Circunscripciones</th>
              <th>Parroquias</th>
              <th>Estado</th>
              <th style={{ textAlign: 'right' }}>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {(!cantones || cantones.length === 0) ? (
              <tr>
                <td colSpan={5} style={{ textAlign: 'center', color: 'var(--color-text-muted)', padding: '2rem' }}>
                  No hay cantones registrados.
                </td>
              </tr>
            ) : (
              cantones.map(c => (
                <tr key={c.id}>
                  <td style={{ fontWeight: 600 }}>{c.nombre}</td>
                  <td>{c.circunscripciones?.length ?? 0}</td>
                  <td>{c.parroquias?.length ?? 0}</td>
                  <td>
                    <span className={`badge ${c.estado === 'Activo' ? 'badge-green' : 'badge-red'}`}>
                      {c.estado}
                    </span>
                  </td>
                  <td style={{ textAlign: 'right' }}>
                    <Link href={`/cantones/${c.id}`} className="btn btn-secondary btn-sm">
                      Ver / Editar
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
