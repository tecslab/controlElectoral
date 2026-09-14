'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import Toast from '@/components/ui/Toast'
import { useEnterSubmit } from '@/hooks/useEnterSubmit'

export default function NuevoCantonPage() {
  const router = useRouter()
  const supabase = createClient()

  const [nombre, setNombre] = useState('')
  const [loading, setLoading] = useState(false)
  const [toast, setToast] = useState<{ message: string; type: 'error' | 'success' } | null>(null)
  const [errors, setErrors] = useState<{ nombre?: string }>({})

  useEnterSubmit('#btn-ingresar-canton')

  function validate() {
    const errs: typeof errors = {}
    if (!nombre.trim()) errs.nombre = 'El nombre del cantón es obligatorio'
    setErrors(errs)
    return Object.keys(errs).length === 0
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (loading) return
    if (!validate()) return

    setLoading(true)
    const { error } = await supabase.from('cantones').insert({
      nombre: nombre.trim(),
    })

    if (error) {
      setLoading(false)
      setToast({ message: `Error al crear cantón: ${error.message}`, type: 'error' })
      return
    }

    setToast({ message: 'Cantón creado exitosamente', type: 'success' })
    setTimeout(() => router.push('/cantones'), 1200)
  }

  return (
    <div style={{ maxWidth: '560px' }}>
      <div className="page-header">
        <h1 className="page-title">Nuevo Cantón</h1>
        <p className="page-subtitle">Ingrese los datos de la ciudad o cantón</p>
      </div>

      <div className="card">
        <form onSubmit={handleSubmit}>
          <div className="form-group" style={{ marginBottom: '1.5rem' }}>
            <label htmlFor="nombre-canton" className="label">Nombre del Cantón *</label>
            <input
              id="nombre-canton"
              type="text"
              className={`input ${errors.nombre ? 'input-error' : ''}`}
              placeholder="Ej. Cuenca, Gualaceo, Quito"
              value={nombre}
              onChange={e => setNombre(e.target.value)}
            />
            {errors.nombre && <span className="error-text">{errors.nombre}</span>}
          </div>

          <div style={{ display: 'flex', gap: '0.75rem' }}>
            <button
              id="btn-ingresar-canton"
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
