'use client'

import { useState, useEffect, useRef } from 'react'
import Papa from 'papaparse'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import Toast from '@/components/ui/Toast'
import { useEnterSubmit } from '@/hooks/useEnterSubmit'

type Parroquia = { id: string; nombre: string }

export default function NuevoRecintoPage() {
  const router = useRouter()
  const supabase = createClient()

  const [nombre, setNombre] = useState('')
  const [idParroquia, setIdParroquia] = useState('')
  const [juntasM, setJuntasM] = useState('')
  const [juntasF, setJuntasF] = useState('')
  const [parroquias, setParroquias] = useState<Parroquia[]>([])
  const [loading, setLoading] = useState(false)
  const [toast, setToast] = useState<{ message: string; type: 'error' | 'success' } | null>(null)
  const [errors, setErrors] = useState<Record<string, string>>({})

  const fileInputRef = useRef<HTMLInputElement>(null)
  const [rechazados, setRechazados] = useState<{ row: string[], error: string }[]>([])
  const [importadosCount, setImportadosCount] = useState<number | null>(null)

  useEnterSubmit('#btn-ingresar-recinto')

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const lastParroquia = localStorage.getItem('lastRecintoParroquia')
      if (lastParroquia) setIdParroquia(lastParroquia)
    }

    supabase.from('parroquias').select('id, nombre').eq('estado', 'Activo').order('nombre')
      .then(({ data }) => setParroquias(data ?? []))
  }, [])

  function validate() {
    const errs: Record<string, string> = {}
    if (!nombre.trim()) errs.nombre = 'El nombre es obligatorio'
    if (!idParroquia) errs.parroquia = 'Seleccione una parroquia'
    const m = parseInt(juntasM)
    const f = parseInt(juntasF)
    if (isNaN(m) || m < 0 || m > 70) errs.juntasM = 'Ingrese un número entre 0 y 70'
    if (isNaN(f) || f < 0 || f > 70) errs.juntasF = 'Ingrese un número entre 0 y 70'
    if (!errs.juntasM && !errs.juntasF && m === 0 && f === 0) {
      errs.juntasM = 'Debe haber al menos una junta'
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
      p_juntas_m: parseInt(juntasM) || 0,
      p_juntas_f: parseInt(juntasF) || 0,
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

        const validCols: any[] = []
        const rejected: any[] = []

        const validParroquiaIds = new Set(parroquias.map(p => p.id))

        for (let i = 0; i < rowsToProcess.length; i++) {
          const row = rowsToProcess[i].map(c => c?.trim() || '')
          const [nombreRaw = '', parroquiaRaw = '', juntasMRaw = '', juntasFRaw = ''] = row

          let rejectReason = ''
          const nombre = nombreRaw.trim()
          if (!nombre) {
            rejectReason = 'Falta Nombre'
          }

          const idParroquia = parroquiaRaw.trim()
          if (!idParroquia || !validParroquiaIds.has(idParroquia)) {
            rejectReason = rejectReason || 'ID Parroquia no presente o inválido'
          }

          const m = parseInt(juntasMRaw, 10)
          if (!juntasMRaw || isNaN(m) || m < 0 || m > 70) {
            rejectReason = rejectReason || 'Juntas Masculinas inválidas (debe ser número 0-70)'
          }

          const f = parseInt(juntasFRaw, 10)
          if (!juntasFRaw || isNaN(f) || f < 0 || f > 70) {
            rejectReason = rejectReason || 'Juntas Femeninas inválidas (debe ser número 0-70)'
          }

          if (!rejectReason && m === 0 && f === 0) {
             rejectReason = 'Debe haber al menos una junta (M o F)'
          }

          if (rejectReason) {
            rejected.push({ row, error: rejectReason })
          } else {
            validCols.push({ nombre, idParroquia, m, f })
          }
        }

        let importados = 0
        if (validCols.length > 0) {
          for (const col of validCols) {
            const { error } = await supabase.rpc('create_recinto_with_juntas', {
              p_nombre: col.nombre,
              p_id_parroquia: col.idParroquia,
              p_juntas_m: col.m,
              p_juntas_f: col.f,
            })
            if (error) {
               rejected.push({
                 row: [col.nombre, col.idParroquia, String(col.m), String(col.f)],
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
    const csvHeader = ['Nombre', 'Parroquia', 'Juntas Masculinas', 'Juntas Femeninas', 'Error']
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
                onChange={e => {
                  const val = e.target.value
                  setIdParroquia(val)
                  localStorage.setItem('lastRecintoParroquia', val)
                }}
              >
                <option value="">Seleccione una parroquia</option>
                {parroquias.map(p => (
                  <option key={p.id} value={p.id}>{p.nombre}</option>
                ))}
              </select>
              {errors.parroquia && <span className="error-text">{errors.parroquia}</span>}
            </div>

            {/* Juntas M */}
            <div className="form-group">
              <label htmlFor="juntas-m" className="label">Juntas Masculinas (M) *</label>
              <input
                id="juntas-m"
                type="number"
                className={`input ${errors.juntasM ? 'input-error' : ''}`}
                placeholder="0"
                value={juntasM}
                onChange={e => setJuntasM(e.target.value)}
                min={0}
                max={70}
              />
              {errors.juntasM && <span className="error-text">{errors.juntasM}</span>}
            </div>

            {/* Juntas F */}
            <div className="form-group">
              <label htmlFor="juntas-f" className="label">Juntas Femeninas (F) *</label>
              <input
                id="juntas-f"
                type="number"
                className={`input ${errors.juntasF ? 'input-error' : ''}`}
                placeholder="0"
                value={juntasF}
                onChange={e => setJuntasF(e.target.value)}
                min={0}
                max={70}
              />
              {errors.juntasF && <span className="error-text">{errors.juntasF}</span>}
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
