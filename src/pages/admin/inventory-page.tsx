import { useMemo, useState, type ChangeEvent, type FormEvent } from 'react'
import { useSearchParams } from 'react-router-dom'
import { ArrowLeft, ArrowRight, Pencil, Plus, SlidersHorizontal } from 'lucide-react'
import { Button } from '../../components/ui/Button'
import { EmptyState } from '../../components/ui/EmptyState'
import { Field, Input, Select, Textarea } from '../../components/ui/Field'
import { ResponsiveTable } from '../../components/ui/ResponsiveTable'
import { ProductArt } from '../../components/art/ProductArt'
import { Segmented } from '../../components/ui/Segmented'
import { Sheet } from '../../components/ui/Sheet'
import { StatusDot } from '../../components/ui/StatusDot'
import { Switch } from '../../components/ui/Switch'
import { useToast } from '../../components/ui/Toast'
import { useAuth } from '../../app/providers/auth-provider'
import { logActivity } from '../../logic/services/audit'
import { errorMessage } from '../../logic/errors'
import { formatNumber, normalizeText } from '../../logic/services/formatters'
import { deleteImage, isRemoteImage, saveImage } from '../../logic/services/images'
import { denyReason } from '../../logic/services/permissions'
import { formatMoney } from '../../logic/services/pricing'
import { ESCENARIO_LABELS } from '../../logic/services/stage'
import { applyMovement, getAvailable, getProductStatus, getReserved } from '../../logic/services/stock'
import {
  firstError, validateMovementQuantity, validateProductDraft, type ProductDraftErrors,
} from '../../logic/services/validation'
import { useInventoryStore } from '../../logic/store/inventory'
import { useOrdersStore } from '../../logic/store/orders'
import { useSettingsStore } from '../../logic/store/settings'
import {
  ARQUETIPOS, ESCENARIOS, MOTIVOS_BY_TYPE, UNITS, type Arquetipo, type Motivo,
  type MovementType, type Product, type ProductDraft, type ProductStatus, type Unit,
} from '../../logic/types'

type StatusFilter = 'todos' | ProductStatus

const ESTADOS: Array<{ value: StatusFilter; label: string }> = [
  { value: 'todos', label: 'Todos' },
  { value: 'normal', label: 'Normal' },
  { value: 'bajo', label: 'Bajo' },
  { value: 'critico', label: 'Crítico' },
  { value: 'agotado', label: 'Agotado' },
]

const numberValue = (value: string): number => {
  const parsed = Number(value)
  return value.trim() === '' || !Number.isFinite(parsed) ? 0 : parsed
}

const nullableValue = (value: string): number | null => {
  const parsed = Number(value)
  return value.trim() === '' || !Number.isFinite(parsed) ? null : parsed
}

