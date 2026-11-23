import type { Arquetipo, Especificacion, Movement, Order, Product, Unit } from '../logic/types'

/** Un arquetipo por ficha semilla; `paquete` es el comodín para productos nuevos. */
const ARQUETIPO_POR_CODIGO: Record<string, Arquetipo> = {
  '001': 'laptop', '002': 'mouse', '003': 'teclado', '004': 'monitor', '005': 'audifonos',
  '006': 'cuaderno', '007': 'lapices', '008': 'lampara', '009': 'cargador', '010': 'camara',
  '011': 'pad', '012': 'grapadora', '013': 'taza', '014': 'ssd', '015': 'cable',
  '016': 'agenda', '017': 'ventilador', '018': 'router', '019': 'funda', '020': 'notas',
  '021': 'reloj', '022': 'microfono', '023': 'hub', '024': 'lapices', '025': 'portavelas',
}

const minutesAgo = (minutes: number): string => new Date(Date.now() - minutes * 60_000).toISOString()
const daysAgo = (days: number): string => minutesAgo(days * 1440)

interface Seed {
  codigo: string; nombre: string; categoria: string; unidad: Unit
  stock: number; minimo: number; objetivo: number; ubicacion: string
  costo: number; precio: number
  corta: string; larga: string; specs: Especificacion[]; etiquetas: string[]
  destacado?: boolean; precioAnterior?: number; publicado?: boolean; proveedor?: string
}

const specs = (...pairs: Array<[string, string]>): Especificacion[] =>
  pairs.map(([clave, valor]) => ({ clave, valor }))

