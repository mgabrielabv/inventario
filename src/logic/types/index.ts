/* ==========================================================================
   Modelo de datos — una sola fuente de verdad para tienda y panel.
   El stock de la tienda y el del inventario son el mismo.
   ========================================================================== */

export const UNITS = ['unidad', 'caja', 'paquete', 'kg', 'litro', 'metro'] as const
export type Unit = (typeof UNITS)[number]

export const MOVEMENT_TYPES = ['Entrada', 'Salida', 'Ajuste'] as const
export type MovementType = (typeof MOVEMENT_TYPES)[number]

export const MOTIVOS = [
  'Compra', 'Devolución de cliente', 'Inventario inicial', 'Venta',
  'Consumo interno', 'Merma o daño', 'Ajuste por conteo', 'Anulación',
] as const
export type Motivo = (typeof MOTIVOS)[number]

export const MOTIVOS_BY_TYPE: Record<MovementType, Motivo[]> = {
  Entrada: ['Compra', 'Devolución de cliente', 'Inventario inicial', 'Anulación'],
  Salida: ['Venta', 'Consumo interno', 'Merma o daño', 'Anulación'],
  Ajuste: ['Ajuste por conteo', 'Anulación'],
}

export const DEFAULT_CATEGORIES = [
  'Tecnología', 'Accesorios', 'Hogar y cocina', 'Papelería y oficina',
  'Juguetes y juegos', 'Deportes y aire libre', 'Cuidado personal',
  'Mascotas', 'Ferretería básica',
]
export const DEFAULT_LOCATIONS = [
  'A-01', 'A-02', 'A-03', 'A-04', 'A-05', 'B-01', 'B-02', 'B-03', 'C-01', 'C-02',
]
export const CATEGORIES = DEFAULT_CATEGORIES
export type Category = string
export const ALL_CATEGORIES = 'Todas' as const
export type CategoryFilter = typeof ALL_CATEGORIES | Category

export type ProductStatus = 'agotado' | 'critico' | 'bajo' | 'normal'
export type StoreStatus = 'disponible' | 'pocas' | 'agotado'
export interface StatusInfo { status: ProductStatus; label: string }

/** Forma ilustrada del producto. Un mismo arquetipo sirve a varias fichas. */
export const ARQUETIPOS = [
  'laptop', 'monitor', 'mouse', 'teclado', 'audifonos', 'cargador', 'camara',
  'pad', 'lampara', 'taza', 'ssd', 'cable', 'agenda', 'cuaderno', 'lapices',
  'ventilador', 'router', 'funda', 'notas', 'reloj', 'microfono', 'hub',
  'grapadora', 'portavelas', 'paquete',
] as const
export type Arquetipo = (typeof ARQUETIPOS)[number]

export interface Especificacion { clave: string; valor: string }

export interface Product {
  id: string
  codigo: string
  slug: string
  nombre: string
  categoria: string
  /** Facetas opcionales de la tienda departamental (migradas con valor vacío). */
  subcategoria?: string
  marca?: string
  unidad: Unit
  stock: number                 // solo cambia por movimientos
  stockMinimo: number
  stockObjetivo: number
  ubicacion: string
  costo: number | null

  /* tienda */
  publicado: boolean
  arquetipo: Arquetipo
  precio: number | null
  precioAnterior: number | null
  descripcionCorta: string
  descripcion: string
  especificaciones: Especificacion[]
  etiquetas: string[]
  destacado: boolean
  imagenes: string[]            // ids de IndexedDB

  proveedor: string
  notas: string
  archivado: boolean
  creadoEn: string
  actualizadoEn: string
}

export interface ProductDraft {
  codigo: string
  nombre: string
  categoria: string
  arquetipo?: Arquetipo
  publicado?: boolean
  destacado?: boolean
  imagenes?: string[]
  unidad: Unit
  stockInicial: number
  stockMinimo: number
  stockObjetivo: number
  ubicacion: string
  costo: number | null
  precio: number | null
  proveedor: string
  notas: string
}

export interface Movement {
  id: string
  fecha: string
  productoId: string
  productoNombre: string
  tipo: MovementType
  cantidad: number
  stockAntes: number
  stockDespues: number
  motivo: Motivo
  referencia: string
  nota: string
  usuario: string
  anulaA?: string
  anuladoPor?: string
}

export interface MovementInput {
  productoId: string
  tipo: MovementType
  cantidad: number
  motivo: Motivo
  referencia?: string
  nota?: string
}

/* --- Pedidos ------------------------------------------------------------- */
export const ORDER_STATUSES = [
  'Pendiente', 'Confirmado', 'Preparando', 'Listo', 'Entregado', 'Cancelado',
] as const
export type OrderStatus = (typeof ORDER_STATUSES)[number]
export const ACTIVE_ORDER_STATUSES: OrderStatus[] = ['Pendiente', 'Confirmado', 'Preparando', 'Listo']

