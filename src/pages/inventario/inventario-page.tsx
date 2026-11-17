import { useEffect, useMemo, useState, type CSSProperties, type FormEvent } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { Edit2, Plus, Search, Trash2, X } from 'lucide-react'
import { toast } from 'sonner'
import { useInventoryStore } from '../../logic/store/inventory'
import { useProducts } from '../../logic/hooks/useProducts'
import { getProductStatus } from '../../logic/store/selectors'
import { CATEGORIES, type Category, type CategoryFilter, type Product, type ProductDraft } from '../../logic/types'
import { firstError, validateProductDraft, type ProductDraftErrors } from '../../logic/services/validation'
import { formatNumber, pluralize } from '../../logic/services/formatters'
import { Button } from '../../components/ui/button'
import { EmptyState } from '../../components/ui/empty-state'
import { StatusBadge } from '../../components/ui/status-badge'
import { OpenBox } from '../../components/illustrations/open-box'
import { EASE_OUT } from '../../components/illustrations/motion'

const EMPTY_DRAFT: ProductDraft = {
  codigo: '',
  producto: '',
  categoria: 'Electrónica',
  cantidad: 0,
}

const METER_MAX = 60

export const InventarioPage = () => {
  const products = useInventoryStore((state) => state.products)
  const addProduct = useInventoryStore((state) => state.addProduct)
  const updateProduct = useInventoryStore((state) => state.updateProduct)
  const deleteProduct = useInventoryStore((state) => state.deleteProduct)

  const [search, setSearch] = useState('')
  const [category, setCategory] = useState<CategoryFilter>('Todas')
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [editing, setEditing] = useState<Product | null>(null)
  const [draft, setDraft] = useState<ProductDraft>(EMPTY_DRAFT)
  const [errors, setErrors] = useState<ProductDraftErrors>({})
  const [deleteConfirm, setDeleteConfirm] = useState<number | null>(null)

  const filtered = useProducts(search, category)

  const categoryCounts = useMemo(() => {
    const counts = new Map<Category, number>()
    for (const product of products) {
      counts.set(product.categoria, (counts.get(product.categoria) ?? 0) + 1)
    }
    return counts
  }, [products])

  useEffect(() => {
    if (!drawerOpen) return
    const handleKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setDrawerOpen(false)
    }
    document.addEventListener('keydown', handleKey)
    return () => document.removeEventListener('keydown', handleKey)
  }, [drawerOpen])

  useEffect(() => {
    if (deleteConfirm === null) return
    const timeout = window.setTimeout(() => setDeleteConfirm(null), 2600)
    return () => window.clearTimeout(timeout)
  }, [deleteConfirm])

  const openCreate = () => {
    setEditing(null)
    setDraft(EMPTY_DRAFT)
    setErrors({})
    setDrawerOpen(true)
  }

  const openEdit = (product: Product) => {
    setEditing(product)
    setDraft({
      codigo: product.codigo,
      producto: product.producto,
      categoria: product.categoria,
      cantidad: product.cantidad,
    })
    setErrors({})
    setDrawerOpen(true)
  }

  const closeDrawer = () => setDrawerOpen(false)

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const codes = products
      .filter((product) => product.id !== editing?.id)
      .map((product) => product.codigo)
    const nextErrors = validateProductDraft(draft, codes)
    setErrors(nextErrors)

    if (Object.keys(nextErrors).length > 0) {
      toast.error(firstError(nextErrors) ?? 'Revisa los datos del producto')
      return
    }

    const cleanDraft: ProductDraft = {
      codigo: draft.codigo.trim(),
      producto: draft.producto.trim(),
      categoria: draft.categoria,
      cantidad: Math.max(0, Math.trunc(draft.cantidad)),
    }

    if (editing) {
      updateProduct(editing.id, cleanDraft)
      toast.success('Producto actualizado')
    } else {
      addProduct(cleanDraft)
      toast.success('Producto agregado al catálogo')
    }
    setDrawerOpen(false)
  }

  const handleDelete = (product: Product) => {
    if (deleteConfirm === product.id) {
      deleteProduct(product.id)
      setDeleteConfirm(null)
      toast.success(`${product.producto} eliminado del catálogo`)
      return
    }
    setDeleteConfirm(product.id)
  }

  return (
    <div className="page inventory">
      <header className="page-head">
        <div>
          <div className="page-head__meta">
            <span className="page-head__index">02 / CATÁLOGO</span>
            <span className="page-head__rule" aria-hidden="true" />
            <span className="eyebrow">
              {formatNumber(products.length)} referencias · {CATEGORIES.length} categorías
            </span>
          </div>
          <h1 className="page-title">
            Inventario<em>.</em>
          </h1>
          <p className="page-head__sub">
            Catálogo curado con control preciso de existencias. Cada código conserva su
            historia y su nivel de stock.
          </p>
        </div>
      </header>

      <div className="toolbar">
        <div className="toolbar__group inventory-filters" role="group" aria-label="Filtrar por categoría">
          <button
            type="button"
            className={['chip', category === 'Todas' ? 'chip--active' : ''].filter(Boolean).join(' ')}
            onClick={() => setCategory('Todas')}
            aria-pressed={category === 'Todas'}
          >
            Todas <span className="chip__count">{products.length}</span>
          </button>
          {CATEGORIES.map((item) => (
            <button
              key={item}
              type="button"
              className={['chip', category === item ? 'chip--active' : ''].filter(Boolean).join(' ')}
              onClick={() => setCategory(item)}
              aria-pressed={category === item}
            >
              {item} <span className="chip__count">{categoryCounts.get(item) ?? 0}</span>
            </button>
          ))}
        </div>

        <div className="toolbar__group">
          <div className="search">
            <Search className="search__icon" size={15} strokeWidth={1.4} aria-hidden="true" />
            <input
              className="search__input"
              type="search"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Buscar por código, producto o categoría"
              aria-label="Buscar en el inventario"
            />
          </div>
          <Button type="button" onClick={openCreate}>
            <Plus size={14} strokeWidth={1.5} aria-hidden="true" />
            Agregar
          </Button>
        </div>
      </div>

      <p className="inventory__count" role="status">
        Mostrando {filtered.length} de {products.length}{' '}
        {pluralize(products.length, 'referencia', 'referencias')}
        {search ? ` para «${search}»` : ''}
      </p>

      <div className="panel inventory-panel">
        {filtered.length === 0 ? (
          <EmptyState
            illustration={<OpenBox />}
            title="Nada por aquí todavía."
            description="Ningún producto coincide con tu búsqueda o con la categoría seleccionada. Ajusta los filtros o agrega una referencia nueva."
          />
        ) : (
          <div className="table-wrap">
            <table className="data-table">
              <thead>
                <tr>
                  <th scope="col">Código</th>
                  <th scope="col">Producto</th>
                  <th scope="col">Categoría</th>
                  <th scope="col">Cantidad</th>
                  <th scope="col">Estado</th>
                  <th scope="col" className="is-right">
                    Acciones
                  </th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((product) => {
                  const status = getProductStatus(product.cantidad)
                  const meter = Math.min(100, (product.cantidad / METER_MAX) * 100)
                  return (
                    <tr key={product.id}>
                      <td data-label="Código">
                        <span className="cell-code">{product.codigo}</span>
                      </td>
                      <td data-label="Producto">
                        <span className="cell-product">{product.producto}</span>
                      </td>
                      <td data-label="Categoría">
                        <span className="cell-category">{product.categoria}</span>
                      </td>
                      <td data-label="Cantidad">
                        <div className="stock-meter">
                          <span className="stock-meter__value">{product.cantidad}</span>
                          <span className="stock-meter__track" aria-hidden="true">
                            <span
                              className={[
                                'stock-meter__fill',
                                status.status === 'low' ? 'stock-meter__fill--low' : '',
                                status.status === 'critical' ? 'stock-meter__fill--critical' : '',
                              ]
                                .filter(Boolean)
                                .join(' ')}
                              style={{ '--meter-size': `${meter}%` } as CSSProperties}
                            />
                          </span>
                        </div>
                      </td>
                      <td data-label="Estado">
                        <StatusBadge status={status.status} />
                      </td>
                      <td data-label="Acciones">
                        <div className="row-actions">
                          <button
                            type="button"
                            className="row-action"
                            onClick={() => openEdit(product)}
                            aria-label={`Editar ${product.producto}`}
                          >
                            <Edit2 size={14} strokeWidth={1.4} aria-hidden="true" />
                          </button>
                          <button
                            type="button"
                            className={[
                              'row-action',
                              deleteConfirm === product.id ? 'row-action--danger' : '',
                            ]
                              .filter(Boolean)
                              .join(' ')}
                            onClick={() => handleDelete(product)}
                            aria-label={
                              deleteConfirm === product.id
                                ? `Confirmar eliminación de ${product.producto}`
                                : `Eliminar ${product.producto}`
                            }
                          >
                            {deleteConfirm === product.id ? (
                              <span className="row-action__confirm">Confirmar</span>
                            ) : (
                              <Trash2 size={14} strokeWidth={1.4} aria-hidden="true" />
                            )}
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <AnimatePresence>
        {drawerOpen && (
          <>
            <motion.div
              className="drawer-overlay"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.25, ease: EASE_OUT }}
              onClick={closeDrawer}
              aria-hidden="true"
            />
            <motion.div
              className="drawer"
              role="dialog"
              aria-modal="true"
              aria-labelledby="inventory-drawer-title"
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ duration: 0.42, ease: EASE_OUT }}
            >
              <div className="drawer__head">
                <div>
                  <p className="drawer__eyebrow">{editing ? 'Modificación' : 'Alta de catálogo'}</p>
                  <h2 className="drawer__title" id="inventory-drawer-title">
                    {editing ? 'Editar producto' : 'Nuevo producto'}
                  </h2>
                </div>
                <button
                  type="button"
                  className="icon-button"
                  onClick={closeDrawer}
                  aria-label="Cerrar panel de producto"
                >
                  <X size={18} strokeWidth={1.4} aria-hidden="true" />
                </button>
              </div>

              <form className="drawer__body inventory-form" onSubmit={handleSubmit} noValidate>
                <div className="inventory-summary">
                  <span>{editing ? 'Código original' : 'Identificador'}</span>
                  <span className="inventory-summary__value">
                    {editing ? editing.codigo : 'Se asigna al guardar'}
                  </span>
                </div>

                <div className="form-field">
                  <label className="form-label" htmlFor="product-code">
                    Código
                  </label>
                  <input
                    id="product-code"
                    className="form-input form-input--mono"
                    value={draft.codigo}
                    onChange={(event) =>
                      setDraft((current) => ({ ...current, codigo: event.target.value }))
                    }
                    aria-invalid={Boolean(errors.codigo)}
                    aria-describedby={errors.codigo ? 'product-code-error' : undefined}
                    placeholder="026"
                    autoComplete="off"
                  />
                  {errors.codigo && (
                    <p className="form-error" id="product-code-error">
                      {errors.codigo}
                    </p>
                  )}
                </div>

                <div className="form-field">
                  <label className="form-label" htmlFor="product-name">
                    Producto
                  </label>
                  <input
                    id="product-name"
                    className="form-input"
                    value={draft.producto}
                    onChange={(event) =>
                      setDraft((current) => ({ ...current, producto: event.target.value }))
                    }
                    aria-invalid={Boolean(errors.producto)}
                    aria-describedby={errors.producto ? 'product-name-error' : undefined}
                    placeholder="Nombre de la referencia"
                    autoComplete="off"
                  />
                  {errors.producto && (
                    <p className="form-error" id="product-name-error">
                      {errors.producto}
                    </p>
                  )}
                </div>

                <div className="form-field">
                  <label className="form-label" htmlFor="product-category">
                    Categoría
                  </label>
                  <select
                    id="product-category"
                    className="form-select"
                    value={draft.categoria}
                    onChange={(event) =>
                      setDraft((current) => ({
                        ...current,
                        categoria: event.target.value as Category,
                      }))
                    }
                  >
                    {CATEGORIES.map((item) => (
                      <option key={item} value={item}>
                        {item}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="form-field">
                  <label className="form-label" htmlFor="product-quantity">
                    Cantidad
                  </label>
                  <input
                    id="product-quantity"
                    className="form-input form-input--mono"
                    type="number"
                    min="0"
                    step="1"
                    value={draft.cantidad}
                    onChange={(event) =>
                      setDraft((current) => ({
                        ...current,
                        cantidad: Number(event.target.value),
                      }))
                    }
                    aria-invalid={Boolean(errors.cantidad)}
                    aria-describedby={errors.cantidad ? 'product-quantity-error' : undefined}
                  />
                  {errors.cantidad && (
                    <p className="form-error" id="product-quantity-error">
                      {errors.cantidad}
                    </p>
                  )}
                  <p className="form-help">
                    Menos de 5 unidades se considera crítico; menos de 10, bajo.
                  </p>
                </div>

                <div className="form-actions">
                  <Button type="submit" size="lg">
                    {editing ? 'Guardar cambios' : 'Agregar producto'}
                  </Button>
                  <Button type="button" variant="ghost" size="lg" onClick={closeDrawer}>
                    Cancelar
                  </Button>
                </div>
              </form>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  )
}
