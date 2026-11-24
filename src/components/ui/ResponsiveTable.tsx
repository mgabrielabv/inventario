import {
  Children, cloneElement, isValidElement,
  type ReactElement, type ReactNode, type TableHTMLAttributes,
} from 'react'

/**
 * Tabla que se convierte en tarjetas en móvil (`.table--cards`).
 * Toma las etiquetas de la primera fila de `<thead>` y las inyecta como
 * `data-label` en cada `<td>` del `<tbody>`, sin cambiar el marcado de las
 * páginas: basta con sustituir `<table>` por `<ResponsiveTable>`.
 */

const textOf = (node: ReactNode): string => {
  if (typeof node === 'string' || typeof node === 'number') return String(node)
  if (Array.isArray(node)) return node.map(textOf).join('')
  if (isValidElement(node)) return textOf((node.props as { children?: ReactNode }).children)
  return ''
}

const childrenOf = (node: ReactElement): ReactNode =>
  (node.props as { children?: ReactNode }).children

const collectLabels = (children: ReactNode): string[] => {
  const labels: string[] = []
  Children.forEach(children, (thead) => {
    if (!isValidElement(thead) || thead.type !== 'thead') return
    Children.forEach(childrenOf(thead), (tr) => {
      if (!isValidElement(tr) || tr.type !== 'tr') return
      Children.forEach(childrenOf(tr), (th) => {
        if (isValidElement(th) && th.type === 'th') labels.push(textOf(childrenOf(th)).trim())
      })
    })
  })
  return labels
}

/** Recorre el árbol de React (incluidos arrays de `.map()`) y numera las
 * celdas dentro de cada fila para asignarles su etiqueta correspondiente. */
const injectLabel = (node: ReactNode, labels: string[], cell: { index: number }): ReactNode => {
  if (Array.isArray(node)) return node.map((child) => injectLabel(child, labels, cell))
  if (!isValidElement(node)) return node
  if (node.type === 'tr') return cloneElement(node, {}, injectLabel(childrenOf(node), labels, { index: 0 }))
  if (node.type === 'td' || node.type === 'th') {
    const label = labels[cell.index] ?? ''
    cell.index += 1
    return cloneElement(node as ReactElement<{ 'data-label'?: string }>, { 'data-label': label })
  }
  return cloneElement(node, {}, injectLabel(childrenOf(node), labels, cell))
}

type Props = TableHTMLAttributes<HTMLTableElement>

export const ResponsiveTable = ({ children, className = '', ...props }: Props) => {
  const labels = collectLabels(children)
  const body = Children.map(children, (child) => {
    if (!isValidElement(child) || child.type !== 'tbody') return child
    return cloneElement(child, {}, injectLabel(childrenOf(child), labels, { index: 0 }))
  })
  return (
    <table {...props} className={`table table--cards ${className}`.trim()}>
      {body}
    </table>
  )
}
