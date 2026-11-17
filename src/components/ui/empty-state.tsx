import type { ReactNode } from 'react'
import { Stamp } from './stamp'

interface EmptyStateProps {
  title: string
  description: string
  illustration?: ReactNode
  stamp?: string
}

export const EmptyState = ({
  title,
  description,
  illustration,
  stamp = 'Nada anotado',
}: EmptyStateProps) => (
  <div className="empty-state">
    {illustration && <div className="empty-state__figure">{illustration}</div>}
    <Stamp size="sm" tilt="left">
      {stamp}
    </Stamp>
    <p className="empty-state__title">{title}</p>
    <p className="empty-state__description">{description}</p>
  </div>
)
