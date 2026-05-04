'use client'

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

  function handleDesde(val: number) {
    const newDesde = Math.max(min, Math.min(val, hasta || max))
    onChange(newDesde, hasta)
  }

  function handleHasta(val: number) {
    const newHasta = Math.min(max, Math.max(val, desde || min))
    onChange(desde, newHasta)
  }

  if (max === 0) return null

  return (
    <div>
      <div className="label">{label} ({sexo}) — Juntas disponibles: {min}–{max}</div>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', marginBottom: '0.25rem' }}>Desde</div>
          <input
            id={`${idPrefix}-desde-${sexo}`}
            type="number"
            className="input"
            value={desde || ''}
            onChange={e => handleDesde(parseInt(e.target.value) || min)}
            min={min}
            max={hasta || max}
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
            value={hasta || ''}
            onChange={e => handleHasta(parseInt(e.target.value) || max)}
            min={desde || min}
            max={max}
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
