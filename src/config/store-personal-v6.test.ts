import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'

const root = join(dirname(fileURLToPath(import.meta.url)), '../..')
const source = (path: string) => readFileSync(join(root, path), 'utf8')

describe('tienda personalizada', () => {
  const home = source('src/pages/store/home-page.tsx')
  const banners = source('src/data/banners.ts')
  const css = source('src/styles/eshop-home.css')

  it('recibe al cliente con sus pedidos en lugar de invitarlo a registrarse', () => {
    expect(home).toContain('useCustomer()')
    expect(home).toContain('ordersForAccount(account, orders)')
    expect(home).toContain('Hola, {account?.nombre}')
    expect(home).toContain('titulo="Comprar de nuevo"')
    expect(home).not.toMatch(/Crear cuenta|Haz tu cuenta|Ya tengo cuenta|cuenta\/registro/i)
  })

  it('muestra fotos reales en el escaparate y en las categorías', () => {
    expect(home).toContain('<ProductImage product={product} className="eshop-hero__photo" />')
    expect(home).toContain('<ProductImage product={sample} className="eshop-category__photo" />')
    for (const selector of [
      '.eshop-hero__product', '.eshop-hero__photo', '.eshop-category__photo',
      '.eshop-personal__links', '.eshop-personal__card', '.eshop-personal__code',
      '.eshop-personal__state', '.eshop-personal__detail', '.eshop-personal__note',
    ]) {
      expect(css).toContain(selector)
    }
  })

  it('el banner de cuenta lleva a los pedidos, no al registro', () => {
    expect(banners).toContain("ruta: '/cuenta/pedidos'")
    expect(banners).not.toMatch(/Crear mi cuenta|cuenta\/registro/i)
  })

  it('usa la URL canónica de categoría en la ficha de producto', () => {
    const pdp = source('src/pages/store/product-page.tsx')
    expect(pdp).toContain('?categoria=')
    expect(pdp).not.toContain('?cat=')
    expect(pdp).toContain('pdp-account-note')
  })

  it('permite repetir un pedido desde el carrito validando lo disponible', () => {
    const cart = source('src/pages/store/cart-page.tsx')
    expect(cart).toContain('ordersForAccount(account, orders)')
    expect(cart).toContain('repeatOrderLines(order, products, orders)')
    expect(cart).toContain('validateCart(affected, products, orders)')
    expect(cart).toContain('<RepeatOrder />')
  })

  it('consolida el aviso de pago simulado en todo el checkout', () => {
    const checkout = source('src/pages/store/checkout-page.tsx')
    expect(checkout).toContain("const PAYMENT_NOTICE = 'Pago simulado. No se realiza ningún cobro.'")
    expect(checkout.match(/\{PAYMENT_NOTICE\}/g)).toHaveLength(3)
  })

  it('simplifica los enlaces de sesión del pie de la tienda', () => {
    const chrome = source('src/components/store/StoreChrome.tsx')
    const footer = chrome.slice(chrome.indexOf('export const StoreFooter'))
    expect(footer).toContain('to="/cuenta"')
    expect(footer).toContain('to="/cuenta/pedidos"')
    expect(footer).not.toMatch(/cuenta\/ingresar|cuenta\/registro/i)
  })
})