const seeds: Seed[] = [
  {
    codigo: '001', nombre: 'Laptop 14"', categoria: 'Electrónica', unidad: 'unidad',
    stock: 15, minimo: 6, objetivo: 18, ubicacion: 'A-01', costo: 620, precio: 780,
    corta: 'Ligera, rápida y lista para trabajar desde el primer día.',
    larga: 'Una laptop de 14 pulgadas pensada para la jornada diaria: arranca en segundos y acompaña reuniones, documentos y diseño sin esfuerzo.\n\nSu cuerpo delgado cabe en una mochila y la batería alcanza para toda la mañana. Incluye sistema operativo listo para usar.\n\n· Pantalla de 14" con resolución nítida\n· 16 GB de memoria y 512 GB de almacenamiento\n· Conectores USB-C y HDMI\n· Hasta 9 horas de batería',
    specs: specs(['Pantalla', '14" Full HD'], ['Memoria', '16 GB RAM'], ['Almacenamiento', '512 GB SSD'], ['Batería', 'Hasta 9 h'], ['Peso', '1,4 kg'], ['Garantía', '12 meses']),
    etiquetas: ['trabajo', 'portátil', 'nuevo'], destacado: true, proveedor: 'Distribuidora Norte',
  },
  {
    codigo: '002', nombre: 'Mouse inalámbrico', categoria: 'Accesorios', unidad: 'unidad',
    stock: 50, minimo: 12, objetivo: 60, ubicacion: 'A-02', costo: 12, precio: 22,
    corta: 'Preciso, silencioso y listo en segundos. Se conecta con un receptor USB y dura meses con una sola pila.',
    larga: 'Un mouse que simplemente funciona. Lo conectas al puerto USB y empiezas a trabajar, sin configuraciones ni demoras.\n\nSus clics son silenciosos y el sensor sigue el movimiento con precisión sobre madera, tela o vidrio. La batería dura meses.\n\n· Conexión inalámbrica con receptor USB\n· Diseño ambidiestro y cómodo\n· Hasta 6 meses de batería\n· Tres botones y rueda de desplazamiento',
    specs: specs(['Conexión', 'Inalámbrica 2,4 GHz'], ['Sensor', 'Óptico 1600 DPI'], ['Batería', 'Hasta 6 meses'], ['Botones', '3'], ['Color', 'Arcilla']),
    etiquetas: ['oficina', 'inalámbrico', 'silencioso'], destacado: true, proveedor: 'Accesorios Sur',
  },
  {
    codigo: '003', nombre: 'Teclado mecánico compacto', categoria: 'Accesorios', unidad: 'unidad',
    stock: 8, minimo: 10, objetivo: 24, ubicacion: 'A-02', costo: 30, precio: 49,
    corta: 'Respuesta firme y tamaño compacto para escribir cómodo todos los días.',
    larga: 'Un teclado de 75 % que deja espacio en el escritorio sin quitarte las teclas que usas siempre.\n\nLos interruptores tienen un recorrido corto y un sonido contenido. Se conecta por USB-C y funciona con Windows y macOS.\n\n· 84 teclas en formato compacto\n· Interruptores de respuesta lineal\n· Cable USB-C desmontable\n· Iluminación suave de una sola zona',
    specs: specs(['Formato', '75 % (84 teclas)'], ['Conexión', 'USB-C'], ['Interruptores', 'Lineales'], ['Retroiluminación', 'Blanca'], ['Compatibilidad', 'Windows y macOS']),
    etiquetas: ['mecánico', 'trabajo'], precioAnterior: 59, proveedor: 'Accesorios Sur',
  },
  {
    codigo: '004', nombre: 'Monitor 24"', categoria: 'Electrónica', unidad: 'unidad',
    stock: 12, minimo: 6, objetivo: 16, ubicacion: 'A-03', costo: 210, precio: 290,
    corta: 'Una imagen amplia y nítida para trabajar con varias ventanas a la vez.',
    larga: 'Pantalla de 24 pulgadas con marcos finos que aprovecha cada centímetro del escritorio.\n\nLa resolución Full HD mantiene el texto legible y los colores consistentes. Incluye soporte ajustable en altura.\n\n· Panel IPS de 24" Full HD\n· Conectores HDMI y DisplayPort\n· Soporte con ajuste de altura\n· Modo de bajo consumo',
    specs: specs(['Tamaño', '24"'], ['Resolución', '1920 × 1080'], ['Panel', 'IPS'], ['Conectores', 'HDMI, DisplayPort'], ['Ajuste', 'Altura e inclinación']),
    etiquetas: ['pantalla', 'oficina'], destacado: true, proveedor: 'Distribuidora Norte',
  },
  {
    codigo: '005', nombre: 'Audífonos con micrófono', categoria: 'Accesorios', unidad: 'unidad',
    stock: 0, minimo: 10, objetivo: 20, ubicacion: 'A-03', costo: 52, precio: 85,
    corta: 'Sonido claro para llamadas y música, con una diadema cómoda.',
    larga: 'Audífonos sobre la oreja que aíslan el ruido de la oficina y mantienen la voz clara en llamadas.\n\nLa espuma de las almohadillas es suave y el micrófono se puede plegar cuando no lo usas.\n\n· Sonido estéreo de 40 mm\n· Micrófono plegable con cancelación de ruido\n· Conexión por cable de 3,5 mm\n· Almohadillas reemplazables',
    specs: specs(['Tipo', 'Sobre la oreja'], ['Controlador', '40 mm'], ['Micrófono', 'Plegable'], ['Conexión', 'Jack 3,5 mm'], ['Color', 'Burdeos']),
    etiquetas: ['audio', 'llamadas'], proveedor: 'Accesorios Sur',
  },
  {
    codigo: '006', nombre: 'Cuaderno A4', categoria: 'Papelería', unidad: 'unidad',
    stock: 35, minimo: 10, objetivo: 48, ubicacion: 'A-04', costo: 3.5, precio: 7,
    corta: 'Cien hojas de papel liso con encuadernación que se abre plano.',
    larga: 'Un cuaderno de uso diario con hojas de gramaje medio: se escribe bien con bolígrafo y no traspasa tinta.\n\nLa encuadernación en espiral permite abrirlo por completo y doblarlo hacia atrás.\n\n· 100 hojas (200 páginas)\n· Papel de 90 g/m²\n· Formato A4\n· Encuadernación en espiral',
    specs: specs(['Formato', 'A4'], ['Hojas', '100'], ['Gramaje', '90 g/m²'], ['Encuadernación', 'Espiral']),
    etiquetas: ['papel', 'estudio'], proveedor: 'Papelería Central',
  },
  {
    codigo: '007', nombre: 'Bolígrafos de tinta negra', categoria: 'Papelería', unidad: 'unidad',
    stock: 120, minimo: 24, objetivo: 150, ubicacion: 'A-04', costo: 0.9, precio: 1.8,
    corta: 'Trazo firme y secado rápido. Un paquete para el escritorio y la mochila.',
    larga: 'Bolígrafos de punta media con tinta negra de secado rápido. Escriben suave desde el primer trazo.\n\nSe entregan en paquete de diez unidades para reponer el escritorio sin preocupaciones.\n\n· Punta media de 0,7 mm\n· Tinta negra de secado rápido\n· Paquete de 10 unidades\n· Cuerpo con agarre de goma',
    specs: specs(['Punta', '0,7 mm'], ['Color', 'Negro'], ['Contenido', '10 unidades'], ['Agarre', 'Goma']),
    etiquetas: ['escritura', 'paquete'], proveedor: 'Papelería Central',
  },
  {
    codigo: '008', nombre: 'Lámpara LED de escritorio', categoria: 'Hogar', unidad: 'unidad',
    stock: 7, minimo: 8, objetivo: 18, ubicacion: 'A-05', costo: 22, precio: 39,
    corta: 'Luz cálida y ajustable que no cansa la vista durante la jornada.',
    larga: 'Lámpara de brazo flexible con tres niveles de brillo y temperatura cálida. El cabezal se orienta hacia donde lo necesitas.\n\nLa base es estable y ocupa poco espacio. Se alimenta por USB-C.\n\n· Tres niveles de brillo\n· Luz cálida de 3000 K\n· Brazo articulado\n· Alimentación USB-C',
    specs: specs(['Brillo', '3 niveles'], ['Temperatura', '3000 K'], ['Alimentación', 'USB-C'], ['Altura', '45 cm']),
    etiquetas: ['luz', 'escritorio'], proveedor: 'Hogar Express',
  },
  {
    codigo: '009', nombre: 'Cargador USB-C 65 W', categoria: 'Accesorios', unidad: 'unidad',
    stock: 23, minimo: 8, objetivo: 30, ubicacion: 'B-01', costo: 18, precio: 35,
    corta: 'Carga laptops y teléfonos con un solo adaptador compacto.',
    larga: 'Adaptador de 65 vatios con un puerto USB-C que negocia la potencia según el dispositivo.\n\nEs pequeño y ligero, ideal para llevar en la mochila junto a la laptop.\n\n· Salida USB-C de 65 W\n· Protección contra sobrecarga\n· Diseño compacto y plegable\n· Compatible con laptops y teléfonos',
    specs: specs(['Potencia', '65 W'], ['Puerto', 'USB-C'], ['Entrada', '100–240 V'], ['Protecciones', 'Sobrecarga y corte']),
    etiquetas: ['carga', 'viaje'], destacado: true, proveedor: 'Accesorios Sur',
  },
  {
    codigo: '010', nombre: 'Cámara web HD', categoria: 'Electrónica', unidad: 'unidad',
    stock: 3, minimo: 6, objetivo: 14, ubicacion: 'B-01', costo: 65, precio: 110,
    corta: 'Imagen nítida para reuniones, con micrófono integrado.',
    larga: 'Cámara de 1080 p con enfoque automático y corrección de luz para verse bien incluso con poca iluminación.\n\nSe coloca sobre el monitor con un soporte que se ajusta al ángulo deseado.\n\n· Resolución 1080 p a 30 fps\n· Micrófono con cancelación de ruido\n· Tapa de privacidad incluida\n· Conexión USB-A',
    specs: specs(['Resolución', '1080 p / 30 fps'], ['Micrófono', 'Integrado'], ['Conexión', 'USB-A'], ['Privacidad', 'Tapa manual']),
    etiquetas: ['video', 'reuniones'], proveedor: 'Distribuidora Norte',
  },
  {
    codigo: '011', nombre: 'Almohadilla para mouse', categoria: 'Accesorios', unidad: 'unidad',
    stock: 45, minimo: 10, objetivo: 60, ubicacion: 'B-02', costo: 8, precio: 16,
    corta: 'Superficie lisa y base antideslizante para un movimiento constante.',
    larga: 'Almohadilla de tela con Costuras reforzadas y base de goma que no se mueve sobre el escritorio.\n\nTamaño mediano, suficiente para un mouse y un teclado compacto.\n\n· Superficie de tela de trazo suave\n· Base antideslizante\n· 35 × 25 cm\n· Costuras reforzadas',
    specs: specs(['Medidas', '35 × 25 cm'], ['Material', 'Tela y goma'], ['Grosor', '3 mm'], ['Color', 'Arcilla']),
    etiquetas: ['escritorio', 'mouse'], proveedor: 'Accesorios Sur',
  },
  {
    codigo: '012', nombre: 'Grapadora', categoria: 'Papelería', unidad: 'unidad',
    stock: 18, minimo: 6, objetivo: 24, ubicacion: 'B-02', costo: 15, precio: 27,
    corta: 'Grapa hasta 20 hojas con un solo movimiento y sin esfuerzo.',
    larga: 'Grapadora metálica de uso frecuente con bandeja para 100 grapas. El mecanismo requiere poca fuerza.\n\nIncluye grapas de repuesto y extractedor para corregir sin dañar el papel.\n\n· Capacidad de 20 hojas\n· Bandeja para 100 grapas\n· Extractador integrado\n· Base antideslizante',
    specs: specs(['Capacidad', '20 hojas'], ['Grapas', 'N.º 24/6'], ['Material', 'Metal'], ['Extra', 'Extractador']),
    etiquetas: ['oficina', 'papel'], proveedor: 'Papelería Central',
  },
  {
    codigo: '013', nombre: 'Taza de cerámica', categoria: 'Hogar', unidad: 'unidad',
    stock: 26, minimo: 10, objetivo: 36, ubicacion: 'B-03', costo: 5.5, precio: 12,
    corta: 'Capacidad de 350 ml, apta para microondas y lavavajillas.',
    larga: 'Taza de cerámica de acabado mate con un mango cómodo y equilibrado.\n\nSu capacidad es ideal para café o té durante la mañana. El esmalte resiste el uso diario.\n\n· Capacidad 350 ml\n· Cerámica de acabado mate\n· Apta para microondas\n· Apta para lavavajillas',
    specs: specs(['Capacidad', '350 ml'], ['Material', 'Cerámica'], ['Acabado', 'Mate'], ['Cuidado', 'Microondas y lavavajillas']),
    etiquetas: ['cocina', 'cerámica'], proveedor: 'Hogar Express',
  },
  {
    codigo: '014', nombre: 'Disco SSD 1 TB', categoria: 'Electrónica', unidad: 'unidad',
    stock: 6, minimo: 4, objetivo: 12, ubicacion: 'B-03', costo: 95, precio: 160,
    corta: 'Almacenamiento rápido para dar nueva vida a cualquier laptop.',
    larga: 'Unidad de estado sólido de 1 TB en formato SATA de 2,5 pulgadas. Las lecturas y escrituras son significativamente más rápidas que un disco mecánico.\n\nIncluye adaptador para instalar en una unidad de 3,5 pulgadas.\n\n· Capacidad 1 TB\n· Interfaz SATA III\n· Formato 2,5"\n· Incluye adaptador y tornillos',
    specs: specs(['Capacidad', '1 TB'], ['Interfaz', 'SATA III'], ['Formato', '2,5"'], ['Lectura', 'Hasta 550 MB/s'], ['Garantía', '24 meses']),
    etiquetas: ['almacenamiento', 'upgrade'], destacado: true, proveedor: 'Distribuidora Norte',
  },
  {
    codigo: '015', nombre: 'Cable HDMI 2 m', categoria: 'Accesorios', unidad: 'unidad',
    stock: 9, minimo: 6, objetivo: 20, ubicacion: 'A-01', costo: 9, precio: 19,
    corta: 'Conecta tu laptop al monitor o al televisor sin perder señal.',
    larga: 'Cable HDMI de dos metros con conectores reforzados y blindaje para evitar interferencias.\n\nSoporta resoluciones hasta 4K a 30 Hz, suficiente para presentaciones y video.\n\n· Longitud 2 metros\n· Soporte 4K a 30 Hz\n· Conectores dorados\n· Blindaje contra interferencias',
    specs: specs(['Longitud', '2 m'], ['Versión', 'HDMI 2.0'], ['Resolución', 'Hasta 4K/30 Hz'], ['Conectores', 'Tipo A']),
    etiquetas: ['cable', 'video'], proveedor: 'Accesorios Sur',
  },
  {
    codigo: '016', nombre: 'Agenda 2026', categoria: 'Papelería', unidad: 'unidad',
    stock: 14, minimo: 6, objetivo: 20, ubicacion: 'A-04', costo: 8, precio: 17,
    corta: 'Una semana por página, con espacio para notas y tareas.',
    larga: 'Agenda de año completo con encuadernación cosida que se abre plana sobre el escritorio.\n\nCada semana tiene su propia página y un recuadro de tareas. Incluye calendario y páginas de notas.\n\n· Enero a diciembre 2026\n· Una semana por página\n· Encuadernación cosida\n· Marcador de página',
    specs: specs(['Año', '2026'], ['Formato', 'A5'], ['Encuadernación', 'Cosida'], ['Hojas', '192']),
    etiquetas: ['planificación', 'nuevo'], proveedor: 'Papelería Central',
  },
  {
    codigo: '017', nombre: 'Ventilador USB', categoria: 'Hogar', unidad: 'unidad',
    stock: 2, minimo: 4, objetivo: 12, ubicacion: 'C-01', costo: 25, precio: 45,
    corta: 'Silencioso y alimentado por USB, ideal para el escritorio.',
    larga: 'Ventilador compacto de tres aspas que se conecta a cualquier puerto USB o cargador de teléfono.\n\nEl brazo se inclina para dirigir el aire y el funcionamiento es silencioso.\n\n· Diámetro de 15 cm\n· Dos niveles de velocidad\n· Alimentación USB\n· Brazo inclinable',
    specs: specs(['Diámetro', '15 cm'], ['Velocidades', '2'], ['Alimentación', 'USB 5 V'], ['Ruido', 'Bajo']),
    etiquetas: ['clima', 'escritorio'], proveedor: 'Hogar Express',
  },
  {
    codigo: '018', nombre: 'Router Wi-Fi', categoria: 'Electrónica', unidad: 'unidad',
    stock: 11, minimo: 6, objetivo: 16, ubicacion: 'C-01', costo: 85, precio: 145,
    corta: 'Conexión estable para toda la casa, con configuración guiada.',
    larga: 'Router de doble banda con cuatro puertos Ethernet y antenas externas. La configuración se hace desde el teléfono en pocos pasos.\n\nIncluye control parental y red de invitados.\n\n· Doble banda 2,4 y 5 GHz\n· Cuatro puertos Ethernet\n· Red de invitados\n· Control parental',
    specs: specs(['Bandas', '2,4 y 5 GHz'], ['Velocidad', 'Hasta 1200 Mbps'], ['Puertos', '4 LAN + 1 WAN'], ['Antenas', '4 externas']),
    etiquetas: ['red', 'hogar'], proveedor: 'Distribuidora Norte',
  },
  {
    codigo: '019', nombre: 'Funda para laptop', categoria: 'Accesorios', unidad: 'unidad',
    stock: 31, minimo: 10, objetivo: 40, ubicacion: 'C-02', costo: 14, precio: 29,
    corta: 'Protección acolchada para una laptop de 14 a 15 pulgadas.',
    larga: 'Funda de tela con interior acolchado y un bolsillo frontal para el cargador y el mouse.\n\nEl cierre se desliza suavemente y el asa permite llevarla cómodamente.\n\n· Ajuste para 14"–15"\n· Interior acolchado\n· Bolsillo frontal\n· Asa reforzada',
    specs: specs(['Tamaño', '14"–15"'], ['Material', 'Poliéster'], ['Bolsillos', '1 frontal'], ['Color', 'Tan']),
    etiquetas: ['protección', 'viaje'], precioAnterior: 35, proveedor: 'Accesorios Sur',
  },
  {
    codigo: '020', nombre: 'Notas adhesivas', categoria: 'Papelería', unidad: 'paquete',
    stock: 67, minimo: 20, objetivo: 90, ubicacion: 'A-05', costo: 4.2, precio: 8.9,
    corta: 'Cinco block de notas para dejar recordatorios donde los ves.',
    larga: 'Paquete con cinco block de notas adhesivas en tonos cálidos. Cada hoja se pega y se retira sin dejar residuos.\n\nIdeales para la nevera, el monitor o el escritorio.\n\n· Cinco block de 75 × 75 mm\n· 100 hojas por block\n· Colores cálidos\n· Adhesivo reposicionable',
    specs: specs(['Contenido', '5 block'], ['Medidas', '75 × 75 mm'], ['Hojas', '100 por block'], ['Colores', 'Tonos cálidos']),
    etiquetas: ['recordatorios', 'paquete'], proveedor: 'Papelería Central',
  },
  {
    codigo: '021', nombre: 'Reloj despertador', categoria: 'Hogar', unidad: 'unidad',
    stock: 8, minimo: 4, objetivo: 12, ubicacion: 'C-02', costo: 26, precio: 49,
    corta: 'Pantalla legible y alarma suave para empezar el día sin sobresaltos.',
    larga: 'Reloj digital con pantalla grande y brillo ajustable. La alarma aumenta de volumen gradualmente.\n\nTiene función de repetición y se alimenta por cable USB.\n\n· Pantalla de 1,2"\n· Volumen de alarma progresivo\n· Función snooze\n· Alimentación USB',
    specs: specs(['Pantalla', 'LED 1,2"'], ['Alarma', 'Progresiva'], ['Snooze', 'Sí'], ['Alimentación', 'USB']),
    etiquetas: ['dormitorio', 'tiempo'], proveedor: 'Hogar Express',
  },
  {
    codigo: '022', nombre: 'Micrófono USB', categoria: 'Electrónica', unidad: 'unidad',
    stock: 4, minimo: 6, objetivo: 12, ubicacion: 'C-02', costo: 52, precio: 95,
    corta: 'Voz clara para grabaciones y llamadas, sin instalar controladores.',
    larga: 'Micrófono de condensador que se conecta por USB y funciona de inmediato en Windows y macOS.\n\nEl patrón cardioide captura la voz frente al equipo y reduce el ruido alrededor.\n\n· Patrón cardioide\n· Resolución 16 bits / 48 kHz\n· Conexión USB-C\n· Incluye soporte de escritorio',
    specs: specs(['Tipo', 'Condensador'], ['Patrón', 'Cardioide'], ['Resolución', '16 bit / 48 kHz'], ['Conexión', 'USB-C']),
    etiquetas: ['audio', 'grabación'], proveedor: 'Distribuidora Norte',
  },
  {
    codigo: '023', nombre: 'Hub USB de 7 puertos', categoria: 'Accesorios', unidad: 'unidad',
    stock: 16, minimo: 8, objetivo: 24, ubicacion: 'B-02', costo: 21, precio: 39,
    corta: 'Más puertos para conectar todo sin cambiar de adaptador.',
    larga: 'Concentrador con siete puertos USB-A y un cable corto que mantiene el escritorio ordenado.\n\nFunciona con laptops, monitores y televisores, sin alimentación externa para dispositivos de bajo consumo.\n\n· Siete puertos USB-A\n· Cable integrado de 60 cm\n· Interruptor individual\n· Diseño compacto',
    specs: specs(['Puertos', '7 USB-A'], ['Versión', 'USB 2.0'], ['Cable', '60 cm'], ['Alimentación', 'Bus USB']),
    etiquetas: ['conectividad', 'escritorio'], proveedor: 'Accesorios Sur',
  },
  {
    codigo: '024', nombre: 'Lápices HB x 12', categoria: 'Papelería', unidad: 'caja',
    stock: 89, minimo: 24, objetivo: 120, ubicacion: 'A-04', costo: 6.5, precio: 13,
    corta: 'Caja de doce lápices de grafito medio para escribir y dibujar.',
    larga: 'Lápices de madera con mina HB de dureza media, fáciles de afilar y de trazo limpio.\n\nLa caja trae doce unidades con relieve en el cuerpo para una sujeción cómoda.\n\n· Dureza HB\n· Caja de 12 unidades\n· Cuerpo de madera con relieve\n· Minas de grafito medio',
    specs: specs(['Dureza', 'HB'], ['Contenido', '12 unidades'], ['Material', 'Madera'], ['Uso', 'Escribir y dibujar']),
    etiquetas: ['dibujo', 'estudio'], proveedor: 'Papelería Central',
  },
  {
    codigo: '025', nombre: 'Portavelas de cerámica', categoria: 'Otras', unidad: 'unidad',
    stock: 13, minimo: 4, objetivo: 18, ubicacion: 'C-01', costo: 12, precio: 25,
    corta: 'Un objeto sencillo que da luz cálida a cualquier rincón.',
    larga: 'Portavelas de cerámica con acabado texturizado y base ancha que evita vuelcos.\n\nSe limpia con un paño seco y combina con velas de té o velas pequeñas.\n\n· Cerámica con acabado mate\n· Base ancha y estable\n· Para velas de té\n· Color arcilla',
    specs: specs(['Material', 'Cerámica'], ['Acabado', 'Mate'], ['Tipo de vela', 'Vela de té'], ['Color', 'Arcilla']),
    etiquetas: ['hogar', 'decoración'], publicado: false, proveedor: 'Hogar Express',
  },
]

