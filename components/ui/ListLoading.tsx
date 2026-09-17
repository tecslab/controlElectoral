export default function ListLoading({ columns = 6, rows = 8 }: { columns?: number; rows?: number }) {
  return (
    <div aria-busy="true" aria-label="Cargando lista">
      <div className="page-header">
        <div>
          <div style={{ width: '11rem', height: '2rem', background: 'var(--color-surface-2)', borderRadius: '6px' }} />
          <div style={{ width: '16rem', height: '1rem', marginTop: '0.5rem', background: 'var(--color-surface-2)', borderRadius: '4px' }} />
        </div>
      </div>
      <div className="table-wrapper">
        <table>
          <tbody>
            {Array.from({ length: rows }, (_, row) => (
              <tr key={row}>
                {Array.from({ length: columns }, (_, column) => (
                  <td key={column}><div className="skeleton" style={{ height: '1rem', width: `${55 + ((row + column) % 4) * 12}%` }} /></td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
