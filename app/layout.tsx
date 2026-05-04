import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Control Electoral',
  description: 'Sistema de gestión logística para el control electoral. Organización de MJRVs, Coordinadores y Recintos.',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="es">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      </head>
      <body>{children}</body>
    </html>
  )
}