export const initialProducts: Product[] = seeds.map((seed, index) => ({
  id: `p${seed.codigo}`,
  codigo: seed.codigo,
  slug: `${seed.codigo}-${seed.nombre.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')}`,
  nombre: seed.nombre,
  categoria: seed.categoria,
  unidad: seed.unidad,
  stock: seed.stock,
  stockMinimo: seed.minimo,
  stockObjetivo: seed.objetivo,
  ubicacion: seed.ubicacion,
  costo: seed.costo,
  publicado: seed.publicado ?? true,
  arquetipo: ARQUETIPO_POR_CODIGO[seed.codigo] ?? 'paquete',
  precio: seed.precio,
  precioAnterior: seed.precioAnterior ?? null,
  descripcionCorta: seed.corta,
  descripcion: seed.larga,
  especificaciones: seed.specs,
  etiquetas: seed.etiquetas,
  destacado: seed.destacado ?? false,
  imagenes: [],
  proveedor: seed.proveedor ?? 'Proveedor local',
  notas: '',
  archivado: false,
  creadoEn: daysAgo(60 - index),
  actualizadoEn: minutesAgo(60 * 12 + index * 37),
}))

/* --- Movimientos semilla (fechas relativas a hoy) ----------------------- */
interface MovementSeed {
  id: string; dias: number; productoId: string; tipo: Movement['tipo']; cantidad: number
  motivo: Movement['motivo']; usuario: string; referencia?: string; nota?: string
}

