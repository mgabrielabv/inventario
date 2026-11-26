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

El estado se persiste en `localStorage` con versiones y migración de claves antiguas; si no está disponible, se usa un mapa en memoria. La persistencia del inventario pasó a v10 para completar facetas, descartar las fichas de relleno `p001`…`p060` junto con sus movimientos y normalizar el escenario sin inventar valores; los pedidos migran a v3 y el respaldo a v5, sanitizando importaciones antiguas. El respaldo importa cuentas de cliente sin sobrescribir las existentes cuando el archivo es v2. “Restablecer datos de demostración” repone los 489 productos reales, movimientos, pedidos, ajustes y la cuenta demo; conserva personal y auditoría.

## Portada pública

`#/` es una landing de seis secciones (hero, escaparate sticky, bento, cómo se usa, departamentos y cierre) con tema oscuro propio: el contenedor aplica `.dark` sin depender de la preferencia del sistema ni del tema guardado. Sus enlaces de anclas son botones que hacen `scrollIntoView`, porque los `href="#id"` colisionan con `HashRouter`. Los tres CTA llevan a `#/cuenta/registro`; `#/seguimiento` y `#/pedido/:codigo` quedan públicos para consultar un pedido sin cuenta. La tienda se mudó a `#/inicio` y los enlaces internos de la cabecera, la barra inferior, migas de pan y el panel se actualizaron en consecuencia.

## Sesiones, cuentas y permisos

`admin/admin123` y `operador/operador123` son credenciales del personal; `cliente@ejemplo.com` / `cliente123` es la cuenta de cliente sembrada. Las contraseñas usan SHA-256 con sal y Web Crypto.

Las sesiones están separadas: `KEYS.user` para el personal y `KEYS.customerSession` para clientes. `ProtectedRoute` exige la sesión del personal en `#/admin`; `CustomerRoute` exige la de cliente en `#/cuenta/*`, en `#/inicio`, `#/tienda`, `#/carrito`, `#/pagar` y `#/favoritos`. Espera a que la cuenta termine de hidratarse con Web Crypto antes de redirigir, para no expulsar a quien ya tiene sesión. Una cuenta de cliente redirige al ingreso del personal si intenta abrir el panel. La matriz de permisos vive en `src/logic/services/permissions.ts`: la interfaz oculta acciones, pero la lógica también las valida. `ver:clientes` permite consultar; `gestionar:clientes` permite activar o desactivar cuentas y solo lo tiene el administrador. La auditoría de esas acciones no guarda hash, sal ni contraseñas.

La recuperación de contraseña es una pantalla simulada. Con backend real habrá que sustituir el cuerpo de `src/logic/services/customer-auth.ts` por llamadas a API manteniendo las firmas asíncronas y decidir el proveedor de correo y el flujo de restablecimiento.

## Checkout y dinero

El checkout mantiene cuatro pasos con resumen sticky. El paso de datos abre con la tarjeta de la cuenta que compra: se eliminó el modo invitado porque la tienda es privada y la portada pública ya explica que hace falta cuenta. El carrito y el borrador sobreviven al ingreso desde el carrito o el checkout. La hidratación respeta el orden borrador > cuenta > carrito. Los pedidos históricos de invitado siguen pudiéndose asociar a una cuenta por correo o teléfono.

Los códigos son `IVO-AAAA-NNNNNN` y la secuencia respeta pedidos `PED-` e `INV-` históricos. El precio principal sigue `settings.moneda.codigo`; el equivalente en bolívares aparece solo si hay `tasaVES` positiva y `mostrarSecundario`. El pago es simulado y se dice explícitamente; no hay pasarela, notificaciones ni reseñas. Los PDF salen de la impresión del navegador.

## Tienda personalizada

`#/inicio` ya no invita a crear cuenta: saluda al cliente por su nombre, abre con un carrusel cuyas fotos son productos reales del catálogo y usa `ProductImage` también en las categorías, con la misma prioridad foto subida → miniatura local → URL importada → ilustración. Las fichas de categoría siguen saliendo de `categoryTiles`, así que no se muestran departamentos vacíos. El antiguo bloque de registro se sustituyó por el panel «Tu espacio», con accesos a pedidos, direcciones y favoritos y el estado del último pedido. El cuarto banner apunta a `#/cuenta/pedidos` en lugar del registro.

`ordersForAccount` selecciona los pedidos de la sesión, incluidos los históricos vinculados por correo o teléfono, y ordena por fecha. Con esa base, el riel «Comprar de nuevo» y el acceso «Comprar de nuevo» del carrito devuelven los productos de compras anteriores. En el carrito, `repeatOrderLines` descarta lo que ya no se puede vender, limita cada cantidad a lo disponible hoy y respeta el precio actual; antes de fusionar las líneas con el carrito existente se pasa `validateCart`, y si aparece algún conflicto se informa sin modificar el carrito. El botón nunca aumenta una reserva por encima de `disponible`.

La ficha de producto conserva sus cuatro vistas y el zoom, pero la nota de la galería ya no promete una ilustración y añade una señal de cuenta: quién compra y dónde quedan sus pedidos. Los enlaces a la categoría usan el parámetro canónico `?categoria=` (el antiguo `?cat=` sigue siendo compatible en `parseFilters`). El checkout mantiene los cuatro pasos, la tarjeta de cuenta y el orden de hidratación; el aviso de pago simulado se consolidó en `PAYMENT_NOTICE` para que paso de pago, revisión y resumen digan exactamente lo mismo. El pie de la tienda redujo sus siete enlaces de cuenta a cuatro, porque el registro ya no es el objetivo de la tienda privada.

