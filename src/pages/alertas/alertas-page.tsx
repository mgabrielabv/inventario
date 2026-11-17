import { motion } from 'framer-motion'
import { useInventoryStore } from '../../store/inventory'
import { AlertTriangle } from 'lucide-react'
import { toast } from 'sonner'

export const AlertasPage = () => {
  const products = useInventoryStore((state) => state.products)
  const alerts = products.filter(p => p.cantidad < 10)
  const critical = alerts.filter(p => p.cantidad < 5)
  const warning = alerts.filter(p => p.cantidad >= 5 && p.cantidad < 10)

  const getSeverity = (cantidad: number) => {
    if (cantidad < 5) return { level: 'Crítico', color: 'var(--accent)' }
    return { level: 'Advertencia', color: 'var(--ochre)' }
  }

  const handleAttend = (product: any) => {
    toast.success(`${product.producto} marcado como atendido`)
  }

  return (
    <div className="min-h-full px-6 lg:px-10 py-10">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
        className="mb-10"
      >
        <div className="flex items-baseline gap-4 mb-4">
          <h1 
            className="text-6xl lg:text-7xl xl:text-8xl"
            style={{ fontFamily: 'var(--font-display)', color: 'var(--ink)' }}
          >
            Alertas
          </h1>
          <span className="text-[10px] tracking-[0.3em] uppercase pb-4" style={{ color: 'var(--ink-subtle)' }}>
            04 / {alerts.length.toString().padStart(2, '0')}
          </span>
        </div>
        <p className="text-sm" style={{ color: 'var(--ink-subtle)' }}>
          {critical.length} crítico{critical.length !== 1 ? 's' : ''} • {warning.length} advertencia{warning.length !== 1 ? 's' : ''}
        </p>
      </motion.div>

      {alerts.length === 0 ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center py-20"
        >
          <p className="text-3xl mb-4" style={{ fontFamily: 'var(--font-display)', fontStyle: 'italic', color: 'var(--ink)' }}>
            Nada por aquí... todavía.
          </p>
          <p className="text-sm" style={{ color: 'var(--ink-subtle)' }}>
            Todos los productos se encuentran dentro de los niveles óptimos
          </p>
        </motion.div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {alerts.map((product, index) => {
            const severity = getSeverity(product.cantidad)
            const percentage = Math.max(10, (product.cantidad / 10) * 100)
            return (
              <motion.div
                key={product.id}
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: index * 0.08, ease: [0.22, 1, 0.36, 1] }}
                className="relative p-6 border overflow-hidden group"
                style={{ 
                  backgroundColor: 'var(--bg-surface)',
                  borderColor: severity.color,
                }}
              >
                <div className="absolute top-0 left-0 w-full h-[2px]" style={{ backgroundColor: severity.color }} />
                <div className="flex items-start justify-between mb-6">
                  <div className="flex items-start gap-3">
                    <AlertTriangle size={20} strokeWidth={1.25} style={{ color: severity.color }} />
                    <div>
                      <h3 className="text-xl mb-1" style={{ fontFamily: 'var(--font-display)', color: 'var(--ink)' }}>
                        {product.producto}
                      </h3>
                      <p className="text-xs" style={{ color: 'var(--ink-subtle)' }}>
                        {product.codigo} • {product.categoria}
                      </p>
                    </div>
                  </div>
                  <span className="text-[10px] tracking-[0.2em] uppercase" style={{ color: severity.color }}>
                    {severity.level}
                  </span>
                </div>

                <div className="mb-6">
                  <div className="flex items-baseline gap-2 mb-3">
                    <span className="text-4xl tabular-nums" style={{ fontFamily: 'var(--font-display)', color: 'var(--ink)' }}>
                      {product.cantidad}
                    </span>
                    <span className="text-sm" style={{ color: 'var(--ink-subtle)' }}>unidades</span>
                  </div>
                  <div className="relative w-full h-1" style={{ backgroundColor: 'var(--line)' }}>
                    <motion.div
                      initial={{ scaleX: 0 }}
                      animate={{ scaleX: percentage / 100 }}
                      transition={{ duration: 1, delay: index * 0.08 + 0.3 }}
                      className="absolute left-0 top-0 h-full origin-left"
                      style={{ backgroundColor: severity.color }}
                    />
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleAttend(product)}
                    className="flex-1 px-4 py-2 text-xs tracking-[0.15em] uppercase border transition-colors duration-300"
                    style={{ borderColor: 'var(--line-strong)', color: 'var(--ink-soft)' }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.borderColor = 'var(--ink)'
                      e.currentTarget.style.color = 'var(--ink)'
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.borderColor = 'var(--line-strong)'
                      e.currentTarget.style.color = 'var(--ink-soft)'
                    }}
                  >
                    Marcar como atendida
                  </button>
                  <button
                    className="flex-1 px-4 py-2 text-xs tracking-[0.15em] uppercase transition-colors duration-300"
                    style={{ backgroundColor: severity.color, color: '#FBFAF6' }}
                  >
                    Reabastecer
                  </button>
                </div>
              </motion.div>
            )
          })}
        </div>
      )}
    </div>
  )
}
