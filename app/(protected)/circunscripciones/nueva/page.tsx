'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import Toast from '@/components/ui/Toast'
import { useEnterSubmit } from '@/hooks/useEnterSubmit'

type Canton = { id: string; nombre: string }

export default function NuevaCircunscripcionPage() {
  const router = useRouter()
  const supabase = createClient()

  const [nombre, setNombre] = useState('')
  const [idCanton, setIdCanton] = useState('')
  const [tipo, setTipo] = useState<'Urbana' | 'Rural'>('Urbana')
  const [cantones, setCantones] = useState<Canton[]>([])
  const [loading, setLoading] = useState(false)
  const [toast, setToast] = useState<{ message: string; type: 'error' | 'success' } | null>(null)
  const [errors, setErrors] = useState<Record<string, string>>({})

  useEnterSubmit('#btn-ingresar-circunscripcion')

  useEffect(() => {
    supabase.from('cantones').select('id, nombre').eq('estado', 'Activo').order('nombre')
      .then(({ data }) => setCantones(data ?? []))
  }, [])

  function validate() {
    const errs: Record<string, string> = {}
    if (!nombre.trim()) errs.nombre = 'El nombre es obligatorio'
    if (!idCanton) errs.canton = 'Seleccione un cantón'
    setErrors(errs)
    return Object.keys(errs).length === 0
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (loading) return
    if (!validate()) return

    setLoading(true)
    const { error } = await supabase.from('circunscripciones').insert({
      nombre: nombre.trim(),
      id_canton: idCanton,
      tipo,
    })

    if (error) {
      setLoading(false)
      setToast({ message: `Error al crear circunscripción: ${error.message}`, type: 'error' })
      return
    }

    setToast({ message: 'Circunscripción creada exitosamente', type: 'success' })
    setTimeout(() => router.push('/circunscripciones'), 1200)
  }

  return (
    <div style={{ maxWidth: '560px' }}>
      <div className="page-header">
        <h1 className="page-title">Nueva Circunscripción</h1>
        <p className="page-subtitle">Ingrese los datos de la circunscripción electoral</p>
      </div>

      <div className="card">
        <form onSubmit={handleSubmit}>
          {/* Cantón */}
          <div className="form-group" style={{ marginBottom: '1.25rem' }}>
            <label htmlFor="canton" className="label">Cantón *</label>
            <select
              id="canton"
              className={`input ${errors.canton ? 'input-error' : ''}`}
              value={idCanton}
              onChange={e => setIdCanton(e.target.value)}
            >
              <option value="">Seleccione un cantón</option>
              {cantones.map(c => (
                <option key={c.id} value={c.id}>{c.nombre}</option>
              ))}
            </select>
            {errors.canton && <span className="error-text">{errors.canton}</span>}
          </div>

          {/* Nombre */}
          <div className="form-group" style={{ marginBottom: '1.25rem' }}>
            <label htmlFor="nombre-circunscripcion" className="label">Nombre *</label>
            <input
              id="nombre-circunscripcion"
              type="text"
              className={`input ${errors.nombre ? 'input-error' : ''}`}
              placeholder="Ej. Circunscripción 1, Circunscripción Rural"
              value={nombre}
              onChange={e => setNombre(e.target.value)}
            />
            {errors.nombre && <span className="error-text">{errors.nombre}</span>}
          </div>

          {/* Tipo */}
          <div className="form-group" style={{ marginBottom: '1.75rem' }}>
            <label className="label">Tipo *</label>
            <div className="toggle-wrapper">
              <span className={`toggle-label ${tipo === 'Urbana' ? 'active' : ''}`}>Urbana</span>
              <div
                onClick={() => setTipo(t => t === 'Urbana' ? 'Rural' : 'Urbana')}
                style={{
                  width: '44px', height: '24px', borderRadius: '12px',
                  background: tipo === 'Rural' ? 'var(--color-success)' : 'var(--color-primary)',
                  position: 'relative', cursor: 'pointer', transition: 'background 0.2s', flexShrink: 0,
                }}
              >
                <div style={{
                  position: 'absolute', top: '3px',
                  left: tipo === 'Rural' ? '22px' : '3px',
                  width: '18px', height: '18px', borderRadius: '50%',
                  background: 'white', transition: 'left 0.2s',
                }} />
              </div>
              <span className={`toggle-label ${tipo === 'Rural' ? 'active' : ''}`}>Rural</span>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '0.75rem' }}>
            <button
              id="btn-ingresar-circunscripcion"
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
