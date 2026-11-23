export type ErrorCode =
  | 'PERMISSION'
  | 'VALIDATION'
  | 'STOCK'
  | 'NOT_FOUND'
  | 'CONFLICT'

export class AppError extends Error {
  code: ErrorCode
  field?: string

  constructor(code: ErrorCode, message: string, field?: string) {
    super(message)
    this.name = 'AppError'
    this.code = code
    this.field = field
  }
}

export const isAppError = (error: unknown): error is AppError => error instanceof AppError

export const errorMessage = (error: unknown): string =>
  isAppError(error)
    ? error.message
    : error instanceof Error
      ? error.message
      : 'Ocurrió un error inesperado'
