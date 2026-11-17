export const EASE_OUT: [number, number, number, number] = [0.22, 1, 0.36, 1]

export interface IllustrationProps {
  reducedMotion?: boolean
}

export const reveal = (reducedMotion: boolean, delay = 0) => ({
  initial: { opacity: 0, y: reducedMotion ? 0 : 16 },
  animate: { opacity: 1, y: 0 },
  transition: {
    duration: reducedMotion ? 0 : 0.7,
    delay: reducedMotion ? 0 : delay,
    ease: EASE_OUT,
  },
})
