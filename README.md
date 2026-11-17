# Sistema de Control e Inventario — Atelier de Almacén

Aplicación de inventario con dirección editorial e industrial: catálogo de museo, cuarto de control. Tipografía de revista, líneas finas, códigos monoespaciados y una paleta natural de borgoña, arcilla, crema y arena.

*"Cada cosa, en su lugar."*

## Stack

- **React 19** + **TypeScript estricto** + **Vite 8**
- **Framer Motion** — transiciones y crossfade del slideshow
- **Zustand** — estado del inventario con persistencia en localStorage
- **React Router 7** (`createHashRouter`, compatible con `file://`)
- **Lucide React** — iconos de línea fina
- **Sonner** — avisos
- **CSS propio** — sin Tailwind; variables, capas y clases semánticas
- **Exportación PDF sin dependencias** — generador propio en `src/logic/services/exportPdf.ts`

## Paleta

Variables en `src/styles/tokens.css`. No se usan colores fuera de la paleta.

| Token | Claro | Oscuro |
| --- | --- | --- |
| Fondo | `#FFF4ED` crema | `#1A0807` borgoña casi negro |
| Superficie | `#FFF9F5` | `#24100E` |
| Tinta | `#2A0A08` | `#FFF4ED` |
| Acento | `#890000` borgoña | `#E3A493` arcilla |
| Línea | borgoña 14% | arcilla/crema 14% |
| Crítico | `#890000` | `#DE8F82` |
| Bajo | `#B8893F` | `#D9A552` |
| Normal | `#6B7A4B` | `#9CAE79` |

Estados siempre con **icono + texto**, nunca solo color. Los gráficos llevan etiquetas directas. Todos los textos visibles cumplen **WCAG AA (4.5:1)** en claro y oscuro.

## Tipografía

- **Instrument Serif** — títulos y cifras editoriales
- **Figtree** — interfaz
- **JetBrains Mono** — códigos, etiquetas y datos tabulares

Las tres familias están **embebidas como woff2 base64** en `src/styles/fonts.css` (subconjunto latin + signos de apertura, comillas, guiones, € y flechas), de modo que el HTML final no solicita archivos externos.

## Arquitectura

```text
src/
├── app/                 # providers (auth, tema), router y ruta protegida
├── components/
│   ├── illustrations/   # SVG: caja, estantería, escáner, pallet, código
│   ├── layout/          # sidebar, header, menú móvil
│   ├── slideshow/       # HeroSlideshow + SlideFigure
│   └── ui/              # botón, estado, estado vacío
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

## Login accesible

El antiguo cubo 3D se sustituyó por un **slideshow editorial de cuatro diapositivas** con ilustraciones SVG:

- Autoplay de ~5 s con progreso por diapositiva
- Pausa al pasar el ratón, al enfocar o al ocultar la pestaña
- Pausa/play visible, puntos de navegación, flechas, teclado (`←`, `→`, `Home`, `End`, `Espacio`) y swipe táctil
- Crossfade con Framer Motion y `cubic-bezier(0.22, 1, 0.36, 1)`
- Parallax de ratón limitado a ±8 px
- `role="region"` + `aria-roledescription="carousel"`; cada slide es `role="group"` con `aria-label="1 de 4"`; aviso `aria-live="polite"` al pausar
- Con `prefers-reduced-motion` se desactivan autoplay y parallax

## Funcionalidades

- **Dashboard** — KPIs con contador animado, alerta crítica, gráfico de categorías con etiquetas directas y últimos movimientos.
- **Inventario** — búsqueda instantánea, filtro por categoría y estado, tabla responsive, panel lateral para alta/edición, validación y eliminación con confirmación.
- **Movimientos** — registro de entradas/salidas con validación de stock, actualización inmediata y línea de tiempo agrupada por día.
- **Alertas** — fichas por producto en riesgo, medidor de umbral y reposición en un clic.
- **Reportes** — cuatro informes, filtros por categoría y estado, exportación CSV y PDF; los operadores ven acceso restringido.

## Uso

```bash
npm install
npm run dev          # http://localhost:5173
npm run build        # build normal + verificación de tipos
npm run build:single # build y copia a "Sistema de Control e Inventario.html"
npm run preview      # sirve dist/
```

`npm run build:single` genera un **único HTML autocontenido** (CSS, JS, fuentes, favicon y textura de ruido en línea) y lo copia a la raíz del proyecto. Pesa ~0.73 MB y funciona abriéndolo directamente con `file://`, sin servidor.

## Credenciales de demostración

| Rol | Usuario | Contraseña | Alcance |
| --- | --- | --- | --- |
| Administrador | `admin` | `admin123` | Todo |
| Operador | `operador` | `operador123` | Lectura; reportes restringidos |

## Datos

25 productos en cinco categorías y cinco movimientos de ejemplo (26 oct 2026). El estado se guarda en `localStorage` con claves `atelier-inventory-storage`, `atelier-user` y `atelier-theme`; si el almacenamiento no está disponible (por ejemplo, en algunos contextos `file://`), la aplicación sigue funcionando en memoria.

## Verificación

La build final se comprobó con Playwright sobre `file://`:

- 4 diapositivas, autoplay, pausa, puntos, flechas, teclado y swipe
- 6 rutas (`login`, dashboard, inventario, movimientos, alertas, reportes)
- Alta de producto, registro de movimiento, reposición de alerta
- Exportación CSV y PDF (cabecera `%PDF-1.4` y `%%EOF` válidos)
- Sin desbordamiento horizontal en 375, 768 y 1440 px
- Contraste AA en claro y oscuro en las seis pantallas
- Sin errores de consola ni referencias a la paleta anterior, Tailwind, jsPDF o al cubo

Las capturas están en `docs/capturas/`.
