'use client'

import { useState, useEffect, useMemo, useRef } from 'react'
import Papa from 'papaparse'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import Toast from '@/components/ui/Toast'
import { useEnterSubmit } from '@/hooks/useEnterSubmit'

type Parroquia = { id: string; nombre: string }
type Zona = { id: string; nombre: string; codigo?: string | null; id_parroquia: string }

export default function NuevoRecintoPage() {
  const router = useRouter()
  const supabase = useMemo(() => createClient(), [])

  const [nombre, setNombre] = useState('')
  const [idParroquia, setIdParroquia] = useState(() => {
    if (typeof window === 'undefined') return ''
    return localStorage.getItem('lastRecintoParroquia') ?? ''
  })
  const [idZona, setIdZona] = useState('')

  const [juntasMDesde, setJuntasMDesde] = useState('')
  const [juntasMHasta, setJuntasMHasta] = useState('')
  const [juntasFDesde, setJuntasFDesde] = useState('')
  const [juntasFHasta, setJuntasFHasta] = useState('')

  const [parroquias, setParroquias] = useState<Parroquia[]>([])
  const [filteredZonas, setFilteredZonas] = useState<Zona[]>([])

  const [loading, setLoading] = useState(false)
  const [toast, setToast] = useState<{ message: string; type: 'error' | 'success' } | null>(null)
  const [errors, setErrors] = useState<Record<string, string>>({})

  const fileInputRef = useRef<HTMLInputElement>(null)
  const [rechazados, setRechazados] = useState<{ row: string[], error: string }[]>([])
  const [importadosCount, setImportadosCount] = useState<number | null>(null)

  useEnterSubmit('#btn-ingresar-recinto')

  useEffect(() => {
    supabase.from('parroquias').select('id, nombre').neq('estado', 'Inactivo').order('nombre')
      .then(({ data }) => setParroquias(data ?? []))
  }, [supabase])

  useEffect(() => {
    if (!idParroquia) return

    let cancelled = false
    supabase
      .from('zonas')
      .select('id, nombre, codigo, id_parroquia')
      .eq('id_parroquia', idParroquia)
      .neq('estado', 'Inactivo')
      .order('nombre')
      .then(({ data, error }) => {
        if (error) {
          console.error('Error fetching zonas:', error)
        } else if (!cancelled) {
          setFilteredZonas(data as Zona[])
        }
      })

    return () => { cancelled = true }
  }, [idParroquia, supabase])

  function handleParroquiaChange(value: string) {
    setIdParroquia(value)
    setIdZona('')
    setFilteredZonas([])
    localStorage.setItem('lastRecintoParroquia', value)
  }

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

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (loading) return
    if (!validate()) return

    setLoading(true)
    const { error } = await supabase.rpc('create_recinto_with_juntas', {
      p_nombre: nombre.trim(),
      p_id_parroquia: idParroquia,
      p_juntas_m_desde: mDesde,
      p_juntas_m_hasta: mHasta,
      p_juntas_f_desde: fDesde,
      p_juntas_f_hasta: fHasta,
      p_id_zona: idZona || null,
    })

    if (error) {
      setLoading(false)
      setToast({ message: `Error al crear recinto: ${error.message}`, type: 'error' })
      return
    }

    setToast({ message: 'Recinto creado exitosamente', type: 'success' })
    setTimeout(() => router.push('/recintos'), 1200)
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
        if (rowsToProcess.length > 0 && rowsToProcess[0][0]?.trim().toLowerCase() === 'nombre') {
          rowsToProcess = rowsToProcess.slice(1)
        }

        const validCols: { nombre: string; idParroquia: string; idZona: string | null; mD: number; mH: number; fD: number; fH: number }[] = []
        const rejected: { row: string[]; error: string }[] = []

        const validParroquiaIds = new Set(parroquias.map(p => p.id))
        const requestedZonaIds = new Set(
          rowsToProcess
            .filter(row => row.length >= 7)
            .map(row => row[2]?.trim())
            .filter((id): id is string => Boolean(id)),
        )
        const zonasById = new Map<string, Zona>()

        if (requestedZonaIds.size > 0) {
          const { data: zonasImport, error: zonasError } = await supabase
            .from('zonas')
            .select('id, nombre, codigo, id_parroquia')
            .in('id', [...requestedZonaIds])
            .neq('estado', 'Inactivo')

          if (zonasError) {
            setLoading(false)
            setToast({ message: `Error verificando zonas: ${zonasError.message}`, type: 'error' })
            return
          }

          for (const zona of (zonasImport as Zona[] ?? [])) zonasById.set(zona.id, zona)
        }

        for (let i = 0; i < rowsToProcess.length; i++) {
          const row = rowsToProcess[i].map(c => c?.trim() || '')
          let rejectReason = ''

          const nombre = row[0]?.trim() || ''
          if (!nombre) {
            rejectReason = 'Falta Nombre'
          }

          const idParroquia = row[1]?.trim() || ''
          if (!idParroquia || !validParroquiaIds.has(idParroquia)) {
            rejectReason = rejectReason || 'ID Parroquia no presente o inválido'
          }

          const usesZonaColumn = row.length >= 7
          const idZona = usesZonaColumn ? (row[2]?.trim() || null) : null
          if (idZona) {
            const zona = zonasById.get(idZona)
            if (!zona) {
              rejectReason = rejectReason || 'ID Zona no presente, inactivo o inválido'
            } else if (zona.id_parroquia !== idParroquia) {
              rejectReason = rejectReason || 'La zona no pertenece a la parroquia indicada'
            }
          }

          let mD = 0, mH = 0, fD = 0, fH = 0

          if (row.length >= 6) {
            // Range formats: legacy (6 columns) or with optional id_zona (7 columns).
            const offset = usesZonaColumn ? 3 : 2
            const parseRange = (desde: string, hasta: string, label: string): [number, number] | null => {
              if (!desde && !hasta) return [0, 0]
              if (!desde || !hasta || !/^\d+$/.test(desde) || !/^\d+$/.test(hasta)) {
                rejectReason = rejectReason || `Rango de juntas ${label} incompleto o inválido`
                return null
              }
              const inicio = Number(desde)
              const fin = Number(hasta)
              if (inicio < 1 || fin < inicio) {
                rejectReason = rejectReason || `Rango de juntas ${label} inválido (Hasta debe ser >= Desde)`
                return null
              }
              return [inicio, fin]
            }

            const rangoM = parseRange(row[offset] || '', row[offset + 1] || '', 'M')
            const rangoF = parseRange(row[offset + 2] || '', row[offset + 3] || '', 'F')
            if (rangoM) [mD, mH] = rangoM
            if (rangoF) [fD, fH] = rangoF
          } else {
            // Legacy Quantity Format: nombre, id_parroquia, juntas_m, juntas_f
            const mCount = parseInt(row[2], 10) || 0
            const fCount = parseInt(row[3], 10) || 0

            if (mCount > 0) { mD = 1; mH = mCount; }
            if (fCount > 0) { fD = 1; fH = fCount; }
          }

          const tM = (mD > 0 && mH >= mD) ? (mH - mD + 1) : 0
          const tF = (fD > 0 && fH >= fD) ? (fH - fD + 1) : 0

          if (!rejectReason && tM === 0 && tF === 0) {
             rejectReason = 'Debe haber al menos una junta (M o F)'
          }

          if (rejectReason) {
            rejected.push({ row, error: rejectReason })
          } else {
            validCols.push({ nombre, idParroquia, idZona, mD, mH, fD, fH })
          }
        }

        let importados = 0
        if (validCols.length > 0) {
          for (const col of validCols) {
            const { error } = await supabase.rpc('create_recinto_with_juntas', {
              p_nombre: col.nombre,
              p_id_parroquia: col.idParroquia,
              p_juntas_m_desde: col.mD,
              p_juntas_m_hasta: col.mH,
              p_juntas_f_desde: col.fD,
              p_juntas_f_hasta: col.fH,
              p_id_zona: col.idZona,
            })
            if (error) {
               rejected.push({
                 row: [col.nombre, col.idParroquia, col.idZona ?? '', String(col.mD), String(col.mH), String(col.fD), String(col.fH)],
                 error: `Error BD: ${error.message}`
               })
            } else {
               importados++
            }
          }
        }

        setRechazados(rejected)
        setImportadosCount(importados)
        setLoading(false)
        if (e.target) e.target.value = ''

        if (importados > 0) {
          setToast({ message: `Se importaron ${importados} recintos correctamente.`, type: 'success' })
        } else if (rejected.length > 0) {
          setToast({ message: 'No se importó ningún recinto válido.', type: 'error' })
        }
      }
    })
  }

  const handleDownloadRechazados = () => {
    const csvData = rechazados.map(r => [...r.row, r.error])
    const csvHeader = ['Nombre', 'Parroquia', 'Zona', 'M Desde', 'M Hasta', 'F Desde', 'F Hasta', 'Error']
    const csv = Papa.unparse([csvHeader, ...csvData])
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    const url = URL.createObjectURL(blob)
    link.setAttribute('href', url)
    link.setAttribute('download', 'recintos_rechazados.csv')
    link.style.visibility = 'hidden'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  return (
    <div style={{ maxWidth: '600px' }}>
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 className="page-title">Nuevo Recinto</h1>
          <p className="page-subtitle">Complete los datos del recinto electoral</p>
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
            <p style={{ color: 'var(--color-text-muted)', fontSize: '0.85rem' }}>Se ingresaron {importadosCount} recinto{importadosCount !== 1 ? 's' : ''} al sistema.</p>
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
          <div className="form-grid">
            {/* Nombre */}
            <div className="form-group full">
              <label htmlFor="nombre-recinto" className="label">Nombre *</label>
              <input
                id="nombre-recinto"
                type="text"
                className={`input ${errors.nombre ? 'input-error' : ''}`}
                placeholder="Nombre del recinto"
                value={nombre}
                onChange={e => setNombre(e.target.value)}
              />
              {errors.nombre && <span className="error-text">{errors.nombre}</span>}
            </div>

            {/* Parroquia */}
            <div className="form-group full">
              <label htmlFor="parroquia-recinto" className="label">Parroquia *</label>
              <select
                id="parroquia-recinto"
              className={`input ${errors.parroquia ? 'input-error' : ''}`}
              value={idParroquia}
              onChange={e => handleParroquiaChange(e.target.value)}
              >
                <option value="">Seleccione una parroquia</option>
                {parroquias.map(p => (
                  <option key={p.id} value={p.id}>{p.nombre}</option>
                ))}
              </select>
              {errors.parroquia && <span className="error-text">{errors.parroquia}</span>}
            </div>

            {/* Zona */}
            {idParroquia && filteredZonas.length > 0 && (
              <div className="form-group full">
                <label htmlFor="zona-recinto" className="label">Zona Electoral (Opcional)</label>
                <select
                  id="zona-recinto"
                  className="input"
                  value={idZona}
                  onChange={e => setIdZona(e.target.value)}
                >
                  <option value="">Sin zona asignada</option>
                  {filteredZonas.map(z => (
                    <option key={z.id} value={z.id}>{z.codigo ? `[${z.codigo}] ` : ''}{z.nombre}</option>
                  ))}
                </select>
              </div>
            )}

            {/* Juntas M Range */}
            <div className="form-group full" style={{ background: 'var(--color-surface-2)', padding: '0.85rem', borderRadius: '8px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                <label className="label" style={{ marginBottom: 0 }}>Juntas Masculinas (M)</label>
                <span style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)' }}>
                  Total: <strong>{totalM}</strong> junta{totalM !== 1 ? 's' : ''}
                </span>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                <div>
                  <label htmlFor="juntas-m-desde" style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>Desde (Nº)</label>
                  <input
                    id="juntas-m-desde"
                    type="number"
                    className="input"
                    placeholder="Ej. 1"
                    value={juntasMDesde}
                    onChange={e => setJuntasMDesde(e.target.value)}
                    min={1}
                  />
                </div>
                <div>
                  <label htmlFor="juntas-m-hasta" style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>Hasta (Nº)</label>
                  <input
                    id="juntas-m-hasta"
                    type="number"
                    className="input"
                    placeholder="Ej. 20"
                    value={juntasMHasta}
                    onChange={e => setJuntasMHasta(e.target.value)}
                    min={1}
                  />
                </div>
              </div>
              {errors.juntasM && <span className="error-text" style={{ marginTop: '0.4rem', display: 'block' }}>{errors.juntasM}</span>}
            </div>

            {/* Juntas F Range */}
            <div className="form-group full" style={{ background: 'var(--color-surface-2)', padding: '0.85rem', borderRadius: '8px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                <label className="label" style={{ marginBottom: 0 }}>Juntas Femeninas (F)</label>
                <span style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)' }}>
                  Total: <strong>{totalF}</strong> junta{totalF !== 1 ? 's' : ''}
                </span>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                <div>
                  <label htmlFor="juntas-f-desde" style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>Desde (Nº)</label>
                  <input
                    id="juntas-f-desde"
                    type="number"
                    className="input"
                    placeholder="Ej. 24"
                    value={juntasFDesde}
                    onChange={e => setJuntasFDesde(e.target.value)}
                    min={1}
                  />
                </div>
                <div>
                  <label htmlFor="juntas-f-hasta" style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>Hasta (Nº)</label>
                  <input
                    id="juntas-f-hasta"
                    type="number"
                    className="input"
                    placeholder="Ej. 28"
                    value={juntasFHasta}
                    onChange={e => setJuntasFHasta(e.target.value)}
                    min={1}
                  />
                </div>
              </div>
              {errors.juntasF && <span className="error-text" style={{ marginTop: '0.4rem', display: 'block' }}>{errors.juntasF}</span>}
            </div>
          </div>

          <div style={{ marginTop: '1.5rem', display: 'flex', gap: '0.75rem' }}>
            <button
              id="btn-ingresar-recinto"
              type="submit"
              className="btn btn-primary"
              disabled={loading}
            >
              {loading ? <><span className="spinner" /> Creando...</> : 'Ingresar'}
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
