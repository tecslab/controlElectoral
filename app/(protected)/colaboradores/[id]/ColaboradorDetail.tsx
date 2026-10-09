'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import Toast from '@/components/ui/Toast'
import RangeSelector from '@/components/ui/RangeSelector'
import Link from 'next/link'
import type { ColaboradorRaw } from './page'
import { useEnterSubmit } from '@/hooks/useEnterSubmit'
import AuditInfo from '@/components/ui/AuditInfo'
import { buildConfirmationWhatsappLinks } from '@/lib/whatsapp'

type Recinto = { id: string; nombre: string; id_parroquia: string }
type Junta = { id: string; numero: number; sexo: string; estado: string }
type Parroquia = { id: string; nombre: string }
type AssignedLocation = { recinto: string; parroquia: string | null } | null
type JuntaMode = '1junta' | 'rango'

const CONTACTADO_OPTIONS = ['Sí', 'No', 'No responde', 'Volver a contactar']

export default function ColaboradorDetail({
  colaborador,
  recintos,
  parroquias,
  assignedLocation,
  initEditing = false,
}: {
  colaborador: ColaboradorRaw
  recintos: Recinto[]
  parroquias: Parroquia[]
  assignedLocation: AssignedLocation
  initEditing?: boolean
}) {
  const router = useRouter()
  const supabase = createClient()

  const [editing, setEditing] = useState(initEditing)
  // Use the assigned recinto as the single recinto (both fields are kept in sync)
  const [form, setForm] = useState({
    apellidos: colaborador.apellidos,
    nombres: colaborador.nombres,
    whatsapp: colaborador.whatsapp,
    email: colaborador.email ?? '',
    cedula: colaborador.cedula ?? '',
    ya_contactado: colaborador.ya_contactado,
    rol: colaborador.rol as 'MJRV' | 'Coordinador',
    id_recinto: colaborador.id_recinto_asignado ?? '',
    asiste_capacitacion: colaborador.asiste_capacitacion,
  })

  const [juntasRecinto, setJuntasRecinto] = useState<Junta[]>([])
  // Junta mode: single junta (default) or range
  const [juntaMode, setJuntaMode] = useState<JuntaMode>('1junta')
  const [selectedJuntaId, setSelectedJuntaId] = useState('')
  const [rangeM, setRangeM] = useState({ desde: 0, hasta: 0 })
  const [rangeF, setRangeF] = useState({ desde: 0, hasta: 0 })
  const [newObservacion, setNewObservacion] = useState('')

  const [filtroParroquia, setFiltroParroquia] = useState('')

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
    if (!editing || !form.id_recinto) {
      setJuntasRecinto([])
      return
    }
    supabase
      .from('juntas')
      .select('id, numero, sexo, estado')
      .eq('id_recinto', form.id_recinto)
      .eq('estado', 'Activo')
      .order('sexo').order('numero')
      .then(({ data }) => {
        setJuntasRecinto(data ?? [])
        // If same recinto as before, pre-fill from existing assignments
        if (form.id_recinto === colaborador.id_recinto_asignado) {
          // Determine mode: if single junta assigned, use 1junta mode
          if (activeAssignments.length === 1) {
            setJuntaMode('1junta')
            setSelectedJuntaId(activeAssignments[0].id ?? '')
          } else if (activeAssignments.length > 1) {
            setJuntaMode('rango')
            if (currentJuntasM.length) setRangeM({ desde: currentJuntasM[0].numero, hasta: currentJuntasM[currentJuntasM.length - 1].numero })
            if (currentJuntasF.length) setRangeF({ desde: currentJuntasF[0].numero, hasta: currentJuntasF[currentJuntasF.length - 1].numero })
          }
        } else {
          setJuntaMode('1junta')
          setSelectedJuntaId('')
          setRangeM({ desde: 0, hasta: 0 })
          setRangeF({ desde: 0, hasta: 0 })
        }
      })
  }, [form.id_recinto, editing])

  function setField(key: string, value: string) {
    setForm(f => ({ ...f, [key]: value }))
  }

  function validate() {
    const errs: Record<string, string> = {}
    if (!form.apellidos.trim()) errs.apellidos = 'Los apellidos son obligatorios'
    if (!form.nombres.trim()) errs.nombres = 'Los nombres son obligatorios'
    if (!/^\d{10}$/.test(form.whatsapp)) errs.whatsapp = 'Ingrese exactamente 10 dígitos numéricos'
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) errs.email = 'Ingrese un correo electrónico válido'
    if (!/^\d{10}$/.test(form.cedula)) errs.cedula = 'Ingrese exactamente 10 dígitos para la cédula'
    setErrors(errs)
    return Object.keys(errs).length === 0
  }

  async function handleSave() {
    if (loading) return;
    if (!validate()) return
    setLoading(true)

    const recintoId = form.id_recinto || null

    // Update colaborador base fields — same recinto for both fields
    const { error: updateErr } = await supabase
      .from('colaboradores')
      .update({
        apellidos: form.apellidos.trim(),
        nombres: form.nombres.trim(),
        whatsapp: form.whatsapp,
        email: form.email.trim().toLowerCase(),
        cedula: form.cedula,
        ya_contactado: form.ya_contactado,
        rol: form.rol,
        id_recinto_votacion: recintoId,
        id_recinto_asignado: recintoId,
        asiste_capacitacion: form.asiste_capacitacion,
      })
      .eq('id', colaborador.id)

    if (updateErr) {
      setToast({ message: `Error: ${updateErr.message}`, type: 'error' })
      setLoading(false)
      return
    }

    // Update junta assignments (only for MJRV, only if recinto is set)
    if (form.rol === 'MJRV' && form.id_recinto) {
      // Mark all existing active assignments inactive
      await supabase
        .from('asignacion_juntas')
        .update({ estado: 'Inactivo' })
        .eq('id_colaborador', colaborador.id)
        .eq('estado', 'Activo')

      // Collect new junta IDs based on mode
      const juntasToAssign: string[] = []
      if (juntaMode === '1junta') {
        if (selectedJuntaId) juntasToAssign.push(selectedJuntaId)
      } else {
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
  const recintosFiltrados = filtroParroquia ? recintos.filter(r => r.id_parroquia === filtroParroquia) : recintos
  const juntasM = juntasRecinto.filter(j => j.sexo === 'M')
  const juntasF = juntasRecinto.filter(j => j.sexo === 'F')
  const whatsappLinks = buildConfirmationWhatsappLinks({
    whatsapp: colaborador.whatsapp,
    nombres: colaborador.nombres,
    rol: colaborador.rol,
    recinto: assignedLocation?.recinto ?? null,
    parroquia: assignedLocation?.parroquia ?? null,
  })

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
              : <div className="whatsapp-contact">
                  <span style={{ fontFamily: 'monospace' }}>{colaborador.whatsapp}</span>
                  {whatsappLinks
                    ? <a
                        className="whatsapp-action"
                        href={whatsappLinks.mobile}
                        target="_blank"
                        rel="noopener noreferrer"
                        aria-label={`Escribir a ${colaborador.nombres} por WhatsApp`}
                        title="Escribir por WhatsApp"
                        onClick={event => {
                          if (/Android|iPhone|iPad|iPod/i.test(navigator.userAgent)) return
                          event.preventDefault()
                          window.open(whatsappLinks.desktop, '_blank', 'noopener,noreferrer')
                        }}
                      ><WhatsAppIcon /></a>
                    : <button type="button" className="whatsapp-action" disabled aria-label="WhatsApp no disponible: falta un número válido, recinto o parroquia" title="Se necesita un número válido, recinto y parroquia para escribir por WhatsApp"><WhatsAppIcon /></button>}
                </div>}
            {errors.whatsapp && <span className="error-text">{errors.whatsapp}</span>}
          </Field>

          <Field label="Correo electrónico" editing={editing}>
            {editing
              ? <input id="edit-email" type="email" className={`input ${errors.email ? 'input-error' : ''}`} value={form.email} onChange={e => setField('email', e.target.value)} />
              : (colaborador.email ?? '—')}
            {errors.email && <span className="error-text">{errors.email}</span>}
          </Field>

          <Field label="Cédula" editing={editing}>
            {editing
              ? <input id="edit-cedula" type="text" className={`input ${errors.cedula ? 'input-error' : ''}`} value={form.cedula} onChange={e => setField('cedula', e.target.value.replace(/\D/g, '').slice(0, 10))} inputMode="numeric" />
              : (colaborador.cedula ?? '—')}
            {errors.cedula && <span className="error-text">{errors.cedula}</span>}
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
          {/* Parroquia filter — visible only in edit mode */}
          {editing && (
            <Field label="Filtrar por parroquia" editing={editing}>
              <select className="input" value={filtroParroquia} onChange={e => {
                setFiltroParroquia(e.target.value)
                setField('id_recinto', '')
              }}>
                <option value="">Todas las parroquias</option>
                {parroquias.map(p => <option key={p.id} value={p.id}>{p.nombre}</option>)}
              </select>
            </Field>
          )}

          {/* Unified Recinto */}
          <Field label="Recinto" editing={editing}>
            {editing ? (
              <select id="edit-recinto" className="input" value={form.id_recinto} onChange={e => setField('id_recinto', e.target.value)}>
                <option value="">No asignado</option>
                {recintosFiltrados.map(r => <option key={r.id} value={r.id}>{r.nombre}</option>)}
              </select>
            ) : (
              assignedLocation?.recinto ?? recintos.find(r => r.id === colaborador.id_recinto_asignado)?.nombre ?? 'No asignado'
            )}
          </Field>

          {/* Junta display — view mode */}
          {!editing && colaborador.rol === 'MJRV' && (
            <Field label="Juntas asignadas">
              {activeAssignments.length === 0
                ? '—'
                : activeAssignments.length === 1
                  ? `Junta ${activeAssignments[0].numero}${activeAssignments[0].sexo}`
                  : [currentRangeM, currentRangeF].filter(r => r !== '—').join(', ') || '—'
              }
            </Field>
          )}

          {/* Junta assignment — edit mode */}
          {editing && isMJRV && form.id_recinto && juntasRecinto.length > 0 && (
            <div className="form-group full">
              {/* Mode toggle */}
              <div style={{ marginBottom: '0.75rem' }}>
                <div className="label" style={{ marginBottom: '0.4rem' }}>Modo de asignación de juntas</div>
                <div className="radio-group">
                  <label className={`radio-option ${juntaMode === '1junta' ? 'selected' : ''}`}>
                    <input
                      type="radio"
                      name="edit-junta-mode"
                      value="1junta"
                      checked={juntaMode === '1junta'}
                      onChange={() => {
                        setJuntaMode('1junta')
                        setRangeM({ desde: 0, hasta: 0 })
                        setRangeF({ desde: 0, hasta: 0 })
                      }}
                    />
                    1 Sola junta
                  </label>
                  <label className={`radio-option ${juntaMode === 'rango' ? 'selected' : ''}`}>
                    <input
                      type="radio"
                      name="edit-junta-mode"
                      value="rango"
                      checked={juntaMode === 'rango'}
                      onChange={() => {
                        setJuntaMode('rango')
                        setSelectedJuntaId('')
                      }}
                    />
                    Rango de juntas
                  </label>
                </div>
              </div>

              {juntaMode === '1junta' ? (
                <div>
                  <label htmlFor="edit-junta-unica" className="label">Junta</label>
                  <select
                    id="edit-junta-unica"
                    className="input"
                    value={selectedJuntaId}
                    onChange={e => setSelectedJuntaId(e.target.value)}
                  >
                    <option value="">Sin asignar</option>
                    {juntasRecinto.map(j => (
                      <option key={j.id} value={j.id}>
                        Junta {j.numero} — {j.sexo === 'M' ? 'Masculina' : 'Femenina'}
                      </option>
                    ))}
                  </select>
                </div>
              ) : (
                <>
                  {juntasM.length > 0 && (
                    <RangeSelector
                      label="Juntas asignadas"
                      sexo="M"
                      juntas={juntasRecinto}
                      desde={rangeM.desde}
                      hasta={rangeM.hasta}
                      onChange={(d, h) => setRangeM({ desde: d, hasta: h })}
                      idPrefix="edit-colab"
                    />
                  )}
                  {juntasF.length > 0 && (
                    <RangeSelector
                      label="Juntas asignadas"
                      sexo="F"
                      juntas={juntasRecinto}
                      desde={rangeF.desde}
                      hasta={rangeF.hasta}
                      onChange={(d, h) => setRangeF({ desde: d, hasta: h })}
                      idPrefix="edit-colab"
                    />
                  )}
                </>
              )}
            </div>
          )}
        </div>

        <AuditInfo
          createdAt={colaborador.created_at}
          createdBy={colaborador.created_by_name}
          updatedAt={colaborador.updated_at}
          updatedBy={colaborador.updated_by_name}
        />

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
                  email: colaborador.email ?? '',
                  cedula: colaborador.cedula ?? '',
                  ya_contactado: colaborador.ya_contactado,
                    rol: colaborador.rol as 'MJRV' | 'Coordinador',
                    id_recinto: colaborador.id_recinto_asignado ?? '',
                    asiste_capacitacion: colaborador.asiste_capacitacion,
                  })
                  setFiltroParroquia('')
                  setJuntaMode('1junta')
                  setSelectedJuntaId('')
                  setRangeM({ desde: 0, hasta: 0 })
                  setRangeF({ desde: 0, hasta: 0 })
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

