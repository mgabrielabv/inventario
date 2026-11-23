import { useRef, useState, type PointerEvent } from 'react'
import { ProductArt, type ArtView } from './ProductArt'
import type { Product } from '../../logic/types'

interface Props {
  product: Product
  view: ArtView
  layoutId?: string
}

const LENS = 156

/** Ampliación por lupa: sigue al puntero sin modificar el tamaño del contenedor. */
export const ArtZoom = ({ product, view, layoutId }: Props) => {
  const container = useRef<HTMLDivElement | null>(null)
  const [point, setPoint] = useState<{ x: number; y: number; fx: number; fy: number } | null>(null)

  const move = (event: PointerEvent<HTMLDivElement>) => {
    const rect = container.current?.getBoundingClientRect()
    if (!rect || rect.width === 0 || rect.height === 0) return
    const x = event.clientX - rect.left
    const y = event.clientY - rect.top
    setPoint({
      x: Math.min(Math.max(x, LENS / 2), Math.max(LENS / 2, rect.width - LENS / 2)),
      y: Math.min(Math.max(y, LENS / 2), Math.max(LENS / 2, rect.height - LENS / 2)),
      fx: Math.min(1, Math.max(0, x / rect.width)),
      fy: Math.min(1, Math.max(0, y / rect.height)),
    })
  }

  return (
    <div
      className="art-zoom"
      ref={container}
      onPointerMove={move}
      onPointerDown={move}
      onPointerLeave={() => setPoint(null)}
      aria-label={`Ampliar ilustración de ${product.nombre}`}
    >
      <ProductArt product={product} view={view} size="100%" layoutId={layoutId} />
      {point && (
        <div
          className="art-zoom__lens"
          aria-hidden="true"
          style={{ left: point.x - LENS / 2, top: point.y - LENS / 2 }}
        >
          <div
            className="art-zoom__lens-inner"
            style={{
              transform: 'scale(2.2)',
              transformOrigin: `${point.fx * LENS}px ${point.fy * LENS}px`,
            }}
          >
            <ProductArt product={product} view={view} size={LENS} />
          </div>
        </div>
      )}
    </div>
  )
}
