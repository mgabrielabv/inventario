import { describe, expect, it } from 'vitest'
import { rollingText } from './useRollingNumber'

describe('RollingNumber', () => {
  it('produce texto estable sin espacios de ancho variable', () => {
    expect(rollingText(815)).toBe('815')
    expect(rollingText(815.5, 2)).toBe('815,50')
    expect(rollingText('USD 815,00')).toBe('USD 815,00')
    expect(rollingText(-12)).toBe('-12')
  })
})
