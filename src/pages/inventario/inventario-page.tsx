import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useInventoryStore } from '../../store/inventory'
import { Search, Plus, Edit2, Trash2, X } from 'lucide-react'
import { Button } from '../../components/ui/button'
import { toast } from 'sonner'

export const InventarioPage = () => {
  const { products, addProduct, updateProduct, deleteProduct, getProductStatus } = useInventoryStore()
  const [search, setSearch] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('Todas')
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [editingProduct, setEditingProduct] = useState<any>(null)
  const [formData, setFormData] = useState({ codigo: '', producto: '', categoria: 'Electrónica', cantidad: 0 })
  const [deleteConfirm, setDeleteConfirm] = useState<number | null>(null)

  const categories = ['Todas', 'Electrónica', 'Accesorios', 'Papelería', 'Hogar', 'Otras']

  const filtered = products.filter(p => {
    const matchSearch = p.producto.toLowerCase().includes(search.toLowerCase()) || p.codigo.includes(search)
    const matchCat = categoryFilter === 'Todas' || p.categoria === categoryFilter
    return matchSearch && matchCat
  })

  const openDrawer = (product?: any) => {
    if (product) {
      setEditingProduct(product)
      setFormData(product)
    } else {
      setEditingProduct(null)
      setFormData({ codigo: '', producto: '', categoria: 'Electrónica', cantidad: 0 })
    }
    setDrawerOpen(true)
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (editingProduct) {
      updateProduct(editingProduct.id, formData)
      toast.success('Producto actualizado')
    } else {
      addProduct(formData as any)
      toast.success('Producto agregado')
    }
    setDrawerOpen(false)
  }

  const handleDelete = (id: number) => {
    if (deleteConfirm === id) {
      deleteProduct(id)
      toast.success('Producto eliminado')
      setDeleteConfirm(null)
    } else {
      setDeleteConfirm(id)
      setTimeout(() => setDeleteConfirm(null), 2000)
    }
  }

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
            Inventario
          </h1>
          <span className="text-[10px] tracking-[0.3em] uppercase pb-4" style={{ color: 'var(--ink-subtle)' }}>
            02 / {products.length.toString().padStart(2, '0')}
          </span>
        </div>

        <div className="flex flex-col lg:flex-row lg:items-center gap-4 justify-between">
          <div className="relative flex-1 max-w-xl">
            <Search size={16} strokeWidth={1.25} className="absolute left-0 top-1/2 -translate-y-1/2" style={{ color: 'var(--ink-subtle)' }} />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar producto..."
              className="w-full bg-transparent border-0 border-b py-2 pl-6 pr-0 text-sm focus:outline-none"
              style={{ borderColor: 'var(--line-strong)', color: 'var(--ink)' }}
            />
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            {categories.map(cat => (
              <button
                key={cat}
                onClick={() => setCategoryFilter(cat)}
                className="px-3 py-1.5 text-[10px] tracking-[0.2em] uppercase border transition-colors duration-300"
                style={{
                  borderColor: categoryFilter === cat ? 'var(--ink)' : 'var(--line-strong)',
                  color: categoryFilter === cat ? 'var(--ink)' : 'var(--ink-subtle)',
                }}
              >
                {cat}
              </button>
            ))}
          </div>

          <Button onClick={() => openDrawer()}>
            <Plus size={14} strokeWidth={1.25} className="inline mr-2" />
            Agregar
          </Button>
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.8, delay: 0.2 }}
        className="border"
        style={{ borderColor: 'var(--line)' }}
      >
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr style={{ borderBottom: '1px solid var(--line)' }}>
                <th className="text-left p-4 text-[9px] tracking-[0.3em] uppercase" style={{ color: 'var(--ink-subtle)' }}>Código</th>
                <th className="text-left p-4 text-[9px] tracking-[0.3em] uppercase" style={{ color: 'var(--ink-subtle)' }}>Producto</th>
                <th className="text-left p-4 text-[9px] tracking-[0.3em] uppercase" style={{ color: 'var(--ink-subtle)' }}>Categoría</th>
                <th className="text-left p-4 text-[9px] tracking-[0.3em] uppercase" style={{ color: 'var(--ink-subtle)' }}>Cantidad</th>
                <th className="text-left p-4 text-[9px] tracking-[0.3em] uppercase" style={{ color: 'var(--ink-subtle)' }}>Estado</th>
                <th className="text-right p-4 text-[9px] tracking-[0.3em] uppercase" style={{ color: 'var(--ink-subtle)' }}></th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((product, index) => {
                const status = getProductStatus(product.cantidad)
                return (
                  <motion.tr
                    key={product.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.4, delay: index * 0.02 }}
                    className="group relative"
                    style={{ borderBottom: '1px solid var(--line)' }}
                  >
                    <td className="p-4 relative">
                      <div className="absolute left-0 top-0 bottom-0 w-[2px] bg-[var(--accent)] scale-y-0 group-hover:scale-y-100 transition-transform duration-300 origin-top" />
                      <span className="text-sm tabular-nums" style={{ fontFamily: 'var(--font-mono)', color: 'var(--ink)' }}>
                        {product.codigo}
                      </span>
                    </td>
                    <td className="p-4">
                      <span className="text-sm" style={{ color: 'var(--ink)' }}>{product.producto}</span>
                    </td>
                    <td className="p-4">
                      <span className="text-sm" style={{ color: 'var(--ink-subtle)' }}>{product.categoria}</span>
                    </td>
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <span className="text-sm tabular-nums" style={{ fontFamily: 'var(--font-mono)', color: 'var(--ink)' }}>
                          {product.cantidad}
                        </span>
                        <div className="flex-1 max-w-[80px] h-[2px] relative" style={{ backgroundColor: 'var(--line)' }}>
                          <div 
                            className="h-full absolute left-0 top-0"
                            style={{ 
                              width: `${Math.min(100, (product.cantidad / 50) * 100)}%`,
                              backgroundColor: status.status === 'normal' ? 'var(--moss)' : status.status === 'low' ? 'var(--ochre)' : 'var(--accent)'
                            }}
                          />
                        </div>
                      </div>
                    </td>
                    <td className="p-4">
                      <div className="flex items-center gap-2">
                        <div 
                          className="w-1.5 h-1.5 rounded-full"
                          style={{ 
                            backgroundColor: status.status === 'normal' ? 'var(--moss)' : status.status === 'low' ? 'var(--ochre)' : 'var(--accent)',
                            animation: status.status !== 'normal' ? 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite' : 'none'
                          }}
                        />
                        <span className="text-sm" style={{ color: 'var(--ink-soft)' }}>{status.label}</span>
                      </div>
                    </td>
                    <td className="p-4 text-right">
                      <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                        <button onClick={() => openDrawer(product)} style={{ color: 'var(--ink-subtle)' }}>
                          <Edit2 size={14} strokeWidth={1.25} />
                        </button>
                        <button onClick={() => handleDelete(product.id)} style={{ color: deleteConfirm === product.id ? 'var(--accent)' : 'var(--ink-subtle)' }}>
                          {deleteConfirm === product.id ? <span className="text-xs">Confirmar</span> : <Trash2 size={14} strokeWidth={1.25} />}
                        </button>
                      </div>
                    </td>
                  </motion.tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </motion.div>

      <AnimatePresence>
        {drawerOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setDrawerOpen(false)}
              className="fixed inset-0 bg-black/40 z-50"
            />
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 30, stiffness: 300 }}
              className="fixed inset-y-0 right-0 w-full sm:w-[400px] z-50 flex flex-col"
              style={{ backgroundColor: 'var(--bg-surface)', borderLeft: '1px solid var(--line)' }}
            >
              <div className="h-16 flex items-center justify-between px-6 border-b" style={{ borderColor: 'var(--line)' }}>
                <div>
                  <h2 className="text-lg" style={{ fontFamily: 'var(--font-display)', color: 'var(--ink)' }}>
                    {editingProduct ? 'Editar Producto' : 'Nuevo Producto'}
                  </h2>
                  <p className="text-[10px] tracking-[0.2em] uppercase" style={{ color: 'var(--ink-subtle)' }}>
                    {editingProduct ? 'Modificación' : 'Alta'}
                  </p>
                </div>
                <button onClick={() => setDrawerOpen(false)} style={{ color: 'var(--ink)' }}>
                  <X size={20} strokeWidth={1.25} />
                </button>
              </div>
              <form onSubmit={handleSubmit} className="flex-1 p-6 space-y-6">
                <div>
                  <label className="text-[10px] tracking-[0.2em] uppercase block mb-2" style={{ color: 'var(--ink-subtle)' }}>
                    Código
                  </label>
                  <input
                    type="text"
                    value={formData.codigo}
                    onChange={(e) => setFormData({...formData, codigo: e.target.value})}
                    className="w-full bg-transparent border-b py-2 text-sm focus:outline-none"
                    style={{ borderColor: 'var(--line-strong)', color: 'var(--ink)' }}
                    required
                  />
                </div>
                <div>
                  <label className="text-[10px] tracking-[0.2em] uppercase block mb-2" style={{ color: 'var(--ink-subtle)' }}>
                    Producto
                  </label>
                  <input
                    type="text"
                    value={formData.producto}
                    onChange={(e) => setFormData({...formData, producto: e.target.value})}
                    className="w-full bg-transparent border-b py-2 text-sm focus:outline-none"
                    style={{ borderColor: 'var(--line-strong)', color: 'var(--ink)' }}
                    required
                  />
                </div>
                <div>
                  <label className="text-[10px] tracking-[0.2em] uppercase block mb-2" style={{ color: 'var(--ink-subtle)' }}>
                    Categoría
                  </label>
                  <select
                    value={formData.categoria}
                    onChange={(e) => setFormData({...formData, categoria: e.target.value as any})}
                    className="w-full bg-transparent border-b py-2 text-sm focus:outline-none"
                    style={{ borderColor: 'var(--line-strong)', color: 'var(--ink)' }}
                  >
                    <option value="Electrónica">Electrónica</option>
                    <option value="Accesorios">Accesorios</option>
                    <option value="Papelería">Papelería</option>
                    <option value="Hogar">Hogar</option>
                    <option value="Otras">Otras</option>
                  </select>
                </div>
                <div>
                  <label className="text-[10px] tracking-[0.2em] uppercase block mb-2" style={{ color: 'var(--ink-subtle)' }}>
                    Cantidad
                  </label>
                  <input
                    type="number"
                    value={formData.cantidad}
                    onChange={(e) => setFormData({...formData, cantidad: parseInt(e.target.value) || 0})}
                    className="w-full bg-transparent border-b py-2 text-sm focus:outline-none tabular-nums"
                    style={{ borderColor: 'var(--line-strong)', color: 'var(--ink)', fontFamily: 'var(--font-mono)' }}
                    required
                  />
                </div>
                <div className="pt-6">
                  <Button type="submit" size="lg" className="w-full">
                    {editingProduct ? 'Actualizar' : 'Guardar'}
                  </Button>
                </div>
              </form>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.4; }
        }
      `}</style>
    </div>
  )
}
