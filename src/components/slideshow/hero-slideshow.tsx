import {
  useCallback,
  useRef,
  useState,
  type CSSProperties,
  type KeyboardEvent,
  type MouseEvent,
  type PointerEvent,
} from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import type { Slide } from '../../logic/types'
import { pad2 } from '../../logic/services/formatters'
import { useSlideshow } from '../../logic/hooks/useSlideshow'
import { EASE_OUT } from '../illustrations/motion'
import { SlideFigure } from './slide-figure'

const PARALLAX_LIMIT = 8
const SWIPE_THRESHOLD = 44

const clamp = (value: number, min: number, max: number): number =>
  Math.min(max, Math.max(min, value))

const progressValue = (slideIndex: number, activeIndex: number, progress: number): number => {
  if (slideIndex < activeIndex) return 1
  if (slideIndex === activeIndex) return progress
  return 0
}

interface CursorState {
  x: number
  y: number
  side: 'left' | 'right'
  visible: boolean
}

export const HeroSlideshow = ({ slides }: { slides: Slide[] }) => {
  const {
    index,
    progress,
    paused,
    reducedMotion,
    next,
    previous,
    goTo,
    pause,
    resume,
    setHovering,
    setFocused,
  } = useSlideshow({ count: slides.length })
  const [parallax, setParallax] = useState({ x: 0, y: 0 })
  const [cursor, setCursor] = useState<CursorState>({
    x: 0,
    y: 0,
    side: 'right',
    visible: false,
  })
  const swipeStart = useRef<{ x: number; y: number } | null>(null)
  const suppressClick = useRef(false)
  const activeSlide = slides[index]

  const handlePointerMove = useCallback(
    (event: PointerEvent<HTMLElement>) => {
      if (reducedMotion || event.pointerType === 'touch') return
      const rect = event.currentTarget.getBoundingClientRect()
      const x = ((event.clientX - rect.left) / rect.width - 0.5) * 2 * PARALLAX_LIMIT
      const y = ((event.clientY - rect.top) / rect.height - 0.5) * 2 * PARALLAX_LIMIT
      setParallax({
        x: clamp(x, -PARALLAX_LIMIT, PARALLAX_LIMIT),
        y: clamp(y, -PARALLAX_LIMIT, PARALLAX_LIMIT),
      })
    },
    [reducedMotion],
  )

  const handlePointerDown = (event: PointerEvent<HTMLElement>) => {
    swipeStart.current = { x: event.clientX, y: event.clientY }
  }

  const handlePointerUp = (event: PointerEvent<HTMLElement>) => {
    const start = swipeStart.current
    swipeStart.current = null
    if (!start) return
    const deltaX = event.clientX - start.x
    const deltaY = event.clientY - start.y
    if (Math.abs(deltaX) < SWIPE_THRESHOLD || Math.abs(deltaX) < Math.abs(deltaY)) return
    suppressClick.current = true
    if (deltaX < 0) next()
    else previous()
  }

  const handleKeyDown = (event: KeyboardEvent<HTMLElement>) => {
    const target = event.target as HTMLElement
    if (target.closest('button, a, input, select, textarea')) return

    if (event.key === 'ArrowRight') {
      event.preventDefault()
      next()
    } else if (event.key === 'ArrowLeft') {
      event.preventDefault()
      previous()
    } else if (event.key === 'Home') {
      event.preventDefault()
      goTo(0)
    } else if (event.key === 'End') {
      event.preventDefault()
      goTo(slides.length - 1)
    } else if (event.key === ' ' && !reducedMotion) {
      event.preventDefault()
      if (paused) {
        setHovering(false)
        resume()
      } else {
        pause()
      }
    }
  }

  const handleStageMove = (event: PointerEvent<HTMLElement>) => {
    if (event.pointerType === 'touch') return
    const rect = event.currentTarget.getBoundingClientRect()
    setCursor({
      x: event.clientX - rect.left,
      y: event.clientY - rect.top,
      side: event.clientX - rect.left < rect.width / 2 ? 'left' : 'right',
      visible: true,
    })
  }

  const handleStageClick = (event: MouseEvent<HTMLElement>) => {
    if (suppressClick.current) {
      suppressClick.current = false
      return
    }
    const rect = event.currentTarget.getBoundingClientRect()
    if (event.clientX - rect.left < rect.width / 2) previous()
    else next()
  }

  const togglePause = () => {
    if (paused) {
      setFocused(false)
      setHovering(false)
      resume()
    } else {
      pause()
    }
  }

  if (!activeSlide) return null

  return (
    <section
      className="slideshow"
      role="region"
      aria-roledescription="carousel"
      aria-label="Cuatro gestos de bodega"
      tabIndex={0}
      onMouseEnter={() => setHovering(true)}
      onMouseLeave={() => {
        setHovering(false)
        setParallax({ x: 0, y: 0 })
        setCursor((current) => ({ ...current, visible: false }))
      }}
      onFocusCapture={() => setFocused(true)}
      onBlurCapture={() => setFocused(false)}
      onPointerDown={handlePointerDown}
      onPointerUp={handlePointerUp}
      onPointerMove={handlePointerMove}
      onKeyDown={handleKeyDown}
    >
      <div
        className="slideshow__stage"
        onClick={handleStageClick}
        onPointerMove={handleStageMove}
        onPointerLeave={() => setCursor((current) => ({ ...current, visible: false }))}
      >
        <AnimatePresence initial={false} mode="sync">
          <motion.span
            key={`ghost-${activeSlide.id}`}
            className="slideshow__ghost"
            aria-hidden="true"
            initial={{ opacity: 0, y: reducedMotion ? 0 : 36 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: reducedMotion ? 0 : -30 }}
            transition={{ duration: reducedMotion ? 0 : 0.7, ease: EASE_OUT }}
          >
            {pad2(index + 1)}
          </motion.span>
        </AnimatePresence>

        <AnimatePresence initial={false} mode="sync">
          <motion.div
            key={activeSlide.id}
            className="slideshow__slide"
            role="group"
            aria-roledescription="slide"
            aria-label={`${index + 1} de ${slides.length}`}
            initial={{ opacity: 0, y: reducedMotion ? 0 : 24 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: reducedMotion ? 0 : -18 }}
            transition={{ duration: reducedMotion ? 0 : 0.7, ease: EASE_OUT }}
          >
            <div
              className="slideshow__figure"
              style={
                {
                  '--parallax-x': `${parallax.x}px`,
                  '--parallax-y': `${parallax.y}px`,
                } as CSSProperties
              }
            >
              <SlideFigure id={activeSlide.id} reducedMotion={reducedMotion} />
            </div>

            <div className="slideshow__copy">
              <p className="slideshow__kicker">{activeSlide.kicker}</p>
              <h2 className="slideshow__title">{activeSlide.title}</h2>
              <p className="slideshow__support">{activeSlide.support}</p>
            </div>
          </motion.div>
        </AnimatePresence>

        {cursor.visible && (
          <span
            className="slideshow__cursor"
            style={{ left: `${cursor.x}px`, top: `${cursor.y}px` }}
            aria-hidden="true"
          >
            {cursor.side === 'left' ? '←' : '→'}
          </span>
        )}
      </div>

      <div className="slideshow__index">
        <div className="slideshow__words" role="group" aria-label="Ir a una sección">
          {slides.map((slide, slideIndex) => (
            <span className="slideshow__word-wrap" key={slide.id}>
              <button
                type="button"
                className={[
                  'slideshow__word',
                  slideIndex === index ? 'slideshow__word--active' : '',
                ]
                  .filter(Boolean)
                  .join(' ')}
                onClick={() => goTo(slideIndex)}
                aria-current={slideIndex === index ? 'true' : undefined}
                aria-label={`Ir a ${slide.label}`}
                style={
                  {
                    '--slide-progress': `${progressValue(slideIndex, index, progress)}`,
                  } as CSSProperties
                }
              >
                {slide.label}
              </button>
              {slideIndex < slides.length - 1 && (
                <span className="slideshow__sep" aria-hidden="true">
                  ·
                </span>
              )}
            </span>
          ))}
        </div>

        <button
          type="button"
          className="slideshow__pause"
          onClick={togglePause}
          disabled={reducedMotion}
          aria-label={
            reducedMotion
              ? 'Reproducción automática desactivada por preferencia de movimiento reducido'
              : paused
                ? 'Reanudar presentación'
                : 'Pausar presentación'
          }
        >
          {paused ? 'Seguir' : 'Pausar'}
        </button>
      </div>

      <div className="visually-hidden">
        <button type="button" onClick={previous}>
          Diapositiva anterior
        </button>
        <button type="button" onClick={next}>
          Diapositiva siguiente
        </button>
      </div>

      <p className="visually-hidden" aria-live="polite">
        {paused
          ? `Diapositiva ${index + 1} de ${slides.length}. ${activeSlide.title} ${activeSlide.support}`
          : ''}
      </p>
    </section>
  )
}
