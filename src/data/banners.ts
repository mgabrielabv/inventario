/** Banners de la portada. Texto propio, sin recursos externos. */
export type BannerVariante = 'primario' | 'arcilla' | 'arena'

export interface Banner {
  id: string
  titulo: string
  subtitulo: string
  cta: string
  ruta: string
  variante: BannerVariante
}

export const banners: Banner[] = [
  {
    id: 'todo-en-un-sitio',
    titulo: 'Todo lo que necesitas, más cerca',
    subtitulo: 'Tecnología, hogar y papelería en un solo lugar. Elige, compara y decide en minutos.',
    cta: 'Explorar la tienda',
    ruta: '/tienda',
    variante: 'primario',
  },
  {
    id: 'precios-que-convienen',
    titulo: 'Buenos precios, todos los días',
    subtitulo: 'Descubre productos con precios especiales y llévalos hoy mismo a tu carrito.',
    cta: 'Ver productos',
    ruta: '/tienda?categoria=Ofertas&orden=precio-asc',
    variante: 'arcilla',
  },
  {
    id: 'compra-a-tu-manera',
    titulo: 'Compra a tu manera',
    subtitulo: 'Elige cómo quieres recibirlo y paga con el método que más te convenga.',
    cta: 'Conocer la tienda',
    ruta: '/tienda',
    variante: 'arena',
  },
  {
    id: 'cuenta-facil',
    titulo: 'Tu compra, siempre a mano',
    subtitulo: 'Revisa el avance de tus pedidos, guarda tus direcciones y repite lo que más te gusta.',
    cta: 'Ver mis pedidos',
    ruta: '/cuenta/pedidos',
    variante: 'primario',
  },
]