function WhatsAppIcon() {
  return (
    <svg viewBox="0 0 24 24" width="21" height="21" fill="currentColor" aria-hidden="true">
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.966-.273-.099-.472-.149-.67.149-.198.297-.768.966-.941 1.164-.173.198-.347.223-.644.075-.297-.149-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.058-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.52.149-.173.198-.297.297-.495.099-.198.05-.372-.025-.52-.075-.149-.669-1.611-.916-2.206-.242-.579-.487-.5-.669-.51-.173-.008-.372-.01-.57-.01s-.52.074-.793.372c-.273.297-1.04 1.016-1.04 2.478s1.065 2.874 1.213 3.072c.149.198 2.095 3.2 5.077 4.487.709.306 1.263.489 1.695.626.712.227 1.36.195 1.872.118.571-.085 1.758-.719 2.005-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.002-5.445 4.433-9.875 9.886-9.875 2.64.001 5.12 1.03 6.985 2.897a9.825 9.825 0 0 1 2.893 6.99c-.002 5.445-4.433 9.875-9.883 9.875m8.407-18.288A11.82 11.82 0 0 0 12.051 0C5.495 0 .158 5.335.156 11.892a11.89 11.89 0 0 0 1.587 5.954L.057 24l6.3-1.653a11.89 11.89 0 0 0 5.69 1.448h.005c6.556 0 11.893-5.335 11.896-11.893a11.82 11.82 0 0 0-3.48-8.407z" />
    </svg>
  )
}
