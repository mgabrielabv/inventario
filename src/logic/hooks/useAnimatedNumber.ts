import { useEffect, useState } from 'react'
import { useReducedMotion } from './useSlideshow'

export const useAnimatedNumber = (value: number, duration = 1200): number => {
  const reducedMotion = useReducedMotion()
  const [count, setCount] = useState(reducedMotion ? value : 0)

  useEffect(() => {
    if (reducedMotion) {
      setCount(value)
      return
    }

    let frame = 0
    const start = performance.now()

    const tick = (now: number) => {
      const progress = Math.min(1, (now - start) / duration)
      const eased = 1 - Math.pow(1 - progress, 3)
      setCount(Math.round(value * eased))
      if (progress < 1) frame = requestAnimationFrame(tick)
    }

    frame = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(frame)
  }, [value, duration, reducedMotion])

  return count
}