export interface OrderLine {
  productoId: string
  nombre: string
  codigo: string
  precioUnit: number
  cantidad: number
}

export interface OrderCustomer {
  nombre: string
  telefono: string
  email?: string
  documento?: string
}

export interface OrderDelivery {
  tipo: 'retiro' | 'delivery'
  direccion?: string
  zona?: string
  referencia?: string
  notas?: string
}

export type PaymentMethod = 'efectivo' | 'transferencia' | 'movil' | 'tarjeta-demo'

export interface Order {
  id: string
  codigo: string
  /** Cuenta de cliente asociada, si el pedido se hizo con cuenta. */
  clienteId?: string
  fecha: string
  cliente: OrderCustomer
  entrega: OrderDelivery
  lineas: OrderLine[]
  subtotal: number
  descuento: number
  cupon?: string
  envio: number
  total: number
  moneda: string
  nota?: string
  ventana?: string
  pago: {
    metodo: PaymentMethod
    referencia?: string
    comprobante?: string
    vuelto?: number
    verificado: boolean
  }
  estado: OrderStatus
  historial: Array<{ estado: OrderStatus; fecha: string; usuario?: string; nota?: string }>
}

/* --- Carrito / favoritos ------------------------------------------------- */
export interface CartLine {
  productoId: string
  cantidad: number
  agregadoEn: string
  precioAlAgregar?: number
  guardado?: boolean
}

/* --- Configuración ------------------------------------------------------- */
export interface DeliveryZone { nombre: string; tarifa: number }

export interface Coupon {
  codigo: string
  tipo: 'porcentaje' | 'monto' | 'envio'
  valor: number
  minimo?: number
  activo: boolean
}

export interface Settings {
  tienda: { nombre: string; direccion: string; horario: string; telefono: string; whatsapp: string }
  entrega: {
    retiro: boolean
    delivery: boolean
    zonas: DeliveryZone[]
    envioGratisDesde: number | null
    ventanas: string[]
  }
  pagos: {
    efectivo: boolean
    transferencia: boolean
    datosTransferencia: string
    movil: boolean
    datosMovil: string
    tarjetaDemo: boolean
  }
  promociones: { cupones: Coupon[] }
  moneda: { codigo: string; tasaVES: number | null; fechaTasa: string | null; mostrarSecundario: boolean }
  catalogo: { categorias: string[]; unidades: Unit[]; ubicaciones: string[] }
  maxPorPedido: number
}

/* --- Personas y auditoría ------------------------------------------------ */
export type UserRole = 'Administrador' | 'Operador'
export type PermissionAction =
  | 'ver:panel' | 'ver:reportes' | 'exportar:reportes' | 'configurar'
  | 'ver:clientes' | 'gestionar:clientes'
  | 'crear:producto' | 'editar:producto' | 'editar:precio' | 'archivar:producto'
  | 'eliminar:producto' | 'registrar:movimiento' | 'anular:movimiento'
  | 'avanzar:pedido' | 'cancelar:pedido' | 'verificar:pago' | 'gestionar:usuarios'

export interface User { id: string; username: string; name: string; role: UserRole }
export interface StoredUser extends User {
  salt: string
  passwordHash: string
  active: boolean
  creadoEn: string
}

export interface ActivityEntry {
  id: string
  fecha: string
  usuario: string
  accion: string
  detalle: string
}

export interface CustomerProfile {
  nombre: string
  telefono: string
  email: string
  documento: string
}

/* --- Cuentas de cliente (separadas del personal) -------------------------- */
export interface Address {
  id: string
  alias: string
  direccion: string
  zona: string
  referencia: string
  esPrincipal: boolean
}

export interface CustomerAccount {
  id: string
  nombre: string
  apellido: string
  email: string
  telefono: string
  documento?: string
  salt: string
  passwordHash: string
  direcciones: Address[]
  creadoEn: string
  ultimoIngreso: string
  aceptaOfertas: boolean
  activo: boolean
}

/* --- Apoyo --------------------------------------------------------------- */
export interface BackupPayload {
  version: number
  exportedAt: string
  products: Product[]
  movements: Movement[]
  orders: Order[]
  settings: Settings
  users: StoredUser[]
  activity: ActivityEntry[]
  /** v3: cuentas de cliente. Los respaldos antiguos no lo traen. */
  customers?: CustomerAccount[]
}

export interface CsvRowError { row: number; message: string }
export interface CsvImportResult { rows: ProductDraft[]; errors: CsvRowError[] }

export interface InventoryStats {
  totalProducts: number
  totalUnits: number
  alertsCount: number
  criticalCount: number
  warningCount: number
  movementsLast7Days: number
  pedidosPorAtender: number
  ventasHoy: number
}

export interface AlertSummary { alerts: Product[]; critical: Product[]; warning: Product[] }
export interface MovementGroup { date: string; movements: Movement[] }
export interface CategoryShare { category: string; units: number; percentage: number }
