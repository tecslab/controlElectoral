'use client'

import { useEffect, useRef, useState } from 'react'
import type { MouseEvent } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import {
  BarChart3, Building2, ChevronRight, CirclePlus, DoorOpen,
  Home, LogOut, Map, MapPin, Menu, MoreHorizontal, Users, X,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { ENABLE_ELECTORAL_STRUCTURE_CREATION } from '@/lib/features'

type NavItem = { label: string; href: string; icon: LucideIcon }

const sections: NavItem[] = [
  { label: 'Dashboard', href: '/dashboard', icon: BarChart3 },
  { label: 'Cantones', href: '/cantones', icon: Building2 },
  { label: 'Circunscripciones', href: '/circunscripciones', icon: Map },
  { label: 'Parroquias', href: '/parroquias', icon: Home },
  { label: 'Zonas', href: '/zonas', icon: MapPin },
  { label: 'Recintos', href: '/recintos', icon: DoorOpen },
  { label: 'Colaboradores', href: '/colaboradores', icon: Users },
]

const createItems: NavItem[] = [
  ...(ENABLE_ELECTORAL_STRUCTURE_CREATION ? [
    { label: 'Nuevo cantón', href: '/cantones/nuevo', icon: CirclePlus },
    { label: 'Nueva circunscripción', href: '/circunscripciones/nueva', icon: CirclePlus },
    { label: 'Nueva parroquia', href: '/parroquias/nueva', icon: CirclePlus },
    { label: 'Nueva zona', href: '/zonas/nueva', icon: CirclePlus },
    { label: 'Nuevo recinto', href: '/recintos/nuevo', icon: CirclePlus },
  ] : []),
  { label: 'Nuevo colaborador', href: '/colaboradores/nuevo', icon: CirclePlus },
]

const quickNav = [
  { label: 'Inicio', href: '/dashboard', icon: Home },
  { label: 'Recintos', href: '/recintos', icon: DoorOpen },
  { label: 'Equipo', href: '/colaboradores', icon: Users },
]

function isActive(pathname: string, href: string) {
  return pathname === href || pathname.startsWith(`${href}/`)
}

export default function Sidebar() {
  const pathname = usePathname()
  const router = useRouter()
  const [menuOpen, setMenuOpen] = useState(false)
  const [loggingOut, setLoggingOut] = useState(false)
  const closeButtonRef = useRef<HTMLButtonElement>(null)
  const drawerRef = useRef<HTMLDivElement>(null)
  const menuTriggerRef = useRef<HTMLButtonElement>(null)

  function openMenu(event: MouseEvent<HTMLButtonElement>) {
    menuTriggerRef.current = event.currentTarget
    setMenuOpen(true)
  }

  useEffect(() => {
    if (!menuOpen) return
    const menuTrigger = menuTriggerRef.current
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    closeButtonRef.current?.focus()
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setMenuOpen(false)
      if (event.key === 'Tab') {
        const focusable = drawerRef.current?.querySelectorAll<HTMLElement>('a[href], button:not([disabled])')
        if (!focusable?.length) return
        const first = focusable[0]
        const last = focusable[focusable.length - 1]
        if (event.shiftKey && document.activeElement === first) {
          event.preventDefault()
          last.focus()
        } else if (!event.shiftKey && document.activeElement === last) {
          event.preventDefault()
          first.focus()
        }
      }
    }
    document.addEventListener('keydown', onKeyDown)
    return () => {
      document.body.style.overflow = previousOverflow
      document.removeEventListener('keydown', onKeyDown)
      menuTrigger?.focus()
    }
  }, [menuOpen])

  async function handleLogout() {
    setLoggingOut(true)
    await createClient().auth.signOut()
    router.push('/login')
  }

  const otherSectionActive = sections.some(
    item => !quickNav.some(quick => quick.href === item.href) && isActive(pathname, item.href),
  )

  return (
    <>
      <aside className="desktop-rail" aria-label="Navegación principal">
        <Link href="/dashboard" className="rail-brand" aria-label="Control Electoral, ir al dashboard">🗳️</Link>
        <nav className="rail-links" aria-label="Accesos rápidos">
          {quickNav.map(({ href, label, icon: Icon }) => (
            <Link key={href} href={href} className={`rail-link ${isActive(pathname, href) ? 'active' : ''}`} aria-label={label} title={label} aria-current={isActive(pathname, href) ? 'page' : undefined}>
              <Icon size={22} aria-hidden="true" />
            </Link>
          ))}
          <button type="button" className={`rail-link ${otherSectionActive ? 'active' : ''}`} aria-label="Abrir menú completo" title="Más secciones" aria-expanded={menuOpen} aria-controls={menuOpen ? 'navigation-drawer' : undefined} onClick={openMenu}>
            <Menu size={22} aria-hidden="true" />
          </button>
        </nav>
        <button type="button" className="rail-link rail-logout" onClick={handleLogout} disabled={loggingOut} aria-label="Cerrar sesión" title="Cerrar sesión">
          <LogOut size={21} aria-hidden="true" />
        </button>
      </aside>

      <header className="mobile-topbar">
        <Link href="/dashboard" className="mobile-brand"><span className="mobile-brand-mark" aria-hidden="true">🗳️</span>Control Electoral</Link>
        <button type="button" className="mobile-menu-button" aria-label="Abrir menú completo" aria-expanded={menuOpen} aria-controls={menuOpen ? 'navigation-drawer' : undefined} onClick={openMenu}>
          <Menu size={23} aria-hidden="true" />
        </button>
      </header>

      <nav className="mobile-bottom-nav" aria-label="Navegación principal">
        {quickNav.map(({ href, label, icon: Icon }) => (
          <Link key={href} href={href} className={`bottom-link ${isActive(pathname, href) ? 'active' : ''}`} aria-current={isActive(pathname, href) ? 'page' : undefined}>
            <Icon size={22} aria-hidden="true" /><span>{label}</span>
          </Link>
        ))}
        <button type="button" className={`bottom-link ${otherSectionActive || menuOpen ? 'active' : ''}`} aria-label="Más secciones" aria-expanded={menuOpen} aria-controls={menuOpen ? 'navigation-drawer' : undefined} onClick={openMenu}>
          <MoreHorizontal size={22} aria-hidden="true" /><span>Más</span>
        </button>
      </nav>

      {menuOpen && (
        <div className="navigation-overlay">
          <button type="button" className="navigation-scrim" aria-label="Cerrar menú" onClick={() => setMenuOpen(false)} />
          <div id="navigation-drawer" ref={drawerRef} className="navigation-drawer" role="dialog" aria-modal="true" aria-label="Menú de navegación">
            <div className="drawer-header">
              <span className="drawer-brand"><span aria-hidden="true">🗳️</span> Control Electoral</span>
              <button ref={closeButtonRef} type="button" className="drawer-close" aria-label="Cerrar menú" onClick={() => setMenuOpen(false)}><X size={22} aria-hidden="true" /></button>
            </div>
            <nav className="drawer-content" aria-label="Todas las secciones">
              <div className="drawer-section-label">Ver información</div>
              {sections.map(({ href, label, icon: Icon }) => (
                <Link key={href} href={href} onClick={() => setMenuOpen(false)} className={`drawer-link ${isActive(pathname, href) ? 'active' : ''}`} aria-current={isActive(pathname, href) ? 'page' : undefined}>
                  <Icon size={19} aria-hidden="true" /><span>{label}</span><ChevronRight size={16} aria-hidden="true" />
                </Link>
              ))}
              <div className="drawer-section-label drawer-create-label">Ingresar información</div>
              {createItems.map(({ href, label, icon: Icon }) => (
                <Link key={href} href={href} onClick={() => setMenuOpen(false)} className={`drawer-link ${isActive(pathname, href) ? 'active' : ''}`} aria-current={isActive(pathname, href) ? 'page' : undefined}>
                  <Icon size={19} aria-hidden="true" /><span>{label}</span><ChevronRight size={16} aria-hidden="true" />
                </Link>
              ))}
            </nav>
            <button type="button" className="drawer-logout" onClick={handleLogout} disabled={loggingOut}><LogOut size={19} aria-hidden="true" />{loggingOut ? 'Cerrando sesión…' : 'Cerrar sesión'}</button>
          </div>
        </div>
      )}
    </>
  )
}
