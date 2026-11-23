import { useCallback } from 'react'
import { flushSync } from 'react-dom'
import { useReducedMotion } from 'framer-motion'
import { dur, ease } from '../tokens'

type ViewTransitionDocument = Document & {
  startViewTransition?: (callback: () => void) => { ready: Promise<void> }
}

/** A13 · revelado circular desde el botón con View Transitions API. */
export const useViewTransitionTheme = (toggle: () => void) => {
  const reduce = useReducedMotion()
  return useCallback((event?: { clientX: number; clientY: number }) => {
    const doc = document as ViewTransitionDocument
    if (!doc.startViewTransition || reduce) { toggle(); return }

    const x = event?.clientX ?? window.innerWidth / 2
    const y = event?.clientY ?? 24
    const radius = Math.hypot(
      Math.max(x, window.innerWidth - x),
      Math.max(y, window.innerHeight - y),
    )

    const transition = doc.startViewTransition(() => {
      flushSync(() => toggle())
    })
    transition.ready.then(() => {
      document.documentElement.animate(
        { clipPath: [`circle(0px at ${x}px ${y}px)`, `circle(${radius}px at ${x}px ${y}px)`] },
        {
          duration: dur.slow * 1000,
          easing: `cubic-bezier(${ease.ios.join(',')})`,
          pseudoElement: '::view-transition-new(root)',
        },
      )
    }).catch(() => { /* el cambio de tema ya se aplicó */ })
  }, [toggle, reduce])
}