const movementSeeds: MovementSeed[] = [
  { id: 'm001', dias: 0, productoId: 'p002', tipo: 'Entrada', cantidad: 10, motivo: 'Compra', usuario: 'admin', referencia: 'OC-2048', nota: 'Reposición de mouse' },
  { id: 'm002', dias: 0, productoId: 'p003', tipo: 'Salida', cantidad: 2, motivo: 'Venta', usuario: 'operador', referencia: 'INV-2026-000004' },
  { id: 'm003', dias: 1, productoId: 'p001', tipo: 'Salida', cantidad: 3, motivo: 'Venta', usuario: 'admin', referencia: 'FAC-119' },
  { id: 'm004', dias: 1, productoId: 'p009', tipo: 'Entrada', cantidad: 15, motivo: 'Compra', usuario: 'admin', referencia: 'OC-2041' },
  { id: 'm005', dias: 2, productoId: 'p005', tipo: 'Salida', cantidad: 1, motivo: 'Consumo interno', usuario: 'operador', nota: 'Audífonos para recepción' },
  { id: 'm006', dias: 2, productoId: 'p010', tipo: 'Entrada', cantidad: 5, motivo: 'Compra', usuario: 'admin', referencia: 'OC-2036' },
  { id: 'm007', dias: 3, productoId: 'p004', tipo: 'Salida', cantidad: 2, motivo: 'Venta', usuario: 'admin', referencia: 'FAC-112' },
  { id: 'm008', dias: 3, productoId: 'p006', tipo: 'Entrada', cantidad: 20, motivo: 'Compra', usuario: 'operador', referencia: 'OC-2031' },
  { id: 'm009', dias: 4, productoId: 'p014', tipo: 'Salida', cantidad: 1, motivo: 'Venta', usuario: 'admin', referencia: 'INV-2026-000003' },
  { id: 'm010', dias: 4, productoId: 'p020', tipo: 'Entrada', cantidad: 30, motivo: 'Compra', usuario: 'operador', referencia: 'OC-2029' },
  { id: 'm011', dias: 5, productoId: 'p008', tipo: 'Salida', cantidad: 2, motivo: 'Merma o daño', usuario: 'admin', nota: 'Unidades con fallo eléctrico' },
  { id: 'm012', dias: 5, productoId: 'p013', tipo: 'Entrada', cantidad: 12, motivo: 'Devolución de cliente', usuario: 'operador', referencia: 'NC-018' },
  { id: 'm013', dias: 6, productoId: 'p017', tipo: 'Salida', cantidad: 1, motivo: 'Venta', usuario: 'admin' },
  { id: 'm014', dias: 6, productoId: 'p023', tipo: 'Entrada', cantidad: 8, motivo: 'Compra', usuario: 'operador', referencia: 'OC-2020' },
  { id: 'm015', dias: 7, productoId: 'p012', tipo: 'Ajuste', cantidad: 17, motivo: 'Ajuste por conteo', usuario: 'admin', nota: 'Conteo físico semanal' },
  { id: 'm016', dias: 7, productoId: 'p019', tipo: 'Salida', cantidad: 4, motivo: 'Venta', usuario: 'operador' },
  { id: 'm017', dias: 8, productoId: 'p016', tipo: 'Entrada', cantidad: 10, motivo: 'Compra', usuario: 'admin', referencia: 'OC-2018' },
  { id: 'm018', dias: 9, productoId: 'p022', tipo: 'Salida', cantidad: 2, motivo: 'Consumo interno', usuario: 'operador', nota: 'Equipo de grabación' },
  { id: 'm019', dias: 10, productoId: 'p024', tipo: 'Entrada', cantidad: 24, motivo: 'Compra', usuario: 'admin', referencia: 'OC-2012' },
  { id: 'm020', dias: 10, productoId: 'p015', tipo: 'Salida', cantidad: 6, motivo: 'Venta', usuario: 'operador' },
  { id: 'm021', dias: 11, productoId: 'p007', tipo: 'Entrada', cantidad: 50, motivo: 'Compra', usuario: 'admin', referencia: 'OC-2009' },
  { id: 'm022', dias: 12, productoId: 'p021', tipo: 'Salida', cantidad: 1, motivo: 'Merma o daño', usuario: 'operador', nota: 'Daño en transporte' },
  { id: 'm023', dias: 12, productoId: 'p018', tipo: 'Entrada', cantidad: 6, motivo: 'Compra', usuario: 'admin', referencia: 'OC-2004' },
  { id: 'm024', dias: 13, productoId: 'p011', tipo: 'Salida', cantidad: 3, motivo: 'Venta', usuario: 'operador' },
  { id: 'm025', dias: 14, productoId: 'p025', tipo: 'Entrada', cantidad: 13, motivo: 'Inventario inicial', usuario: 'admin' },
]

