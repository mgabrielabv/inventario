/* Única fuente de verdad de la marca.
   Cambia SOLO los valores de BRAND: el título, la meta description, el favicon,
   el monograma, las claves de almacenamiento, los códigos de pedido y los textos
   de la tienda se derivan de aquí. Los colores viven en src/styles/tokens.css. */
export const BRAND = {
  name: 'Ivoria',
  shortName: 'Ivoria',
  tagline: 'Todo para tu casa y tu día, en un solo lugar.',
  slug: 'ivoria',
  orderPrefix: 'IVO',
  themeKey: 'ivoria-theme',
  supportEmail: 'hola@ivoria.com',
  whatsapp: '',
  city: 'Caracas',
  /** URL opcional de un logo real; vacío = monograma «I». */
  logoUrl: '',
} as const

/** Inicial del monograma, derivada siempre del nombre corto. */
export const brandInitial = (): string =>
  BRAND.shortName.replace(/[^\p{L}\p{N}]/gu, '').charAt(0).toUpperCase() || 'T'

/** Prefijo para claves de localStorage/IndexedDB, sin guion final. */
export const storageKey = (suffix: string): string => `${BRAND.slug}-${suffix}`
