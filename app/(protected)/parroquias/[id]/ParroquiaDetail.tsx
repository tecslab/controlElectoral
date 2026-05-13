'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import Toast from '@/components/ui/Toast'
import Link from 'next/link'
import { useEnterSubmit } from '@/hooks/useEnterSubmit'

type Parroquia = {
  id: string
  nombre: string
  tipo: string
  estado: string
  num_recintos: number
  num_juntas: number
}

export default function ParroquiaDetail({ parroquia, initEditing = false }: { parroquia: Parroquia, initEditing?: boolean }) {
  const router = useRouter()
  const supabase = createClient()

  const [editing, setEditing] = useState(initEditing)
  const [nombre, setNombre] = useState(parroquia.nombre)
  const [tipo, setTipo] = useState<'Urbana' | 'Rural'>(parroquia.tipo as 'Urbana' | 'Rural')
  const [loading, setLoading] = useState(false)
  const [toast, setToast] = useState<{ message: string; type: 'error' | 'success' } | null>(null)

  useEnterSubmit('#btn-guardar-parroquia', editing)

  async function handleSave() {
    if (loading) return;
    if (!nombre.trim()) {
      setToast({ message: 'El nombre es obligatorio', type: 'error' })
      return
    }
    setLoading(true)
    const { error } = await supabase
      .from('parroquias')
      .update({ nombre: nombre.trim(), tipo })
      .eq('id', parroquia.id)
    setLoading(false)

    if (error) {
      setToast({ message: `Error al guardar: ${error.message}`, type: 'error' })
      return
    }
    setToast({ message: 'Parroquia actualizada', type: 'success' })
    setEditing(false)
    router.refresh()
  }

  return (
    <div style={{ maxWidth: '600px' }}>
      <div className="page-header">
        <div>
          <Link href="/parroquias" style={{ color: 'var(--color-text-muted)', fontSize: '0.85rem', textDecoration: 'none' }}>
            ← Parroquias
          </Link>
          <h1 className="page-title" style={{ marginTop: '0.25rem' }}>{parroquia.nombre}</h1>
        </div>
        {!editing && (
          <button
            id="btn-editar-parroquia"
            className="btn btn-secondary"
            onClick={() => setEditing(true)}
          >
            ✏️ Editar
          </button>
        )}
      </div>

      <div className="card">
        <div style={{ display: 'grid', gap: '1.25rem' }}>
          {/* Nombre */}
          <div>
            <div className="label">Nombre</div>
            {editing ? (
              <input
                id="edit-nombre-parroquia"
                type="text"
                className="input"
                value={nombre}
                onChange={e => setNombre(e.target.value)}
              />
            ) : (
              <div style={{ color: 'var(--color-text)', fontWeight: 500 }}>{parroquia.nombre}</div>
            )}
          </div>

          {/* Tipo */}
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
              <span className={`badge ${parroquia.tipo === 'Urbana' ? 'badge-blue' : 'badge-green'}`}>
                {parroquia.tipo}
              </span>
            )}
          </div>

          {/* Stats */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div>
              <div className="label">Número de Recintos</div>
              <div style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--color-primary)' }}>
                {parroquia.num_recintos}
              </div>
            </div>
            <div>
              <div className="label">Total Juntas</div>
              <div style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--color-primary)' }}>
                {parroquia.num_juntas}
              </div>
            </div>
          </div>

          {/* Estado */}
          <div>
            <div className="label">Estado</div>
            <span className={`badge ${parroquia.estado === 'Activo' ? 'badge-green' : 'badge-red'}`}>
              {parroquia.estado}
            </span>
          </div>
        </div>

        {editing && (
          <>
            <div className="divider" />
            <div style={{ display: 'flex', gap: '0.75rem' }}>
              <button
                id="btn-guardar-parroquia"
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
                  setNombre(parroquia.nombre)
                  setTipo(parroquia.tipo as 'Urbana' | 'Rural')
                }}
              >
                Cancelar
              </button>
            </div>
          </>
        )}
      </div>

      {toast && (
        <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />
      )}
    </div>
  )
}
