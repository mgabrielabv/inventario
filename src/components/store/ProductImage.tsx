import { motion, useReducedMotion } from 'framer-motion'
import { useEffect, useState } from 'react'
import { ProductArt } from '../art/ProductArt'
import { getImage } from '../../logic/services/images'
import type { Product } from '../../logic/types'
import { cardMotion, distance, dur, ease } from '../../motion/tokens'
import { isLightDevice } from '../../motion/helpers'

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
  const reduce = useReducedMotion()
  const light = isLightDevice()

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
        <motion.img
          className="eshop-photo__img"
          src={photo}
          alt={product.nombre}
          loading="lazy"
          decoding="async"
          initial={reduce || light
            ? { opacity: 0 }
            : { opacity: 0, filter: `blur(${cardMotion.blurFrom}px)` }}
          animate={{ opacity: 1, filter: 'blur(0px)' }}
          transition={{ duration: reduce ? dur.micro : dur.base, ease: ease.easeOutQuint }}
        />
      )}
      {state === 'fallback' && (
        <motion.div
          className="eshop-photo__art-wrap"
          initial={reduce ? undefined : { opacity: 0, y: distance.rise }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: reduce ? dur.micro : dur.base, ease: ease.easeOutQuint }}
        >
          <ProductArt
            arquetipo={product.arquetipo}
            categoria={product.categoria}
            nombre={product.nombre}
            size="100%"
            view="hero"
            className="eshop-photo__art"
          />
        </motion.div>
      )}
    </div>
  )
}