export const AdminInventoryPage = () => {
  const { can, user } = useAuth()
  const { toast } = useToast()
  const [params, setParams] = useSearchParams()
  const q = params.get('q') ?? ''
  const [categoria, setCategoria] = useState('Todas')
  const [estado, setEstado] = useState<StatusFilter>('todos')
  const [incluirArchivados, setIncluirArchivados] = useState(false)
  const [sheetOpen, setSheetOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [draft, setDraft] = useState<ProductDraft | null>(null)
  const [errors, setErrors] = useState<ProductDraftErrors>({})
  const [confirmTarget, setConfirmTarget] = useState<{ id: string; kind: 'archive' | 'delete' } | null>(null)
  const [soloSinFoto, setSoloSinFoto] = useState(false)
  const [soloBajoMinimo, setSoloBajoMinimo] = useState(false)
  const [fotoActual, setFotoActual] = useState(0)
  const [fotosEliminadas, setFotosEliminadas] = useState<string[]>([])
  const [fotosNuevas, setFotosNuevas] = useState<string[]>([])
  const [movTarget, setMovTarget] = useState<Product | null>(null)
  const [movTipo, setMovTipo] = useState<MovementType>('Entrada')
  const [movMotivo, setMovMotivo] = useState<Motivo>('Compra')
  const [movCantidad, setMovCantidad] = useState('1')
  const [movReferencia, setMovReferencia] = useState('')
  const [movNota, setMovNota] = useState('')
  const [movError, setMovError] = useState('')

  const products = useInventoryStore((state) => state.products)
  const addProduct = useInventoryStore((state) => state.addProduct)
  const updateProduct = useInventoryStore((state) => state.updateProduct)
  const addMovement = useInventoryStore((state) => state.addMovement)
  const archiveProduct = useInventoryStore((state) => state.archiveProduct)
  const deleteProduct = useInventoryStore((state) => state.deleteProduct)
  const orders = useOrdersStore((state) => state.orders)
  const settings = useSettingsStore((state) => state.settings)

  const categorias = useMemo(
    () => [...new Set([...settings.catalogo.categorias, ...products.map((product) => product.categoria)])],
    [settings.catalogo.categorias, products],
  )
  const ubicaciones = useMemo(
    () => [...new Set([...settings.catalogo.ubicaciones, ...products.map((product) => product.ubicacion).filter(Boolean)])],
    [settings.catalogo.ubicaciones, products],
  )

  const rows = useMemo(() => {
    const needle = normalizeText(q.trim())
    return products
      .filter((product) => incluirArchivados || !product.archivado)
      .filter((product) => categoria === 'Todas' || product.categoria === categoria)
      .filter((product) => {
        if (estado === 'todos') return true
        return getProductStatus(product, orders).status === estado
      })
      .filter((product) => !soloSinFoto || (product.imagenes?.length ?? 0) === 0)
      .filter((product) => !soloBajoMinimo
        || (product.stockMinimo > 0 && getAvailable(product, orders) < product.stockMinimo))
      .filter((product) => {
        if (!needle) return true
        return normalizeText(`${product.nombre} ${product.codigo} ${product.ubicacion} ${product.categoria}`)
          .includes(needle)
      })
      .sort((a, b) => a.nombre.localeCompare(b.nombre, 'es'))
  }, [products, orders, q, categoria, estado, incluirArchivados, soloSinFoto, soloBajoMinimo])

  const changeQuery = (value: string) => {
    const next = new URLSearchParams(params)
    if (value.trim()) next.set('q', value.trim())
    else next.delete('q')
    setParams(next, { replace: true })
  }

  const abrirNuevo = () => {
    setEditingId(null)
    setDraft({
      codigo: '', nombre: '', categoria: settings.catalogo.categorias[0] ?? 'Otras',
      unidad: 'unidad', stockInicial: 0, stockMinimo: 0, stockObjetivo: 0,
      ubicacion: ubicaciones[0] ?? '', costo: null, precio: null, proveedor: '', notas: '',
      arquetipo: 'paquete', publicado: false, destacado: false, imagenes: [], escenario: 'natural',
    })
    setErrors({})
    setFotoActual(0)
    setFotosEliminadas([])
    setFotosNuevas([])
    setSheetOpen(true)
  }

  const abrirEdicion = (product: Product) => {
    setEditingId(product.id)
    setDraft({
      codigo: product.codigo, nombre: product.nombre, categoria: product.categoria,
      unidad: product.unidad, stockInicial: product.stock, stockMinimo: product.stockMinimo,
      stockObjetivo: product.stockObjetivo, ubicacion: product.ubicacion,
      costo: product.costo, precio: product.precio, proveedor: product.proveedor, notas: product.notas,
      arquetipo: product.arquetipo, publicado: product.publicado,
      destacado: product.destacado, imagenes: [...product.imagenes],
      escenario: product.escenario ?? 'natural',
    })
    setErrors({})
    setFotoActual(0)
    setFotosEliminadas([])
    setFotosNuevas([])
    setSheetOpen(true)
  }

  const guardar = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!draft) return
    const who = user?.name ?? 'sistema'
    const validation = validateProductDraft(
      draft,
      products.filter((product) => product.id !== editingId).map((product) => product.codigo),
    )
    if (Object.keys(validation).length > 0) {
      setErrors(validation)
      toast(firstError(validation) ?? 'Revisa los campos del producto', { tone: 'critical' })
      return
    }

    if (editingId) {
      const patch: Partial<Product> = {
        codigo: draft.codigo.trim(), nombre: draft.nombre.trim(), categoria: draft.categoria,
        unidad: draft.unidad, stockMinimo: draft.stockMinimo, stockObjetivo: draft.stockObjetivo,
        ubicacion: draft.ubicacion.trim(), costo: draft.costo,
        proveedor: draft.proveedor.trim(), notas: draft.notas.trim(),
        arquetipo: draft.arquetipo ?? 'paquete',
        publicado: draft.publicado ?? false,
        destacado: draft.destacado ?? false,
        imagenes: draft.imagenes ?? [],
        escenario: draft.escenario,
      }
      if (can('editar:precio')) patch.precio = draft.precio
      updateProduct(editingId, patch)
      const detalle = `${patch.nombre} (${patch.codigo}) · ${patch.imagenes?.length ?? 0} fotos · ${patch.escenario ?? 'natural'}`
      logActivity(who, 'Producto actualizado', detalle)
      toast('Producto actualizado')
    } else {
      addProduct(draft, who)
      logActivity(who, 'Producto creado',
        `${draft.nombre.trim()} (${draft.codigo.trim()}) · ${draft.imagenes?.length ?? 0} fotos`)
      toast('Producto creado')
    }
    if (fotosEliminadas.length > 0) {
      void Promise.all(fotosEliminadas.map((id) => deleteImage(id).catch(() => undefined)))
    }
    setFotosEliminadas([])
    setFotosNuevas([])
    setSheetOpen(false)
    setDraft(null)
  }

  const confirmar = (target: { id: string; kind: 'archive' | 'delete' }) => {
    const product = products.find((item) => item.id === target.id)
    if (!product) return
    const who = user?.name ?? 'sistema'
    if (target.kind === 'archive') {
      archiveProduct(target.id, !product.archivado)
      logActivity(who, product.archivado ? 'Producto restaurado' : 'Producto archivado', product.nombre)
      toast(product.archivado ? 'Producto restaurado' : 'Producto archivado')
    } else {
      deleteProduct(target.id)
      logActivity(who, 'Producto eliminado', `${product.nombre} (${product.codigo})`)
      toast('Producto eliminado junto con sus movimientos')
    }
    setConfirmTarget(null)
  }

  const setField = <K extends keyof ProductDraft>(key: K, value: ProductDraft[K]) => {
    setDraft((current) => (current ? { ...current, [key]: value } : current))
    setErrors((current) => ({ ...current, [key]: undefined }))
  }

  const subirFoto = async (event: ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files ?? [])
    event.target.value = ''
    if (files.length === 0 || !draft) return
    try {
      const ids: string[] = []
      for (const file of files) ids.push(await saveImage(file))
      setField('imagenes', [...(draft.imagenes ?? []), ...ids])
      setFotosNuevas((current) => [...current, ...ids])
      setFotoActual(draft.imagenes?.length ?? 0)
      toast(ids.length === 1
        ? 'Foto guardada. La primera foto es la principal.'
        : `${ids.length} fotos guardadas. La primera es la principal.`)
    } catch (cause) {
      toast(errorMessage(cause), { tone: 'critical' })
    }
  }

  const moverFoto = (index: number, delta: number) => {
    if (!draft) return
    const imagenes = [...(draft.imagenes ?? [])]
    const destino = index + delta
    if (destino < 0 || destino >= imagenes.length) return
    const actual = imagenes[index]!
    imagenes[index] = imagenes[destino]!
    imagenes[destino] = actual
    setField('imagenes', imagenes)
    setFotoActual(destino)
  }

  const quitarFoto = (index: number) => {
    if (!draft) return
    const id = draft.imagenes?.[index]
    if (!id) return
    setField('imagenes', draft.imagenes!.filter((_, i) => i !== index))
    if (!isRemoteImage(id)) setFotosEliminadas((current) => [...current, id])
    setFotoActual((current) => Math.max(0, Math.min(current, (draft.imagenes?.length ?? 1) - 2)))
  }

  const cerrarHoja = () => {
    // Las fotos recién subidas no pertenecen a ninguna ficha si se cancela.
    if (fotosNuevas.length > 0) {
      void Promise.all(fotosNuevas.map((id) => deleteImage(id).catch(() => undefined)))
    }
    setSheetOpen(false)
    setDraft(null)
    setErrors({})
    setFotoActual(0)
    setFotosEliminadas([])
    setFotosNuevas([])
  }

  const abrirMovimiento = (product: Product) => {
    setMovTarget(product)
    setMovTipo('Entrada')
    setMovMotivo(MOTIVOS_BY_TYPE.Entrada[0] ?? 'Compra')
    setMovCantidad('1')
    setMovReferencia('')
    setMovNota('')
    setMovError('')
  }

  const changeMovTipo = (next: MovementType) => {
    setMovTipo(next)
    setMovMotivo(MOTIVOS_BY_TYPE[next][0] ?? 'Compra')
    setMovError('')
  }

  const registrarMovimiento = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!movTarget) return
    const who = user?.name ?? 'sistema'
    if (!can('registrar:movimiento')) {
      setMovError(denyReason('registrar:movimiento'))
      return
    }
    const cantidad = Number(movCantidad)
    const disponible = getAvailable(movTarget, orders)
    const validation = movCantidad.trim() === ''
      ? (movTipo === 'Ajuste' ? 'Escribe el conteo real' : 'Escribe la cantidad')
      : validateMovementQuantity(movTipo, cantidad, disponible)
    if (validation) { setMovError(validation); return }
    try {
      const input = {
        productoId: movTarget.id, tipo: movTipo, cantidad, motivo: movMotivo,
        referencia: movReferencia, nota: movNota,
      }
      // addMovement vuelve a aplicar la regla antes de escribir; aquí solo se
      // calcula el resultado para el aviso y la auditoría.
      const applied = applyMovement(movTarget, input)
      addMovement({ ...input, usuario: who })
      logActivity(who, 'Movimiento registrado',
        `${movTipo} de ${formatNumber(cantidad)} en ${movTarget.nombre} · ${movMotivo} · ${applied.stockAntes} → ${applied.stockDespues}`)
      toast(`${movTipo} registrada en ${movTarget.nombre}`)
      setMovTarget(null)
    } catch (cause) {
      setMovError(errorMessage(cause))
      toast(errorMessage(cause), { tone: 'critical' })
    }
  }

  return (
    <div className="admin-page container-admin">
      <header className="admin-page-head">
        <div className="col">
          <p className="t-min t-muted">Catálogo y existencias</p>
          <h1 className="t-ui t-strong">Inventario</h1>
          <p className="t-caption">{formatNumber(products.length)} fichas en total · el stock se mueve solo con movimientos.</p>
        </div>
        <div className="admin-actions">
          {can('crear:producto') && (
            <Button size="sm" onClick={abrirNuevo}><Plus size={16} strokeWidth={1.6} />Nuevo producto</Button>
          )}
        </div>
      </header>

      <div className="admin-toolbar">
        <Field label="Buscar" className="admin-toolbar__search">
          {(id) => (
            <Input id={id} value={q} placeholder="Nombre, código o ubicación"
              onChange={(event) => changeQuery(event.target.value)} />
          )}
        </Field>
        <Field label="Categoría">
          {(id) => (
            <Select id={id} value={categoria} onChange={(event) => setCategoria(event.target.value)}>
              <option value="Todas">Todas</option>
              {categorias.map((item) => <option key={item} value={item}>{item}</option>)}
            </Select>
          )}
        </Field>
        <Field label="Incluir archivados">
          {() => <Switch checked={incluirArchivados} onChange={setIncluirArchivados} label="Incluir archivados" />}
        </Field>
        <Field label="Filtros rápidos">
          {() => (
            <div className="admin-toolbar__toggles">
              <Switch checked={soloSinFoto} onChange={setSoloSinFoto} label="Sin foto" />
              <Switch checked={soloBajoMinimo} onChange={setSoloBajoMinimo} label="Bajo mínimo" />
            </div>
          )}
        </Field>
      </div>
      <Segmented value={estado} options={ESTADOS} onChange={setEstado} label="Filtrar por estado de stock" size="sm" />

      {rows.length === 0 ? (
        <EmptyState title="Sin productos para mostrar" description="Ajusta los filtros o crea una ficha nueva."
          action={can('crear:producto') ? <Button size="sm" onClick={abrirNuevo}>Nuevo producto</Button> : undefined} />
      ) : (
        <div className="table-wrap">
          <ResponsiveTable className="admin-table">
            <thead>
              <tr>
                <th>Producto</th>
                <th>Categoría</th>
                <th>Ubicación</th>
                <th>Stock</th>
                <th>Reservado</th>
                <th>Disponible</th>
                <th>Estado</th>
                <th>Precio</th>
                <th className="admin-cell-right">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((product) => {
                const reservado = getReserved(product.id, orders)
                const disponible = getAvailable(product, orders)
                const status = getProductStatus(product, orders)
                return (
                  <tr key={product.id} className={product.archivado ? 'is-archived' : undefined}>
                    <td>
                      <div className="admin-product-cell">
                        <ProductArt product={product} size={46} view="solo" />
                        <div className="col">
                          <span className="t-mid">{product.nombre}</span>
                          <span className="product-code t-min t-muted">
                            {product.codigo}{product.archivado ? ' · archivado' : ''}
                          </span>
                        </div>
                      </div>
                    </td>
                    <td>{product.categoria}</td>
                    <td>{product.ubicacion || '—'}</td>
                    <td className="t-num">{formatNumber(product.stock)}</td>
                    <td className="t-num">{formatNumber(reservado)}</td>
                    <td className="t-num t-mid">{formatNumber(disponible)}</td>
                    <td><StatusDot status={status.status} label={status.label} compact /></td>
                    <td className="t-num">{product.precio === null ? '—' : formatMoney(product.precio)}</td>
                    <td>
                      <div className="actions">
                        {can('registrar:movimiento') && (
                          <Button size="sm" variant="secondary" disabled={product.archivado}
                            aria-label={`Registrar movimiento de ${product.nombre}`}
                            onClick={() => abrirMovimiento(product)}>
                            <SlidersHorizontal size={15} strokeWidth={1.6} />Mover
                          </Button>
                        )}
                        {can('editar:producto') && (
                          <Button size="sm" variant="secondary" aria-label={`Editar ${product.nombre}`}
                            onClick={() => abrirEdicion(product)}>
                            <Pencil size={15} strokeWidth={1.6} />Editar
                          </Button>
                        )}
                        {can('archivar:producto') && (
                          <Button size="sm" variant="tertiary"
                            onClick={() => setConfirmTarget({ id: product.id, kind: 'archive' })}>
                            {product.archivado ? 'Restaurar' : 'Archivar'}
                          </Button>
                        )}
                        {can('eliminar:producto') && (
                          <Button size="sm" variant="danger"
                            onClick={() => setConfirmTarget({ id: product.id, kind: 'delete' })}>
                            Eliminar
                          </Button>
                        )}
                      </div>
                      {confirmTarget?.id === product.id && (
                        <div className="admin-confirm">
                          <p className="t-min t-pretty">
                            {confirmTarget.kind === 'delete'
                              ? 'Se eliminará la ficha y sus movimientos. No se puede deshacer.'
                              : product.archivado
                                ? '¿Volver a activar esta ficha?'
                                : 'El producto dejará de estar disponible para movimientos.'}
                          </p>
                          <div className="row">
                            <Button size="sm" variant="danger" onClick={() => confirmar(confirmTarget)}>Confirmar</Button>
                            <Button size="sm" variant="secondary" onClick={() => setConfirmTarget(null)}>Cancelar</Button>
                          </div>
                        </div>
                      )}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </ResponsiveTable>
        </div>
      )}

      <Sheet open={sheetOpen} onClose={cerrarHoja}
        title={editingId ? 'Editar producto' : 'Nuevo producto'}>
        {draft && (
          <form className="admin-sheet-form" onSubmit={guardar} noValidate>
            <div className="admin-form-grid">
              <Field label="Código" required error={errors.codigo}>
                {(id, describedBy) => (
                  <Input id={id} aria-describedby={describedBy || undefined} value={draft.codigo}
                    onChange={(event) => setField('codigo', event.target.value)} />
                )}
              </Field>
              <Field label="Nombre" required error={errors.nombre}>
                {(id, describedBy) => (
                  <Input id={id} aria-describedby={describedBy || undefined} value={draft.nombre}
                    onChange={(event) => setField('nombre', event.target.value)} />
                )}
              </Field>
              <Field label="Categoría">
                {(id) => (
                  <Select id={id} value={draft.categoria}
                    onChange={(event) => setField('categoria', event.target.value)}>
                    {categorias.map((item) => <option key={item} value={item}>{item}</option>)}
                  </Select>
                )}
              </Field>
              <Field label="Unidad">
                {(id) => (
                  <Select id={id} value={draft.unidad}
                    onChange={(event) => setField('unidad', event.target.value as Unit)}>
                    {UNITS.map((unit) => <option key={unit} value={unit}>{unit}</option>)}
                  </Select>
                )}
              </Field>
              <Field label="Stock inicial" error={errors.stockInicial}
                hint={editingId ? 'El stock se ajusta con movimientos, no desde aquí.' : undefined}>
                {(id, describedBy) => (
                  <Input id={id} type="number" min={0} disabled={Boolean(editingId)}
                    aria-describedby={describedBy || undefined} value={draft.stockInicial}
                    onChange={(event) => setField('stockInicial', numberValue(event.target.value))} />
                )}
              </Field>
              <Field label="Ubicación">
                {(id) => (
                  <Select id={id} value={draft.ubicacion}
                    onChange={(event) => setField('ubicacion', event.target.value)}>
                    <option value="">Sin ubicación</option>
                    {ubicaciones.map((item) => <option key={item} value={item}>{item}</option>)}
                  </Select>
                )}
              </Field>
              <Field label="Stock mínimo" required error={errors.stockMinimo}>
                {(id, describedBy) => (
                  <Input id={id} type="number" min={0} aria-describedby={describedBy || undefined}
                    value={draft.stockMinimo}
                    onChange={(event) => setField('stockMinimo', numberValue(event.target.value))} />
                )}
              </Field>
              <Field label="Stock objetivo" required error={errors.stockObjetivo}>
                {(id, describedBy) => (
                  <Input id={id} type="number" min={0} aria-describedby={describedBy || undefined}
                    value={draft.stockObjetivo}
                    onChange={(event) => setField('stockObjetivo', numberValue(event.target.value))} />
                )}
              </Field>
              <Field label="Costo">
                {(id) => (
                  <Input id={id} type="number" min={0} step="0.01" value={draft.costo ?? ''}
                    onChange={(event) => setField('costo', nullableValue(event.target.value))} />
                )}
              </Field>
              <Field label="Precio de venta"
                hint={can('editar:precio') ? undefined : denyReason('editar:precio')}>
                {(id) => (
                  <Input id={id} type="number" min={0} step="0.01" value={draft.precio ?? ''}
                    disabled={!can('editar:precio')}
                    onChange={(event) => setField('precio', nullableValue(event.target.value))} />
                )}
              </Field>
              <Field label="Proveedor" className="admin-form-grid__full">
                {(id) => (
                  <Input id={id} value={draft.proveedor}
                    onChange={(event) => setField('proveedor', event.target.value)} />
                )}
              </Field>
              <Field label="Notas internas" className="admin-form-grid__full">
                {(id) => (
                  <Textarea id={id} value={draft.notas} rows={3}
                    onChange={(event) => setField('notas', event.target.value)} />
                )}
              </Field>

              <section className="admin-store-section admin-form-grid__full" aria-label="Presentación en tienda">
                <h3 className="t-ui t-strong">Tienda</h3>
                <div className="admin-store-preview">
                  <div className="admin-store-stage" data-escenario={draft.escenario ?? 'natural'}>
                    <ProductArt
                      categoria={draft.categoria}
                      arquetipo={draft.arquetipo ?? 'paquete'}
                      codigo={draft.codigo}
                      nombre={draft.nombre || 'Vista previa'}
                      imagenes={draft.imagenes ?? []}
                      size={140}
                      view="hero"
                    />
                  </div>
                  <p className="t-min t-muted">
                    Las fotos tienen prioridad sobre el arte generado. La primera foto es la principal;
                    el escenario cambia el fondo de la presentación.
                  </p>
                </div>
                <div className="admin-form-grid">
                  <Field label="Arquetipo" hint="Define la forma ilustrada del producto.">
                    {(id, describedBy) => (
                      <Select id={id} value={draft.arquetipo ?? 'paquete'}
                        aria-describedby={describedBy || undefined}
                        onChange={(event) => setField('arquetipo', event.target.value as Arquetipo)}>
                        {ARQUETIPOS.map((item) => <option key={item} value={item}>{item}</option>)}
                      </Select>
                    )}
                  </Field>
                  <Field label="Escenario" hint="Fondo de la presentación en la tienda.">
                    {(id, describedBy) => (
                      <Select id={id} value={draft.escenario ?? 'natural'}
                        aria-describedby={describedBy || undefined}
                        onChange={(event) => setField('escenario', event.target.value as ProductDraft['escenario'])}>
                        {ESCENARIOS.map((item) => <option key={item} value={item}>{ESCENARIO_LABELS[item]}</option>)}
                      </Select>
                    )}
                  </Field>
                </div>
                <Field label="Fotos del producto"
                  hint="JPG, PNG o WebP. Puedes subir varias; la primera será la principal.">
                  {(id, describedBy) => (
                    <input id={id} className="input" type="file" accept="image/*" multiple
                      aria-describedby={describedBy || undefined} onChange={(event) => void subirFoto(event)} />
                  )}
                </Field>
                {(draft.imagenes?.length ?? 0) > 0 && (
                  <div className="admin-gallery">
                    <div className="admin-gallery__preview">
                      <ProductArt
                        imagenes={[draft.imagenes![Math.min(fotoActual, draft.imagenes!.length - 1)]!]}
                        size="100%" view="hero"
                      />
                    </div>
                    <div className="admin-gallery__side">
                      <p className="t-min t-muted">Elige una foto para verla y cambiar su posición.</p>
                      <div className="admin-store-photos" role="group" aria-label="Fotos del producto">
                        {draft.imagenes!.map((imageId, index) => (
                          <button key={`${imageId}-${index}`} type="button" className={`admin-store-photo${index === fotoActual ? ' is-active' : ''}`}
                            aria-label={`Ver foto ${index + 1}${index === 0 ? ', principal' : ''}`}
                            aria-pressed={index === fotoActual} onClick={() => setFotoActual(index)}>
                            <ProductArt imagenes={[imageId]} size={64} view="solo" />
                            <span className="admin-store-photo__tag">{index === 0 ? 'Principal' : String(index + 1)}</span>
                          </button>
                        ))}
                      </div>
                      <div className="admin-gallery__actions">
                        <Button size="sm" variant="secondary" disabled={fotoActual === 0}
                          onClick={() => moverFoto(fotoActual, -1)}>
                          <ArrowLeft size={15} strokeWidth={1.6} />Antes
                        </Button>
                        <Button size="sm" variant="secondary"
                          disabled={fotoActual >= (draft.imagenes?.length ?? 0) - 1}
                          onClick={() => moverFoto(fotoActual, 1)}>
                          <ArrowRight size={15} strokeWidth={1.6} />Después
                        </Button>
                        <Button size="sm" variant="danger" onClick={() => quitarFoto(fotoActual)}>
                          Quitar foto {fotoActual + 1}
                        </Button>
                      </div>
                    </div>
                  </div>
                )}
                <div className="admin-switch-row">
                  <div className="col">
                    <span className="t-mid">Publicado en la tienda</span>
                    <span className="t-min t-muted">Aparece en el catálogo si tiene precio.</span>
                  </div>
                  <Switch checked={draft.publicado ?? false} label="Publicado en la tienda"
                    onChange={(value) => setField('publicado', value)} />
                </div>
                <div className="admin-switch-row">
                  <div className="col"><span className="t-mid">Destacado</span></div>
                  <Switch checked={draft.destacado ?? false} label="Destacado"
                    onChange={(value) => setField('destacado', value)} />
                </div>
              </section>
            </div>
            <div className="admin-sheet-actions">
              <Button type="submit" size="sm">{editingId ? 'Guardar cambios' : 'Crear producto'}</Button>
              <Button size="sm" variant="secondary" onClick={cerrarHoja}>Cancelar</Button>
            </div>
          </form>
        )}
      </Sheet>

      <Sheet open={Boolean(movTarget)} onClose={() => setMovTarget(null)}
        title={`Movimiento · ${movTarget?.nombre ?? 'producto'}`}>
        {movTarget && (
          <form className="admin-sheet-form" onSubmit={registrarMovimiento} noValidate>
            <p className="t-caption t-pretty">
              Stock {formatNumber(movTarget.stock)} · reservado {formatNumber(getReserved(movTarget.id, orders))}
              {' · '}disponible {formatNumber(getAvailable(movTarget, orders))}. El stock cambia solo con movimientos.
            </p>
            {!can('registrar:movimiento') && <p className="inline-note">{denyReason('registrar:movimiento')}</p>}
            <Segmented value={movTipo} options={[
              { value: 'Entrada', label: 'Entrada' },
              { value: 'Salida', label: 'Salida' },
              { value: 'Ajuste', label: 'Ajuste' },
            ]} onChange={changeMovTipo} label="Tipo de movimiento" size="sm" />
            <div className="admin-form-grid">
              <Field label="Motivo" required>
                {(id) => (
                  <Select id={id} value={movMotivo} onChange={(event) => setMovMotivo(event.target.value as Motivo)}>
                    {MOTIVOS_BY_TYPE[movTipo].map((item) => <option key={item} value={item}>{item}</option>)}
                  </Select>
                )}
              </Field>
              <Field label={movTipo === 'Ajuste' ? 'Conteo real' : 'Cantidad'} required
                hint={movTipo === 'Salida'
                  ? `Máximo ${formatNumber(getAvailable(movTarget, orders))} unidades`
                  : movTipo === 'Ajuste' ? 'El conteo fija el stock a esta cifra.' : undefined}>
                {(id, describedBy) => (
                  <Input id={id} type="number" step="1" aria-describedby={describedBy || undefined}
                    value={movCantidad} onChange={(event) => { setMovCantidad(event.target.value); setMovError('') }} />
                )}
              </Field>
              <Field label="Referencia">
                {(id) => (
                  <Input id={id} value={movReferencia} placeholder="Factura, pedido o albarán"
                    onChange={(event) => setMovReferencia(event.target.value)} />
                )}
              </Field>
              <Field label="Nota">
                {(id) => (
                  <Input id={id} value={movNota} placeholder="Detalle opcional"
                    onChange={(event) => setMovNota(event.target.value)} />
                )}
              </Field>
            </div>
            {movError && <p className="inline-alert" role="alert">{movError}</p>}
            <div className="admin-sheet-actions">
              <Button type="submit" size="sm" disabled={!can('registrar:movimiento')}>Guardar movimiento</Button>
              <Button size="sm" variant="secondary" onClick={() => setMovTarget(null)}>Cancelar</Button>
            </div>
          </form>
        )}
      </Sheet>
    </div>
  )
}
