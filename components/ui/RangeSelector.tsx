'use client'

import React, { useState, useEffect } from 'react'

type Junta = { id: string; numero: number; sexo: string }

type RangeSelectorProps = {
  label: string
  sexo: 'M' | 'F'
  juntas: Junta[]
  desde: number
  hasta: number
  onChange: (desde: number, hasta: number) => void
  disabled?: boolean
  idPrefix: string
}

export default function RangeSelector({
  label,
  sexo,
  juntas,
  desde,
  hasta,
  onChange,
  disabled = false,
  idPrefix,
}: RangeSelectorProps) {
  const available = juntas
    .filter(j => j.sexo === sexo)
    .map(j => j.numero)
    .sort((a, b) => a - b)

  const max = available.length > 0 ? Math.max(...available) : 0
  const min = available.length > 0 ? Math.min(...available) : 1

  const [localDesde, setLocalDesde] = useState(String(desde || ''))
  const [localHasta, setLocalHasta] = useState(String(hasta || ''))

  useEffect(() => {
    setLocalDesde(String(desde || ''))
  }, [desde])

  useEffect(() => {
    setLocalHasta(String(hasta || ''))
  }, [hasta])

  function handleDesdeBlur() {
    let val = parseInt(localDesde)
    if (isNaN(val)) val = min
    const newDesde = Math.max(min, Math.min(val, hasta || max))
    setLocalDesde(String(newDesde))
    onChange(newDesde, hasta || max)
  }

  function handleHastaBlur() {
    let val = parseInt(localHasta)
    if (isNaN(val)) val = max
    const newHasta = Math.min(max, Math.max(val, desde || min))
    setLocalHasta(String(newHasta))
    onChange(desde || min, newHasta)
  }

  function handleSliderChange(newDesde: number, newHasta: number) {
    onChange(newDesde, newHasta)
  }

  if (max === 0) return null

  const getPercent = (value: number) => {
    if (max === min) return 50
    return ((value - min) / (max - min)) * 100
  }

  const currentDesde = desde || min
  const currentHasta = hasta || max

  return (
    <div style={{ marginBottom: '1.5rem' }}>
      <div className="label">{label} ({sexo}) — Juntas disponibles: {min}–{max}</div>
      
      {/* Slider */}
      <div style={{ padding: '2.5rem 1rem 1rem 1rem', position: 'relative' }}>
         <div style={{ position: 'absolute', top: '2.4rem', left: '0', fontSize: '12px', color: '#9ca3af' }}>{min}</div>
         <div style={{ position: 'absolute', top: '2.4rem', right: '0', fontSize: '12px', color: '#9ca3af' }}>{max}</div>

         <div style={{ position: 'relative', height: '4px', backgroundColor: '#e5e7eb', borderRadius: '4px', margin: '0 0.5rem' }}>
            {/* Active track */}
            <div 
              style={{
                position: 'absolute',
                height: '100%',
                backgroundColor: 'var(--color-primary)',
                borderRadius: '4px',
                left: `${getPercent(currentDesde)}%`,
                width: `${getPercent(currentHasta) - getPercent(currentDesde)}%`
              }}
            />
            
            {/* Min Thumb Label */}
            <div style={{
              position: 'absolute',
              left: `${getPercent(currentDesde)}%`,
              top: '-30px',
              transform: 'translateX(-50%)',
              backgroundColor: 'var(--color-primary)',
              color: 'white',
              padding: '2px 8px',
              borderRadius: '6px',
              fontSize: '12px',
              fontWeight: '500',
              zIndex: 10
            }}>
              {currentDesde}
              <div style={{
                position: 'absolute',
                bottom: '-4px',
                left: '50%',
                transform: 'translateX(-50%)',
                width: '0',
                height: '0',
                borderLeft: '4px solid transparent',
                borderRight: '4px solid transparent',
                borderTop: '4px solid var(--color-primary)',
              }} />
            </div>

            {/* Max Thumb Label */}
            <div style={{
              position: 'absolute',
              left: `${getPercent(currentHasta)}%`,
              top: '-30px',
              transform: 'translateX(-50%)',
              backgroundColor: 'var(--color-primary)',
              color: 'white',
              padding: '2px 8px',
              borderRadius: '6px',
              fontSize: '12px',
              fontWeight: '500',
              zIndex: 10
            }}>
              {currentHasta}
              <div style={{
                position: 'absolute',
                bottom: '-4px',
                left: '50%',
                transform: 'translateX(-50%)',
                width: '0',
                height: '0',
                borderLeft: '4px solid transparent',
                borderRight: '4px solid transparent',
                borderTop: '4px solid var(--color-primary)',
              }} />
            </div>

            {/* Min Slider Input */}
            <input
              type="range"
              min={min}
              max={max}
              value={currentDesde}
              onChange={(e) => {
                const val = Math.min(parseInt(e.target.value), currentHasta)
                handleSliderChange(val, currentHasta)
              }}
              disabled={disabled}
              className="absolute top-1/2 -translate-y-1/2 w-full appearance-none bg-transparent pointer-events-none custom-range"
              style={{ zIndex: currentDesde > max - 10 ? 5 : 3, left: 0, margin: 0 }}
            />
            {/* Max Slider Input */}
            <input
              type="range"
              min={min}
              max={max}
              value={currentHasta}
              onChange={(e) => {
                const val = Math.max(parseInt(e.target.value), currentDesde)
                handleSliderChange(currentDesde, val)
              }}
              disabled={disabled}
              className="absolute top-1/2 -translate-y-1/2 w-full appearance-none bg-transparent pointer-events-none custom-range"
              style={{ zIndex: 4, left: 0, margin: 0 }}
            />
         </div>
      </div>

      <style jsx>{`
        .custom-range::-webkit-slider-thumb {
          pointer-events: auto;
          appearance: none;
          width: 20px;
          height: 20px;
          border-radius: 50%;
          background: white;
          border: 3px solid var(--color-primary);
          cursor: pointer;
          box-shadow: 0 1px 3px rgba(0,0,0,0.1);
        }
        .custom-range::-moz-range-thumb {
          pointer-events: auto;
          width: 20px;
          height: 20px;
          border-radius: 50%;
          background: white;
          border: 3px solid var(--color-primary);
          cursor: pointer;
          box-shadow: 0 1px 3px rgba(0,0,0,0.1);
        }
      `}</style>

      {/* Inputs below slider */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginTop: '1.5rem' }}>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', marginBottom: '0.25rem' }}>Desde</div>
          <input
            id={`${idPrefix}-desde-${sexo}`}
            type="number"
            className="input"
            value={localDesde}
            onChange={e => setLocalDesde(e.target.value)}
            onBlur={handleDesdeBlur}
            disabled={disabled}
            placeholder={String(min)}
          />
        </div>
        <div style={{ paddingTop: '1.25rem', color: 'var(--color-text-muted)' }}>—</div>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', marginBottom: '0.25rem' }}>Hasta</div>
          <input
            id={`${idPrefix}-hasta-${sexo}`}
            type="number"
            className="input"
            value={localHasta}
            onChange={e => setLocalHasta(e.target.value)}
            onBlur={handleHastaBlur}
            disabled={disabled}
            placeholder={String(max)}
          />
        </div>
        {(desde && hasta) && (
          <div style={{
            paddingTop: '1.25rem',
            fontSize: '0.8rem',
            color: 'var(--color-primary)',
            whiteSpace: 'nowrap',
          }}>
            {hasta - desde + 1} juntas
          </div>
        )}
      </div>
    </div>
  )
}
