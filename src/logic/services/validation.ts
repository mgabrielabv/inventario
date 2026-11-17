import type { MovementType, ProductDraft } from '../types'

export type ProductDraftErrors = Partial<Record<keyof ProductDraft, string>>

export const validateProductDraft = (
  draft: ProductDraft,
  existingCodes: string[] = [],
): ProductDraftErrors => {
  const errors: ProductDraftErrors = {}
  const codigo = draft.codigo.trim()
  const producto = draft.producto.trim()

  if (!codigo) errors.codigo = 'El código es obligatorio'
  else if (existingCodes.includes(codigo)) errors.codigo = 'Ese código ya existe'

  if (!producto) errors.producto = 'El nombre es obligatorio'
  if (!Number.isFinite(draft.cantidad) || draft.cantidad < 0) {
    errors.cantidad = 'La cantidad debe ser un número positivo'
  }

  return errors
}

export const firstError = (errors: ProductDraftErrors): string | null => {
  const messages = Object.values(errors)
  return messages.length > 0 ? (messages[0] ?? null) : null
}

export const validateMovementQuantity = (
  type: MovementType,
  requested: number,
  available: number,
): string | null => {
  if (!Number.isFinite(requested) || requested <= 0) {
    return 'La cantidad debe ser mayor que cero'
  }
  if (type === 'Salida' && requested > available) {
    return 'Stock insuficiente para registrar la salida'
  }
  return null
}
