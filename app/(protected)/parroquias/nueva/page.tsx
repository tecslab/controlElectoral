'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import Toast from '@/components/ui/Toast'

export default function NuevaParroquiaPage() {
  const router = useRouter()
  const supabase = createClient()

  const [nombre, setNombre] = useState('')
  const [tipo, setTipo] = useState<'Urbana' | 'Rural'>('Urbana')
  const [loading, setLoading] = useState(false)
  const [toast, setToast] = useState<{ message: string; type: 'error' | 'success' } | null>(null)
  const [errors, setErrors] = useState<{ nombre?: string }>({})

  function validate() {
    const errs: typeof errors = {}
    if (!nombre.trim()) errs.nombre = 'El nombre es obligatorio'
    setErrors(errs)
    return Object.keys(errs).length === 0
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!validate()) return

    setLoading(true)
    const { error } = await supabase.from('parroquias').insert({
      nombre: nombre.trim(),
      tipo,
    })
    setLoading(false)

    if (error) {
      setToast({ message: `Error al crear parroquia: ${error.message}`, type: 'error' })
      return
    }

    setToast({ message: 'Parroquia creada exitosamente', type: 'success' })
    setTimeout(() => router.push('/parroquias'), 1200)
  }

  return (
    <div style={{ maxWidth: '560px' }}>
      <div className="page-header">
        <div>
          <h1 className="page-title">Nueva Parroquia</h1>
          <p className="page-subtitle">Ingrese los datos de la parroquia</p>
        </div>
      </div>

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
