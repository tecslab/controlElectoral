import React from 'react'

type AuditInfoProps = {
  createdAt?: string | null
  createdBy?: string | null
  updatedAt?: string | null
  updatedBy?: string | null
}

export default function AuditInfo({ createdAt, createdBy, updatedAt, updatedBy }: AuditInfoProps) {
  if (!createdAt && !createdBy && !updatedAt && !updatedBy) return null

  const formatDate = (isoString?: string | null) => {
    if (!isoString) return '—'
    try {
      const d = new Date(isoString)
      return d.toLocaleString('es-EC', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      })
    } catch {
      return isoString
    }
  }

  return (
    <div style={{
      marginTop: '1.5rem',
      paddingTop: '1rem',
      borderTop: '1px solid var(--color-border)',
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
      gap: '0.75rem',
      fontSize: '0.78rem',
      color: 'var(--color-text-faint)'
    }}>
      <div>
        <strong style={{ color: 'var(--color-text-muted)', fontWeight: 600 }}>Creado por:</strong>{' '}
        {createdBy || 'Sistema / Sin registro'}
        {createdAt && <div style={{ fontSize: '0.75rem', marginTop: '0.1rem' }}>{formatDate(createdAt)}</div>}
      </div>
      <div>
        <strong style={{ color: 'var(--color-text-muted)', fontWeight: 600 }}>Última modificación por:</strong>{' '}
        {updatedBy || createdBy || '—'}
        {updatedAt && <div style={{ fontSize: '0.75rem', marginTop: '0.1rem' }}>{formatDate(updatedAt)}</div>}
      </div>
    </div>
  )
}
