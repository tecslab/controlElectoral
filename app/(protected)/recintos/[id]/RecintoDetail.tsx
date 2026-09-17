'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import Toast from '@/components/ui/Toast'
import Link from 'next/link'
import { useEnterSubmit } from '@/hooks/useEnterSubmit'
import AuditInfo from '@/components/ui/AuditInfo'
import { ENABLE_ELECTORAL_STRUCTURE_EDITING } from '@/lib/features'

type Recinto = {
  id: string
  nombre: string
  estado: string
  id_parroquia: string
  id_zona?: string | null
  parroquia_nombre: string
  zona_nombre?: string | null
  juntas_m: number
  juntas_f: number
  juntas_m_desde?: number
  juntas_m_hasta?: number
  juntas_f_desde?: number
  juntas_f_hasta?: number
  created_at?: string
  created_by?: string | null
  created_by_name?: string | null
  updated_at?: string
  updated_by?: string | null
  updated_by_name?: string | null
}

type Parroquia = { id: string; nombre: string }
type Zona = { id: string; nombre: string; codigo?: string | null; id_parroquia: string }

export default function RecintoDetail({
  recinto,
  parroquias,
  zonas = [],
  initEditing = false,
}: {
  recinto: Recinto
  parroquias: Parroquia[]
  zonas?: Zona[]
  initEditing?: boolean
}) {
  const router = useRouter()
  const supabase = createClient()

  const [editing, setEditing] = useState<boolean>(initEditing && ENABLE_ELECTORAL_STRUCTURE_EDITING)
  const [nombre, setNombre] = useState(recinto.nombre)
  const [idParroquia, setIdParroquia] = useState(recinto.id_parroquia)
  const [idZona, setIdZona] = useState(recinto.id_zona ?? '')

  const [juntasMDesde, setJuntasMDesde] = useState(recinto.juntas_m_desde ? String(recinto.juntas_m_desde) : '')
  const [juntasMHasta, setJuntasMHasta] = useState(recinto.juntas_m_hasta ? String(recinto.juntas_m_hasta) : '')
  const [juntasFDesde, setJuntasFDesde] = useState(recinto.juntas_f_desde ? String(recinto.juntas_f_desde) : '')
  const [juntasFHasta, setJuntasFHasta] = useState(recinto.juntas_f_hasta ? String(recinto.juntas_f_hasta) : '')

  const [loading, setLoading] = useState(false)
  const [toast, setToast] = useState<{ message: string; type: 'error' | 'success' } | null>(null)
  const [errors, setErrors] = useState<Record<string, string>>({})

  const [filteredZonas, setFilteredZonas] = useState<Zona[]>([])

  useEffect(() => {
    if (!idParroquia) {
      setFilteredZonas([])
      return
    }
    const local = zonas.filter(z => z.id_parroquia === idParroquia)
    setFilteredZonas(local)

    supabase
      .from('zonas')
      .select('id, nombre, codigo, id_parroquia')
      .eq('id_parroquia', idParroquia)
      .neq('estado', 'Inactivo')
      .order('nombre')
      .then(({ data }) => {
        if (data && data.length > 0) {
          setFilteredZonas(data as Zona[])
        }
      })
  }, [idParroquia, zonas])

  useEnterSubmit('#btn-guardar-recinto', editing)

  const mDesde = parseInt(juntasMDesde) || 0
  const mHasta = parseInt(juntasMHasta) || 0
  const totalM = (mDesde > 0 && mHasta >= mDesde) ? (mHasta - mDesde + 1) : 0

  const fDesde = parseInt(juntasFDesde) || 0
  const fHasta = parseInt(juntasFHasta) || 0
  const totalF = (fDesde > 0 && fHasta >= fDesde) ? (fHasta - fDesde + 1) : 0

  function validate() {
    const errs: Record<string, string> = {}
    if (!nombre.trim()) errs.nombre = 'El nombre es obligatorio'
    if (!idParroquia) errs.parroquia = 'Seleccione una parroquia'

    if (juntasMDesde || juntasMHasta) {
      if (!mDesde || mDesde < 1) errs.juntasM = 'Número "Desde" inválido'
      else if (!mHasta || mHasta < mDesde) errs.juntasM = '"Hasta" debe ser mayor o igual a "Desde"'
    }

    if (juntasFDesde || juntasFHasta) {
      if (!fDesde || fDesde < 1) errs.juntasF = 'Número "Desde" inválido'
      else if (!fHasta || fHasta < fDesde) errs.juntasF = '"Hasta" debe ser mayor o igual a "Desde"'
    }

    if (!errs.juntasM && !errs.juntasF && totalM === 0 && totalF === 0) {
      errs.juntasM = 'Debe definir al menos un rango válido de juntas (M o F)'
    }

    setErrors(errs)
    return Object.keys(errs).length === 0
  }

  async function handleSave() {
    if (loading) return;
    if (!validate()) return
    setLoading(true)

    // Update recinto basic info
    const { error: recintoError } = await supabase
      .from('recintos')
      .update({ nombre: nombre.trim(), id_parroquia: idParroquia, id_zona: idZona || null })
      .eq('id', recinto.id)

    if (recintoError) {
      setToast({ message: `Error al guardar: ${recintoError.message}`, type: 'error' })
      setLoading(false)
      return
    }

    // Update juntas count via RPC update_juntas_range
    const { error: rpcError } = await supabase.rpc('update_juntas_range', {
      p_id_recinto: recinto.id,
      p_m_desde: mDesde,
      p_m_hasta: mHasta,
      p_f_desde: fDesde,
      p_f_hasta: fHasta,
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
        {ENABLE_ELECTORAL_STRUCTURE_EDITING && !editing && (
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
                onChange={e => {
                  const newParroquia = e.target.value
                  setIdParroquia(newParroquia)
                  setIdZona('')
                }}
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

          {/* Zona */}
          {(editing ? filteredZonas.length > 0 : (recinto.zona_nombre || filteredZonas.length > 0)) && (
            <div>
              <div className="label">Zona Electoral</div>
              {editing ? (
                <select
                  id="edit-zona-recinto"
                  className="input"
                  value={idZona}
                  onChange={e => setIdZona(e.target.value)}
                >
                  <option value="">Sin zona asignada</option>
                  {filteredZonas.map(z => (
                    <option key={z.id} value={z.id}>{z.codigo ? `[${z.codigo}] ` : ''}{z.nombre}</option>
                  ))}
                </select>
              ) : (
                <div style={{ color: 'var(--color-text-muted)' }}>
                  {recinto.zona_nombre ?? 'Sin zona asignada'}
                </div>
              )}
            </div>
          )}

          {/* Juntas M */}
          {editing ? (
            <div className="form-group full" style={{ background: 'var(--color-surface-2)', padding: '0.85rem', borderRadius: '8px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                <label className="label" style={{ marginBottom: 0 }}>Juntas Masculinas (M)</label>
                <span style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)' }}>
                  Total: <strong>{totalM}</strong>
                </span>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                <div>
                  <label htmlFor="edit-juntas-m-desde" style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>Desde (Nº)</label>
                  <input
                    id="edit-juntas-m-desde"
                    type="number"
                    className="input"
                    value={juntasMDesde}
                    onChange={e => setJuntasMDesde(e.target.value)}
                    min={1}
                  />
                </div>
                <div>
                  <label htmlFor="edit-juntas-m-hasta" style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>Hasta (Nº)</label>
                  <input
                    id="edit-juntas-m-hasta"
                    type="number"
                    className="input"
                    value={juntasMHasta}
                    onChange={e => setJuntasMHasta(e.target.value)}
                    min={1}
                  />
                </div>
              </div>
              {errors.juntasM && <span className="error-text" style={{ marginTop: '0.4rem', display: 'block' }}>{errors.juntasM}</span>}
            </div>
          ) : (
            <div>
              <div className="label">Juntas Masculinas (M)</div>
              <div style={{ fontSize: '1.1rem', fontWeight: 600 }}>
                {recinto.juntas_m > 0
                  ? `Juntas ${recinto.juntas_m_desde} a ${recinto.juntas_m_hasta} (${recinto.juntas_m} en total)`
                  : 'Sin juntas masculinas'}
              </div>
            </div>
          )}

          {/* Juntas F */}
          {editing ? (
            <div className="form-group full" style={{ background: 'var(--color-surface-2)', padding: '0.85rem', borderRadius: '8px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                <label className="label" style={{ marginBottom: 0 }}>Juntas Femeninas (F)</label>
                <span style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)' }}>
                  Total: <strong>{totalF}</strong>
                </span>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                <div>
                  <label htmlFor="edit-juntas-f-desde" style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>Desde (Nº)</label>
                  <input
                    id="edit-juntas-f-desde"
                    type="number"
                    className="input"
                    value={juntasFDesde}
                    onChange={e => setJuntasFDesde(e.target.value)}
                    min={1}
                  />
                </div>
                <div>
                  <label htmlFor="edit-juntas-f-hasta" style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>Hasta (Nº)</label>
                  <input
                    id="edit-juntas-f-hasta"
                    type="number"
                    className="input"
                    value={juntasFHasta}
                    onChange={e => setJuntasFHasta(e.target.value)}
                    min={1}
                  />
                </div>
              </div>
              {errors.juntasF && <span className="error-text" style={{ marginTop: '0.4rem', display: 'block' }}>{errors.juntasF}</span>}
            </div>
          ) : (
            <div>
              <div className="label">Juntas Femeninas (F)</div>
              <div style={{ fontSize: '1.1rem', fontWeight: 600 }}>
                {recinto.juntas_f > 0
                  ? `Juntas ${recinto.juntas_f_desde} a ${recinto.juntas_f_hasta} (${recinto.juntas_f} en total)`
                  : 'Sin juntas femeninas'}
              </div>
            </div>
          )}

          {/* Estado */}
          <div>
            <div className="label">Estado</div>
            <span className={`badge ${recinto.estado === 'Activo' ? 'badge-green' : 'badge-red'}`}>
              {recinto.estado}
            </span>
          </div>
        </div>

        <AuditInfo
          createdAt={recinto.created_at}
          createdBy={recinto.created_by_name}
          updatedAt={recinto.updated_at}
          updatedBy={recinto.updated_by_name}
        />

        {editing && (
          <>
            <div className="divider" />
            {totalM < recinto.juntas_m || totalF < recinto.juntas_f ? (
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
                  setIdZona(recinto.id_zona ?? '')
                  setJuntasMDesde(recinto.juntas_m_desde ? String(recinto.juntas_m_desde) : '')
                  setJuntasMHasta(recinto.juntas_m_hasta ? String(recinto.juntas_m_hasta) : '')
                  setJuntasFDesde(recinto.juntas_f_desde ? String(recinto.juntas_f_desde) : '')
                  setJuntasFHasta(recinto.juntas_f_hasta ? String(recinto.juntas_f_hasta) : '')
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
