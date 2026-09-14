'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import Toast from '@/components/ui/Toast'
import Link from 'next/link'
import AuditInfo from '@/components/ui/AuditInfo'
import { useEnterSubmit } from '@/hooks/useEnterSubmit'

type Circunscripcion = {
  id: string
  nombre: string
  tipo: string
  estado: string
  id_canton: string
  canton_nombre: string
  num_parroquias: number
  created_at?: string
  created_by?: string | null
  created_by_name?: string | null
  updated_at?: string
  updated_by?: string | null
  updated_by_name?: string | null
}

type Canton = { id: string; nombre: string }

export default function CircunscripcionDetail({
  circunscripcion,
  cantones,
  initEditing = false,
}: {
  circunscripcion: Circunscripcion
  cantones: Canton[]
  initEditing?: boolean
}) {
  const router = useRouter()
  const supabase = createClient()

  const [editing, setEditing] = useState(initEditing)
  const [nombre, setNombre] = useState(circunscripcion.nombre)
  const [idCanton, setIdCanton] = useState(circunscripcion.id_canton)
  const [tipo, setTipo] = useState<'Urbana' | 'Rural'>(circunscripcion.tipo as 'Urbana' | 'Rural')
  const [loading, setLoading] = useState(false)
  const [toast, setToast] = useState<{ message: string; type: 'error' | 'success' } | null>(null)

  useEnterSubmit('#btn-guardar-circunscripcion', editing)

  async function handleSave() {
    if (loading) return
    if (!nombre.trim() || !idCanton) {
      setToast({ message: 'Nombre y Cantón son obligatorios', type: 'error' })
      return
    }
    setLoading(true)
    const { error } = await supabase
      .from('circunscripciones')
      .update({ nombre: nombre.trim(), id_canton: idCanton, tipo })
      .eq('id', circunscripcion.id)
    setLoading(false)

    if (error) {
      setToast({ message: `Error al guardar: ${error.message}`, type: 'error' })
      return
    }
    setToast({ message: 'Circunscripción actualizada', type: 'success' })
    setEditing(false)
    router.refresh()
  }

  return (
    <div style={{ maxWidth: '600px' }}>
      <div className="page-header">
        <div>
          <Link href="/circunscripciones" style={{ color: 'var(--color-text-muted)', fontSize: '0.85rem', textDecoration: 'none' }}>
            ← Circunscripciones
          </Link>
          <h1 className="page-title" style={{ marginTop: '0.25rem' }}>{circunscripcion.nombre}</h1>
        </div>
        {!editing && (
          <button id="btn-editar-circunscripcion" className="btn btn-secondary" onClick={() => setEditing(true)}>
            ✏️ Editar
          </button>
        )}
      </div>

      <div className="card">
        <div style={{ display: 'grid', gap: '1.25rem' }}>
          <div>
            <div className="label">Nombre</div>
            {editing ? (
              <input
                id="edit-nombre-circunscripcion"
                type="text"
                className="input"
                value={nombre}
                onChange={e => setNombre(e.target.value)}
              />
            ) : (
              <div style={{ fontWeight: 500 }}>{circunscripcion.nombre}</div>
            )}
          </div>

          <div>
            <div className="label">Cantón</div>
            {editing ? (
              <select
                className="input"
                value={idCanton}
                onChange={e => setIdCanton(e.target.value)}
              >
                {cantones.map(c => (
                  <option key={c.id} value={c.id}>{c.nombre}</option>
                ))}
              </select>
            ) : (
              <div style={{ color: 'var(--color-text-muted)' }}>{circunscripcion.canton_nombre}</div>
            )}
          </div>

          <div>
            <div className="label">Tipo</div>
            {editing ? (
              <div className="toggle-wrapper" style={{ maxWidth: '260px' }}>
                <span className={`toggle-label ${tipo === 'Urbana' ? 'active' : ''}`}>Urbana</span>
                <div
                  onClick={() => setTipo(t => t === 'Urbana' ? 'Rural' : 'Urbana')}
                  style={{
                    width: '44px', height: '24px', borderRadius: '12px',
                    background: tipo === 'Rural' ? 'var(--color-success)' : 'var(--color-primary)',
                    position: 'relative', cursor: 'pointer', transition: 'background 0.2s', flexShrink: 0,
                  }}
                >
                  <div style={{
                    position: 'absolute', top: '3px',
                    left: tipo === 'Rural' ? '22px' : '3px',
                    width: '18px', height: '18px', borderRadius: '50%',
                    background: 'white', transition: 'left 0.2s',
                  }} />
                </div>
                <span className={`toggle-label ${tipo === 'Rural' ? 'active' : ''}`}>Rural</span>
              </div>
            ) : (
              <span className={`badge ${circunscripcion.tipo === 'Urbana' ? 'badge-blue' : 'badge-green'}`}>
                {circunscripcion.tipo}
              </span>
            )}
          </div>

          <div>
            <div className="label">Parroquias en esta Circunscripción</div>
            <div style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--color-primary)' }}>
              {circunscripcion.num_parroquias}
            </div>
          </div>

          <div>
            <div className="label">Estado</div>
            <span className={`badge ${circunscripcion.estado === 'Activo' ? 'badge-green' : 'badge-red'}`}>
              {circunscripcion.estado}
            </span>
          </div>
        </div>

        <AuditInfo
          createdAt={circunscripcion.created_at}
          createdBy={circunscripcion.created_by_name}
          updatedAt={circunscripcion.updated_at}
          updatedBy={circunscripcion.updated_by_name}
        />

        {editing && (
          <>
            <div className="divider" />
            <div style={{ display: 'flex', gap: '0.75rem' }}>
              <button
                id="btn-guardar-circunscripcion"
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
                  setNombre(circunscripcion.nombre)
                  setIdCanton(circunscripcion.id_canton)
                  setTipo(circunscripcion.tipo as 'Urbana' | 'Rural')
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
