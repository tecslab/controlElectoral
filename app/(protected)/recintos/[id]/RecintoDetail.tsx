'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import Toast from '@/components/ui/Toast'
import Link from 'next/link'

type Recinto = {
  id: string
  nombre: string
  estado: string
  id_parroquia: string
  parroquia_nombre: string
  juntas_m: number
  juntas_f: number
}

type Parroquia = { id: string; nombre: string }

export default function RecintoDetail({
  recinto,
  parroquias,
  initEditing = false,
}: {
  recinto: Recinto
  parroquias: Parroquia[]
  initEditing?: boolean
}) {
  const router = useRouter()
  const supabase = createClient()

  const [editing, setEditing] = useState(initEditing)
  const [nombre, setNombre] = useState(recinto.nombre)
  const [idParroquia, setIdParroquia] = useState(recinto.id_parroquia)
  const [juntasM, setJuntasM] = useState(String(recinto.juntas_m))
  const [juntasF, setJuntasF] = useState(String(recinto.juntas_f))
  const [loading, setLoading] = useState(false)
  const [toast, setToast] = useState<{ message: string; type: 'error' | 'success' } | null>(null)
  const [errors, setErrors] = useState<Record<string, string>>({})

  function validate() {
    const errs: Record<string, string> = {}
    if (!nombre.trim()) errs.nombre = 'El nombre es obligatorio'
    if (!idParroquia) errs.parroquia = 'Seleccione una parroquia'
    const m = parseInt(juntasM)
    const f = parseInt(juntasF)
    if (isNaN(m) || m < 0 || m > 70) errs.juntasM = 'Ingrese un número entre 0 y 70'
    if (isNaN(f) || f < 0 || f > 70) errs.juntasF = 'Ingrese un número entre 0 y 70'
    setErrors(errs)
    return Object.keys(errs).length === 0
  }

  async function handleSave() {
    if (!validate()) return
    setLoading(true)

    // Update recinto basic info
    const { error: recintoError } = await supabase
      .from('recintos')
      .update({ nombre: nombre.trim(), id_parroquia: idParroquia })
      .eq('id', recinto.id)

    if (recintoError) {
      setToast({ message: `Error al guardar: ${recintoError.message}`, type: 'error' })
      setLoading(false)
      return
    }

    // Update juntas count via RPC
    const { error: rpcError } = await supabase.rpc('update_juntas_count', {
      p_id_recinto: recinto.id,
      p_new_m: parseInt(juntasM) || 0,
      p_new_f: parseInt(juntasF) || 0,
    })

    setLoading(false)

    if (rpcError) {
      setToast({ message: `Error al actualizar juntas: ${rpcError.message}`, type: 'error' })
      return
    }

    setToast({ message: 'Recinto actualizado', type: 'success' })
    setEditing(false)
    router.refresh()
  }

  return (
    <div style={{ maxWidth: '600px' }}>
      <div className="page-header">
        <div>
          <Link href="/recintos" style={{ color: 'var(--color-text-muted)', fontSize: '0.85rem', textDecoration: 'none' }}>
            ← Recintos
          </Link>
          <h1 className="page-title" style={{ marginTop: '0.25rem' }}>{recinto.nombre}</h1>
        </div>
        {!editing && (
          <button id="btn-editar-recinto" className="btn btn-secondary" onClick={() => setEditing(true)}>
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
                id="edit-nombre-recinto"
                type="text"
                className={`input ${errors.nombre ? 'input-error' : ''}`}
                value={nombre}
                onChange={e => setNombre(e.target.value)}
              />
            ) : (
              <div style={{ fontWeight: 500 }}>{recinto.nombre}</div>
            )}
            {errors.nombre && <span className="error-text">{errors.nombre}</span>}
          </div>

          {/* Parroquia */}
          <div>
            <div className="label">Parroquia</div>
            {editing ? (
              <select
                id="edit-parroquia-recinto"
                className={`input ${errors.parroquia ? 'input-error' : ''}`}
                value={idParroquia}
                onChange={e => setIdParroquia(e.target.value)}
              >
                {parroquias.map(p => (
                  <option key={p.id} value={p.id}>{p.nombre}</option>
                ))}
              </select>
            ) : (
              <div style={{ color: 'var(--color-text-muted)' }}>{recinto.parroquia_nombre}</div>
            )}
            {errors.parroquia && <span className="error-text">{errors.parroquia}</span>}
          </div>

          {/* Juntas */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div>
              <div className="label">Juntas Masculinas (M)</div>
              {editing ? (
                <input
                  id="edit-juntas-m"
                  type="number"
                  className={`input ${errors.juntasM ? 'input-error' : ''}`}
                  value={juntasM}
                  onChange={e => setJuntasM(e.target.value)}
                  min={0} max={70}
                />
              ) : (
                <div style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--color-primary)' }}>
                  {recinto.juntas_m}
                </div>
              )}
              {errors.juntasM && <span className="error-text">{errors.juntasM}</span>}
            </div>
            <div>
              <div className="label">Juntas Femeninas (F)</div>
              {editing ? (
                <input
                  id="edit-juntas-f"
                  type="number"
                  className={`input ${errors.juntasF ? 'input-error' : ''}`}
                  value={juntasF}
                  onChange={e => setJuntasF(e.target.value)}
                  min={0} max={70}
                />
              ) : (
                <div style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--color-primary)' }}>
                  {recinto.juntas_f}
                </div>
              )}
              {errors.juntasF && <span className="error-text">{errors.juntasF}</span>}
            </div>
          </div>

          {/* Estado */}
          <div>
            <div className="label">Estado</div>
            <span className={`badge ${recinto.estado === 'Activo' ? 'badge-green' : 'badge-red'}`}>
              {recinto.estado}
            </span>
          </div>
        </div>

        {editing && (
          <>
            <div className="divider" />
            {parseInt(juntasM) < recinto.juntas_m || parseInt(juntasF) < recinto.juntas_f ? (
              <div style={{
                background: 'var(--color-warning-soft)',
                border: '1px solid rgba(251,191,36,0.25)',
                borderRadius: '8px',
                padding: '0.75rem 1rem',
                color: 'var(--color-warning)',
                fontSize: '0.85rem',
                marginBottom: '1rem',
              }}>
                ⚠️ Reducir el número de juntas marcará las juntas excedentes como <strong>Inactivas</strong>.
              </div>
            ) : null}
            <div style={{ display: 'flex', gap: '0.75rem' }}>
              <button
                id="btn-guardar-recinto"
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
                  setNombre(recinto.nombre)
                  setIdParroquia(recinto.id_parroquia)
                  setJuntasM(String(recinto.juntas_m))
                  setJuntasF(String(recinto.juntas_f))
                  setErrors({})
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
