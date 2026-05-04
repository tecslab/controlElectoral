import Sidebar from '@/components/layout/Sidebar'

export default function ProtectedLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div style={{ display: 'flex', minHeight: '100vh' }}>
      <Sidebar />
      <main style={{
        marginLeft: 'var(--sidebar-width)',
        flex: 1,
        padding: '2rem',
        maxWidth: '100%',
        overflowX: 'hidden',
      }}>
        {children}
      </main>
    </div>
  )
}
