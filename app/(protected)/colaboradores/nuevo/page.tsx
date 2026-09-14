'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import Papa from 'papaparse'
import { createClient } from '@/lib/supabase/client'
import Toast from '@/components/ui/Toast'
import RangeSelector from '@/components/ui/RangeSelector'
import { useEnterSubmit } from '@/hooks/useEnterSubmit'

type Recinto = { id: string; nombre: string; id_parroquia: string }
type Junta = { id: string; numero: number; sexo: string; estado: string }
type Parroquia = { id: string; nombre: string }

type JuntaMode = '1junta' | 'rango'

export default function NuevoColaboradorPage() {
  const router = useRouter()
  const supabase = createClient()

  const [form, setForm] = useState({
    apellidos: '',
    nombres: '',
    whatsapp: '',
    rol: 'MJRV' as 'MJRV' | 'Coordinador',
    id_recinto: '',
  })
  const [observaciones, setObservaciones] = useState<string[]>([''])

  // Junta selection mode: single junta (default) or range
  const [juntaMode, setJuntaMode] = useState<JuntaMode>('1junta')
  // Single junta selection
  const [selectedJuntaId, setSelectedJuntaId] = useState('')
  // Range selection
  const [rangeM, setRangeM] = useState({ desde: 0, hasta: 0 })
  const [rangeF, setRangeF] = useState({ desde: 0, hasta: 0 })

  const [recintos, setRecintos] = useState<Recinto[]>([])
  const [parroquias, setParroquias] = useState<Parroquia[]>([])
  const [juntasRecinto, setJuntasRecinto] = useState<Junta[]>([])
  const [loading, setLoading] = useState(false)
  const [toast, setToast] = useState<{ message: string; type: 'error' | 'success' } | null>(null)
  const [errors, setErrors] = useState<Record<string, string>>({})

  const [filtroParroquia, setFiltroParroquia] = useState('')

  const fileInputRef = useRef<HTMLInputElement>(null)
  const [rechazados, setRechazados] = useState<{ row: string[], error: string }[]>([])
  const [importadosCount, setImportadosCount] = useState<number | null>(null)

  useEnterSubmit('#btn-ingresar-colaborador')

  // Initialize from localStorage and fetch data on mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const p = localStorage.getItem('lastParroquia')
      const r = localStorage.getItem('lastRecinto')
      if (p) setFiltroParroquia(p)
      if (r) setForm(f => ({ ...f, id_recinto: r }))
    }

    supabase.from('parroquias').select('id, nombre').eq('estado', 'Activo').order('nombre')
      .then(({ data }) => setParroquias(data ?? []))
    supabase.from('recintos').select('id, nombre, id_parroquia').eq('estado', 'Activo').order('nombre')
      .then(({ data }) => setRecintos(data ?? []))
  }, [])

  // Load juntas when recinto changes
  useEffect(() => {
    if (!form.id_recinto) {
      setJuntasRecinto([])
      setSelectedJuntaId('')
      setRangeM({ desde: 0, hasta: 0 })
      setRangeF({ desde: 0, hasta: 0 })
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
        setSelectedJuntaId('')
        setRangeM({ desde: 0, hasta: 0 })
        setRangeF({ desde: 0, hasta: 0 })
      })
  }, [form.id_recinto])

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

    // The recinto is used for both voting and assigned (same recinto assumption for balotaje)
    const recintoId = form.id_recinto || null

    const { data: colab, error: colabErr } = await supabase
      .from('colaboradores')
      .insert({
        apellidos: form.apellidos.trim(),
        nombres: form.nombres.trim(),
        whatsapp: form.whatsapp.trim(),
        rol: form.rol,
        id_recinto_votacion: recintoId,
        id_recinto_asignado: recintoId,
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

    // Insert junta assignments (MJRV only)
    if (form.rol === 'MJRV' && form.id_recinto) {
      const juntasToAssign: string[] = []

      if (juntaMode === '1junta') {
        if (selectedJuntaId) juntasToAssign.push(selectedJuntaId)
      } else {
        // Collect from range M
        if (rangeM.desde && rangeM.hasta) {
          juntasRecinto
            .filter(j => j.sexo === 'M' && j.numero >= rangeM.desde && j.numero <= rangeM.hasta)
            .forEach(j => juntasToAssign.push(j.id))
        }
        // Collect from range F
        if (rangeF.desde && rangeF.hasta) {
          juntasRecinto
            .filter(j => j.sexo === 'F' && j.numero >= rangeF.desde && j.numero <= rangeF.hasta)
            .forEach(j => juntasToAssign.push(j.id))
        }
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

    // Insert observations
    const obsToInsert = observaciones.filter(o => o.trim())
    if (obsToInsert.length > 0) {
      await supabase.from('observaciones_colaboradores').insert(
        obsToInsert.map(texto => ({ id_colaborador: colaboradorId, texto }))
      )
    }

    setToast({ message: 'Colaborador creado exitosamente', type: 'success' })
    setTimeout(() => router.push('/colaboradores'), 1200)
  }

  const handleImportCsv = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setLoading(true)

    Papa.parse(file, {
      skipEmptyLines: true,
      complete: async (results) => {
        const data = results.data as string[][]
        let rowsToProcess = data
        // Skip header row if present (detect by "nombres" in second column)
        if (rowsToProcess.length > 0 && rowsToProcess[0][1]?.trim().toLowerCase() === 'nombres') {
          rowsToProcess = rowsToProcess.slice(1)
        }

        const validCols: any[] = []
        const rejected: any[] = []

        const { data: recintosData } = await supabase.from('recintos').select('id')
        const { data: juntasData } = await supabase.from('juntas').select('id, id_recinto, numero, sexo').eq('estado', 'Activo')

        const validRecintosIds = new Set(recintosData?.map(r => String(r.id)) || [])
        const juntasByRecinto = (juntasData || []).reduce((acc, j) => {
          if (!acc[j.id_recinto]) acc[j.id_recinto] = []
          acc[j.id_recinto].push({ id: j.id, numero: j.numero, sexo: j.sexo })
          return acc
        }, {} as Record<string, { id: string, numero: number, sexo: string }[]>)

        for (let i = 0; i < rowsToProcess.length; i++) {
          const row = rowsToProcess[i].map(c => c?.trim() || '')
          // CSV columns: Apellidos, Nombres, Whatsapp, ya_contactado, rol, recinto, asiste_capacitacion,
          //              junta_numero (opt), junta_sexo (opt), desde (opt), hasta (opt)
          const [
            apellidos = '', nombres = '', whatsapp = '', yaContactadoRaw = '', rolRaw = '',
            recintoRaw = '', asisteRaw = '', juntaNumeroRaw = '', juntaSexoRaw = '',
            desdeRaw = '', hastaRaw = ''
          ] = row

          let rejectReason = ''
          if (!nombres) rejectReason = 'Falta Nombres'
          const whatsappClean = whatsapp.replace(/\D/g, '')
          if (!whatsappClean || whatsappClean.length !== 10) {
            rejectReason = 'WhatsApp es obligatorio y debe tener exactamente 10 dígitos numéricos'
          }

          const recintoId = recintoRaw && validRecintosIds.has(recintoRaw) ? recintoRaw : null

          let juntasToAssign: string[] = []
          const rol = rolRaw || 'MJRV'
          let ya_contactado = yaContactadoRaw || 'No'
          if (ya_contactado.trim().toLowerCase() === 'si') ya_contactado = 'Sí'

          let asiste_capacitacion = asisteRaw || 'No'
          if (asiste_capacitacion.trim().toLowerCase() === 'si') asiste_capacitacion = 'Sí'

          if (!rejectReason && rol === 'MJRV' && recintoId) {
            const juntasOfRecinto = juntasByRecinto[recintoId] || []

            // Mode 1: single junta (junta_numero + junta_sexo columns)
            if (juntaNumeroRaw && juntaSexoRaw) {
              const num = parseInt(juntaNumeroRaw, 10)
              const sexo = juntaSexoRaw.toUpperCase()
              if (!isNaN(num) && (sexo === 'M' || sexo === 'F')) {
                const found = juntasOfRecinto.find(j => j.numero === num && j.sexo === sexo)
                if (found) {
                  juntasToAssign = [found.id]
                } else {
                  rejectReason = `Junta ${num}${sexo} no encontrada o inactiva en el recinto`
                }
              }
            }
            // Mode 2: range (desde + hasta columns) — applies to both M and F
            else if (desdeRaw && hastaRaw) {
              const desde = parseInt(desdeRaw, 10)
              const hasta = parseInt(hastaRaw, 10)
              const maxJuntaNum = juntasOfRecinto.reduce((m, j) => Math.max(m, j.numero), 0)
              if (isNaN(desde) || isNaN(hasta) || desde < 1 || hasta > maxJuntaNum || desde > hasta) {
                rejectReason = `Rango de juntas (${desdeRaw}-${hastaRaw}) inválido o fuera de límite (máx ${maxJuntaNum})`
              } else {
                juntasToAssign = juntasOfRecinto
                  .filter(j => j.numero >= desde && j.numero <= hasta)
                  .map(j => j.id)
              }
            }
            // No junta columns: allowed (collaborator without junta assignment)
          }

          if (rejectReason) {
            rejected.push({ row, error: rejectReason })
          } else {
            validCols.push({
              apellidos,
              nombres,
              whatsapp: whatsappClean,
              ya_contactado,
              rol,
              id_recinto_votacion: recintoId,
              id_recinto_asignado: recintoId,
              asiste_capacitacion,
              _juntasToAssign: juntasToAssign
            })
          }
        }

        if (validCols.length > 0) {
          const toInsert = validCols.map(c => ({
            apellidos: c.apellidos,
            nombres: c.nombres,
            whatsapp: c.whatsapp,
            ya_contactado: c.ya_contactado,
            rol: c.rol,
            id_recinto_votacion: c.id_recinto_votacion,
            id_recinto_asignado: c.id_recinto_asignado,
            asiste_capacitacion: c.asiste_capacitacion,
          }))

          const { data: insertedCols, error } = await supabase
            .from('colaboradores')
            .insert(toInsert)
            .select('id')

          if (error) {
            setToast({ message: `Error al insertar: ${error.message}`, type: 'error' })
            setLoading(false)
            return
          }

          const assignmentsToInsert: { id_colaborador: string, id_junta: string }[] = []
          if (insertedCols) {
            insertedCols.forEach((colab, idx) => {
              const tempColab = validCols[idx]
              if (tempColab._juntasToAssign && tempColab._juntasToAssign.length > 0) {
                tempColab._juntasToAssign.forEach((jid: string) => {
                  assignmentsToInsert.push({ id_colaborador: colab.id, id_junta: jid })
                })
              }
            })
          }

          if (assignmentsToInsert.length > 0) {
            await supabase.from('asignacion_juntas').insert(assignmentsToInsert)
          }
        }

        setRechazados(rejected)
        setImportadosCount(validCols.length)
        setLoading(false)
        if (e.target) e.target.value = ''

        if (validCols.length > 0) {
          setToast({ message: `Se importaron ${validCols.length} colaboradores correctamente.`, type: 'success' })
        } else {
          setToast({ message: 'No se importó ningún colaborador válido.', type: 'error' })
        }
      }
    })
  }

  const handleDownloadRechazados = () => {
    const csvData = rechazados.map(r => [...r.row, r.error])
    const csvHeader = ['Apellidos', 'Nombres', 'Whatsapp', 'ya_contactado', 'rol', 'recinto', 'asiste_capacitacion', 'junta_numero', 'junta_sexo', 'desde', 'hasta', 'Error']
    const csv = Papa.unparse([csvHeader, ...csvData])
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    const url = URL.createObjectURL(blob)
    link.setAttribute('href', url)
    link.setAttribute('download', 'colaboradores_rechazados.csv')
    link.style.visibility = 'hidden'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  const isMJRV = form.rol === 'MJRV'
  const recintosFiltrados = filtroParroquia
    ? recintos.filter(r => r.id_parroquia === filtroParroquia)
    : recintos
  const juntasM = juntasRecinto.filter(j => j.sexo === 'M')
  const juntasF = juntasRecinto.filter(j => j.sexo === 'F')

  return (
    <div style={{ maxWidth: '700px' }}>
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 className="page-title">Nuevo Colaborador</h1>
          <p className="page-subtitle">Complete los datos o importe desde CSV</p>
        </div>
        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
          <input
            type="file"
            accept=".csv"
            style={{ display: 'none' }}
            ref={fileInputRef}
            onChange={handleImportCsv}
          />
          <button
            type="button"
            className="btn btn-secondary"
            onClick={() => fileInputRef.current?.click()}
            disabled={loading}
          >
            Importar de CSV
          </button>
        </div>
      </div>

      {importadosCount !== null && (
        <div className="card" style={{ marginBottom: '1.5rem', background: 'var(--color-surface-2)', border: '1px solid var(--color-border)' }}>
          <div>
            <h3 style={{ color: 'var(--color-text)', fontSize: '1rem', fontWeight: 600, marginBottom: '0.25rem' }}>Resumen de Importación</h3>
            <p style={{ color: 'var(--color-text-muted)', fontSize: '0.85rem' }}>Se ingresaron {importadosCount} colaborador{importadosCount !== 1 ? 'es' : ''} al sistema.</p>
          </div>
        </div>
      )}

      {rechazados.length > 0 && (
        <div className="card" style={{ marginBottom: '1.5rem', background: 'var(--color-surface-2)', border: '1px solid var(--color-border)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <h3 style={{ color: 'var(--color-text)', fontSize: '1rem', fontWeight: 600, marginBottom: '0.25rem' }}>Errores de Importación</h3>
              <p style={{ color: 'var(--color-text-muted)', fontSize: '0.85rem' }}>Se encontraron {rechazados.length} fila(s) con errores o datos inválidos.</p>
            </div>
            <button type="button" className="btn btn-primary" onClick={handleDownloadRechazados}>
              Descargar rechazados
            </button>
          </div>
        </div>
      )}

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
            {/* Parroquia filter */}
            <div className="form-group">
              <label htmlFor="filtro-parroquia" className="label" style={{ color: 'var(--color-text-muted)' }}>
                Filtrar por parroquia
              </label>
              <select
                id="filtro-parroquia"
                className="input"
                value={filtroParroquia}
                onChange={e => {
                  const val = e.target.value
                  setFiltroParroquia(val)
                  setField('id_recinto', '')
                  localStorage.setItem('lastParroquia', val)
                  localStorage.removeItem('lastRecinto')
                }}
              >
                <option value="">Todas las parroquias</option>
                {parroquias.map(p => <option key={p.id} value={p.id}>{p.nombre}</option>)}
              </select>
            </div>

            {/* Unified recinto selector */}
            <div className="form-group">
              <label htmlFor="recinto" className="label">Recinto</label>
              <select
                id="recinto"
                className="input"
                value={form.id_recinto}
                onChange={e => {
                  const val = e.target.value
                  setField('id_recinto', val)
                  localStorage.setItem('lastRecinto', val)
                }}
              >
                <option value="">No asignado</option>
                {recintosFiltrados.map(r => <option key={r.id} value={r.id}>{r.nombre}</option>)}
              </select>
            </div>

            {/* Junta assignment — only for MJRV */}
            {isMJRV && form.id_recinto && juntasRecinto.length > 0 && (
              <div className="form-group full">
                {/* Mode toggle */}
                <div style={{ marginBottom: '0.75rem' }}>
                  <div className="label" style={{ marginBottom: '0.4rem' }}>Modo de asignación de juntas</div>
                  <div className="radio-group">
                    <label className={`radio-option ${juntaMode === '1junta' ? 'selected' : ''}`}>
                      <input
                        type="radio"
                        name="junta-mode"
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
                        name="junta-mode"
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
                    <label htmlFor="junta-unica" className="label">Junta</label>
                    <select
                      id="junta-unica"
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
                        idPrefix="nuevo-colab"
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
                        idPrefix="nuevo-colab"
                      />
                    )}
                  </>
                )}
              </div>
            )}

            {isMJRV && form.id_recinto && juntasRecinto.length === 0 && (
              <div className="form-group full">
                <p style={{ color: 'var(--color-text-faint)', fontSize: '0.85rem' }}>
                  Este recinto no tiene juntas activas registradas.
                </p>
              </div>
            )}

            {isMJRV && !form.id_recinto && (
              <div className="form-group full">
                <p style={{ color: 'var(--color-text-faint)', fontSize: '0.85rem' }}>
                  Seleccione un Recinto para configurar las juntas.
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
