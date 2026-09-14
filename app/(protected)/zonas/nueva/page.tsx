'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import Toast from '@/components/ui/Toast'
import { useEnterSubmit } from '@/hooks/useEnterSubmit'

type Parroquia = { id: string; nombre: string }

export default function NuevaZonaPage() {
  const router = useRouter()
  const supabase = createClient()

  const [nombre, setNombre] = useState('')
  const [codigo, setCodigo] = useState('')
  const [idParroquia, setIdParroquia] = useState('')
  const [parroquias, setParroquias] = useState<Parroquia[]>([])
  const [loading, setLoading] = useState(false)
  const [toast, setToast] = useState<{ message: string; type: 'error' | 'success' } | null>(null)
  const [errors, setErrors] = useState<Record<string, string>>({})

  useEnterSubmit('#btn-ingresar-zona')

  useEffect(() => {
    supabase.from('parroquias').select('id, nombre').eq('estado', 'Activo').order('nombre')
      .then(({ data }) => setParroquias(data ?? []))
  }, [])

  function validate() {
    const errs: Record<string, string> = {}
    if (!nombre.trim()) errs.nombre = 'El nombre de la zona es obligatorio'
    if (!idParroquia) errs.parroquia = 'Seleccione una parroquia'
    setErrors(errs)
    return Object.keys(errs).length === 0
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (loading) return
    if (!validate()) return

    setLoading(true)
    const { error } = await supabase.from('zonas').insert({
      nombre: nombre.trim(),
      codigo: codigo.trim() || null,
      id_parroquia: idParroquia,
    })

    if (error) {
      setLoading(false)
      setToast({ message: `Error al crear zona: ${error.message}`, type: 'error' })
      return
    }

    setToast({ message: 'Zona creada exitosamente', type: 'success' })
    setTimeout(() => router.push('/zonas'), 1200)
  }

  return (
    <div style={{ maxWidth: '560px' }}>
      <div className="page-header">
        <h1 className="page-title">Nueva Zona Electoral</h1>
        <p className="page-subtitle">Ingrese los datos de la zona perteneciente a una parroquia</p>
      </div>

      <div className="card">
        <form onSubmit={handleSubmit}>
          {/* Parroquia */}
          <div className="form-group" style={{ marginBottom: '1.25rem' }}>
            <label htmlFor="parroquia-zona" className="label">Parroquia *</label>
            <select
              id="parroquia-zona"
              className={`input ${errors.parroquia ? 'input-error' : ''}`}
              value={idParroquia}
              onChange={e => setIdParroquia(e.target.value)}
            >
              <option value="">Seleccione una parroquia</option>
              {parroquias.map(p => (
                <option key={p.id} value={p.id}>{p.nombre}</option>
              ))}
            </select>
            {errors.parroquia && <span className="error-text">{errors.parroquia}</span>}
          </div>

          {/* Código */}
          <div className="form-group" style={{ marginBottom: '1.25rem' }}>
            <label htmlFor="codigo-zona" className="label">Código (Opcional)</label>
            <input
              id="codigo-zona"
              type="text"
              className="input"
              placeholder="Ej. Z01, 01"
              value={codigo}
              onChange={e => setCodigo(e.target.value)}
            />
          </div>

          {/* Nombre */}
          <div className="form-group" style={{ marginBottom: '1.75rem' }}>
            <label htmlFor="nombre-zona" className="label">Nombre de la Zona *</label>
            <input
              id="nombre-zona"
              type="text"
              className={`input ${errors.nombre ? 'input-error' : ''}`}
              placeholder="Ej. Zona El Sagrario, Zona Central"
              value={nombre}
              onChange={e => setNombre(e.target.value)}
            />
            {errors.nombre && <span className="error-text">{errors.nombre}</span>}
          </div>

          <div style={{ display: 'flex', gap: '0.75rem' }}>
            <button
              id="btn-ingresar-zona"
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
