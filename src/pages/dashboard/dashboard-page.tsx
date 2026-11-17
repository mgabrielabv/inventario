import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { useInventoryStore } from '../../store/inventory'
import { ArrowUp, ArrowDown, ArrowRight } from 'lucide-react'
import { NavLink } from 'react-router-dom'

const AnimatedNumber = ({ value }: { value: number }) => {
  const [count, setCount] = useState(0)

  useEffect(() => {
    let start = 0
    const end = value
    const duration = 1200
    const increment = end / (duration / 16)

    const timer = setInterval(() => {
      start += increment
      if (start >= end) {
        setCount(end)
        clearInterval(timer)
      } else {
        setCount(Math.floor(start))
      }
    }, 16)

    return () => clearInterval(timer)
  }, [value])

  return <span>{count}</span>
}

const Sparkline = ({ data = [4, 6, 5, 8, 7, 9, 10] }: { data?: number[] }) => {
  const max = Math.max(...data)
  const points = data.map((val, i) => {
    const x = (i / (data.length - 1)) * 120
    const y = 48 - (val / max) * 40
    return `${x},${y}`
  }).join(' ')

  return (
    <svg width="120" height="48" viewBox="0 0 120 48">
      <motion.polyline
        initial={{ pathLength: 0 }}
        animate={{ pathLength: 1 }}
        transition={{ duration: 1.2, ease: 'easeOut', delay: 0.3 }}
        fill="none"
        stroke="var(--ink)"
        strokeWidth="1.5"
        points={points}
      />
    </svg>
  )
}

