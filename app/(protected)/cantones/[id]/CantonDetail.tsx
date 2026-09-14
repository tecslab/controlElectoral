'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import Toast from '@/components/ui/Toast'
import Link from 'next/link'
import AuditInfo from '@/components/ui/AuditInfo'
import { useEnterSubmit } from '@/hooks/useEnterSubmit'

type Canton = {
  id: string
  nombre: string
  estado: string
  num_circunscripciones: number
  num_parroquias: number
  created_at?: string
  created_by?: string | null
  created_by_name?: string | null
  updated_at?: string
  updated_by?: string | null
  updated_by_name?: string | null
}

export default function CantonDetail({ canton, initEditing = false }: { canton: Canton; initEditing?: boolean }) {
  const router = useRouter()
  const supabase = createClient()

  const [editing, setEditing] = useState(initEditing)
  const [nombre, setNombre] = useState(canton.nombre)
  const [loading, setLoading] = useState(false)
  const [toast, setToast] = useState<{ message: string; type: 'error' | 'success' } | null>(null)

  useEnterSubmit('#btn-guardar-canton', editing)

  async function handleSave() {
    if (loading) return
    if (!nombre.trim()) {
      setToast({ message: 'El nombre es obligatorio', type: 'error' })
      return
    }
    setLoading(true)
    const { error } = await supabase
      .from('cantones')
      .update({ nombre: nombre.trim() })
      .eq('id', canton.id)
    setLoading(false)

    if (error) {
      setToast({ message: `Error al guardar: ${error.message}`, type: 'error' })
      return
    }
    setToast({ message: 'Cantón actualizado', type: 'success' })
    setEditing(false)
    router.refresh()
  }

  return (
    <div style={{ maxWidth: '600px' }}>
      <div className="page-header">
        <div>
          <Link href="/cantones" style={{ color: 'var(--color-text-muted)', fontSize: '0.85rem', textDecoration: 'none' }}>
            ← Cantones
          </Link>
          <h1 className="page-title" style={{ marginTop: '0.25rem' }}>{canton.nombre}</h1>
        </div>
        {!editing && (
          <button id="btn-editar-canton" className="btn btn-secondary" onClick={() => setEditing(true)}>
            ✏️ Editar
          </button>
        )}
      </div>

      <div className="card">
        <div style={{ display: 'grid', gap: '1.25rem' }}>
          <div>
            <div className="label">Nombre del Cantón</div>
            {editing ? (
              <input
                id="edit-nombre-canton"
                type="text"
                className="input"
                value={nombre}
                onChange={e => setNombre(e.target.value)}
              />
            ) : (
              <div style={{ fontWeight: 500 }}>{canton.nombre}</div>
            )}
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div>
              <div className="label">Circunscripciones</div>
              <div style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--color-primary)' }}>
                {canton.num_circunscripciones}
              </div>
            </div>
            <div>
              <div className="label">Parroquias</div>
              <div style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--color-primary)' }}>
                {canton.num_parroquias}
              </div>
            </div>
          </div>

          <div>
            <div className="label">Estado</div>
            <span className={`badge ${canton.estado === 'Activo' ? 'badge-green' : 'badge-red'}`}>
              {canton.estado}
            </span>
          </div>
        </div>

        <AuditInfo
          createdAt={canton.created_at}
          createdBy={canton.created_by_name}
          updatedAt={canton.updated_at}
          updatedBy={canton.updated_by_name}
        />

        {editing && (
          <>
            <div className="divider" />
            <div style={{ display: 'flex', gap: '0.75rem' }}>
              <button
                id="btn-guardar-canton"
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
                  setNombre(canton.nombre)
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
