import type { ReactNode } from 'react'

interface EmptyStateProps {
  title: string
  description: string
  illustration?: ReactNode
}

export const EmptyState = ({ title, description, illustration }: EmptyStateProps) => (
  <div className="empty-state">
    {illustration && <div className="empty-state__figure">{illustration}</div>}
    <p className="empty-state__title">{title}</p>
    <p className="empty-state__description">{description}</p>
  </div>
)
