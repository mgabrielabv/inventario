# INVENTARIO — Control de bodega

Aplicación de inventario con lenguaje de **rotulado de bodega**: etiquetas de envío, sellos de goma, papel kraft, renglones punteados y cifras de señalética industrial. La interfaz es corta y operativa: qué hay, qué falta y qué se movió.

## Stack

- **React 19** + **TypeScript estricto** + **Vite 8**
- **Framer Motion** — transiciones, máscaras de título y crossfade del slideshow
- **Zustand** — estado del inventario con persistencia en localStorage
- **React Router 7** (`createHashRouter`, compatible con `file://`)
- **Lucide React** — iconos de trazo
- **Sonner** — avisos
- **CSS propio** — sin Tailwind; variables, capas y clases semánticas
- **Exportación PDF sin dependencias** — generador propio en `src/logic/services/exportPdf.ts`

## Concepto visual

El sistema se ve y suena como una bodega real que lleva sus cuentas a mano: letras de señalética, cartón, tinta de sello y un libro de registro. Sin marcos de museo, sin pies de foto y sin códigos decorativos.

Cinco elementos se repiten en todas las pantallas:

1. **Etiqueta de envío** — silueta con esquina chaflanada y agujero perforado; se usa para estados y alertas.
2. **Sello de goma** — doble borde, giro de −6°/−3°, mezcla `multiply` y textura SVG (`feTurbulence` + `feDisplacementMap`) con animación de estampado.
3. **Renglón punteado** — línea de puntos que lleva la vista del concepto al valor.
4. **Cifra gigante** — número condensado con `tabular-nums`, contador de entrada y golpe de escala al terminar.
5. **Papel kraft** — fondo arena con ruido y borde superior rasgado hecho con `mask-image`.

## Paleta

Variables en `src/styles/tokens.css`. No se usan colores fuera de la paleta.

| Token | Claro | Oscuro |
| --- | --- | --- |
| Fondo | `#FFF4ED` crema | `#1A0807` borgoña casi negro |
| Superficie | `#FFF9F4` | `#24100E` |
| Tinta | `#2A0A08` | `#FFF4ED` |
| Acento | `#890000` burdeos | `#E3A493` arcilla |
| Papel kraft | `#D2B48C` arena | `#6B4A38` kraft oscuro |
| Línea | burdeos 16% | crema 16% |
| Crítico | `#890000` | `#DE8F82` |
| Bajo | `#B8893F` | `#D9A552` |
| Normal | `#6B7A4B` | `#9CAE79` |

Estados siempre con **icono + texto**, nunca solo color. Los gráficos llevan etiquetas directas. Todos los textos visibles cumplen **WCAG AA (4.5:1)** en claro y oscuro.

## Tipografía

- **Archivo Variable** — titulares, interfaz y etiquetas; `wght` 400–900 y `wdth` 62–100 %.
- **IBM Plex Mono** — solo valores reales: códigos, cantidades y horas.

Los titulares van en mayúsculas, `font-stretch` 62–75 %, peso 800–900 y línea ~0.88. La interfaz nunca baja de 14 px y las etiquetas de 12 px. No se usan familias de moda ni cursivas de acento.

Ambas familias están **embebidas como woff2 base64** en `src/styles/fonts.css` (subconjunto latin), de modo que el HTML final no solicita archivos externos.

## Arquitectura

```text
src/
├── app/                 # providers (auth, tema), router y ruta protegida
├── components/
│   ├── illustrations/   # SVG: caja, estantería, escáner, pallet, código
│   ├── layout/          # sidebar, header, menú móvil
│   ├── slideshow/       # HeroSlideshow + SlideFigure
│   └── ui/              # botón, etiqueta de estado, sello, cifra, título, vacíos
├── data/                # productos y diapositivas (datos puros)
├── logic/
│   ├── hooks/           # slideshow, contadores, estadísticas, exportación
│   ├── services/        # auth, almacenamiento, formato, validación, CSV, PDF
│   ├── store/           # Zustand + selectores
│   └── types/           # contratos TypeScript
├── pages/               # login, dashboard, inventario, movimientos, alertas, reportes
└── styles/              # tokens, base, componentes, layout y una hoja por página
```

