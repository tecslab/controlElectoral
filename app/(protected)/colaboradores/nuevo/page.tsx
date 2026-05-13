'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import Toast from '@/components/ui/Toast'
import RangeSelector from '@/components/ui/RangeSelector'
import { useEnterSubmit } from '@/hooks/useEnterSubmit'

type Recinto = { id: string; nombre: string }
type Junta = { id: string; numero: number; sexo: string; estado: string }

export default function NuevoColaboradorPage() {
  const router = useRouter()
  const supabase = createClient()

  const [form, setForm] = useState({
    apellidos: '',
    nombres: '',
    whatsapp: '',
    rol: 'MJRV' as 'MJRV' | 'Coordinador',
    id_recinto_votacion: '',
    id_recinto_asignado: '',
  })
  const [observaciones, setObservaciones] = useState<string[]>([''])
  const [rangeM, setRangeM] = useState({ desde: 0, hasta: 0 })
  const [rangeF, setRangeF] = useState({ desde: 0, hasta: 0 })

  const [recintos, setRecintos] = useState<Recinto[]>([])
  const [juntasRecinto, setJuntasRecinto] = useState<Junta[]>([])
  const [loading, setLoading] = useState(false)
  const [toast, setToast] = useState<{ message: string; type: 'error' | 'success' } | null>(null)
  const [errors, setErrors] = useState<Record<string, string>>({})

  useEnterSubmit('#btn-ingresar-colaborador')

  useEffect(() => {
    supabase.from('recintos').select('id, nombre').eq('estado', 'Activo').order('nombre')
      .then(({ data }) => setRecintos(data ?? []))
  }, [])

  useEffect(() => {
    if (!form.id_recinto_asignado) {
      setJuntasRecinto([])
      setRangeM({ desde: 0, hasta: 0 })
      setRangeF({ desde: 0, hasta: 0 })
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
        setRangeM({ desde: 0, hasta: 0 })
        setRangeF({ desde: 0, hasta: 0 })
      })
  }, [form.id_recinto_asignado])

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

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (loading) return;
    if (!validate()) return

    setLoading(true)

    // 1. Insert colaborador
    const { data: colab, error: colabErr } = await supabase
      .from('colaboradores')
      .insert({
        apellidos: form.apellidos.trim(),
        nombres: form.nombres.trim(),
        whatsapp: form.whatsapp.trim(),
        rol: form.rol,
        id_recinto_votacion: form.id_recinto_votacion || null,
        id_recinto_asignado: form.id_recinto_asignado || null,
        ya_contactado: 'No',
        asiste_capacitacion: 'No',
      })
      .select('id')
      .single()

    if (colabErr || !colab) {
      setToast({ message: `Error al crear colaborador: ${colabErr?.message}`, type: 'error' })
      setLoading(false)
      return
    }

    const colaboradorId = colab.id

    // 2. Insert junta assignments (MJRV only)
    if (form.rol === 'MJRV' && form.id_recinto_asignado) {
      const juntasToAssign: string[] = []

      // Collect junta IDs from range M
      if (rangeM.desde && rangeM.hasta) {
        juntasRecinto
          .filter(j => j.sexo === 'M' && j.numero >= rangeM.desde && j.numero <= rangeM.hasta)
          .forEach(j => juntasToAssign.push(j.id))
      }

      // Collect junta IDs from range F
      if (rangeF.desde && rangeF.hasta) {
        juntasRecinto
          .filter(j => j.sexo === 'F' && j.numero >= rangeF.desde && j.numero <= rangeF.hasta)
          .forEach(j => juntasToAssign.push(j.id))
      }

      if (juntasToAssign.length > 0) {
        const { error: juntaErr } = await supabase.from('asignacion_juntas').insert(
          juntasToAssign.map(id_junta => ({
            id_colaborador: colaboradorId,
            id_junta,
          }))
        )
        if (juntaErr) {
          setToast({ message: `Colaborador creado, pero error en juntas: ${juntaErr.message}`, type: 'error' })
          setLoading(false)
          return
        }
      }
    }

    // 3. Insert observations
    const obsToInsert = observaciones.filter(o => o.trim())
    if (obsToInsert.length > 0) {
      await supabase.from('observaciones_colaboradores').insert(
        obsToInsert.map(texto => ({ id_colaborador: colaboradorId, texto }))
      )
    }

    setToast({ message: 'Colaborador creado exitosamente', type: 'success' })
    setTimeout(() => router.push('/colaboradores'), 1200)
  }

  const isMJRV = form.rol === 'MJRV'
  const juntasM = juntasRecinto.filter(j => j.sexo === 'M')
  const juntasF = juntasRecinto.filter(j => j.sexo === 'F')

  return (
    <div style={{ maxWidth: '700px' }}>
      <div className="page-header">
        <div>
          <h1 className="page-title">Nuevo Colaborador</h1>
          <p className="page-subtitle">Complete los datos del colaborador</p>
        </div>
      </div>

      <div className="card">
        <form onSubmit={handleSubmit}>
          {/* Datos personales */}
          <div style={{ marginBottom: '0.5rem', fontWeight: 600, color: 'var(--color-text-muted)', fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Datos personales
          </div>
          <div className="form-grid" style={{ marginBottom: '1.5rem' }}>
            <div className="form-group">
              <label htmlFor="apellidos" className="label">Apellidos *</label>
              <input
                id="apellidos"
                type="text"
                className={`input ${errors.apellidos ? 'input-error' : ''}`}
                value={form.apellidos}
                onChange={e => setField('apellidos', e.target.value)}
                placeholder="Apellidos del colaborador"
              />
              {errors.apellidos && <span className="error-text">{errors.apellidos}</span>}
            </div>

            <div className="form-group">
              <label htmlFor="nombres" className="label">Nombres *</label>
              <input
                id="nombres"
                type="text"
                className={`input ${errors.nombres ? 'input-error' : ''}`}
                value={form.nombres}
                onChange={e => setField('nombres', e.target.value)}
                placeholder="Nombres del colaborador"
              />
              {errors.nombres && <span className="error-text">{errors.nombres}</span>}
            </div>

            <div className="form-group">
              <label htmlFor="whatsapp" className="label">WhatsApp * (10 dígitos)</label>
              <input
                id="whatsapp"
                type="text"
                className={`input ${errors.whatsapp ? 'input-error' : ''}`}
                value={form.whatsapp}
                onChange={e => setField('whatsapp', e.target.value.replace(/\D/g, '').slice(0, 10))}
                placeholder="0991234567"
                inputMode="numeric"
              />
              {errors.whatsapp && <span className="error-text">{errors.whatsapp}</span>}
            </div>

            <div className="form-group">
              <label className="label">Rol *</label>
              <div className="radio-group">
                {(['MJRV', 'Coordinador'] as const).map(r => (
                  <label key={r} className={`radio-option ${form.rol === r ? 'selected' : ''}`}>
                    <input
                      type="radio"
                      name="rol"
                      value={r}
                      checked={form.rol === r}
                      onChange={() => setField('rol', r)}
                    />
                    {r}
                  </label>
                ))}
              </div>
            </div>
          </div>

          <div className="divider" />

          {/* Asignación */}
          <div style={{ marginBottom: '0.75rem', fontWeight: 600, color: 'var(--color-text-muted)', fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Asignación electoral
          </div>
          <div className="form-grid" style={{ marginBottom: '1.5rem' }}>
            <div className="form-group">
              <label htmlFor="recinto-votacion" className="label">Recinto de Votación</label>
              <select
                id="recinto-votacion"
                className="input"
                value={form.id_recinto_votacion}
                onChange={e => setField('id_recinto_votacion', e.target.value)}
              >
                <option value="">No asignado</option>
                {recintos.map(r => <option key={r.id} value={r.id}>{r.nombre}</option>)}
              </select>
            </div>

            <div className="form-group">
              <label htmlFor="recinto-asignado" className="label">Recinto Asignado</label>
              <select
                id="recinto-asignado"
                className="input"
                value={form.id_recinto_asignado}
                onChange={e => setField('id_recinto_asignado', e.target.value)}
              >
                <option value="">No asignado</option>
                {recintos.map(r => <option key={r.id} value={r.id}>{r.nombre}</option>)}
              </select>
            </div>

            {/* Junta ranges — only for MJRV */}
            {isMJRV && form.id_recinto_asignado && (
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
                      idPrefix="nuevo-colab"
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
                      idPrefix="nuevo-colab"
                    />
                  </div>
                )}
              </>
            )}
            {isMJRV && !form.id_recinto_asignado && (
              <div className="form-group full">
                <p style={{ color: 'var(--color-text-faint)', fontSize: '0.85rem' }}>
                  Seleccione un Recinto Asignado para configurar las juntas.
                </p>
              </div>
            )}
          </div>

          <div className="divider" />

          {/* Observaciones */}
          <div style={{ marginBottom: '0.75rem', fontWeight: 600, color: 'var(--color-text-muted)', fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Observaciones
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginBottom: '1.5rem' }}>
            {observaciones.map((obs, i) => (
              <div key={i} style={{ display: 'flex', gap: '0.5rem' }}>
                <textarea
                  id={`observacion-${i}`}
                  className="input"
                  value={obs}
                  onChange={e => {
                    const next = [...observaciones]
                    next[i] = e.target.value
                    setObservaciones(next)
                  }}
                  placeholder={`Observación ${i + 1}...`}
                  rows={2}
                />
                {observaciones.length > 1 && (
                  <button
                    type="button"
                    className="btn btn-ghost btn-sm"
                    onClick={() => setObservaciones(obs => obs.filter((_, j) => j !== i))}
                    style={{ alignSelf: 'flex-start' }}
                  >
                    ✕
                  </button>
                )}
              </div>
            ))}
            <button
              type="button"
              className="btn btn-secondary btn-sm"
              onClick={() => setObservaciones(obs => [...obs, ''])}
              style={{ alignSelf: 'flex-start' }}
              id="btn-add-observacion"
            >
              ＋ Agregar observación
            </button>
          </div>

          <div style={{ display: 'flex', gap: '0.75rem' }}>
            <button
              id="btn-ingresar-colaborador"
              type="submit"
              className="btn btn-primary"
              disabled={loading}
            >
              {loading ? <><span className="spinner" /> Guardando...</> : 'Ingresar'}
            </button>
            <button type="button" className="btn btn-secondary" onClick={() => router.back()}>
              Cancelar
            </button>
          </div>
        </form>
      </div>

      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
    </div>
  )
}
