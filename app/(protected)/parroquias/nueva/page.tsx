'use client'

import { useState, useRef } from 'react'
import Papa from 'papaparse'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import Toast from '@/components/ui/Toast'
import { useEnterSubmit } from '@/hooks/useEnterSubmit'

export default function NuevaParroquiaPage() {
  const router = useRouter()
  const supabase = createClient()

  const [nombre, setNombre] = useState('')
  const [tipo, setTipo] = useState<'Urbana' | 'Rural'>('Urbana')
  const [loading, setLoading] = useState(false)
  const [toast, setToast] = useState<{ message: string; type: 'error' | 'success' } | null>(null)
  const [errors, setErrors] = useState<{ nombre?: string }>({})

  const fileInputRef = useRef<HTMLInputElement>(null)
  const [rechazados, setRechazados] = useState<{ row: string[], error: string }[]>([])
  const [importadosCount, setImportadosCount] = useState<number | null>(null)

  useEnterSubmit('#btn-ingresar-parroquia')

  function validate() {
    const errs: typeof errors = {}
    if (!nombre.trim()) errs.nombre = 'El nombre es obligatorio'
    setErrors(errs)
    return Object.keys(errs).length === 0
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (loading) return
    if (!validate()) return

    setLoading(true)
    const { error } = await supabase.from('parroquias').insert({
      nombre: nombre.trim(),
      tipo,
    })

    if (error) {
      setLoading(false)
      setToast({ message: `Error al crear parroquia: ${error.message}`, type: 'error' })
      return
    }

    setToast({ message: 'Parroquia creada exitosamente', type: 'success' })
    setTimeout(() => router.push('/parroquias'), 1200)
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

        for (let i = 0; i < rowsToProcess.length; i++) {
          const row = rowsToProcess[i].map(c => c?.trim() || '')
          const [nombreRaw = '', tipoRaw = ''] = row

          let rejectReason = ''
          const nombre = nombreRaw.trim()
          if (!nombre) {
            rejectReason = 'Falta Nombre'
          }

          let tipo = tipoRaw.trim() || 'Urbana'
          if (tipo.toLowerCase() === 'urbano' || tipo.toLowerCase() === 'urbana') {
            tipo = 'Urbana'
          } else if (tipo.toLowerCase() === 'rural') {
            tipo = 'Rural'
          }

          if (tipo !== 'Urbana' && tipo !== 'Rural' && !rejectReason) {
            rejectReason = 'Tipo inválido (debe ser Urbana o Rural)'
          }

          if (rejectReason) {
            rejected.push({ row, error: rejectReason })
          } else {
            validCols.push({ nombre, tipo })
          }
        }

        if (validCols.length > 0) {
          const { error } = await supabase
            .from('parroquias')
            .insert(validCols)

          if (error) {
            setToast({ message: `Error al insertar: ${error.message}`, type: 'error' })
            setLoading(false)
            return
          }
        }

        setRechazados(rejected)
        setImportadosCount(validCols.length)
        setLoading(false)
        if (e.target) e.target.value = ''
        
        if (validCols.length > 0) {
          setToast({ message: `Se importaron ${validCols.length} parroquias correctamente.`, type: 'success' })
        } else {
          setToast({ message: 'No se importó ninguna parroquia válida.', type: 'error' })
        }
      }
    })
  }

  const handleDownloadRechazados = () => {
    const csvData = rechazados.map(r => [...r.row, r.error])
    const csvHeader = ['Nombre', 'Tipo', 'Error']
    const csv = Papa.unparse([csvHeader, ...csvData])
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    const url = URL.createObjectURL(blob)
    link.setAttribute('href', url)
    link.setAttribute('download', 'parroquias_rechazadas.csv')
    link.style.visibility = 'hidden'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  return (
    <div style={{ maxWidth: '560px' }}>
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 className="page-title">Nueva Parroquia</h1>
          <p className="page-subtitle">Ingrese los datos de la parroquia</p>
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
            <p style={{ color: 'var(--color-text-muted)', fontSize: '0.85rem' }}>Se ingresaron {importadosCount} parroquia{importadosCount !== 1 ? 's' : ''} al sistema.</p>
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
          <div className="form-group" style={{ marginBottom: '1.25rem' }}>
            <label htmlFor="nombre-parroquia" className="label">Nombre *</label>
            <input
              id="nombre-parroquia"
              type="text"
              className={`input ${errors.nombre ? 'input-error' : ''}`}
              placeholder="Nombre de la parroquia"
              value={nombre}
              onChange={e => setNombre(e.target.value)}
            />
            {errors.nombre && <span className="error-text">{errors.nombre}</span>}
          </div>

          <div className="form-group" style={{ marginBottom: '1.75rem' }}>
            <label className="label">Tipo *</label>
            <div className="toggle-wrapper">
              <span className={`toggle-label ${tipo === 'Urbana' ? 'active' : ''}`}>Urbana</span>
              <div
                onClick={() => setTipo(t => t === 'Urbana' ? 'Rural' : 'Urbana')}
                style={{
                  width: '44px', height: '24px',
                  borderRadius: '12px',
                  background: tipo === 'Rural' ? 'var(--color-success)' : 'var(--color-primary)',
                  position: 'relative',
                  cursor: 'pointer',
                  transition: 'background 0.2s',
                  flexShrink: 0,
                }}
              >
                <div style={{
                  position: 'absolute',
                  top: '3px',
                  left: tipo === 'Rural' ? '22px' : '3px',
                  width: '18px', height: '18px',
                  borderRadius: '50%',
                  background: 'white',
                  transition: 'left 0.2s',
                }} />
              </div>
              <span className={`toggle-label ${tipo === 'Rural' ? 'active' : ''}`}>Rural</span>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '0.75rem' }}>
            <button
              id="btn-ingresar-parroquia"
              type="submit"
              className="btn btn-primary"
              disabled={loading}
            >
              {loading ? <><span className="spinner" /> Guardando...</> : 'Ingresar'}
            </button>
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => router.back()}
            >
              Cancelar
            </button>
          </div>
        </form>
      </div>

      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}
    </div>
  )
}
