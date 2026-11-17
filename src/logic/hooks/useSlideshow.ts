import { useCallback, useEffect, useRef, useState } from 'react'

const QUERY = '(prefers-reduced-motion: reduce)'

const readPreference = (): boolean =>
  typeof window !== 'undefined' && window.matchMedia(QUERY).matches

export const useReducedMotion = (): boolean => {
  const [reducedMotion, setReducedMotion] = useState(readPreference)

  useEffect(() => {
    const media = window.matchMedia(QUERY)
    const handleChange = (event: MediaQueryListEvent) => setReducedMotion(event.matches)
    setReducedMotion(media.matches)
    media.addEventListener('change', handleChange)
    return () => media.removeEventListener('change', handleChange)
  }, [])

  return reducedMotion
}

interface SlideshowOptions {
  count: number
  duration?: number
}

interface SlideshowState {
  index: number
  progress: number
  paused: boolean
  reducedMotion: boolean
  next: () => void
  previous: () => void
  goTo: (index: number) => void
  pause: () => void
  resume: () => void
  setHovering: (hovering: boolean) => void
  setFocused: (focused: boolean) => void
}

export const useSlideshow = ({ count, duration = 5200 }: SlideshowOptions): SlideshowState => {
  const reducedMotion = useReducedMotion()
  const [index, setIndex] = useState(0)
  const [userPaused, setUserPaused] = useState(false)
  const [hovering, setHovering] = useState(false)
  const [focused, setFocused] = useState(false)
  const [hidden, setHidden] = useState(false)
  const [progress, setProgress] = useState(0)
  const elapsedRef = useRef(0)
  const lastFrameRef = useRef<number | null>(null)

  const paused = reducedMotion || userPaused || hovering || focused || hidden

  useEffect(() => {
    const handleVisibility = () => setHidden(document.hidden)
    handleVisibility()
    document.addEventListener('visibilitychange', handleVisibility)
    return () => document.removeEventListener('visibilitychange', handleVisibility)
  }, [])

  useEffect(() => {
    elapsedRef.current = 0
    lastFrameRef.current = null
    setProgress(0)
  }, [index])

  useEffect(() => {
    if (paused || count === 0) return

    let frame = 0
    const tick = (now: number) => {
      if (lastFrameRef.current === null) lastFrameRef.current = now
      elapsedRef.current += now - lastFrameRef.current
      lastFrameRef.current = now

      const nextProgress = Math.min(1, elapsedRef.current / duration)
      setProgress(nextProgress)

      if (nextProgress >= 1) {
        setIndex((current) => (current + 1) % count)
        return
      }
      frame = requestAnimationFrame(tick)
    }

    frame = requestAnimationFrame(tick)
    return () => {
      cancelAnimationFrame(frame)
      lastFrameRef.current = null
    }
  }, [paused, count, duration, index])

  const goTo = useCallback(
    (target: number) => {
      if (count === 0) return
      setIndex(((target % count) + count) % count)
      setUserPaused(false)
    },
    [count],
  )

  const next = useCallback(() => goTo(index + 1), [goTo, index])
  const previous = useCallback(() => goTo(index - 1), [goTo, index])
  const pause = useCallback(() => setUserPaused(true), [])
  const resume = useCallback(() => setUserPaused(false), [])

  return {
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
  }
}
