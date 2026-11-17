import type { Movement, Product } from '../logic/types'

export const initialProducts: Product[] = [
  { id: 1, codigo: '001', producto: 'Laptop', categoria: 'Electrónica', cantidad: 15 },
  { id: 2, codigo: '002', producto: 'Mouse', categoria: 'Accesorios', cantidad: 50 },
  { id: 3, codigo: '003', producto: 'Teclado', categoria: 'Accesorios', cantidad: 8 },
  { id: 4, codigo: '004', producto: 'Monitor', categoria: 'Electrónica', cantidad: 12 },
  { id: 5, codigo: '005', producto: 'Audífonos', categoria: 'Accesorios', cantidad: 4 },
  { id: 6, codigo: '006', producto: 'Cuaderno A4', categoria: 'Papelería', cantidad: 35 },
  { id: 7, codigo: '007', producto: 'Bolígrafos', categoria: 'Papelería', cantidad: 120 },
  { id: 8, codigo: '008', producto: 'Lámpara LED', categoria: 'Hogar', cantidad: 7 },
  { id: 9, codigo: '009', producto: 'Cargador USB-C', categoria: 'Accesorios', cantidad: 23 },
  { id: 10, codigo: '010', producto: 'Webcam HD', categoria: 'Electrónica', cantidad: 3 },
  { id: 11, codigo: '011', producto: 'Almohadilla', categoria: 'Accesorios', cantidad: 45 },
  { id: 12, codigo: '012', producto: 'Grapadora', categoria: 'Papelería', cantidad: 18 },
  { id: 13, codigo: '013', producto: 'Taza Cerámica', categoria: 'Hogar', cantidad: 26 },
  { id: 14, codigo: '014', producto: 'Disco SSD 1TB', categoria: 'Electrónica', cantidad: 6 },
  { id: 15, codigo: '015', producto: 'Cable HDMI', categoria: 'Accesorios', cantidad: 9 },
  { id: 16, codigo: '016', producto: 'Agenda 2026', categoria: 'Papelería', cantidad: 14 },
  { id: 17, codigo: '017', producto: 'Ventilador USB', categoria: 'Hogar', cantidad: 2 },
  { id: 18, codigo: '018', producto: 'Router WiFi', categoria: 'Electrónica', cantidad: 11 },
  { id: 19, codigo: '019', producto: 'Funda Laptop', categoria: 'Accesorios', cantidad: 31 },
  { id: 20, codigo: '020', producto: 'Post-it', categoria: 'Papelería', cantidad: 67 },
  { id: 21, codigo: '021', producto: 'Reloj Despertador', categoria: 'Hogar', cantidad: 8 },
  { id: 22, codigo: '022', producto: 'Micrófono USB', categoria: 'Electrónica', cantidad: 4 },
  { id: 23, codigo: '023', producto: 'Hub USB', categoria: 'Accesorios', cantidad: 16 },
  { id: 24, codigo: '024', producto: 'Lápices HB', categoria: 'Papelería', cantidad: 89 },
  { id: 25, codigo: '025', producto: 'Portavela', categoria: 'Otras', cantidad: 13 },
]

/** Fecha relativa al momento de abrir la aplicación, en minutos hacia atrás. */
const minutesAgo = (minutes: number): string =>
  new Date(Date.now() - minutes * 60_000).toISOString()

/**
 * Movimientos semilla fechados respecto a ahora para que el libro siempre
 * muestre hoy, ayer y los últimos días, sin importar cuándo se abra.
 */
export const initialMovements: Movement[] = [
  {
    id: 1,
    fecha: minutesAgo(35),
    productoId: 2,
    producto: 'Mouse',
    tipo: 'Entrada',
    cantidad: 10,
    usuario: 'admin',
  },
  {
    id: 2,
    fecha: minutesAgo(130),
    productoId: 3,
    producto: 'Teclado',
    tipo: 'Salida',
    cantidad: 2,
    usuario: 'operador',
  },
  {
    id: 3,
    fecha: minutesAgo(245),
    productoId: 1,
    producto: 'Laptop',
    tipo: 'Salida',
    cantidad: 3,
    usuario: 'admin',
  },
  {
    id: 4,
    fecha: minutesAgo(1560),
    productoId: 9,
    producto: 'Cargador USB-C',
    tipo: 'Entrada',
    cantidad: 15,
    usuario: 'admin',
  },
  {
    id: 5,
    fecha: minutesAgo(3060),
    productoId: 5,
    producto: 'Audífonos',
    tipo: 'Salida',
    cantidad: 1,
    usuario: 'operador',
  },
  {
    id: 6,
    fecha: minutesAgo(4620),
    productoId: 10,
    producto: 'Webcam HD',
    tipo: 'Entrada',
    cantidad: 5,
    usuario: 'admin',
  },
  {
    id: 7,
    fecha: minutesAgo(7320),
    productoId: 4,
    producto: 'Monitor',
    tipo: 'Salida',
    cantidad: 2,
    usuario: 'admin',
  },
]