export const DashboardPage = () => {
  const products = useInventoryStore((state) => state.products)
  const movements = useInventoryStore((state) => state.movements)
  
  const totalProducts = products.length
  const totalUnits = products.reduce((sum, p) => sum + p.cantidad, 0)
  const alertsCount = products.filter(p => p.cantidad < 10).length
  const criticalCount = products.filter(p => p.cantidad < 5).length
  const warningCount = alertsCount - criticalCount

  const categoryData = products.reduce((acc, product) => {
    acc[product.categoria] = (acc[product.categoria] || 0) + product.cantidad
    return acc
  }, {} as Record<string, number>)

  const sortedCategories = Object.entries(categoryData)
    .sort(([, a], [, b]) => b - a)
    .map(([cat, value]) => ({ cat, value, percentage: Math.round((value / totalUnits) * 100) }))

  const recentMovements = movements.slice(0, 5)

  const getRelativeTime = (date: string) => {
    const now = new Date()
    const then = new Date(date)
    const diff = Math.floor((now.getTime() - then.getTime()) / 1000 / 60)
    if (diff < 60) return `hace ${diff} min`
    if (diff < 1440) return `hace ${Math.floor(diff / 60)} h`
    return `hace ${Math.floor(diff / 1440)} d`
  }

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.08,
        delayChildren: 0.1,
      },
    },
  }

  const itemVariants = {
    hidden: { opacity: 0, y: 24 },
    visible: { 
      opacity: 1, 
      y: 0,
      transition: { duration: 0.7, ease: [0.22, 1, 0.36, 1] }
    },
  }

  return (
    <div className="min-h-[calc(100svh-72px)]">
      <div style={{ maxWidth: '1440px', margin: '0 auto', padding: '48px 24px' }} className="lg:!px-[48px]">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
          className="mb-[48px]"
        >
          <p className="text-[11px] tracking-[0.16em] uppercase mb-[16px]" style={{ fontFamily: 'var(--font-mono)', color: 'var(--ink-subtle)' }}>
            01 / DASHBOARD
          </p>
          <h1 
            className="mb-[16px]"
            style={{ 
              fontFamily: 'var(--font-display)', 
              color: 'var(--ink)',
              fontSize: 'clamp(48px, 6vw, 88px)',
              lineHeight: 0.95,
            }}
          >
            Inicio
          </h1>
          <p className="text-[16px]" style={{ color: 'var(--ink-subtle)' }}>
            <span style={{ color: 'var(--accent)' }}>{alertsCount}</span> producto{alertsCount !== 1 ? 's' : ''} necesita{alertsCount !== 1 ? 'n' : ''} tu atención
          </p>
        </motion.div>

        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="grid grid-cols-1 md:grid-cols-6 lg:grid-cols-12 gap-[24px]"
          style={{ alignContent: 'start' }}
        >
          {/* Fila 1 */}
          <motion.div variants={itemVariants} className="md:col-span-6 lg:col-span-7">
            <div 
              className="flex flex-col justify-between h-[280px] p-[32px] border"
              style={{ 
                backgroundColor: 'var(--bg-surface)',
                borderColor: 'var(--line)',
              }}
            >
              <div className="flex items-start justify-between">
                <p className="text-[11px] tracking-[0.16em] uppercase" style={{ color: 'var(--ink-subtle)' }}>
                  Total de productos
                </p>
              </div>
              <div className="flex items-end justify-between">
                <div 
                  className="text-left"
                  style={{ 
                    fontFamily: 'var(--font-display)', 
                    color: 'var(--ink)',
                    fontSize: 'clamp(72px, 9vw, 128px)',
                    lineHeight: 0.9,
                  }}
                >
                  <AnimatedNumber value={totalProducts} />
                </div>
                <div className="flex items-end gap-4 mb-2">
                  <Sparkline />
                  <div className="text-right">
                    <p className="text-[13px] flex items-center gap-1" style={{ fontFamily: 'var(--font-mono)', color: 'var(--moss)' }}>
                      <ArrowUp size={12} strokeWidth={1.5} />
                      12% vs. semana pasada
                    </p>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="flex-1 h-px" style={{ backgroundColor: 'var(--line)' }} />
                <p className="text-[13px]" style={{ color: 'var(--ink-subtle)' }}>
                  {totalUnits.toLocaleString('es-ES')} unidades en total
                </p>
              </div>
            </div>
          </motion.div>

          <motion.div variants={itemVariants} className="md:col-span-6 lg:col-span-5">
            <div 
              className="flex flex-col justify-between h-[280px] p-[32px] border"
              style={{ 
                backgroundColor: 'var(--accent)',
                borderColor: 'var(--accent)',
              }}
            >
              <div className="flex items-start justify-between">
                <p className="text-[11px] tracking-[0.16em] uppercase" style={{ color: '#FBFAF6' }}>
                  Alertas de stock
                </p>
                <motion.div
                  animate={{ scale: [1, 1.3, 1] }}
                  transition={{ duration: 2, repeat: Infinity }}
                  className="w-2 h-2 rounded-full"
                  style={{ backgroundColor: '#FBFAF6' }}
                />
              </div>
              <div 
                className="text-left"
                style={{ 
                  fontFamily: 'var(--font-display)', 
                  color: '#FBFAF6',
                  fontSize: 'clamp(72px, 9vw, 128px)',
                  lineHeight: 0.9,
                }}
              >
                <AnimatedNumber value={alertsCount} />
              </div>
              <div className="flex items-center gap-2">
                <span className="px-2 py-1 text-[11px] border" style={{ borderColor: 'rgba(251, 250, 246, 0.4)', color: '#FBFAF6' }}>
                  {criticalCount} críticos
                </span>
                <span className="px-2 py-1 text-[11px] border" style={{ borderColor: 'rgba(251, 250, 246, 0.4)', color: '#FBFAF6' }}>
                  {warningCount} en advertencia
                </span>
              </div>
            </div>
          </motion.div>

          {/* Fila 2 */}
          <motion.div variants={itemVariants} className="md:col-span-6 lg:col-span-7">
            <div 
              className="flex flex-col h-[360px] p-[32px] border"
              style={{ 
                backgroundColor: 'var(--bg-surface)',
                borderColor: 'var(--line)',
              }}
            >
              <div className="flex items-start justify-between mb-[24px]">
                <p className="text-[11px] tracking-[0.16em] uppercase" style={{ color: 'var(--ink)' }}>
                  Stock por categoría
                </p>
                <p className="text-[11px] tracking-[0.16em] uppercase" style={{ fontFamily: 'var(--font-mono)', color: 'var(--ink-subtle)' }}>
                  CH-01
                </p>
              </div>
              <div className="flex-1 flex flex-col justify-center space-y-[20px]">
                {sortedCategories.map((item, index) => (
                  <motion.div
                    key={item.cat}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.6, delay: index * 0.08 }}
                    className="group flex items-center gap-4"
                  >
                    <div className="w-[120px] text-sm" style={{ color: 'var(--ink)' }}>
                      {item.cat}
                    </div>
                    <div className="flex-1 relative h-[12px]">
                      <div className="absolute inset-0" style={{ backgroundColor: 'rgba(20, 19, 15, 0.08)' }} />
                      <motion.div
                        initial={{ scaleX: 0 }}
                        animate={{ scaleX: 1 }}
                        transition={{ duration: 0.8, delay: index * 0.08 + 0.2, ease: [0.22, 1, 0.36, 1] }}
                        className="absolute inset-y-0 left-0 origin-left"
                        style={{ 
                          width: `${(item.value / totalUnits) * 100}%`,
                          backgroundColor: index === 0 ? 'var(--accent)' : 'var(--ink)',
                          borderRadius: '2px',
                        }}
                      />
                    </div>
                    <div className="w-[80px] text-right">
                      <span className="text-sm tabular-nums" style={{ fontFamily: 'var(--font-mono)', color: 'var(--ink)' }}>
                        {item.value}
                      </span>
                      <span className="text-xs ml-2" style={{ color: 'var(--ink-subtle)' }}>
                        {item.percentage}%
                      </span>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          </motion.div>

          <motion.div variants={itemVariants} className="md:col-span-6 lg:col-span-5">
            <div 
              className="flex flex-col h-[360px] p-[32px] border"
              style={{ 
                backgroundColor: 'var(--bg-surface)',
                borderColor: 'var(--line)',
              }}
            >
              <div className="flex items-start justify-between mb-[24px]">
                <p className="text-[11px] tracking-[0.16em] uppercase" style={{ color: 'var(--ink)' }}>
                  Últimos movimientos
                </p>
                <p className="text-[11px] tracking-[0.16em] uppercase" style={{ fontFamily: 'var(--font-mono)', color: 'var(--ink-subtle)' }}>
                  MV-01
                </p>
              </div>
              <div className="flex-1">
                {recentMovements.map((mov, index) => (
                  <div 
                    key={mov.id} 
                    className="grid items-center gap-3 py-[16px] border-b"
                    style={{ 
                      gridTemplateColumns: '32px 1fr auto',
                      borderColor: 'var(--line)',
                    }}
                  >
                    <div 
                      className="w-[32px] h-[32px] rounded-full flex items-center justify-center"
                      style={{ 
                        backgroundColor: mov.tipo === 'Entrada' ? 'rgba(94, 122, 75, 0.12)' : 'rgba(255, 74, 28, 0.12)' 
                      }}
                    >
                      {mov.tipo === 'Entrada' ? (
                        <ArrowUp size={14} strokeWidth={1.5} style={{ color: 'var(--moss)' }} />
                      ) : (
                        <ArrowDown size={14} strokeWidth={1.5} style={{ color: 'var(--accent)' }} />
                      )}
                    </div>
                    <div>
                      <p className="text-[15px]" style={{ color: 'var(--ink)' }}>{mov.producto}</p>
                      <p className="text-[13px]" style={{ color: 'var(--ink-subtle)' }}>
                        {getRelativeTime(mov.fecha)}
                      </p>
                    </div>
                    <div 
                      className="text-[16px] tabular-nums"
                      style={{ 
                        fontFamily: 'var(--font-mono)',
                        color: mov.tipo === 'Entrada' ? 'var(--moss)' : 'var(--accent)'
                      }}
                    >
                      {mov.tipo === 'Entrada' ? '+' : '-'}{mov.cantidad}
                    </div>
                  </div>
                ))}
              </div>
              <NavLink 
                to="/movimientos" 
                className="flex items-center gap-2 text-[13px] mt-4 group"
                style={{ color: 'var(--ink-subtle)' }}
              >
                <span>Ver todos</span>
                <ArrowRight size={14} strokeWidth={1.25} className="group-hover:translate-x-1 transition-transform duration-300" />
              </NavLink>
            </div>
          </motion.div>

          {/* Fila 3 */}
          <motion.div variants={itemVariants} className="md:col-span-6 lg:col-span-4">
            <div 
              className="flex flex-col justify-between h-[200px] p-[32px] border"
              style={{ 
                backgroundColor: 'var(--bg-surface)',
                borderColor: 'var(--line)',
              }}
            >
              <p className="text-[11px] tracking-[0.16em] uppercase" style={{ color: 'var(--ink)' }}>
                Tendencia semanal
              </p>
              <Sparkline />
              <p className="text-[13px]" style={{ color: 'var(--ink-subtle)' }}>
                +18% movimientos esta semana
              </p>
            </div>
          </motion.div>

          <motion.div variants={itemVariants} className="md:col-span-6 lg:col-span-4">
            <div 
              className="flex flex-col justify-between h-[200px] p-[32px] border"
              style={{ 
                backgroundColor: 'var(--bg-surface)',
                borderColor: 'var(--line)',
              }}
            >
              <p className="text-[11px] tracking-[0.16em] uppercase" style={{ color: 'var(--ink)' }}>
                Producto estrella
              </p>
              <div>
                <p className="text-2xl mb-1" style={{ fontFamily: 'var(--font-display)', color: 'var(--ink)' }}>Mouse</p>
                <p className="text-[13px]" style={{ color: 'var(--ink-subtle)' }}>Mayor rotación</p>
              </div>
              <p className="text-[13px] tabular-nums" style={{ fontFamily: 'var(--font-mono)', color: 'var(--ink-subtle)' }}>
                50 unidades
              </p>
            </div>
          </motion.div>

          <motion.div variants={itemVariants} className="md:col-span-6 lg:col-span-4">
            <div 
              className="flex flex-col justify-between h-[200px] p-[32px] border"
              style={{ 
                backgroundColor: 'var(--bg-surface)',
                borderColor: 'var(--line)',
              }}
            >
              <p className="text-[11px] tracking-[0.16em] uppercase" style={{ color: 'var(--ink)' }}>
                Valor del inventario
              </p>
              <div 
                className="text-[56px]"
                style={{ 
                  fontFamily: 'var(--font-display)', 
                  color: 'var(--ink)',
                  lineHeight: 0.9,
                }}
              >
                <AnimatedNumber value={totalUnits} />
              </div>
              <p className="text-[13px]" style={{ color: 'var(--ink-subtle)' }}>
                Unidades totales registradas
              </p>
            </div>
          </motion.div>
        </motion.div>

        <div className="mt-[48px] pt-[24px] border-t" style={{ borderColor: 'var(--line)' }}>
          <p className="text-[11px] tabular-nums" style={{ fontFamily: 'var(--font-mono)', color: 'var(--ink-subtle)' }}>
            Última sincronización: hace 1 min
          </p>
        </div>
      </div>
    </div>
  )
}
