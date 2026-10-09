type ConfirmationDetails = {
  whatsapp: string
  nombres: string
  rol: string
  recinto: string | null
  parroquia: string | null
}

type ConfirmationLinks = { mobile: string; desktop: string }

export function buildConfirmationWhatsappLinks({ whatsapp, nombres, rol, recinto, parroquia }: ConfirmationDetails): ConfirmationLinks | null {
  const localNumber = whatsapp.trim()
  const name = nombres.trim()
  const role = rol.trim()
  const venue = recinto?.trim()
  const parish = parroquia?.trim()

  if (!/^09\d{8}$/.test(localNumber) || !name || !role || !venue || !parish) return null

  const messageRole = role === 'MJRV' ? 'Veedor' : role
  const message = `Hola ${name}, te contactamos para confirmar tu apoyo como ${messageRole} en ${venue} de la parroquia ${parish}.`
  const phone = `593${localNumber.slice(1)}`
  const text = encodeURIComponent(message)

  return {
    mobile: `https://wa.me/${phone}?text=${text}`,
    desktop: `https://web.whatsapp.com/send?phone=${phone}&text=${text}`,
  }
}
