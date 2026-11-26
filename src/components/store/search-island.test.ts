import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'

const css = readFileSync(new URL('../../styles/search-island.css', import.meta.url), 'utf8')

/** Contrato de la isla: un solo borde/fondo, sin escalón input/botón. */
describe('search island', () => {
  it('el input es transparente, sin borde, sin sombra y sin outline propio', () => {
    const input = /\.search-island__input\s*\{([\s\S]*?)\n\}/.exec(css)?.[1] ?? ''
    expect(input).toMatch(/background:\s*transparent/)
    expect(input).toMatch(/border:\s*0/)
    expect(input).toMatch(/box-shadow:\s*none/)
    expect(input).toMatch(/outline:\s*0/)
    expect(input).toMatch(/flex:\s*1 1 auto/)
    expect(input).toMatch(/min-width:\s*0/)
  })

  it('el botón queda dentro de la píldora con margen interno y área táctil de 44 px', () => {
    const button = /\.search-island__submit\s*\{([\s\S]*?)\n\}/.exec(css)?.[1] ?? ''
    expect(button).toMatch(/height:\s*calc\(100% - 4px\)/)
    expect(button).toMatch(/margin:\s*2px 4px 2px 0/)
    expect(button).toMatch(/min-height:\s*44px/)
    expect(button).toMatch(/border-radius:\s*var\(--radius-pill\)/)
  })

  it('el contenedor tiene altura fija, radio pastilla y un solo borde', () => {
    const island = /\.search-island\s*\{([\s\S]*?)\n\}/.exec(css)?.[1] ?? ''
    expect(island).toMatch(/height:\s*48px/)
    expect(island).toMatch(/border:\s*1px solid/)
    expect(island).toMatch(/border-radius:\s*var\(--radius-pill\)/)
    expect(island).toMatch(/align-items:\s*center/)
    expect(css).toMatch(/\.search-island:focus-within\s*\{/)
  })

  it('cubre autofill, forced-colors y reduced-motion', () => {
    expect(css).toContain(':-webkit-autofill')
    expect(css).toContain('-webkit-box-shadow: 0 0 0 1000px var(--search-bg) inset')
    expect(css).toContain('forced-colors: active')
    expect(css).toContain('prefers-reduced-motion: reduce')
  })
})
