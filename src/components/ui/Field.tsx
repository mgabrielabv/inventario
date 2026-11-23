import { useId, type ReactNode } from 'react'

interface Props {
  label: string
  children: (id: string, describedBy: string) => ReactNode
  hint?: string
  error?: string
  required?: boolean
  className?: string
}

export const Field = ({ label, children, hint, error, required, className = '' }: Props) => {
  const id = useId()
  const hintId = `${id}-hint`
  return (
    <div className={`field ${className}`}>
      <label className="field__label" htmlFor={id}>
        {label}{required && <span className="field__req" aria-hidden="true"> *</span>}
      </label>
      {children(id, hint ? hintId : '')}
      {(error || hint) && (
        <p id={hintId} className={`field__hint${error ? ' is-error' : ''}`} role={error ? 'alert' : undefined}>
          {error ?? hint}
        </p>
      )}
    </div>
  )
}

export const Input = ({ className = '', ...props }: React.InputHTMLAttributes<HTMLInputElement>) => (
  <input className={`input ${className}`} {...props} />
)

export const Textarea = ({ className = '', ...props }: React.TextareaHTMLAttributes<HTMLTextAreaElement>) => (
  <textarea className={`input textarea ${className}`} {...props} />
)

export const Select = ({ className = '', children, ...props }: React.SelectHTMLAttributes<HTMLSelectElement>) => (
  <select className={`input select ${className}`} {...props}>{children}</select>
)
