import { useState } from 'react'
import { motion } from 'framer-motion'
import { useInventoryStore } from '../../store/inventory'
import { useAuth } from '../../contexts/AuthContext'
import { ArrowUp, ArrowDown, Plus } from 'lucide-react'
import { Button } from '../../components/ui/button'
import { toast } from 'sonner'

export const MovimientosPage = () => {
  const { products, movements, addMovement } = useInventoryStore()
  const { user } = useAuth()
  const [showForm, setShowForm] = useState(false)
  const [formData, setFormData] = useState({ productoId: 0, tipo: 'Entrada' as 'Entrada' | 'Salida', cantidad: 1 })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const product = products.find(p => p.id === formData.productoId)
    if (!product) return
    if (formData.tipo === 'Salida' && product.cantidad < formData.cantidad) {
      toast.error('Stock insuficiente')
      return
    }
    addMovement({
      productoId: formData.productoId,
      producto: product.producto,
      tipo: formData.tipo,
      cantidad: formData.cantidad,
      usuario: user?.username || 'admin'
    })
    toast.success('Movimiento registrado')
    setShowForm(false)
    setFormData({ productoId: 0, tipo: 'Entrada', cantidad: 1 })
  }

  const groupedByDate = movements.reduce((acc, mov) => {
    const date = new Date(mov.fecha).toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })
    if (!acc[date]) acc[date] = []
    acc[date].push(mov)
    return acc
  }, {} as Record<string, any[]>)

  return (
    <div className="min-h-full px-6 lg:px-10 py-10">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
        className="mb-10"
      >
        <div className="flex items-baseline gap-4 mb-6">
          <h1 
            className="text-6xl lg:text-7xl xl:text-8xl"
            style={{ fontFamily: 'var(--font-display)', color: 'var(--ink)' }}
          >
            Movimientos
          </h1>
          <span className="text-[10px] tracking-[0.3em] uppercase pb-4" style={{ color: 'var(--ink-subtle)' }}>
            03
          </span>
        </div>
        <Button onClick={() => setShowForm(!showForm)}>
          <Plus size={14} strokeWidth={1.25} className="inline mr-2" />
          Registrar Movimiento
        </Button>
      </motion.div>

      {showForm && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          className="mb-10 p-6 border"
          style={{ backgroundColor: 'var(--bg-surface)', borderColor: 'var(--line)' }}
        >
          <form onSubmit={handleSubmit} className="flex flex-wrap items-end gap-4">
            <div className="flex-1 min-w-[200px]">
              <label className="text-[10px] tracking-[0.2em] uppercase block mb-2" style={{ color: 'var(--ink-subtle)' }}>
                Producto
              </label>
              <select
                value={formData.productoId}
                onChange={(e) => setFormData({...formData, productoId: parseInt(e.target.value)})}
                className="w-full bg-transparent border-b py-2 text-sm focus:outline-none"
                style={{ borderColor: 'var(--line-strong)', color: 'var(--ink)' }}
                required
              >
                <option value={0}>Seleccionar...</option>
                {products.map(p => (
                  <option key={p.id} value={p.id}>{p.codigo} - {p.producto} ({p.cantidad})</option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-[10px] tracking-[0.2em] uppercase block mb-2" style={{ color: 'var(--ink-subtle)' }}>
                Tipo
              </label>
              <select
                value={formData.tipo}
                onChange={(e) => setFormData({...formData, tipo: e.target.value as any})}
                className="w-full bg-transparent border-b py-2 text-sm focus:outline-none"
                style={{ borderColor: 'var(--line-strong)', color: 'var(--ink)' }}
              >
                <option value="Entrada">Entrada</option>
                <option value="Salida">Salida</option>
              </select>
            </div>
            <div>
              <label className="text-[10px] tracking-[0.2em] uppercase block mb-2" style={{ color: 'var(--ink-subtle)' }}>
                Cantidad
              </label>
              <input
                type="number"
                value={formData.cantidad}
                onChange={(e) => setFormData({...formData, cantidad: parseInt(e.target.value)})}
                className="w-24 bg-transparent border-b py-2 text-sm focus:outline-none tabular-nums"
                style={{ borderColor: 'var(--line-strong)', color: 'var(--ink)', fontFamily: 'var(--font-mono)' }}
                min="1"
                required
              />
            </div>
            <Button type="submit" size="md">Registrar</Button>
          </form>
        </motion.div>
      )}

      <div className="space-y-12">
        {Object.entries(groupedByDate).map(([date, items], dateIndex) => (
          <motion.div
            key={date}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: dateIndex * 0.1 }}
          >
            <div className="flex items-center gap-4 mb-6">
              <h2 className="text-2xl" style={{ fontFamily: 'var(--font-display)', fontStyle: 'italic', color: 'var(--ink)' }}>
                {date}
              </h2>
              <div className="flex-1 h-px" style={{ backgroundColor: 'var(--line)' }} />
            </div>
            <div className="space-y-2 ml-4 border-l" style={{ borderColor: 'var(--line)' }}>
              {items.map((mov, idx) => (
                <motion.div
                  key={mov.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.6, delay: idx * 0.05 }}
                  className="relative pl-8 py-3 group"
                >
                  <div className="absolute left-[-5px] top-1/2 -translate-y-1/2 w-2.5 h-2.5 border-2" style={{ borderColor: mov.tipo === 'Entrada' ? 'var(--moss)' : 'var(--accent)', backgroundColor: 'var(--bg)' }} />
                  <div className="flex items-center justify-between p-4 border transition-colors duration-300 group-hover:bg-[var(--bg-surface)]" style={{ borderColor: 'var(--line)' }}>
                    <div className="flex items-center gap-4">
                      {mov.tipo === 'Entrada' ? (
                        <ArrowUp size={16} strokeWidth={1.25} style={{ color: 'var(--moss)' }} />
                      ) : (
                        <ArrowDown size={16} strokeWidth={1.25} style={{ color: 'var(--accent)' }} />
                      )}
                      <div>
                        <p className="text-sm" style={{ color: 'var(--ink)' }}>{mov.producto}</p>
                        <p className="text-xs" style={{ color: 'var(--ink-subtle)' }}>{mov.tipo} • {mov.usuario}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p 
                        className="text-lg tabular-nums"
                        style={{ 
                          fontFamily: 'var(--font-mono)',
                          color: mov.tipo === 'Entrada' ? 'var(--moss)' : 'var(--accent)'
                        }}
                      >
                        {mov.tipo === 'Entrada' ? '+' : '-'}{mov.cantidad}
                      </p>
                      <p className="text-xs" style={{ color: 'var(--ink-subtle)' }}>
                        {new Date(mov.fecha).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  )
}
