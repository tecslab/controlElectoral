'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import Toast from '@/components/ui/Toast'
import Link from 'next/link'
import AuditInfo from '@/components/ui/AuditInfo'
import { ENABLE_ELECTORAL_STRUCTURE_EDITING } from '@/lib/features'
import { useEnterSubmit } from '@/hooks/useEnterSubmit'

type Zona = {
  id: string
  nombre: string
  codigo: string | null
  estado: string
  id_parroquia: string
  parroquia_nombre: string
  num_recintos: number
  created_at?: string
  created_by?: string | null
  created_by_name?: string | null
  updated_at?: string
  updated_by?: string | null
  updated_by_name?: string | null
}

type Parroquia = { id: string; nombre: string }

export default function ZonaDetail({
  zona,
  parroquias,
  initEditing = false,
}: {
  zona: Zona
  parroquias: Parroquia[]
  initEditing?: boolean
}) {
  const router = useRouter()
  const supabase = createClient()

  const [editing, setEditing] = useState<boolean>(initEditing && ENABLE_ELECTORAL_STRUCTURE_EDITING)
  const [nombre, setNombre] = useState(zona.nombre)
  const [codigo, setCodigo] = useState(zona.codigo ?? '')
  const [idParroquia, setIdParroquia] = useState(zona.id_parroquia)
  const [loading, setLoading] = useState(false)
  const [toast, setToast] = useState<{ message: string; type: 'error' | 'success' } | null>(null)

  useEnterSubmit('#btn-guardar-zona', editing)

  async function handleSave() {
    if (loading) return
    if (!nombre.trim() || !idParroquia) {
      setToast({ message: 'Nombre y Parroquia son obligatorios', type: 'error' })
      return
    }
    setLoading(true)
    const { error } = await supabase
      .from('zonas')
      .update({ nombre: nombre.trim(), codigo: codigo.trim() || null, id_parroquia: idParroquia })
      .eq('id', zona.id)
    setLoading(false)

    if (error) {
      setToast({ message: `Error al guardar: ${error.message}`, type: 'error' })
      return
    }
    setToast({ message: 'Zona actualizada', type: 'success' })
    setEditing(false)
    router.refresh()
  }

  return (
    <div style={{ maxWidth: '600px' }}>
      <div className="page-header">
        <div>
          <Link href="/zonas" style={{ color: 'var(--color-text-muted)', fontSize: '0.85rem', textDecoration: 'none' }}>
            ← Zonas
          </Link>
          <h1 className="page-title" style={{ marginTop: '0.25rem' }}>{zona.nombre}</h1>
        </div>
        {ENABLE_ELECTORAL_STRUCTURE_EDITING && !editing && (
          <button id="btn-editar-zona" className="btn btn-secondary" onClick={() => setEditing(true)}>
            ✏️ Editar
          </button>
        )}
      </div>

      <div className="card">
        <div style={{ display: 'grid', gap: '1.25rem' }}>
          <div>
            <div className="label">Nombre de la Zona</div>
            {editing ? (
              <input
                id="edit-nombre-zona"
                type="text"
                className="input"
                value={nombre}
                onChange={e => setNombre(e.target.value)}
              />
            ) : (
              <div style={{ fontWeight: 500 }}>{zona.nombre}</div>
            )}
          </div>

          <div>
            <div className="label">Código</div>
            {editing ? (
              <input
                id="edit-codigo-zona"
                type="text"
                className="input"
                value={codigo}
                onChange={e => setCodigo(e.target.value)}
              />
            ) : (
              <div style={{ color: 'var(--color-text-muted)' }}>{zona.codigo || '—'}</div>
            )}
          </div>

          <div>
            <div className="label">Parroquia</div>
            {editing ? (
              <select
                className="input"
                value={idParroquia}
                onChange={e => setIdParroquia(e.target.value)}
              >
                {parroquias.map(p => (
                  <option key={p.id} value={p.id}>{p.nombre}</option>
                ))}
              </select>
            ) : (
              <div style={{ color: 'var(--color-text-muted)' }}>{zona.parroquia_nombre}</div>
            )}
          </div>

          <div>
            <div className="label">Recintos en esta Zona</div>
            <div style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--color-primary)' }}>
              {zona.num_recintos}
            </div>
          </div>

          <div>
            <div className="label">Estado</div>
            <span className={`badge ${zona.estado === 'Activo' ? 'badge-green' : 'badge-red'}`}>
              {zona.estado}
            </span>
          </div>
        </div>

        <AuditInfo
          createdAt={zona.created_at}
          createdBy={zona.created_by_name}
          updatedAt={zona.updated_at}
          updatedBy={zona.updated_by_name}
        />

        {editing && (
          <>
            <div className="divider" />
            <div style={{ display: 'flex', gap: '0.75rem' }}>
              <button
                id="btn-guardar-zona"
                className="btn btn-primary"
                onClick={handleSave}
                disabled={loading}
              >
                {loading ? <><span className="spinner" /> Guardando...</> : 'Guardar cambios'}
              </button>
              <button
                className="btn btn-secondary"
                onClick={() => {
                  setEditing(false)
                  setNombre(zona.nombre)
                  setCodigo(zona.codigo ?? '')
                  setIdParroquia(zona.id_parroquia)
                }}
              >
                Cancelar
              </button>
            </div>
          </>
        )}
      </div>

      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
    </div>
  )
}
