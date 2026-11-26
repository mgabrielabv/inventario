# Decisiones del rediseño

## Alcance

La aplicación es una sola página con cuatro superficies:

- **Tienda departamental**: inicio, catálogo con filtros, ficha, carrito, checkout, confirmación, seguimiento y favoritos.
- **Cuenta de cliente**: ingreso, registro, recuperación, datos, direcciones, pedidos y favoritos.
- **Acceso del personal**: `/ingresar`.
- **Panel**: inicio, inventario, movimientos, pedidos, reposición, reportes, clientes y configuración.

La navegación usa `HashRouter` para que el HTML funcione con `file://`. `npm run build` genera un único `dist/index.html` con `vite-plugin-singlefile`; no hay peticiones a recursos remotos. `npm run build:single` lo copia a `ivoria.html`, con nombre derivado de `BRAND.slug`.

Se descartó la orientación de farmacia de versiones anteriores: los nueve departamentos son Tecnología, Accesorios, Hogar y cocina, Papelería y oficina, Juguetes y juegos, Deportes y aire libre, Cuidado personal, Mascotas y Ferretería básica. Las 25 fichas originales conservaron id, código, nombre, precios y existencias; se añadieron 35 productos (`p026`–`p060`) y facetas `subcategoria`/`marca`.

## Marca

`src/config/brand.ts` es la única fuente de verdad. El plugin `brandHtml` de `vite.config.ts` inyecta título, meta, tema y monograma desde ahí; `storageKey()` deriva las claves y `generateOrderCode()` el prefijo. `src/config/legacy.ts` concentra nombres, claves, imágenes y departamentos históricos solo para migrar sin pérdida. La prueba `brand-lint` falla si el nombre antiguo reaparece en la tienda, el encabezado, el pie, el acceso de clientes, el título, la meta o las claves activas; `store-language-v6` prohíbe además vocabulario interno (`stock`, `SKU`, `bodega`, `almacén`, `inventario`) en textos visibles de la tienda.

El nombre definitivo es **Ivoria** (`Todo para tu casa y tu día, en un solo lugar.`), del inglés *ivory* en diálogo con el crema de la paleta. `BRAND.name`/`shortName` valen `Ivoria`, `slug` es `ivoria`, `orderPrefix` es `IVO` y `themeKey` es `ivoria-theme`. Cambiar solo `brand.ts` propaga el nombre a título, meta, favicon, monograma, claves y códigos de pedido. El slug anterior `tienda` quedó en `LEGACY_SLUGS` y `migrateLegacyStorage`/`images.ts` trasladan claves e imágenes sin pérdida; los pedidos `PED-` e `INV-` siguen vigentes y cuentan en la secuencia `IVO-AAAA-NNNNNN`.

Se eligió un **monograma «I» con serifas de bloque**, burdeos sobre crema, compartido entre `BrandMark` y el favicon SVG dinámico: es legible a 16 px y 28 px y no añade peticiones. La prueba `brand-lint` falla si el nombre se repite fuera de `BRAND`. Un logo definitivo reemplazable vía `BRAND.logoUrl` sigue pendiente de confirmación.

## Paleta y contraste

Los únicos colores literales están en `src/styles/tokens.css`. Los cuatro colores base son ley:

| Color | Valor |
| --- | --- |
| Burdeos | `#890000` |
| Arcilla | `#BA8376` |
| Crema | `#FFF4ED` |
| Arena | `#D2B48C` |

El mismo archivo contiene los límites de validación (`--palette-hue-min`, `--palette-hue-max`, `--palette-saturation-min`) y los pares que debe comprobar `check-contrast`. Los scripts leen esa configuración: cambiar de identidad no exige tocar `scripts/`. Ambos corren en `prebuild`. Los estados nunca se comunican solo con color: llevan punto, icono y texto.

La paleta definitiva también está pendiente de confirmación; la actual cumple AA en claro y oscuro.

## Tipografía y movimiento

Inter Variable embebida como woff2 (latin y latin-ext) en `src/styles/fonts.css`; Vite la inlinea. Titulares en oración normal, tracking negativo, sin condensados ni mayúsculas decorativas; mínimo absoluto de 12 px.

`src/motion/tokens.ts` concentra muelles, duraciones y curvas; `MotionConfig reducedMotion="user"` y `@media (prefers-reduced-motion: reduce)` desactivan lo no esencial. En la tienda se conservó solo movimiento funcional: transiciones de ruta, accordion del checkout, vuelo al carrito, avisos y estados. `WordReveal`, `MeshBackground`, el parallax del héroe y el scroll-jacking quedaron fuera de la tienda; la ficha mantiene una inclinación ligera que se desactiva con movimiento reducido.

## Datos, stock y migraciones

