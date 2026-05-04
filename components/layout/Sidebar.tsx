'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

type NavItem = {
  label: string
  href: string
  icon: string
}

const mainNav: NavItem[] = [
  { label: 'Parroquias', href: '/parroquias', icon: '🏘️' },
  { label: 'Recintos', href: '/recintos', icon: '🏫' },
  { label: 'Colaboradores', href: '/colaboradores', icon: '👥' },
  { label: 'Dashboard', href: '/dashboard', icon: '📊' },
]

const ingresoNav: NavItem[] = [
  { label: 'Parroquias', href: '/parroquias/nueva', icon: '＋' },
  { label: 'Recintos', href: '/recintos/nuevo', icon: '＋' },
  { label: 'Colaboradores', href: '/colaboradores/nuevo', icon: '＋' },
]

export default function Sidebar() {
  const pathname = usePathname()
  const router = useRouter()
  const supabase = createClient()
  const [ingresoOpen, setIngresoOpen] = useState(true)
  const [loggingOut, setLoggingOut] = useState(false)

  async function handleLogout() {
    setLoggingOut(true)
    await supabase.auth.signOut()
    router.push('/login')
  }

  const isActive = (href: string) =>
    pathname === href || (href !== '/' && pathname.startsWith(href + '/'))

  return (
    <aside style={{
      width: 'var(--sidebar-width)',
      minHeight: '100vh',
      background: 'var(--color-surface)',
      borderRight: '1px solid var(--color-border)',
      display: 'flex',
      flexDirection: 'column',
      position: 'fixed',
      left: 0,
      top: 0,
      bottom: 0,
      zIndex: 50,
    }}>
      {/* Logo */}
      <div style={{
        padding: '1.25rem 1.25rem',
        borderBottom: '1px solid var(--color-border)',
        display: 'flex',
        alignItems: 'center',
        gap: '0.75rem',
      }}>
        <div style={{
          width: '36px', height: '36px',
          background: 'var(--color-primary)',
          borderRadius: '10px',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: '1.1rem', flexShrink: 0,
        }}>🗳️</div>
        <div>
          <div style={{ fontWeight: 700, fontSize: '0.9rem', color: 'var(--color-text)' }}>
            Control Electoral
          </div>
          <div style={{ fontSize: '0.7rem', color: 'var(--color-text-muted)' }}>
            Sistema logístico
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav style={{ flex: 1, padding: '0.75rem 0.75rem', overflowY: 'auto' }}>

        {/* Ingresar section */}
        <div style={{ marginBottom: '0.5rem' }}>
          <button
            onClick={() => setIngresoOpen(o => !o)}
            style={{
              width: '100%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '0.5rem 0.75rem',
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              color: 'var(--color-text-muted)',
              fontSize: '0.7rem',
              fontWeight: 600,
              textTransform: 'uppercase',
              letterSpacing: '0.08em',
              borderRadius: '6px',
            }}
          >
            <span>Ingresar información</span>
            <span style={{ transition: 'transform 0.2s', transform: ingresoOpen ? 'rotate(180deg)' : 'none' }}>▾</span>
          </button>

          {ingresoOpen && (
            <div style={{ paddingLeft: '0.5rem' }}>
              {ingresoNav.map(item => (
                <NavLink key={item.href} item={item} active={pathname === item.href} />
              ))}
            </div>
          )}
        </div>

        {/* Divider */}
        <div style={{ height: '1px', background: 'var(--color-border)', margin: '0.5rem 0' }} />

        {/* Main nav */}
        <div style={{
          fontSize: '0.7rem',
          fontWeight: 600,
          textTransform: 'uppercase',
          letterSpacing: '0.08em',
          color: 'var(--color-text-muted)',
          padding: '0.5rem 0.75rem 0.35rem',
        }}>
          Ver información
        </div>
        {mainNav.map(item => (
          <NavLink key={item.href} item={item} active={isActive(item.href) && !pathname.includes('/nueva') && !pathname.includes('/nuevo')} />
        ))}
      </nav>

      {/* Logout */}
      <div style={{ padding: '0.75rem', borderTop: '1px solid var(--color-border)' }}>
        <button
          onClick={handleLogout}
          disabled={loggingOut}
          className="btn btn-ghost"
          style={{ width: '100%', justifyContent: 'center', fontSize: '0.825rem' }}
          id="btn-logout"
        >
          {loggingOut ? <span className="spinner spinner-dark" /> : '↩'} Cerrar sesión
        </button>
      </div>
    </aside>
  )
}

function NavLink({ item, active }: { item: NavItem; active: boolean }) {
  return (
    <Link
      href={item.href}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '0.6rem',
        padding: '0.5rem 0.75rem',
        borderRadius: '8px',
        marginBottom: '0.15rem',
        fontSize: '0.875rem',
        fontWeight: active ? 600 : 400,
        color: active ? 'var(--color-primary)' : 'var(--color-text-muted)',
        background: active ? 'var(--color-primary-soft)' : 'transparent',
        textDecoration: 'none',
        transition: 'all 0.15s',
      }}
      onMouseEnter={e => {
        if (!active) {
          (e.currentTarget as HTMLElement).style.background = 'var(--color-surface-2)'
          ;(e.currentTarget as HTMLElement).style.color = 'var(--color-text)'
        }
      }}
      onMouseLeave={e => {
        if (!active) {
          (e.currentTarget as HTMLElement).style.background = 'transparent'
          ;(e.currentTarget as HTMLElement).style.color = 'var(--color-text-muted)'
        }
      }}
    >
      <span style={{ fontSize: '0.9rem', width: '18px', textAlign: 'center' }}>{item.icon}</span>
      {item.label}
    </Link>
  )
}
