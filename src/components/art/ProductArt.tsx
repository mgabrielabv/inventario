import { motion, useReducedMotion } from 'framer-motion'
import { useEffect, useId, useMemo, useState, type CSSProperties } from 'react'
import { getImage, isRemoteImage } from '../../logic/services/images'
import { ARQUETIPOS_ARTE } from './arquetipos'
import {
  boxFaces, ellipsePath, polygon, project, toneFill,
  type ArtPart, type BoxPart, type CylinderPart, type PlatePart, type RodPart,
} from './iso'
import type { Arquetipo, Product } from '../../logic/types'

export type ArtView = 'hero' | 'solo' | 'abierto' | 'detalle'

interface Props {
  product?: Product
  categoria?: string
  arquetipo?: Arquetipo
  codigo?: string
  nombre?: string
  imagenes?: string[]
  size?: number | string
  view?: ArtView
  layoutId?: string
  className?: string
  style?: CSSProperties
  interactive?: boolean
}

const asBox = (part: ArtPart): part is BoxPart => part.kind === 'box'
const asCyl = (part: ArtPart): part is CylinderPart => part.kind === 'cylinder'
const asPlate = (part: ArtPart): part is PlatePart => part.kind === 'plate'
const asRod = (part: ArtPart): part is RodPart => part.kind === 'rod'

const BoxShape = ({ part, stroke }: { part: BoxPart; stroke: string }) => {
  const faces = boxFaces(part)
  return (
    <g stroke={stroke} strokeWidth="0.7" strokeLinejoin="round">
      <polygon points={polygon(faces.left)} style={{ fill: toneFill(part.tone, 'left') }} />
      <polygon points={polygon(faces.right)} style={{ fill: toneFill(part.tone, 'right') }} />
      <polygon points={polygon(faces.top)} style={{ fill: toneFill(part.tone, 'top') }} />
    </g>
  )
}

const CylinderShape = ({ part, stroke }: { part: CylinderPart; stroke: string }) => {
  const top = ellipsePath(part.x, part.y, part.z + part.h, part.r, part.r)
  const bottom = ellipsePath(part.x, part.y, part.z, part.r, part.r)
  const rx = top.rx
  const ry = top.ry
  const body = `M ${top.cx - rx} ${top.cy} L ${bottom.cx - rx} ${bottom.cy}
    A ${rx} ${ry} 0 0 0 ${bottom.cx + rx} ${bottom.cy} L ${top.cx + rx} ${top.cy}
    A ${rx} ${ry} 0 0 1 ${top.cx - rx} ${top.cy} Z`
  const shade = `M ${top.cx - rx} ${top.cy} L ${bottom.cx - rx} ${bottom.cy}
    A ${rx} ${ry} 0 0 0 ${bottom.cx} ${bottom.cy + ry} L ${top.cx} ${top.cy + ry} Z`
  return (
    <g stroke={stroke} strokeWidth="0.7" strokeLinejoin="round">
      <path d={body} style={{ fill: toneFill(part.tone, 'right') }} />
      <path d={shade} style={{ fill: toneFill(part.tone, 'left') }} stroke="none" />
      <ellipse cx={top.cx} cy={top.cy} rx={rx} ry={ry} style={{ fill: toneFill(part.tone, 'top') }} />
    </g>
  )
}

const PlateShape = ({ part, stroke }: { part: PlatePart; stroke: string }) => {
  const { x, y, z, w, d } = part
  const points = [
    project(x - w / 2, y - d / 2, z), project(x + w / 2, y - d / 2, z),
    project(x + w / 2, y + d / 2, z), project(x - w / 2, y + d / 2, z),
  ]
  return (
    <polygon
      points={polygon(points)}
      style={{ fill: toneFill(part.tone, 'top') }}
      stroke={stroke}
      strokeWidth="0.6"
      strokeLinejoin="round"
    />
  )
}

const RodShape = ({ part, stroke }: { part: RodPart; stroke: string }) => {
  const horizontal = part.axis === 'x'
  return (
    <BoxShape
      part={{
        kind: 'box', tone: part.tone,
        x: part.x, y: part.y, z: part.z,
        w: horizontal ? part.length : 1.6,
        d: horizontal ? 1.6 : part.length,
        h: 1.6,
      }}
      stroke={stroke}
    />
  )
}

