export const normalizeText = (value: string): string =>
  value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()

export const pad2 = (value: number): string => value.toString().padStart(2, '0')

export const formatNumber = (value: number): string => value.toLocaleString('es-ES')

export const formatLongDate = (date: Date = new Date()): string =>
  date.toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' })

export const formatGroupDate = (iso: string): string =>
  new Date(iso).toLocaleDateString('es-ES', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })

export const formatTime = (iso: string): string =>
  new Date(iso).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })

export const formatRelativeTime = (iso: string): string => {
  const diffMinutes = Math.floor((Date.now() - new Date(iso).getTime()) / 1000 / 60)
  if (diffMinutes < 1) return 'ahora'
  if (diffMinutes < 60) return `hace ${diffMinutes} min`
  if (diffMinutes < 1440) return `hace ${Math.floor(diffMinutes / 60)} h`
  return `hace ${Math.floor(diffMinutes / 1440)} d`
}

export const getGreeting = (date: Date = new Date()): string => {
  const hour = date.getHours()
  if (hour < 12) return 'Buenos días'
  if (hour < 20) return 'Buenas tardes'
  return 'Buenas noches'
}

export const pluralize = (count: number, singular: string, plural: string): string =>
  count === 1 ? singular : plural
