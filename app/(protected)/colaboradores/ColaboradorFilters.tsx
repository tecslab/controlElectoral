'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { useCallback, useState } from 'react'

type Option = { id: string; nombre: string }

export default function ColaboradorFilters({
  filters,
  parroquias,
  recintos,
}: {
  filters: Record<string, string>
  parroquias: Option[]
  recintos: Option[]
}) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [nombre, setNombre] = useState(filters.nombre ?? '')

  const updateFilter = useCallback(
    (key: string, value: string) => {
      const params = new URLSearchParams(searchParams.toString())
      if (value) params.set(key, value)
      else params.delete(key)
      params.delete('page')
      router.push(`/colaboradores?${params.toString()}`)
    },
    [router, searchParams]
  )

  const contactados = ['Todos', 'Sí', 'No', 'No responde', 'Volver a contactar']
  const roles = ['Todos', 'MJRV', 'Coordinador']
  const capacitacion = ['Todos', 'Sí', 'No']

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginBottom: '1.25rem' }}>
      {/* Row 1 */}
      <div className="filters-bar">
        <input
          type="text"
          className="input"
          placeholder="Buscar por apellido..."
          value={nombre}
          onChange={e => setNombre(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && updateFilter('nombre', nombre)}
          style={{ maxWidth: '220px' }}
          id="filter-nombre-colaborador"
        />

        <select
          className="input"
          style={{ maxWidth: '200px' }}
          value={filters.recinto ?? ''}
          onChange={e => updateFilter('recinto', e.target.value)}
          id="filter-recinto-colaborador"
        >
          <option value="">Todos los recintos</option>
          <option value="unassigned">No asignados</option>
          {recintos.map(r => <option key={r.id} value={r.id}>{r.nombre}</option>)}
        </select>

        <select
          className="input"
          style={{ maxWidth: '200px' }}
          value={filters.parroquia ?? ''}
          onChange={e => updateFilter('parroquia', e.target.value)}
          id="filter-parroquia-colaborador"
        >
          <option value="">Todas las parroquias</option>
          {parroquias.map(p => <option key={p.id} value={p.id}>{p.nombre}</option>)}
        </select>
      </div>

      {/* Row 2 */}
      <div className="filters-bar">
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <span style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>Rol:</span>
          {roles.map(r => (
            <button
              key={r}
              onClick={() => updateFilter('rol', r === 'Todos' ? '' : r)}
              className={`btn btn-xs ${(filters.rol ?? '') === (r === 'Todos' ? '' : r) ? 'btn-primary' : 'btn-secondary'}`}
            >
              {r}
            </button>
          ))}
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <span style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>Contactado:</span>
          {contactados.map(c => (
            <button
              key={c}
              onClick={() => updateFilter('contactado', c === 'Todos' ? '' : c)}
              className={`btn btn-xs ${(filters.contactado ?? '') === (c === 'Todos' ? '' : c) ? 'btn-primary' : 'btn-secondary'}`}
            >
              {c}
            </button>
          ))}
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <span style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>Capacitación:</span>
          {capacitacion.map(v => (
            <button
              key={v}
              onClick={() => updateFilter('capacitacion', v === 'Todos' ? '' : v)}
              className={`btn btn-xs ${(filters.capacitacion ?? '') === (v === 'Todos' ? '' : v) ? 'btn-primary' : 'btn-secondary'}`}
            >
              {v}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
