'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import Toast from '@/components/ui/Toast'
import RangeSelector from '@/components/ui/RangeSelector'
import Link from 'next/link'
import type { ColaboradorRaw } from './page'
import { useEnterSubmit } from '@/hooks/useEnterSubmit'

type Recinto = { id: string; nombre: string; id_parroquia: string }
type Junta = { id: string; numero: number; sexo: string; estado: string }
type Parroquia = { id: string; nombre: string }

const CONTACTADO_OPTIONS = ['Sí', 'No', 'No responde', 'Volver a contactar']

export default function ColaboradorDetail({
  colaborador,
  recintos,
  parroquias,
  initEditing = false,
}: {
  colaborador: ColaboradorRaw
  recintos: Recinto[]
  parroquias: Parroquia[]
  initEditing?: boolean
}) {
  const router = useRouter()
  const supabase = createClient()

  const [editing, setEditing] = useState(initEditing)
  const [form, setForm] = useState({
    apellidos: colaborador.apellidos,
    nombres: colaborador.nombres,
    whatsapp: colaborador.whatsapp,
    ya_contactado: colaborador.ya_contactado,
    rol: colaborador.rol as 'MJRV' | 'Coordinador',
    id_recinto_votacion: colaborador.id_recinto_votacion ?? '',
    id_recinto_asignado: colaborador.id_recinto_asignado ?? '',
    asiste_capacitacion: colaborador.asiste_capacitacion,
  })

  const [juntasRecinto, setJuntasRecinto] = useState<Junta[]>([])
  const [rangeM, setRangeM] = useState({ desde: 0, hasta: 0 })
  const [rangeF, setRangeF] = useState({ desde: 0, hasta: 0 })
  const [newObservacion, setNewObservacion] = useState('')

  const [filtroParroquiaVotacion, setFiltroParroquiaVotacion] = useState('')
  const [filtroParroquiaAsignado, setFiltroParroquiaAsignado] = useState('')

  const [loading, setLoading] = useState(false)
  const [savingObs, setSavingObs] = useState(false)
  const [toast, setToast] = useState<{ message: string; type: 'error' | 'success' } | null>(null)
  const [errors, setErrors] = useState<Record<string, string>>({})

  useEnterSubmit('#btn-guardar-colaborador', editing)

  // Compute current juntas from existing assignments
  const activeAssignments = colaborador.asignacion_juntas
    .filter(a => a.estado === 'Activo' && a.juntas)
    .map(a => a.juntas!)

  const currentJuntasM = activeAssignments.filter(j => j.sexo === 'M').sort((a, b) => a.numero - b.numero)
  const currentJuntasF = activeAssignments.filter(j => j.sexo === 'F').sort((a, b) => a.numero - b.numero)

  const currentRangeM = currentJuntasM.length
    ? `${currentJuntasM[0].numero}M–${currentJuntasM[currentJuntasM.length - 1].numero}M`
    : '—'
  const currentRangeF = currentJuntasF.length
    ? `${currentJuntasF[0].numero}F–${currentJuntasF[currentJuntasF.length - 1].numero}F`
    : '—'

  // Load juntas when recinto changes in edit mode
  useEffect(() => {
    if (!editing || !form.id_recinto_asignado) {
      setJuntasRecinto([])
      return
    }
    supabase
      .from('juntas')
      .select('id, numero, sexo, estado')
      .eq('id_recinto', form.id_recinto_asignado)
      .eq('estado', 'Activo')
      .order('numero')
      .then(({ data }) => {
        setJuntasRecinto(data ?? [])
        // Pre-fill ranges from current assignments if same recinto
        if (form.id_recinto_asignado === colaborador.id_recinto_asignado) {
          if (currentJuntasM.length) setRangeM({ desde: currentJuntasM[0].numero, hasta: currentJuntasM[currentJuntasM.length - 1].numero })
          if (currentJuntasF.length) setRangeF({ desde: currentJuntasF[0].numero, hasta: currentJuntasF[currentJuntasF.length - 1].numero })
        } else {
          setRangeM({ desde: 0, hasta: 0 })
          setRangeF({ desde: 0, hasta: 0 })
        }
      })
  }, [form.id_recinto_asignado, editing])

  function setField(key: string, value: string) {
    setForm(f => ({ ...f, [key]: value }))
  }

  function validate() {
    const errs: Record<string, string> = {}
    if (!form.apellidos.trim()) errs.apellidos = 'Los apellidos son obligatorios'
    if (!form.nombres.trim()) errs.nombres = 'Los nombres son obligatorios'
    if (!/^\d{10}$/.test(form.whatsapp)) errs.whatsapp = 'Ingrese exactamente 10 dígitos numéricos'
    setErrors(errs)
    return Object.keys(errs).length === 0
  }

  async function handleSave() {
    if (loading) return;
    if (!validate()) return
    setLoading(true)

    // Update colaborador base fields
    const { error: updateErr } = await supabase
      .from('colaboradores')
      .update({
        apellidos: form.apellidos.trim(),
        nombres: form.nombres.trim(),
        whatsapp: form.whatsapp,
        ya_contactado: form.ya_contactado,
        rol: form.rol,
        id_recinto_votacion: form.id_recinto_votacion || null,
        id_recinto_asignado: form.id_recinto_asignado || null,
        asiste_capacitacion: form.asiste_capacitacion,
      })
      .eq('id', colaborador.id)

    if (updateErr) {
      setToast({ message: `Error: ${updateErr.message}`, type: 'error' })
      setLoading(false)
      return
    }

    // Update junta assignments (only for MJRV, only if recinto is set)
    if (form.rol === 'MJRV' && form.id_recinto_asignado) {
      // Mark all existing active assignments inactive
      await supabase
        .from('asignacion_juntas')
        .update({ estado: 'Inactivo' })
        .eq('id_colaborador', colaborador.id)
        .eq('estado', 'Activo')

      // Collect new junta IDs from ranges
      const juntasToAssign: string[] = []
      if (rangeM.desde && rangeM.hasta) {
        juntasRecinto
          .filter(j => j.sexo === 'M' && j.numero >= rangeM.desde && j.numero <= rangeM.hasta)
          .forEach(j => juntasToAssign.push(j.id))
      }
      if (rangeF.desde && rangeF.hasta) {
        juntasRecinto
          .filter(j => j.sexo === 'F' && j.numero >= rangeF.desde && j.numero <= rangeF.hasta)
          .forEach(j => juntasToAssign.push(j.id))
      }

      if (juntasToAssign.length > 0) {
        await supabase.from('asignacion_juntas').upsert(
          juntasToAssign.map(id_junta => ({
            id_colaborador: colaborador.id,
            id_junta,
            estado: 'Activo',
          })),
          { onConflict: 'id_colaborador,id_junta' }
        )
      }
    }

    setLoading(false)
    setToast({ message: 'Colaborador actualizado', type: 'success' })
    setEditing(false)
    router.refresh()
  }

  async function handleAddObservacion() {
    if (!newObservacion.trim()) return
    setSavingObs(true)
    const { error } = await supabase.from('observaciones_colaboradores').insert({
      id_colaborador: colaborador.id,
      texto: newObservacion.trim(),
    })
    setSavingObs(false)
    if (error) {
      setToast({ message: `Error al guardar observación: ${error.message}`, type: 'error' })
      return
    }
    setNewObservacion('')
    router.refresh()
  }

  const isMJRV = form.rol === 'MJRV'
  const recintosVotacion = filtroParroquiaVotacion ? recintos.filter(r => r.id_parroquia === filtroParroquiaVotacion) : recintos
  const recintosAsignado = filtroParroquiaAsignado ? recintos.filter(r => r.id_parroquia === filtroParroquiaAsignado) : recintos
  const juntasM = juntasRecinto.filter(j => j.sexo === 'M')
  const juntasF = juntasRecinto.filter(j => j.sexo === 'F')

  const contactadoBadge: Record<string, string> = {
    'Sí': 'badge-green',
    'No': 'badge-gray',
    'No responde': 'badge-red',
    'Volver a contactar': 'badge-yellow',
  }

  return (
    <div style={{ maxWidth: '700px' }}>
      <div className="page-header">
        <div>
          <Link href="/colaboradores" style={{ color: 'var(--color-text-muted)', fontSize: '0.85rem', textDecoration: 'none' }}>
            ← Colaboradores
          </Link>
          <h1 className="page-title" style={{ marginTop: '0.25rem' }}>
            {colaborador.apellidos} {colaborador.nombres}
          </h1>
        </div>
        {!editing && (
          <button id="btn-editar-colaborador" className="btn btn-secondary" onClick={() => setEditing(true)}>
            ✏️ Editar
          </button>
        )}
      </div>

      <div className="card">
        {/* Section: Datos personales */}
        <div style={{ marginBottom: '0.5rem', fontWeight: 600, color: 'var(--color-text-muted)', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
          Datos personales
        </div>
        <div className="form-grid" style={{ marginBottom: '1.5rem' }}>
          <Field label="Apellidos" editing={editing}>
            {editing
              ? <input id="edit-apellidos" type="text" className={`input ${errors.apellidos ? 'input-error' : ''}`} value={form.apellidos} onChange={e => setField('apellidos', e.target.value)} />
              : colaborador.apellidos}
            {errors.apellidos && <span className="error-text">{errors.apellidos}</span>}
          </Field>

          <Field label="Nombres" editing={editing}>
            {editing
              ? <input id="edit-nombres" type="text" className={`input ${errors.nombres ? 'input-error' : ''}`} value={form.nombres} onChange={e => setField('nombres', e.target.value)} />
              : colaborador.nombres}
            {errors.nombres && <span className="error-text">{errors.nombres}</span>}
          </Field>

          <Field label="WhatsApp" editing={editing}>
            {editing
              ? <input id="edit-whatsapp" type="text" className={`input ${errors.whatsapp ? 'input-error' : ''}`} value={form.whatsapp} onChange={e => setField('whatsapp', e.target.value.replace(/\D/g, '').slice(0, 10))} inputMode="numeric" />
              : <span style={{ fontFamily: 'monospace' }}>{colaborador.whatsapp}</span>}
            {errors.whatsapp && <span className="error-text">{errors.whatsapp}</span>}
          </Field>

          <Field label="Rol" editing={editing}>
            {editing ? (
              <div className="radio-group">
                {(['MJRV', 'Coordinador'] as const).map(r => (
                  <label key={r} className={`radio-option ${form.rol === r ? 'selected' : ''}`}>
                    <input type="radio" name="edit-rol" value={r} checked={form.rol === r} onChange={() => setField('rol', r)} />
                    {r}
                  </label>
                ))}
              </div>
            ) : (
              <span className={`badge ${colaborador.rol === 'MJRV' ? 'badge-blue' : 'badge-gray'}`}>{colaborador.rol}</span>
            )}
          </Field>

          <Field label="Ya contactado" editing={editing}>
            {editing ? (
              <div className="radio-group">
                {CONTACTADO_OPTIONS.map(opt => (
                  <label key={opt} className={`radio-option ${form.ya_contactado === opt ? 'selected' : ''}`}>
                    <input type="radio" name="edit-contactado" value={opt} checked={form.ya_contactado === opt} onChange={() => setField('ya_contactado', opt)} />
                    {opt}
                  </label>
                ))}
              </div>
            ) : (
              <span className={`badge ${contactadoBadge[colaborador.ya_contactado] ?? 'badge-gray'}`}>
                {colaborador.ya_contactado}
              </span>
            )}
          </Field>

          <Field label="Asiste capacitación" editing={editing}>
            {editing ? (
              <div className="radio-group">
                {(['Sí', 'No'] as const).map(opt => (
                  <label key={opt} className={`radio-option ${form.asiste_capacitacion === opt ? 'selected' : ''}`}>
                    <input type="radio" name="edit-capacitacion" value={opt} checked={form.asiste_capacitacion === opt} onChange={() => setField('asiste_capacitacion', opt)} />
                    {opt}
                  </label>
                ))}
              </div>
            ) : (
              <span className={`badge ${colaborador.asiste_capacitacion === 'Sí' ? 'badge-green' : 'badge-gray'}`}>
                {colaborador.asiste_capacitacion}
              </span>
            )}
          </Field>
        </div>

        <div className="divider" />

        {/* Section: Asignación */}
        <div style={{ marginBottom: '0.75rem', fontWeight: 600, color: 'var(--color-text-muted)', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
          Asignación electoral
        </div>
        <div className="form-grid" style={{ marginBottom: '1.5rem' }}>
          {editing && (
            <>
              <Field label="Parroquia de Votación" editing={editing}>
                <select className="input" value={filtroParroquiaVotacion} onChange={e => {
                  setFiltroParroquiaVotacion(e.target.value)
                  setField('id_recinto_votacion', '')
                }}>
                  <option value="">Todas</option>
                  {parroquias.map(p => <option key={p.id} value={p.id}>{p.nombre}</option>)}
                </select>
              </Field>

              <Field label="Parroquia Asignada" editing={editing}>
                <select className="input" value={filtroParroquiaAsignado} onChange={e => {
                  setFiltroParroquiaAsignado(e.target.value)
                  setField('id_recinto_asignado', '')
                }}>
                  <option value="">Todas</option>
                  {parroquias.map(p => <option key={p.id} value={p.id}>{p.nombre}</option>)}
                </select>
              </Field>
            </>
          )}

          <Field label="Recinto de Votación" editing={editing}>
            {editing ? (
              <select id="edit-recinto-votacion" className="input" value={form.id_recinto_votacion} onChange={e => setField('id_recinto_votacion', e.target.value)}>
                <option value="">No asignado</option>
                {recintosVotacion.map(r => <option key={r.id} value={r.id}>{r.nombre}</option>)}
              </select>
            ) : (
              recintos.find(r => r.id === colaborador.id_recinto_votacion)?.nombre ?? 'No asignado'
            )}
          </Field>

          <Field label="Recinto Asignado" editing={editing}>
            {editing ? (
              <select id="edit-recinto-asignado" className="input" value={form.id_recinto_asignado} onChange={e => setField('id_recinto_asignado', e.target.value)}>
                <option value="">No asignado</option>
                {recintosAsignado.map(r => <option key={r.id} value={r.id}>{r.nombre}</option>)}
              </select>
            ) : (
              recintos.find(r => r.id === colaborador.id_recinto_asignado)?.nombre ?? 'No asignado'
            )}
          </Field>

          {/* Junta ranges */}
          {!editing && colaborador.rol === 'MJRV' && (
            <>
              <Field label="Juntas M asignadas">{currentRangeM}</Field>
              <Field label="Juntas F asignadas">{currentRangeF}</Field>
            </>
          )}

          {editing && isMJRV && form.id_recinto_asignado && (
            <>
              {juntasM.length > 0 && (
                <div className="form-group full">
                  <RangeSelector
                    label="Juntas asignadas"
                    sexo="M"
                    juntas={juntasRecinto}
                    desde={rangeM.desde}
                    hasta={rangeM.hasta}
                    onChange={(d, h) => setRangeM({ desde: d, hasta: h })}
                    idPrefix="edit-colab"
                  />
                </div>
              )}
              {juntasF.length > 0 && (
                <div className="form-group full">
                  <RangeSelector
                    label="Juntas asignadas"
                    sexo="F"
                    juntas={juntasRecinto}
                    desde={rangeF.desde}
                    hasta={rangeF.hasta}
                    onChange={(d, h) => setRangeF({ desde: d, hasta: h })}
                    idPrefix="edit-colab"
                  />
                </div>
              )}
            </>
          )}
        </div>

        {editing && (
          <>
            <div className="divider" />
            <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '0.5rem' }}>
              <button id="btn-guardar-colaborador" className="btn btn-primary" onClick={handleSave} disabled={loading}>
                {loading ? <><span className="spinner" /> Guardando...</> : 'Guardar cambios'}
              </button>
              <button
                className="btn btn-secondary"
                onClick={() => {
                  setEditing(false)
                  setForm({
                    apellidos: colaborador.apellidos,
                    nombres: colaborador.nombres,
                    whatsapp: colaborador.whatsapp,
                    ya_contactado: colaborador.ya_contactado,
                    rol: colaborador.rol as 'MJRV' | 'Coordinador',
                    id_recinto_votacion: colaborador.id_recinto_votacion ?? '',
                    id_recinto_asignado: colaborador.id_recinto_asignado ?? '',
                    asiste_capacitacion: colaborador.asiste_capacitacion,
                  })
                  setErrors({})
                }}
              >
                Cancelar
              </button>
            </div>
          </>
        )}
      </div>

      {/* Observaciones */}
      <div className="card" style={{ marginTop: '1.5rem' }}>
        <div style={{ marginBottom: '1rem', fontWeight: 600, color: 'var(--color-text-muted)', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
          Observaciones
        </div>

        {colaborador.observaciones_colaboradores.length === 0 && (
          <p style={{ color: 'var(--color-text-faint)', fontSize: '0.875rem', marginBottom: '1rem' }}>
            No hay observaciones registradas.
          </p>
        )}

        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginBottom: '1.25rem' }}>
          {colaborador.observaciones_colaboradores
            .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())
            .map(obs => (
              <div key={obs.id} style={{
                background: 'var(--color-surface-2)',
                borderRadius: '8px',
                padding: '0.75rem 1rem',
                borderLeft: '3px solid var(--color-border)',
              }}>
                <div style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', marginBottom: '0.25rem' }}>
                  {new Date(obs.created_at).toLocaleString('es-EC')}
                </div>
                <div style={{ color: 'var(--color-text)', fontSize: '0.875rem' }}>{obs.texto}</div>
              </div>
            ))}
        </div>

        {/* Add observation */}
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <textarea
            id="nueva-observacion"
            className="input"
            placeholder="Agregar una nueva observación..."
            value={newObservacion}
            onChange={e => setNewObservacion(e.target.value)}
            rows={2}
            style={{ flex: 1 }}
          />
          <button
            id="btn-guardar-observacion"
            className="btn btn-primary btn-sm"
            onClick={handleAddObservacion}
            disabled={savingObs || !newObservacion.trim()}
            style={{ alignSelf: 'flex-start' }}
          >
            {savingObs ? <span className="spinner" /> : '＋'}
          </button>
        </div>
      </div>

      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
    </div>
  )
}

function Field({ label, children, editing }: { label: string; children: React.ReactNode; editing?: boolean }) {
  return (
    <div className={`form-group${editing === false ? '' : ''}`}>
      <div className="label">{label}</div>
      <div>{children}</div>
    </div>
  )
}
