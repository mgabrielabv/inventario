import { useEffect, useMemo, useRef, useState } from 'react'
import { Search } from 'lucide-react'
import { AnimatePresence, motion } from 'framer-motion'
import { popover } from '../../motion/variants'

export interface ComboOption { id: string; label: string; sub?: string }

interface Props {
  options: ComboOption[]
  value: string
  onChange: (id: string) => void
  placeholder?: string
  label?: string
}

/** Combobox accessibile: flechas, Enter y acepta lector de código de barras. */
export const Combobox = ({ options, value, onChange, placeholder = 'Buscar…', label = 'Producto' }: Props) => {
  const [query, setQuery] = useState('')
  const [open, setOpen] = useState(false)
  const [active, setActive] = useState(0)
  const box = useRef<HTMLDivElement | null>(null)
  const selected = options.find((option) => option.id === value)

  const matches = useMemo(() => {
    const needle = query.trim().toLowerCase()
    if (!needle) return options.slice(0, 8)
    return options.filter((option) =>
      `${option.label} ${option.sub ?? ''}`.toLowerCase().includes(needle)).slice(0, 8)
  }, [options, query])

  useEffect(() => {
    if (!open) return
    const close = (event: MouseEvent) => {
      if (!box.current?.contains(event.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', close)
    return () => document.removeEventListener('mousedown', close)
  }, [open])

  const pick = (id: string) => { onChange(id); setQuery(''); setOpen(false) }

  return (
    <div className="combobox" ref={box}>
      <div className="combobox__control">
        <Search size={18} strokeWidth={1.5} aria-hidden="true" />
        <input
          className="combobox__input"
          aria-label={label}
          role="combobox"
          aria-expanded={open}
          aria-controls="combo-list"
          autoComplete="off"
          value={open ? query : (selected?.label ?? '')}
          placeholder={placeholder}
          onFocus={() => { setOpen(true); setQuery('') }}
          onChange={(event) => { setQuery(event.target.value); setActive(0); setOpen(true) }}
          onKeyDown={(event) => {
            if (event.key === 'ArrowDown') { event.preventDefault(); setActive((i) => Math.min(i + 1, matches.length - 1)) }
            if (event.key === 'ArrowUp') { event.preventDefault(); setActive((i) => Math.max(i - 1, 0)) }
            if (event.key === 'Enter' && matches[active]) { event.preventDefault(); pick(matches[active]!.id) }
            if (event.key === 'Escape') setOpen(false)
          }}
        />
      </div>
      <AnimatePresence>
        {open && (
          <motion.div id="combo-list" className="combobox__list glass" role="listbox" {...popover}>
            {matches.length === 0 ? (
              <p className="combobox__empty t-caption">Sin resultados</p>
            ) : matches.map((option, index) => (
              <button
                key={option.id} type="button" role="option" aria-selected={option.id === value}
                className={`combobox__option${index === active ? ' is-active' : ''}`}
                onMouseEnter={() => setActive(index)}
                onClick={() => pick(option.id)}
              >
                <span className="t-mid">{option.label}</span>
                {option.sub && <span className="t-caption">{option.sub}</span>}
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
