import { AnimatePresence, motion, useReducedMotion } from 'framer-motion'
import { useEffect, useState } from 'react'
import { ProductArt } from '../art/ProductArt'
import { getImage, isRemoteImage } from '../../logic/services/images'
import { localImageFor, type LocalImage } from '../../logic/services/local-images'
import type { Product } from '../../logic/types'
import { cardMotion, distance, dur, ease } from '../../motion/tokens'
import { isLightDevice } from '../../motion/helpers'

interface Props {
  product: Product
  className?: string
}

type PhotoState = 'loading' | 'photo' | 'fallback'

/**
 * Prioridad: foto subida (IndexedDB) → miniatura local optimizada → URL
 * importada → ilustración. El skeleton y el blur-up reservan el mismo hueco,
 * así que la imagen no desplaza el contenido (CLS 0).
 * No se pasa `codigo` a ProductArt para que nunca aparezca el SKU en la tienda.
 */
export const ProductImage = ({ product, className = '' }: Props) => {
  const imageId = product.imagenes?.[0]
  const remoteUrl = isRemoteImage(imageId) ? imageId.trim() : null
  const local: LocalImage | undefined = localImageFor(product.id)
  const [photo, setPhoto] = useState<string | null>(null)
  const [blur, setBlur] = useState<string | null>(null)
  const [loaded, setLoaded] = useState(false)
  const [state, setState] = useState<PhotoState>(imageId ? 'loading' : 'fallback')
  const reduce = useReducedMotion()
  const light = isLightDevice()

  useEffect(() => {
    let alive = true
    setPhoto(null)
    setBlur(null)
    setLoaded(false)
    if (!imageId) {
      setState('fallback')
      return () => { alive = false }
    }
    setState('loading')
    const applyLocal = () => {
      if (!alive || !local) return false
      setPhoto(local.src)
      setBlur(local.blur)
      setState('photo')
      return true
    }
    if (remoteUrl) {
      if (!applyLocal()) {
        setPhoto(remoteUrl)
        setState('photo')
      }
      return () => { alive = false }
    }
    getImage(imageId)
      .then((data) => {
        if (!alive) return
        if (data) {
          setPhoto(data)
          setState('photo')
        } else if (!applyLocal()) {
          setState('fallback')
        }
      })
      .catch(() => { if (alive && !applyLocal()) setState('fallback') })
    return () => { alive = false }
  }, [imageId, remoteUrl, local])

  const onError = () => {
    if (local && photo === local.src) {
      setPhoto(remoteUrl)
      setBlur(null)
      setLoaded(false)
    } else {
      setState('fallback')
    }
  }

  return (
    <div className={`eshop-photo ${className}`.trim()}>
      {state === 'loading' && <span className="eshop-photo__skeleton" aria-hidden="true" />}
      {state === 'photo' && photo && (
        <>
          <AnimatePresence>
            {blur && !loaded && (
              <motion.img
                key="blur"
                className="eshop-photo__blur"
                src={blur}
                alt=""
                aria-hidden="true"
                initial={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: dur.base, ease: ease.easeOutQuint }}
              />
            )}
          </AnimatePresence>
          <motion.img
            className="eshop-photo__img"
            src={photo}
            alt={product.nombre}
            loading="lazy"
            decoding="async"
            referrerPolicy="no-referrer"
            onLoad={() => setLoaded(true)}
            onError={onError}
            initial={reduce || light
              ? { opacity: 0 }
              : { opacity: 0, filter: `blur(${cardMotion.blurFrom}px)` }}
            animate={{ opacity: 1, filter: 'blur(0px)' }}
            transition={{ duration: reduce ? dur.micro : dur.base, ease: ease.easeOutQuint }}
          />
        </>
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
