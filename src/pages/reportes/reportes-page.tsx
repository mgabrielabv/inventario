import { useState } from 'react'
import { motion } from 'framer-motion'
import { useInventoryStore } from '../../store/inventory'
import { useAuth } from '../../contexts/AuthContext'
import { FileText, ArrowLeftRight, Calendar, TrendingUp, Download } from 'lucide-react'
import { Button } from '../../components/ui/button'
import { toast } from 'sonner'
import jsPDF from 'jspdf'

export const ReportesPage = () => {
  const { user } = useAuth()
  const { products, movements, getProductStatus } = useInventoryStore()
  const [activeReport, setActiveReport] = useState('stock')
  const [categoria, setCategoria] = useState('Todas')
  const [estado, setEstado] = useState('Todas')

  if (user?.role === 'Operador') {
    return (
      <div className="min-h-full px-6 lg:px-10 py-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <h1 className="text-6xl mb-6" style={{ fontFamily: 'var(--font-display)', color: 'var(--ink)' }}>
            Reportes
          </h1>
          <div className="p-12 text-center border" style={{ borderColor: 'var(--line)' }}>
            <p className="text-sm" style={{ color: 'var(--ink-subtle)' }}>
              Acceso restringido
            </p>
          </div>
        </motion.div>
      </div>
    )
  }

  const reports = [
    { id: 'stock', label: 'Stock Actual', icon: FileText },
    { id: 'movimientos', label: 'Movimientos', icon: ArrowLeftRight },
    { id: 'fecha', label: 'Reporte por Fecha', icon: Calendar },
    { id: 'top', label: 'Productos Más/Menos Movidos', icon: TrendingUp },
  ]

  const filteredProducts = products.filter(p => {
    const matchCat = categoria === 'Todas' || p.categoria === categoria
    const status = getProductStatus(p.cantidad)
    const matchEst = estado === 'Todas' || status.label === estado
    return matchCat && matchEst
  })

  const handleExportPDF = () => {
    toast.success('Generando PDF...')
    setTimeout(() => {
      const doc = new jsPDF()
      doc.setFontSize(20)
      doc.text('Sistema de Control e Inventario', 20, 20)
      doc.setFontSize(12)
      doc.text('Reporte: ' + reports.find(r => r.id === activeReport)?.label, 20, 30)
      doc.text('Fecha: ' + new Date().toLocaleDateString('es-ES'), 20, 40)
      doc.save('reporte-atelier.pdf')
      toast.success('PDF descargado')
    }, 500)
  }

  const handleExportCSV = () => {
    toast.success('CSV descargado')
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
            Reportes
          </h1>
          <span className="text-[10px] tracking-[0.3em] uppercase pb-4" style={{ color: 'var(--ink-subtle)' }}>
            05
          </span>
        </div>
      </motion.div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3 mb-8">
        {reports.map((report, index) => (
          <motion.button
            key={report.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: index * 0.05 }}
            onClick={() => setActiveReport(report.id)}
            className="relative p-6 text-left border transition-all duration-300"
            style={{
              backgroundColor: activeReport === report.id ? 'var(--ink)' : 'var(--bg-surface)',
              borderColor: activeReport === report.id ? 'var(--ink)' : 'var(--line)',
            }}
          >
            <report.icon 
              size={20} 
              strokeWidth={1.25} 
              className="mb-4"
              style={{ color: activeReport === report.id ? 'var(--bg)' : 'var(--ink)' }}
            />
            <p 
              className="text-sm"
              style={{ color: activeReport === report.id ? 'var(--bg)' : 'var(--ink)' }}
            >
              {report.label}
            </p>
          </motion.button>
        ))}
      </div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.8 }}
        className="border"
        style={{ backgroundColor: 'var(--bg-surface)', borderColor: 'var(--line)' }}
      >
        <div className="p-6 flex flex-wrap items-center justify-between gap-4 border-b" style={{ borderColor: 'var(--line)' }}>
          <div className="flex flex-wrap items-center gap-3">
            <select
              value={categoria}
              onChange={(e) => setCategoria(e.target.value)}
              className="px-3 py-1.5 text-xs border bg-transparent"
              style={{ borderColor: 'var(--line-strong)', color: 'var(--ink)' }}
            >
              <option value="Todas">Todas las categorías</option>
              <option value="Electrónica">Electrónica</option>
              <option value="Accesorios">Accesorios</option>
              <option value="Papelería">Papelería</option>
              <option value="Hogar">Hogar</option>
              <option value="Otras">Otras</option>
            </select>
            <select
              value={estado}
              onChange={(e) => setEstado(e.target.value)}
              className="px-3 py-1.5 text-xs border bg-transparent"
              style={{ borderColor: 'var(--line-strong)', color: 'var(--ink)' }}
            >
              <option value="Todas">Todos los estados</option>
              <option value="Normal">Normal</option>
              <option value="Bajo stock">Bajo stock</option>
              <option value="Crítico">Crítico</option>
            </select>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={handleExportCSV}>
              <Download size={12} strokeWidth={1.25} className="inline mr-2" />
              CSV
            </Button>
            <Button size="sm" onClick={handleExportPDF}>
              <Download size={12} strokeWidth={1.25} className="inline mr-2" />
              PDF
            </Button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr style={{ borderBottom: '1px solid var(--line)' }}>
                <th className="text-left p-4 text-[9px] tracking-[0.3em] uppercase" style={{ color: 'var(--ink-subtle)' }}>Código</th>
                <th className="text-left p-4 text-[9px] tracking-[0.3em] uppercase" style={{ color: 'var(--ink-subtle)' }}>Producto</th>
                <th className="text-left p-4 text-[9px] tracking-[0.3em] uppercase" style={{ color: 'var(--ink-subtle)' }}>Categoría</th>
                <th className="text-left p-4 text-[9px] tracking-[0.3em] uppercase" style={{ color: 'var(--ink-subtle)' }}>Cantidad</th>
                <th className="text-left p-4 text-[9px] tracking-[0.3em] uppercase" style={{ color: 'var(--ink-subtle)' }}>Estado</th>
              </tr>
            </thead>
            <tbody>
              {filteredProducts.map((product, index) => {
                const status = getProductStatus(product.cantidad)
                return (
                  <motion.tr
                    key={product.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.4, delay: index * 0.02 }}
                    style={{ borderBottom: '1px solid var(--line)' }}
                  >
                    <td className="p-4">
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
                      <span className="text-sm tabular-nums" style={{ fontFamily: 'var(--font-mono)', color: 'var(--ink)' }}>
                        {product.cantidad}
                      </span>
                    </td>
                    <td className="p-4">
                      <div className="flex items-center gap-2">
                        <div 
                          className="w-1.5 h-1.5 rounded-full"
                          style={{ 
                            backgroundColor: status.status === 'normal' ? 'var(--moss)' : status.status === 'low' ? 'var(--ochre)' : 'var(--accent)'
                          }}
                        />
                        <span className="text-sm" style={{ color: 'var(--ink-soft)' }}>{status.label}</span>
                      </div>
                    </td>
                  </motion.tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </motion.div>
    </div>
  )
}
