import { useEffect, useRef, useState } from 'react'
import { useReducedMotion } from 'framer-motion'
import { meshMotion } from '../tokens'

/** Malla difuminada. Se pausa fuera de pantalla, al desplazarse y con la pestaña oculta. */
export const MeshBackground = () => {
  const ref = useRef<HTMLDivElement | null>(null)
  const [inView, setInView] = useState(true)
  const [visible, setVisible] = useState(() => typeof document === 'undefined' || !document.hidden)
  const [scrolling, setScrolling] = useState(false)
  const reduce = useReducedMotion()

  useEffect(() => {
    const element = ref.current
    if (!element) return
    let timer = 0
    const observer = new IntersectionObserver(([entry]) => {
      setInView(entry?.isIntersecting ?? false)
    }, { threshold: 0 })
    observer.observe(element)
    const onVisibility = () => setVisible(!document.hidden)
    const onScroll = () => {
      setScrolling(true)
      window.clearTimeout(timer)
      timer = window.setTimeout(() => setScrolling(false), meshMotion.resumeDelay)
    }
    document.addEventListener('visibilitychange', onVisibility)
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => {
      observer.disconnect()
      document.removeEventListener('visibilitychange', onVisibility)
      window.removeEventListener('scroll', onScroll)
      window.clearTimeout(timer)
    }
  }, [])

  const active = inView && visible && !scrolling && !reduce
  return (
    <div ref={ref} className={`mesh${active ? '' : ' mesh--paused'}`} aria-hidden="true">
      <span className="mesh__blob mesh__blob--1" />
      <span className="mesh__blob mesh__blob--2" />
      <span className="mesh__blob mesh__blob--3" />
      <span className="mesh__veil" />
    </div>
  )
}
