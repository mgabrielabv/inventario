import { useEffect, useState } from 'react'
import { ProductArt } from '../art/ProductArt'
import { getImage } from '../../logic/services/images'
import type { Product } from '../../logic/types'

interface Props {
  product: Product
  className?: string
}

type PhotoState = 'loading' | 'photo' | 'fallback'

/**
 * Foto real almacenada en IndexedDB. Mientras se lee se reserva el espacio con
 * un skeleton; si no hay imagen (o falla la lectura) se dibuja el arquetipo.
 * No se pasa `codigo` a ProductArt para que nunca aparezca el SKU en la tienda.
 */
export const ProductImage = ({ product, className = '' }: Props) => {
  const imageId = product.imagenes?.[0]
  const [photo, setPhoto] = useState<string | null>(null)
  const [state, setState] = useState<PhotoState>(imageId ? 'loading' : 'fallback')

  useEffect(() => {
    let alive = true
    setPhoto(null)
    if (!imageId) {
      setState('fallback')
      return () => { alive = false }
    }
    setState('loading')
    getImage(imageId)
      .then((data) => {
        if (!alive) return
        setPhoto(data)
        setState(data ? 'photo' : 'fallback')
      })
      .catch(() => { if (alive) setState('fallback') })
    return () => { alive = false }
  }, [imageId])

  return (
    <div className={`eshop-photo ${className}`.trim()}>
      {state === 'loading' && <span className="eshop-photo__skeleton" aria-hidden="true" />}
      {state === 'photo' && photo && (
        <img
          className="eshop-photo__img"
          src={photo}
          alt={product.nombre}
          loading="lazy"
          decoding="async"
        />
      )}
      {state === 'fallback' && (
        <ProductArt
          arquetipo={product.arquetipo}
          categoria={product.categoria}
          nombre={product.nombre}
          size="100%"
          view="hero"
          className="eshop-photo__art"
        />
      )}
    </div>
  )
}
