'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { useCallback, useState } from 'react'

type Parroquia = { id: string; nombre: string }

export default function RecintoFilters({
  estadoFilter,
  parroquiaFilter,
  nombreFilter,
  parroquias,
}: {
  estadoFilter: string
  parroquiaFilter: string
  nombreFilter: string
  parroquias: Parroquia[]
}) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [nombre, setNombre] = useState(nombreFilter)

  const updateFilter = useCallback(
    (key: string, value: string) => {
      const params = new URLSearchParams(searchParams.toString())
      if (value) params.set(key, value)
      else params.delete(key)
      router.push(`/recintos?${params.toString()}`)
    },
    [router, searchParams]
  )

  const estados = ['Activo', 'Inactivo', 'Todos']

  return (
    <div className="filters-bar">
      {/* Nombre search */}
      <input
        type="text"
        className="input"
        placeholder="Buscar por nombre..."
        value={nombre}
        onChange={e => setNombre(e.target.value)}
        onKeyDown={e => e.key === 'Enter' && updateFilter('nombre', nombre)}
        style={{ maxWidth: '220px' }}
        id="filter-nombre-recinto"
      />

      {/* Estado */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
        <span style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>Estado:</span>
        <div style={{ display: 'flex', gap: '0.25rem' }}>
          {estados.map(e => (
            <button
              key={e}
              onClick={() => updateFilter('estado', e)}
              className={`btn btn-xs ${estadoFilter === e ? 'btn-primary' : 'btn-secondary'}`}
            >
              {e}
            </button>
          ))}
        </div>
      </div>

      {/* Parroquia */}
      <select
        className="input"
        style={{ maxWidth: '200px' }}
        value={parroquiaFilter}
        onChange={e => updateFilter('parroquia', e.target.value)}
        id="filter-parroquia-recinto"
      >
        <option value="">Todas las parroquias</option>
        {parroquias.map(p => (
          <option key={p.id} value={p.id}>{p.nombre}</option>
        ))}
      </select>
    </div>
  )
}
