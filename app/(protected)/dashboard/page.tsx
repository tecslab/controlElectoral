export default function DashboardPage() {
  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Dashboard</h1>
          <p className="page-subtitle">Resumen general del evento electoral</p>
        </div>
      </div>

      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))',
        gap: '1rem',
        marginBottom: '2rem',
      }}>
        {[
          { label: 'Total Colaboradores', icon: '👥', color: 'var(--color-primary)' },
          { label: 'Recintos', icon: '🏫', color: '#a78bfa' },
          { label: 'Parroquias', icon: '🏘️', color: 'var(--color-success)' },
          { label: 'Juntas Cubiertas', icon: '✅', color: 'var(--color-warning)' },
        ].map(stat => (
          <div key={stat.label} className="card" style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <div style={{
              width: '48px', height: '48px',
              borderRadius: '12px',
              background: `${stat.color}22`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '1.4rem', flexShrink: 0,
            }}>
              {stat.icon}
            </div>
            <div>
              <div style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>{stat.label}</div>
              <div style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--color-text)' }}>—</div>
            </div>
          </div>
        ))}
      </div>

      <div className="card">
        <p style={{ color: 'var(--color-text-muted)', textAlign: 'center', padding: '2rem 0' }}>
          📊 El Dashboard completo se implementará en una siguiente fase.
        </p>
      </div>
    </div>
  )
}
