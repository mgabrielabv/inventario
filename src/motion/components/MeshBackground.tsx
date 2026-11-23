import { useEffect, useRef, useState } from 'react'
import { useReducedMotion } from 'framer-motion'

/** Malla difuminada. Se pausa fuera de pantalla y con la pestaña oculta. */
export const MeshBackground = () => {
  const ref = useRef<HTMLDivElement | null>(null)
  const [active, setActive] = useState(true)
  const reduce = useReducedMotion()

  useEffect(() => {
    const element = ref.current
    if (!element) return
    let inView = true
    let visible = !document.hidden
    const sync = () => setActive(inView && visible && !reduce)
    const observer = new IntersectionObserver(([entry]) => {
      inView = entry?.isIntersecting ?? false
      sync()
    }, { threshold: 0 })
    observer.observe(element)
    const onVisibility = () => { visible = !document.hidden; sync() }
    document.addEventListener('visibilitychange', onVisibility)
    return () => {
      observer.disconnect()
      document.removeEventListener('visibilitychange', onVisibility)
    }
  }, [reduce])

  return (
    <div ref={ref} className={`mesh${active ? '' : ' mesh--paused'}`} aria-hidden="true">
      <span className="mesh__blob mesh__blob--1" />
      <span className="mesh__blob mesh__blob--2" />
      <span className="mesh__blob mesh__blob--3" />
      <span className="mesh__veil" />
    </div>
  )
}
