import { useMemo } from 'react'

export interface RollingChar { key: string; char: string }

/** Prepara los caracteres de una cifra para el componente RollingNumber. */
export const useRollingNumber = (value: number | string, decimals = 0): RollingChar[] => {
  const text = useMemo(() => {
    if (typeof value === 'string') return value
    return value.toLocaleString('es-VE', {
      minimumFractionDigits: decimals, maximumFractionDigits: decimals,
    })
  }, [value, decimals])

  return useMemo(
    () => text.split('').map((char, index) => ({ key: `${index}-${char}`, char })),
    [text],
  )
}
