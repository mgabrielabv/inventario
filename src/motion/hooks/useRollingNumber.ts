import { useMemo } from 'react'

export interface RollingChar {
  key: string
  char: string
  digit: boolean
}

/** Texto estable y determinista: nunca inserta espacios de anchura variable. */
export const rollingText = (value: number | string, decimals = 0): string => {
  if (typeof value === 'string') return value
  const safe = Number.isFinite(value) ? value : 0
  const fixed = Math.abs(safe).toFixed(decimals)
  const [integer, fraction] = fixed.split('.')
  const grouped = integer.replace(/\B(?=(\d{3})+(?!\d))/g, '.')
  return `${safe < 0 ? '-' : ''}${grouped}${fraction ? `,${fraction}` : ''}`
}

/** Prepara los caracteres de una cifra para el componente RollingNumber. */
export const useRollingNumber = (value: number | string, decimals = 0): RollingChar[] => {
  const text = useMemo(() => rollingText(value, decimals), [value, decimals])
  return useMemo(
    () => text.split('').map((char, index) => ({
      key: `${index}-${char}`,
      char,
      digit: char >= '0' && char <= '9',
    })),
    [text],
  )
}
