'use client'

import { useEffect } from 'react'

type ToastProps = {
  message: string
  type?: 'error' | 'success' | 'warning'
  onClose: () => void
  duration?: number
}

export default function Toast({ message, type = 'error', onClose, duration = 5000 }: ToastProps) {
  useEffect(() => {
    const timer = setTimeout(onClose, duration)
    return () => clearTimeout(timer)
  }, [onClose, duration])

  const colors = {
    error: { bg: 'var(--color-danger-soft)', border: 'rgba(255,79,106,0.25)', text: 'var(--color-danger)', icon: '✕' },
    success: { bg: 'var(--color-success-soft)', border: 'rgba(52,211,153,0.25)', text: 'var(--color-success)', icon: '✓' },
    warning: { bg: 'var(--color-warning-soft)', border: 'rgba(251,191,36,0.25)', text: 'var(--color-warning)', icon: '⚠' },
  }

  const c = colors[type]

  return (
    <div style={{
      position: 'fixed',
      bottom: '1.5rem',
      right: '1.5rem',
      zIndex: 1000,
      display: 'flex',
      alignItems: 'center',
      gap: '0.75rem',
      padding: '0.85rem 1.25rem',
      background: c.bg,
      border: `1px solid ${c.border}`,
      borderRadius: '10px',
      color: c.text,
      fontSize: '0.875rem',
      maxWidth: '420px',
      boxShadow: '0 8px 32px rgba(0,0,0,0.35)',
      animation: 'slideIn 0.25s ease',
    }}>
      <style>{`
        @keyframes slideIn {
          from { opacity: 0; transform: translateY(8px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
      <span style={{ fontWeight: 700, fontSize: '1rem' }}>{c.icon}</span>
      <span style={{ flex: 1 }}>{message}</span>
      <button
        onClick={onClose}
        style={{
          background: 'none', border: 'none', cursor: 'pointer',
          color: c.text, opacity: 0.7, fontSize: '1rem', padding: '0 0.25rem',
        }}
      >×</button>
    </div>
  )
}
