import type { MovementType, ProductDraft } from '../types'

export type ProductDraftErrors = Partial<Record<keyof ProductDraft, string>>
const isNonNegative = (v: number): boolean => Number.isFinite(v) && v >= 0

export const validateProductDraft = (
  draft: ProductDraft, existingCodes: string[] = [],
): ProductDraftErrors => {
  const errors: ProductDraftErrors = {}
  const codigo = draft.codigo.trim()
  if (!codigo) errors.codigo = 'El código es obligatorio'
  else if (existingCodes.includes(codigo)) errors.codigo = 'Ese código ya existe'
  if (!draft.nombre.trim()) errors.nombre = 'El nombre es obligatorio'
  if (!isNonNegative(draft.stockInicial)) errors.stockInicial = 'El stock debe ser cero o positivo'
  if (!isNonNegative(draft.stockMinimo)) errors.stockMinimo = 'El mínimo debe ser cero o positivo'
  if (!isNonNegative(draft.stockObjetivo)) errors.stockObjetivo = 'El objetivo debe ser cero o positivo'
  else if (draft.stockObjetivo > 0 && draft.stockObjetivo < draft.stockMinimo) {
    errors.stockObjetivo = 'El objetivo no puede ser menor que el mínimo'
  }
  return errors
}

export const firstError = (errors: ProductDraftErrors): string | null =>
  Object.values(errors)[0] ?? null

export const validateMovementQuantity = (
  type: MovementType, requested: number, available: number,
): string | null => {
  if (!Number.isFinite(requested)) return 'La cantidad debe ser un número'
  if (type === 'Ajuste') return requested < 0 ? 'El conteo real no puede ser negativo' : null
  if (requested <= 0) return 'La cantidad debe ser mayor que cero'
  if (type === 'Salida' && requested > available) return 'Stock insuficiente para registrar la salida'
  return null
}

/** Acepta 04xx-xxxxxxx venezolano o un número internacional con +. */
export const validatePhone = (raw: string): string | null => {
  const value = raw.trim()
  if (!value) return 'El teléfono es obligatorio'
  const digits = value.replace(/\D/g, '')
  if (value.startsWith('+')) {
    return digits.length >= 8 && digits.length <= 15 ? null : 'Número internacional no válido'
  }
  if (!/^0\d{10}$/.test(digits)) return 'Usa el formato 04xx-xxxxxxx'
  if (!/^04\d{9}$/.test(digits)) return 'Usa el formato 04xx-xxxxxxx'
  return null
}

export const validateEmail = (raw: string): string | null => {
  const value = raw.trim()
  if (!value) return null
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value) ? null : 'Correo no válido'
}

export const validateCheckout = (data: {
  nombre: string; telefono: string; email: string; direccion?: string; zona?: string
  entrega: 'retiro' | 'delivery'; acepta: boolean
}): Record<string, string> => {
  const errors: Record<string, string> = {}
  if (data.nombre.trim().length < 3) errors.nombre = 'Escribe tu nombre y apellido'
  const phoneError = validatePhone(data.telefono)
  if (phoneError) errors.telefono = phoneError
  const emailError = validateEmail(data.email)
  if (emailError) errors.email = emailError
  if (data.entrega === 'delivery') {
    if (!data.direccion?.trim()) errors.direccion = 'La dirección es obligatoria'
    if (!data.zona?.trim()) errors.zona = 'Selecciona una zona'
  }
  if (!data.acepta) errors.acepta = 'Debes aceptar los términos'
  return errors
}