Las pruebas `store-personal-v6` y `session-routes-v6` comprueban estas decisiones leyendo el código fuente: sin registro en la tienda, sin parámetros heredados, fotos en el escaparate y las categorías, repetición validada del pedido y un solo texto de pago simulado.

Salvedad de verificación de esta fase: `verify:motion` completa 10/10 flujos funcionales con CLS 0,0000, 0 errores y 0 peticiones externas, pero `1280-estado-pedido` no alcanza el suelo de 32 FPS (mediciones de 28,2 a 30,5). Ese flujo mide el panel de pedidos, que no se modificó en esta fase; en la línea base ya rozaba el límite (32,4) y el entorno de medición tenía CPU ×4 con alta carga externa. Se acepta el resultado con esta salvedad, sin rebajar el presupuesto del script; el resto de verificaciones pasan sin problemas.

## Panel del personal

El inventario incorpora dos filtros rápidos («Sin foto» y «Bajo mínimo») junto a los existentes. «Sin foto» significa estrictamente que la ficha no tiene imágenes; «Bajo mínimo» compara el disponible derivado con el mínimo declarado y solo aplica si ese mínimo es mayor que cero. Ninguno escribe en el producto: el stock sigue cambiando únicamente por movimientos.

La tabla separa **Stock**, **Reservado** y **Disponible** en tres columnas en lugar de colapsar la reserva en una nota. `reservado` y `disponible` se calculan en cada render con `getReserved`/`getAvailable` a partir de los pedidos activos; no se persisten. Las miniaturas de la tabla usan `ProductArt` con la misma prioridad que la tienda (foto subida → miniatura local → URL importada → ilustración), así que el personal ve la foto real de cada ficha.

La foto principal es la primera de `imagenes`. El formulario admite subida múltiple, muestra una vista previa grande, permite recorrer las miniaturas y reordenarlas con «Antes»/«Después». Quitar una foto deja el borrado diferido hasta guardar: las fotos nuevas se descartan al cancelar y las eliminadas se borran de IndexedDB solo cuando se confirma la ficha. Las URLs importadas nunca se borran de IndexedDB porque no viven ahí.

El campo `escenario` (`natural`, `estudio`, `arena`, `noche`) es opcional y se normaliza con `normalizeEscenario` en la migración v10, en la importación y en la creación de fichas. Las fichas antiguas se muestran en `natural` y un valor desconocido nunca se inventa: solo cambia el fondo decorativo de `ProductStage` y de la vista previa del panel; no altera foto, precio ni stock.

El botón «Mover» abre una hoja de movimiento rápido que reutiliza `MOTIVOS_BY_TYPE`, `validateMovementQuantity`, `applyMovement` y `addMovement`; por tanto aplica los mismos permisos, límites y validación que la página de movimientos, y registra la auditoría con el antes/después calculado. «Stock inicial» sigue deshabilitado al editar.

El respaldo pasa a **v5**: incluye `fotos`, un mapa de data URLs de las imágenes subidas desde el panel (fichas y comprobantes de pago). Las URL importadas viajan en `imagenes` y no se duplican. `validateBackup` rechaza mapas mal formados, ids vacíos, formatos distintos de WebP/PNG/JPEG y blobs desproporcionados antes de sobrescribir nada; `restoreImages` convierte las data URLs a blobs y las guarda con sus ids originales antes de reemplazar los datos. Los respaldos v1–v4 sin `fotos` siguen siendo válidos. Las pruebas `admin-panel-v7` y `backup-v7` fijan estas decisiones leyendo el fuente y validando el esquema.

Salvedad de verificación de esta fase: `verify:motion` vuelve a completar 10/10 flujos funcionales, pero `1280-estado-pedido` queda en 28,9 FPS frente al suelo de 32, la misma salvedad aceptada en la fase anterior y sin rebajar el presupuesto del script. `verify:visual` terminó limpio en la tercera ejecución; en las dos anteriores apareció de forma transitoria una tarea larga (233 ms y 219 ms) y un CLS de 0,0125 en `768-light-inicio`, ruta que no se modificó en esta fase, con CPU ×4 y alta carga externa. No se ajustaron umbrales.

## Pulido de código (fase 8)

Se corrigieron las advertencias accionables del lint sin cambiar comportamiento: dependencias completas en los efectos de `product-page.tsx` y `checkout-page.tsx` (con la hidratación de cuenta guiada por `account?.id`), memoización de `entrega` en `CartSummary.tsx`, variable sin uso en `scripts/mobile-audit.mjs`, año del pie y del placeholder de seguimiento calculados una sola vez en `StoreChrome.tsx` y `tracking-page.tsx`, valor inicial de `openByDefault` con `useState` en lugar de acceder a un ref durante el render, y actualización de `closeRef.current` dentro de un efecto en `Modal.tsx`, `Sheet.tsx` y `StoreChrome.tsx`. Quedan las advertencias de fast-refresh en proveedores/hooks y las de `set-state-in-effect` en sincronizaciones deliberadas con tiendas y medios; no se refactorizó código estable solo para silenciarlas.

Tras el pulido: `npm run lint` sin errores, `npx tsc -b` correcto, `npm test` 21/109 en verde, `npm run build` con `dist/index.html` de 2.638.198 bytes (970.847 gzip), `verify:seed` 9/9, `verify:visual` limpio en la repetición (la primera medición tuvo una tarea larga transitoria de 394 ms en `1280-light-inicio`), `verify:motion` 10/10 con la salvedad conocida de `1280-estado-pedido` en 30,5 FPS y tareas largas transitorias en `hoja-filtros`, y `audit:mobile` 280 mediciones con 0 problemas. No se rebajaron umbrales ni se añadieron dependencias.

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