/** Ilustración isométrica determinista; una foto real, si existe, la sustituye. */
export const ProductArt = ({
  product, categoria, arquetipo, codigo, nombre, imagenes,
  size = 160, view = 'solo', layoutId, className = '', style, interactive = false,
}: Props) => {
  const reduce = useReducedMotion()
  const gradientId = useId().replace(/:/g, '')
  const [photo, setPhoto] = useState<string | null>(null)
  const sourceCategory = product?.categoria ?? categoria ?? 'Otras'
  const sourceArquetipo = product?.arquetipo ?? arquetipo ?? 'paquete'
  const sourceCode = product?.codigo ?? codigo ?? ''
  const sourceName = product?.nombre ?? nombre ?? 'Producto'
  const photoIds = product?.imagenes ?? imagenes ?? []
  const archetype = ARQUETIPOS_ARTE[sourceArquetipo] ?? ARQUETIPOS_ARTE.paquete

  useEffect(() => {
    let alive = true
    setPhoto(null)
    const first = photoIds[0]
    if (!first) return () => { alive = false }
    if (isRemoteImage(first)) {
      setPhoto(first.trim())
      return () => { alive = false }
    }
    getImage(first)
      .then((data) => { if (alive) setPhoto(data) })
      .catch(() => { if (alive) setPhoto(null) })
    return () => { alive = false }
  }, [photoIds[0]])

  const parts = useMemo(
    () => view === 'abierto' && archetype.open ? archetype.open : archetype.parts,
    [archetype, view],
  )
  const focus = archetype.focus ?? { x: 0, y: 0 }
  const zoom = view === 'detalle' ? 1.28 : 1
  const shift = view === 'detalle'
    ? `translate(${(100 - focus.x * 42).toFixed(1)} ${(112 - focus.y * 32).toFixed(1)}) scale(${zoom}) translate(${-focus.x} ${-focus.y})`
    : ''

  return (
    <motion.div
      className={`product-art product-art--${view} ${className}`}
      data-category={sourceCategory}
      style={{ width: size, height: size, ...style }}
      layoutId={layoutId}
      animate={interactive && !reduce ? { y: [0, -4, 0] } : { y: 0 }}
      transition={interactive && !reduce
        ? { duration: 6, repeat: Infinity, ease: 'easeInOut' }
        : { duration: 0.32, ease: 'easeOut' }}
      role="img"
      aria-label={`${sourceName} · ilustración ${archetype.label.toLowerCase()}`}
    >
      <div className="product-art__glow" aria-hidden="true" />
      {photo ? (
        <img
          className="product-art__photo"
          src={photo}
          alt={sourceName}
          loading="lazy"
          decoding="async"
          referrerPolicy="no-referrer"
          onError={() => setPhoto(null)}
        />
      ) : (
        <svg className="product-art__svg" viewBox="0 0 200 200" aria-hidden="true">
          <defs>
            <radialGradient id={`art-shadow-${gradientId}`}>
              <stop offset="0%" stopColor="var(--box-shadow)" stopOpacity="0.75" />
              <stop offset="65%" stopColor="var(--box-shadow)" stopOpacity="0.24" />
              <stop offset="100%" stopColor="var(--box-shadow)" stopOpacity="0" />
            </radialGradient>
          </defs>
          <ellipse cx="100" cy="132" rx="72" ry="26" fill={`url(#art-shadow-${gradientId})`} />
          <g transform={shift}>
            {parts.map((part, index) => {
              const stroke = 'var(--art-edge)'
              if (asBox(part)) return <BoxShape key={index} part={part} stroke={stroke} />
              if (asCyl(part)) return <CylinderShape key={index} part={part} stroke={stroke} />
              if (asPlate(part)) return <PlateShape key={index} part={part} stroke={stroke} />
              if (asRod(part)) return <RodShape key={index} part={part} stroke={stroke} />
              return null
            })}
          </g>
          {sourceCode && (
            <text className="product-art__code" x="100" y="194" textAnchor="middle">{sourceCode}</text>
          )}
        </svg>
      )}
    </motion.div>
  )
}
