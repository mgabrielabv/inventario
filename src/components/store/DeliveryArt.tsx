interface MapProps {
  tipo: 'retiro' | 'delivery'
}

/** Mapa abstracto dibujado en SVG: sin librerías ni servicios externos. */
export const DeliveryMap = ({ tipo }: MapProps) => (
  <svg
    className="delivery-map"
    viewBox="0 0 240 138"
    role="img"
    aria-label={tipo === 'retiro' ? 'Mapa ilustrativo de la tienda' : 'Mapa ilustrativo de la ruta de entrega'}
  >
    <rect width="240" height="138" rx="14" fill="var(--art-paper)" />
    <g stroke="var(--art-edge)" strokeWidth="5" opacity="0.28" fill="none">
      <path d="M0 46h240M0 96h240M62 0v138M152 0v138" />
    </g>
    <g fill="var(--art-base)" opacity="0.34">
      <rect x="12" y="12" width="36" height="24" rx="3" />
      <rect x="80" y="12" width="52" height="22" rx="3" />
      <rect x="172" y="58" width="48" height="26" rx="3" />
      <rect x="14" y="106" width="34" height="20" rx="3" />
      <rect x="172" y="106" width="42" height="20" rx="3" />
    </g>
    {tipo === 'delivery' && (
      <path
        d="M62 112 L62 68 L152 68 L152 30"
        fill="none" stroke="var(--primary)" strokeWidth="3"
        strokeLinecap="round" strokeLinejoin="round" strokeDasharray="7 6"
      />
    )}
    <circle cx={tipo === 'retiro' ? 152 : 152} cy={tipo === 'retiro' ? 30 : 30} r="10"
      fill="var(--primary)" opacity="0.22" />
    <circle cx={tipo === 'retiro' ? 152 : 152} cy={tipo === 'retiro' ? 30 : 30} r="5"
      fill="var(--primary)" />
    {tipo === 'delivery' && (
      <>
        <circle cx="62" cy="112" r="7" fill="var(--art-accent)" />
        <circle cx="62" cy="112" r="3" fill="var(--art-paper)" />
      </>
    )}
  </svg>
)

interface WindowsProps {
  ventanas: string[]
  value: string
  onChange: (value: string) => void
}

/** Ventanas horarias configuradas por el negocio; nunca horarios inventados. */
export const DeliveryWindows = ({ ventanas, value, onChange }: WindowsProps) => {
  if (ventanas.length === 0) return null
  return (
    <fieldset className="delivery-windows">
      <legend className="t-caption t-strong">Ventana horaria (opcional)</legend>
      <div className="delivery-windows__list">
        {ventanas.map((ventana) => (
          <button
            key={ventana}
            type="button"
            className={value === ventana ? 'is-active' : ''}
            aria-pressed={value === ventana}
            onClick={() => onChange(value === ventana ? '' : ventana)}
          >
            {ventana}
          </button>
        ))}
      </div>
    </fieldset>
  )
}