La lógica de negocio vive en hooks y funciones puras. Los componentes no contienen CSS; solo usan variables CSS dinámicas cuando el valor depende del estado (`--parallax-*`, `--slide-progress`, `--meter-size`, etc.).

## Login y slideshow

El acceso abre con un **slideshow de cuatro diapositivas** (Recepción, Stock, Escáner, Movimientos) con ilustraciones SVG:

- Autoplay de ~5 s con relleno progresivo del índice de palabras (`RECEPCIÓN · STOCK · ESCÁNER · MOVIMIENTOS`).
- Numeral fantasma 01–04 detrás de cada figura.
- Navegación por mitades del escenario con cursor tipográfico `←`/`→`; botones `Anterior`/`Siguiente` solo para lectores de pantalla.
- Botón de texto `Pausar`/`Seguir`; pausa al pasar el ratón, al enfocar o al ocultar la pestaña.
- Teclado (`←`, `→`, `Home`, `End`, `Espacio`) y swipe táctil.
- Crossfade con Framer Motion y `cubic-bezier(0.22, 1, 0.36, 1)`; parallax de ratón limitado a ±8 px.
- `role="region"` + `aria-roledescription="carousel"`; cada slide es `role="group"` con `aria-label="1 de 4"`; aviso `aria-live="polite"` al pausar.
- Con `prefers-reduced-motion` se desactivan autoplay y parallax.

Al validar las credenciales, un sello **ACCESO CONCEDIDO** se estampa durante ~900 ms antes de entrar al panel.

## Funcionalidades

- **Hoy en bodega** — cifra gigante de productos, bloque burdeos de alertas, categorías sobre kraft y últimos movimientos.
- **Todo lo que hay** — búsqueda instantánea, pestañas de categoría, tabla libro mayor, panel lateral para alta/edición, validación y eliminación con confirmación.
- **Lo que entró y salió** — totales sin tarjetas, formulario sobre kraft y libro agrupado por día.
- **Lo que falta** — tablero de reposición con etiquetas de envío, umbral visual y reposición en un clic.
- **Las cuentas** — cuatro informes, filtros por categoría y estado, exportación CSV y PDF; los operadores ven acceso restringido.

## Uso

```bash
npm install
npm run dev          # http://localhost:5173
npm run build        # build normal + verificación de tipos
npm run build:single # build y copia a "Sistema de Control e Inventario.html"
npm run preview      # sirve dist/
```

`npm run build:single` genera un **único HTML autocontenido** (CSS, JS, fuentes, favicon y textura de ruido en línea) y lo copia a la raíz del proyecto. Ronda los 0.8 MB y funciona abriéndolo directamente con `file://`, sin servidor.

## Credenciales de demostración

| Rol | Usuario | Contraseña | Alcance |
| --- | --- | --- | --- |
| Administrador | `admin` | `admin123` | Todo |
| Operador | `operador` | `operador123` | Lectura; reportes restringidos |

## Datos

25 productos en cinco categorías y siete movimientos de ejemplo. Las fechas semilla se generan **relativas al momento de abrir la app** (hoy, ayer y hasta cinco días atrás), así que el libro siempre parece vivo.

El estado se guarda en `localStorage` con claves `inventario-inventory-storage`, `inventario-user` e `inventario-theme`. Al abrir una versión anterior, la app renombra esas claves sin perder la sesión, el tema ni los movimientos. La versión 2 migra los movimientos semilla antiguos sin perder los del usuario. Si el almacenamiento no está disponible (por ejemplo, en algunos contextos `file://`), la aplicación sigue funcionando en memoria.

## Verificación

La build final se comprueba con Playwright sobre `file://`:

- 4 diapositivas, autoplay, pausa, índice, teclado y swipe
- 6 rutas (`login`, dashboard, inventario, movimientos, alertas, reportes)
- Login real con sello y navegación diferida; tema claro/oscuro persistente
- Alta, edición y eliminación de producto; registro de movimiento; reposición de alerta
- Exportación CSV y PDF (cabecera `%PDF-1.4` y `%%EOF` válidos)
- Sin desbordamiento horizontal en 375, 768 y 1440 px
- Contraste AA y axe-core sin violaciones en claro y oscuro
- Sin errores de consola ni referencias a la paleta o tipografías anteriores

Las capturas están en `docs/capturas/`.