const saldos = new Map(initialProducts.map((p) => [p.id, p.stock]))
export const initialMovements: Movement[] = movementSeeds.map((seed) => {
  const product = initialProducts.find((p) => p.id === seed.productoId)
  const stockDespues = saldos.get(seed.productoId) ?? 0
  const delta = seed.tipo === 'Entrada' ? seed.cantidad : seed.tipo === 'Salida' ? -seed.cantidad : 0
  const stockAntes = Math.max(0, stockDespues - (seed.tipo === 'Ajuste' ? 0 : delta))
  if (seed.tipo === 'Ajuste') saldos.set(seed.productoId, seed.cantidad)
  else saldos.set(seed.productoId, stockAntes)
  return {
    id: seed.id, fecha: daysAgo(seed.dias), productoId: seed.productoId,
    productoNombre: product?.nombre ?? '', tipo: seed.tipo, cantidad: seed.cantidad,
    stockAntes, stockDespues, motivo: seed.motivo,
    referencia: seed.referencia ?? '', nota: seed.nota ?? '', usuario: seed.usuario,
  }
})

/* --- Pedidos semilla en distintos estados ------------------------------- */
const sampleOrder = (
  n: number, estado: Order['estado'], dias: number, productoIds: string[], cantidades: number[],
  nombre: string, telefono: string, entrega: Order['entrega'], metodo: Order['pago']['metodo'],
): Order => {
  const lineas = productoIds.map((id, i) => {
    const product = initialProducts.find((p) => p.id === id)!
    return {
      productoId: product.id, nombre: product.nombre, codigo: product.codigo,
      precioUnit: product.precio ?? 0, cantidad: cantidades[i] ?? 1,
    }
  })
  const subtotal = lineas.reduce((sum, l) => sum + l.precioUnit * l.cantidad, 0)
  const envio = entrega.tipo === 'delivery' ? 5 : 0
  const fecha = daysAgo(dias)
  const historial: Order['historial'] = [
    { estado: 'Pendiente', fecha, usuario: 'sistema' },
    ...(estado === 'Pendiente' ? [] : [{ estado: 'Confirmado' as const, fecha: minutesAgo(dias * 1440 - 60), usuario: 'admin' }]),
    ...(['Preparando', 'Listo', 'Entregado'].includes(estado)
      ? [{ estado: 'Preparando' as const, fecha: minutesAgo(Math.max(0, dias * 1440 - 120)), usuario: 'operador' }] : []),
    ...(estado === 'Entregado' ? [{ estado: 'Entregado' as const, fecha: minutesAgo(Math.max(0, dias * 1440 - 240)), usuario: 'operador' }] : []),
    ...(estado === 'Cancelado' ? [{ estado: 'Cancelado' as const, fecha: minutesAgo(Math.max(0, dias * 1440 - 90)), usuario: 'admin', nota: 'Cancelado por el cliente' }] : []),
  ]
  return {
    id: `o-seed-${n}`, codigo: `INV-2026-${String(n).padStart(6, '0')}`, fecha,
    cliente: { nombre, telefono, email: 'cliente@example.com' }, entrega, lineas,
    subtotal, descuento: 0, envio, total: subtotal + envio, moneda: 'USD',
    pago: { metodo, verificado: metodo !== 'efectivo' },
    estado, historial,
  }
}

