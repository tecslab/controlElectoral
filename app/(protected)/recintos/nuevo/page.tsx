'use client'

import { useState, useEffect } from 'react'
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

  return (
    <div style={{ maxWidth: '600px' }}>
      <div className="page-header">
        <div>
          <h1 className="page-title">Nuevo Recinto</h1>
          <p className="page-subtitle">Complete los datos del recinto electoral</p>
        </div>
      </div>

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
