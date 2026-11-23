import { AlertTriangle, Check, CircleAlert } from 'lucide-react'
import type { ProductStatus, StoreStatus } from '../../logic/types'

type Status = ProductStatus | StoreStatus

const LABELS: Record<string, string> = {
  disponible: 'Disponible', pocas: 'Pocas unidades', agotado: 'Agotado',
  normal: 'Normal', bajo: 'Bajo', critico: 'Crítico',
}

/** Estado siempre con punto + ícono + texto, nunca solo color. */
export const StatusDot = ({ status, label, compact = false }: {
  status: Status; label?: string; compact?: boolean
}) => {
  const icon = status === 'agotado' || status === 'critico'
    ? <CircleAlert size={compact ? 12 : 14} strokeWidth={1.8} />
    : status === 'pocas' || status === 'bajo'
      ? <AlertTriangle size={compact ? 12 : 14} strokeWidth={1.8} />
      : <Check size={compact ? 12 : 14} strokeWidth={2} />

  return (
    <span className={`status-dot status-dot--${status}`}>
      <span className="status-dot__point" aria-hidden="true" />
      {icon}
      <span>{label ?? LABELS[status] ?? status}</span>
    </span>
  )
}