export const initialOrders: Order[] = [
  sampleOrder(1, 'Pendiente', 0, ['p002', 'p009'], [1, 1], 'María Rodríguez', '0424-1112233', { tipo: 'delivery', direccion: 'Calle 10, Caracas', zona: 'Caracas' }, 'transferencia'),
  sampleOrder(2, 'Confirmado', 0, ['p001'], [1], 'Carlos Pérez', '0412-2223344', { tipo: 'retiro' }, 'efectivo'),
  sampleOrder(3, 'Preparando', 1, ['p004', 'p015'], [1, 2], 'Ana González', '0426-3334455', { tipo: 'delivery', direccion: 'Los Teques', zona: 'Miranda' }, 'tarjeta-demo'),
  sampleOrder(4, 'Listo', 2, ['p006', 'p007'], [2, 3], 'Luis Martínez', '0414-4445566', { tipo: 'retiro' }, 'efectivo'),
  sampleOrder(5, 'Entregado', 5, ['p014'], [1], 'Sofía Hernández', '0424-5556677', { tipo: 'delivery', direccion: 'Caracas', zona: 'Caracas' }, 'transferencia'),
  sampleOrder(6, 'Cancelado', 7, ['p018'], [1], 'Pedro Jiménez', '0416-6667788', { tipo: 'retiro' }, 'efectivo'),
]
