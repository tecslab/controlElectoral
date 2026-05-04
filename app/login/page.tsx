'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

export default function LoginPage() {
  const router = useRouter()
  const supabase = createClient()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)

    const { error } = await supabase.auth.signInWithPassword({ email, password })

    if (error) {
      setError('Credenciales incorrectas. Verifique su usuario y contraseña.')
      setLoading(false)
      return
    }

    router.push('/dashboard')
    router.refresh()
  }

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'var(--color-bg)',
      padding: '1rem',
    }}>
      {/* Background glow */}
      <div style={{
        position: 'fixed',
        inset: 0,
        background: 'radial-gradient(ellipse 60% 50% at 50% 0%, rgba(79,124,255,0.12) 0%, transparent 60%)',
        pointerEvents: 'none',
      }} />

      <div style={{ width: '100%', maxWidth: '400px', position: 'relative' }}>
        {/* Logo / Title */}
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: '52px',
            height: '52px',
            borderRadius: '14px',
            background: 'var(--color-primary)',
            marginBottom: '1rem',
            fontSize: '1.5rem',
          }}>
            🗳️
          </div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--color-text)' }}>
            Control Electoral
          </h1>
          <p style={{ color: 'var(--color-text-muted)', marginTop: '0.35rem', fontSize: '0.875rem' }}>
            Sistema de gestión logística
          </p>
        </div>

        {/* Card */}
        <div className="card" style={{ padding: '2rem' }}>
          <form onSubmit={handleSubmit}>
            <div className="form-group" style={{ marginBottom: '1rem' }}>
              <label htmlFor="email" className="label">Correo electrónico</label>
              <input
                id="email"
                type="email"
                className="input"
                placeholder="operador@ejemplo.com"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
                autoComplete="email"
                autoFocus
              />
            </div>

            <div className="form-group" style={{ marginBottom: '1.5rem' }}>
              <label htmlFor="password" className="label">Contraseña</label>
              <input
                id="password"
                type="password"
                className="input"
                placeholder="••••••••"
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
                autoComplete="current-password"
              />
            </div>

            {error && (
              <div style={{
                background: 'var(--color-danger-soft)',
                border: '1px solid rgba(255,79,106,0.25)',
                borderRadius: '8px',
                padding: '0.75rem 1rem',
                color: 'var(--color-danger)',
                fontSize: '0.875rem',
                marginBottom: '1.25rem',
              }}>
                {error}
              </div>
            )}

            <button
              id="btn-login"
              type="submit"
              className="btn btn-primary"
              disabled={loading}
              style={{ width: '100%', justifyContent: 'center', padding: '0.65rem' }}
            >
              {loading ? <><span className="spinner" /> Ingresando...</> : 'Ingresar'}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}
