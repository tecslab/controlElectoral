import Sidebar from '@/components/layout/Sidebar'

export default function ProtectedLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="protected-shell">
      <Sidebar />
      <main className="protected-main">{children}</main>
    </div>
  )
}
