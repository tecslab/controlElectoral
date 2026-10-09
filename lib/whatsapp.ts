type ConfirmationDetails = {
  whatsapp: string
  nombres: string
  rol: string
  recinto: string | null
  parroquia: string | null
}

export function buildConfirmationWhatsappUrl({ whatsapp, nombres, rol, recinto, parroquia }: ConfirmationDetails): string | null {
  const localNumber = whatsapp.trim()
  const name = nombres.trim()
  const role = rol.trim()
  const venue = recinto?.trim()
  const parish = parroquia?.trim()

  if (!/^09\d{8}$/.test(localNumber) || !name || !role || !venue || !parish) return null

  const messageRole = role === 'MJRV' ? 'Veedor' : role
  const message = `Hola ${name}, te contactamos para confirmar tu apoyo como ${messageRole} en ${venue} de la parroquia ${parish}.`
  return `https://wa.me/593${localNumber.slice(1)}?text=${encodeURIComponent(message)}`
}
