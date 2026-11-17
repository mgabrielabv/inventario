import { AlertOctagon, AlertTriangle, Check } from 'lucide-react'
import type { ProductStatus } from '../../logic/types'

const STATUS_META = {
  normal: { label: 'Normal', Icon: Check },
  low: { label: 'Bajo', Icon: AlertTriangle },
  critical: { label: 'Crítico', Icon: AlertOctagon },
} as const

export const StatusBadge = ({ status }: { status: ProductStatus }) => {
  const { label, Icon } = STATUS_META[status]
  return (
    <span className={`status ship-label ship-label--${status}`}>
      <Icon size={13} strokeWidth={1.8} aria-hidden="true" />
      <span>{label}</span>
    </span>
  )
}