Tienda y panel comparten inventario. `reservado` suma las líneas de pedidos activos (`Pendiente`, `Confirmado`, `Preparando`, `Listo`) y `disponible = stock - reservado`. Al entregar se generan movimientos `Salida/Venta`; al cancelar se libera la reserva sin crear movimientos. La confirmación revalida el stock.

El estado se persiste en `localStorage` con versiones y migración de claves antiguas; si no está disponible, se usa un mapa en memoria. La persistencia del inventario pasó a v8 para completar facetas y descartar las fichas de relleno `p001`…`p060` junto con sus movimientos; los pedidos migran a v3 y el respaldo a v4, sanitizando importaciones antiguas. El respaldo importa cuentas de cliente sin sobrescribir las existentes cuando el archivo es v2. “Restablecer datos de demostración” repone los 489 productos reales, movimientos, pedidos, ajustes y la cuenta demo; conserva personal y auditoría.

## Portada pública

`#/` es una landing de seis secciones (hero, escaparate sticky, bento, cómo se usa, departamentos y cierre) con tema oscuro propio: el contenedor aplica `.dark` sin depender de la preferencia del sistema ni del tema guardado. Sus enlaces de anclas son botones que hacen `scrollIntoView`, porque los `href="#id"` colisionan con `HashRouter`. Los tres CTA llevan a `#/cuenta/registro`; `#/seguimiento` y `#/pedido/:codigo` quedan públicos para consultar un pedido sin cuenta. La tienda se mudó a `#/inicio` y los enlaces internos de la cabecera, la barra inferior, migas de pan y el panel se actualizaron en consecuencia.

## Sesiones, cuentas y permisos

`admin/admin123` y `operador/operador123` son credenciales del personal; `cliente@ejemplo.com` / `cliente123` es la cuenta de cliente sembrada. Las contraseñas usan SHA-256 con sal y Web Crypto.

Las sesiones están separadas: `KEYS.user` para el personal y `KEYS.customerSession` para clientes. `ProtectedRoute` exige la sesión del personal en `#/admin`; `CustomerRoute` exige la de cliente en `#/cuenta/*`, en `#/inicio`, `#/tienda`, `#/carrito`, `#/pagar` y `#/favoritos`. Espera a que la cuenta termine de hidratarse con Web Crypto antes de redirigir, para no expulsar a quien ya tiene sesión. Una cuenta de cliente redirige al ingreso del personal si intenta abrir el panel. La matriz de permisos vive en `src/logic/services/permissions.ts`: la interfaz oculta acciones, pero la lógica también las valida. `ver:clientes` permite consultar; `gestionar:clientes` permite activar o desactivar cuentas y solo lo tiene el administrador. La auditoría de esas acciones no guarda hash, sal ni contraseñas.

La recuperación de contraseña es una pantalla simulada. Con backend real habrá que sustituir el cuerpo de `src/logic/services/customer-auth.ts` por llamadas a API manteniendo las firmas asíncronas y decidir el proveedor de correo y el flujo de restablecimiento.

## Checkout y dinero

El checkout mantiene cuatro pasos con resumen sticky. El paso de datos abre con la tarjeta de la cuenta que compra: se eliminó el modo invitado porque la tienda es privada y la portada pública ya explica que hace falta cuenta. El carrito y el borrador sobreviven al ingreso desde el carrito o el checkout. La hidratación respeta el orden borrador > cuenta > carrito. Los pedidos históricos de invitado siguen pudiéndose asociar a una cuenta por correo o teléfono.

Los códigos son `IVO-AAAA-NNNNNN` y la secuencia respeta pedidos `PED-` e `INV-` históricos. El precio principal sigue `settings.moneda.codigo`; el equivalente en bolívares aparece solo si hay `tasaVES` positiva y `mostrarSecundario`. El pago es simulado y se dice explícitamente; no hay pasarela, notificaciones ni reseñas. Los PDF salen de la impresión del navegador.

## Accesibilidad

Contraste AA en claro y oscuro, foco visible, `aria-*`, errores asociados al campo con `aria-describedby`, navegación por teclado, texteos alternativos para el arte de producto y avisos accesibles. Los atajos de teclado ignoran campos, `contenteditable` y diálogos.

## Móvil y panel (ronda 2)

`src/styles/mobile.css` se carga después de los estilos base y concentra la capa móvil: cabecera tipo app, buscador a pantalla completa con búsquedas recientes, selector de zona, barra inferior de cinco entradas (Inicio, Categorías, Buscar, Carrito, Cuenta), pie plegable con `<details>`, hojas y diálogos a pantalla completa, barras de acción fijas y safe-area. Los objetivos táctiles mínimos y el tamaño de campo de 16 px se fijan en una regla global al final de la cascada para que ninguna regla de página pueda rebajarlos. `--fs-ui` se mantiene en 16 px también en tablet para evitar el zoom automático de iOS.

