import type { ReactNode } from 'react'
import { OpenBox } from '../box/OpenBox'

interface Props {
  title: string
  description?: string
  action?: ReactNode
  compact?: boolean
}

export const EmptyState = ({ title, description, action, compact = false }: Props) => (
  <div className={`empty-state${compact ? ' empty-state--compact' : ''}`}>
    <OpenBox size={compact ? 110 : 180} />
    <h2 className="t-ui t-strong">{title}</h2>
    {description && <p className="t-caption t-pretty">{description}</p>}
    {action && <div className="empty-state__action">{action}</div>}
  </div>
)
