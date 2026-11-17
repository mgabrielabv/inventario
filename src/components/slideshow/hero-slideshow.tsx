import {
  useCallback,
  useRef,
  useState,
  type CSSProperties,
  type KeyboardEvent,
  type PointerEvent,
} from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { ChevronLeft, ChevronRight, Pause, Play } from 'lucide-react'
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
  const swipeStart = useRef<{ x: number; y: number } | null>(null)
  const activeSlide = slides[index]

  const handlePointerMove = useCallback(
    (event: PointerEvent<HTMLElement>) => {
      if (reducedMotion || event.pointerType === 'touch') return
      const rect = event.currentTarget.getBoundingClientRect()
      const x = ((event.clientX - rect.left) / rect.width - 0.5) * 2 * PARALLAX_LIMIT
      const y = ((event.clientY - rect.top) / rect.height - 0.5) * 2 * PARALLAX_LIMIT
      setParallax({ x: clamp(x, -PARALLAX_LIMIT, PARALLAX_LIMIT), y: clamp(y, -PARALLAX_LIMIT, PARALLAX_LIMIT) })
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
    if (deltaX < 0) next()
    else previous()
  }

  const handleKeyDown = (event: KeyboardEvent<HTMLElement>) => {
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
      aria-label="El almacén en cuatro gestos"
      tabIndex={0}
      onMouseEnter={() => setHovering(true)}
      onMouseLeave={() => {
        setHovering(false)
        setParallax({ x: 0, y: 0 })
      }}
      onFocusCapture={() => setFocused(true)}
      onBlurCapture={() => setFocused(false)}
      onPointerDown={handlePointerDown}
      onPointerUp={handlePointerUp}
      onPointerMove={handlePointerMove}
      onKeyDown={handleKeyDown}
    >
      <div className="slideshow__corners" aria-hidden="true">
        <span className="slideshow__corner slideshow__corner--tl">{activeSlide.corners.topLeft}</span>
        <span className="slideshow__corner slideshow__corner--tr">{activeSlide.corners.topRight}</span>
        <span className="slideshow__corner slideshow__corner--bl">{activeSlide.corners.bottomLeft}</span>
        <span className="slideshow__corner slideshow__corner--br">{activeSlide.corners.bottomRight}</span>
      </div>

      <div className="slideshow__stage">
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
      </div>

      <div className="slideshow__controls">
        <button
          type="button"
          className="slideshow__control"
          onClick={togglePause}
          disabled={reducedMotion}
          aria-label={
            reducedMotion
              ? 'Reproducción automática desactivada por preferencia de movimiento reducido'
              : paused
                ? 'Reproducir presentación'
                : 'Pausar presentación'
          }
        >
          {paused ? (
            <Play size={14} strokeWidth={1.5} aria-hidden="true" />
          ) : (
            <Pause size={14} strokeWidth={1.5} aria-hidden="true" />
          )}
        </button>

        <div className="slideshow__indicators" aria-label="Diapositivas">
          {slides.map((slide, slideIndex) => (
            <button
              key={slide.id}
              type="button"
              className={[
                'slideshow__indicator',
                slideIndex === index ? 'slideshow__indicator--active' : '',
              ]
                .filter(Boolean)
                .join(' ')}
              onClick={() => goTo(slideIndex)}
              aria-label={`Ir a la diapositiva ${slideIndex + 1}: ${slide.title}`}
              aria-current={slideIndex === index ? 'true' : 'false'}
            >
              <span
                className="slideshow__indicator-fill"
                style={
                  {
                    '--slide-progress': `${progressValue(slideIndex, index, progress)}`,
                  } as CSSProperties
                }
              />
            </button>
          ))}
        </div>

        <span className="slideshow__counter" aria-hidden="true">
          {pad2(index + 1)} <span>/</span> {pad2(slides.length)}
        </span>

        <div className="slideshow__arrows">
          <button
            type="button"
            className="slideshow__arrow"
            onClick={previous}
            aria-label="Diapositiva anterior"
          >
            <ChevronLeft size={16} strokeWidth={1.4} aria-hidden="true" />
          </button>
          <button
            type="button"
            className="slideshow__arrow"
            onClick={next}
            aria-label="Diapositiva siguiente"
          >
            <ChevronRight size={16} strokeWidth={1.4} aria-hidden="true" />
          </button>
        </div>
      </div>

      <p className="visually-hidden" aria-live="polite">
        {paused
          ? `Diapositiva ${index + 1} de ${slides.length}. ${activeSlide.title} ${activeSlide.support}`
          : ''}
      </p>
    </section>
  )
}
