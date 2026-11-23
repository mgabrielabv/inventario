import { AlertOctagon, AlertTriangle, Check } from 'lucide-react'
import { STATUS_LABEL } from '../../logic/services/stock'
import type { ProductStatus } from '../../logic/types'

const STATUS_ICON = {
  normal: Check,
  bajo: AlertTriangle,
  critico: AlertOctagon,
  agotado: AlertOctagon,
} as const

export const StatusBadge = ({ status }: { status: ProductStatus }) => {
  const Icon = STATUS_ICON[status]
  return (
    <span className={`status ship-label ship-label--${status}`}>
      <Icon size={13} strokeWidth={1.8} aria-hidden="true" />
      <span>{STATUS_LABEL[status]}</span>
    </span>
  )
}
