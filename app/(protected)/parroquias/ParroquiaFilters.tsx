'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { useCallback } from 'react'

export default function ParroquiaFilters({
  estadoFilter,
  tipoFilter,
}: {
  estadoFilter: string
  tipoFilter: string
}) {
  const router = useRouter()
  const searchParams = useSearchParams()

  const updateFilter = useCallback(
    (key: string, value: string) => {
      const params = new URLSearchParams(searchParams.toString())
      params.set(key, value)
      router.push(`/parroquias?${params.toString()}`)
    },
    [router, searchParams]
  )

  const estados = ['Activo', 'Inactivo', 'Todos']
  const tipos = ['Todos', 'Urbana', 'Rural']

  return (
    <div className="filters-bar">
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

      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
        <span style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>Tipo:</span>
        <div style={{ display: 'flex', gap: '0.25rem' }}>
          {tipos.map(t => (
            <button
              key={t}
              onClick={() => updateFilter('tipo', t)}
              className={`btn btn-xs ${tipoFilter === t || (!tipoFilter && t === 'Todos') ? 'btn-primary' : 'btn-secondary'}`}
            >
              {t}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