Los fondos de las barras fijas son sólidos: se descartó `backdrop-filter` porque las capturas con CPU ×4 mostraban texto del fondo a través de la barra. Las 52 reglas `:hover` del proyecto quedaron dentro de `@media (hover: hover)` (en `components.css`, además, con `(pointer: fine)`), de modo que un toque no deja estados pegajosos; en táctil manda `:active`. Los atajos `/` y `C` exigen `(pointer: fine)`. Las hojas y el cajón del panel atrapan el foco, lo devuelven, cierran con Escape y con el botón «atrás» del navegador mediante `popstate`.

El panel usa un cajón con backdrop en ≤1024 px y una barra inferior con cinco destinos; la decisión de añadir barra inferior al panel, que estaba pendiente, quedó implementada. Las seis tablas del panel pasan por `ResponsiveTable`, que clona `thead/tbody/tr/td` e inyecta `data-label` desde los `<th>`: en móvil se convierten en tarjetas sin scroll horizontal, y en escritorio conservan la tabla original.

Los breakpoints se unificaron en **360, 480, 768, 1024 y 1280 px** (más 1281 en `min-width`), con un caso explícito ≤360. Como CSS no permite `var()` dentro de `@media`, `tokens.css` es la lista de verdad documental y las media queries repiten los literales; cualquier cambio de breakpoint debe actualizar ambos sitios. La adopción fue mobile-first: las reglas base atienden al teléfono y las media queries añaden espacio a medida que crece el ancho.

## Verificación

- `npm test` — 14 archivos y 65 pruebas de marca, idioma, sesiones, permisos, cuentas, direcciones, pedidos, catálogo, filtros/URL, precios, stock, catálogo semilla, movimiento, hashing y migración real de `localStorage`.
- `npm run check:palette` y `npm run check:contrast` — en `prebuild`.
- `npm run build` y `npm run build:single` — tipos, HTML único y artefacto con nombre de marca.
- `npm run verify:visual` — 86 combinaciones de ruta/tema/medio con Chrome sobre `file://`, incluidos cinco anchos, más 50 mediciones móviles de CLS, desborde, objetivos <44 px y campos <16 px; E2E de personal, cliente (con checkout) y visitante (portada, guardas y rutas públicas); filtros por URL; croma, tareas largas, errores de consola y peticiones externas.
- `npm run audit:mobile` — 10 viewports × 2 temas × 13 rutas = 260 mediciones con `hasTouch: true` en teléfono y tablet; desbordes, recortes, solapes, objetivos táctiles, campos, CLS y peticiones.

Resultado al cierre: 14/14 archivos y 65/65 pruebas verdes; HTML de 1.310.724 bytes (490.031 gzip; 1.280,00 KiB), por debajo del límite de 2,5 MB; croma 100 %, desborde 0 px, CLS 0,0052 en escritorio y 0,0066 en móvil, 0 tareas largas, 0 objetivos <44 px, 0 campos <16 px, 0 errores de consola y 0 peticiones externas. La auditoría móvil reporta 260 mediciones, 0 hallazgos y 0 problemas. Los cuatro E2E pasan (personal, cliente, visitante y filtros); el pedido de prueba queda como `IVO-2026-000007`.

Durante el trabajo aparecieron defectos reales, todos corregidos: la migración de ajustes no restauraba los diez departamentos, la secuencia de pedidos no contaba los códigos `INV-`, y `addAddress` devolvía una dirección con ID efímero en lugar de la guardada. El propio verify visual estaba roto por selectores antiguos y porque las funciones inyectadas por `addInitScript` usaban claves de Node como si fueran closures. En la ronda 2, el CLS se acumulaba entre rutas del router por hash (se reinicia el observador por ruta), los enlaces inline se contaban como objetivos pequeños (se aplicó la exención WCAG 2.5.8, igual que en `mobile-audit.mjs`) y `build:single` fallaba por sufijos de importación en los tests (se sustituyeron por `vi.resetModules()`). Todo está corregido.

Las capturas históricas quedan en `docs/capturas/`; las actuales y los informes, en `docs/capturas/verificacion/`, `docs/capturas/movil/`, `docs/verificacion-visual.json` y `docs/verificacion-movil.{json,md}`.

## Decisiones pendientes

Resueltas en esta ronda: el nombre comercial (Ivoria), el monograma «I» como marca provisional compartida con el favicon, los breakpoints unificados y la barra inferior del panel. Sigue pendiente de confirmación de producto la **paleta definitiva** (la actual burdeos/arcilla/crema/arena cumple AA y está bloqueada en `tokens.css`), un **logo real** que sustituya al monograma mediante `BRAND.logoUrl`, el **backend de recuperación de contraseña** (hoy es una pantalla simulada) y el **pago real** (hoy es simulado y se dice explícitamente). El aviso de `npm audit` (1 moderada y 2 críticas en el toolchain) no bloquea build, tests ni verificación, pero debe revisarse antes de publicar.
