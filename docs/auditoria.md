# Auditoría del rediseño de la tienda

Fecha: 2026-11-23. Alcance: tienda departamental online (no farmacia). Se revisaron `README.md`, `index.html`, `src/app/**`, `src/logic/**`, `src/pages/store/**`, `src/components/store/**`, `src/components/ui/**`, `src/styles/**`, `scripts/**` y los tests existentes. Esta es la auditoría de cierre: conserva la línea base y el estado final de cada hallazgo.

## Línea base y resultado final

| Comando | Línea base | Estado final |
| --- | --- | --- |
| `npm install` | Correcto (85 paquetes; avisos de `npm audit` y de script bloqueado de `esbuild`, no bloqueantes). | Sin cambios; los avisos siguen sin bloquear build ni tests. |
| `npm run build` | Correcto; `dist/index.html` ≈ 1,12 MB. | Correcto; 1.310.724 bytes (490.031 gzip), paleta y contraste AA OK. |
| `npm test` | Correcto: 6 archivos, 32 pruebas. | Correcto: 14 archivos, 65 pruebas. |
| `npm run dev` | Correcto: Vite 8.3.5 en 5174. | Sin cambios. |
| `npm run verify:visual` | Falla: selectores de pasos desactualizados. | Correcto: personal, cliente, invitado y filtros OK; 0 errores, 0 peticiones externas. |

El recorrido de `verify:visual` cubre 86 combinaciones de ruta/tema/medio, incluidos cinco anchos (320, 390, 412, 768 y 1280); `audit:mobile` amplía la cobertura a 10 viewports × 2 temas × 13 rutas (ver `docs/verificacion-movil.md`). No hay desbordes (máx. 0 px); el CLS máximo es 0,0052 en escritorio y 0,0066 en móvil, sin tareas largas. Las capturas de la línea base y las actuales quedan en `docs/capturas/`, `docs/capturas/verificacion/` y `docs/capturas/movil/`; el detalle legible está en `docs/verificacion-visual.json` y `docs/verificacion-movil.json`.

## Hallazgos

| # | Archivo | Problema | Severidad | Resolución | Estado |
| --- | --- | --- | --- | --- | --- |
| 1 | `src/config/brand.ts`, `formatters.ts`, `index.html`, `StoreChrome.tsx`, `settings.ts` | El nombre "Inventario" estaba hardcodeado en título, meta, menú, fallbacks y ajustes. | alta | `BRAND` central, placeholders inyectados por `brandHtml`, `storeName(settings)` en la tienda y migración de ajustes. | Resuelto |
| 2 | `storage.ts`, `images.ts`, `tracking-page.tsx` | Claves `inventario-*`, base de imágenes y placeholder `INV-` visibles. | alta | Claves derivadas de `BRAND.slug`, migración de claves/imágenes y `BRAND.orderPrefix` en el placeholder. | Resuelto |
| 3 | `orders.ts`, `products.ts`, tests | Códigos `INV-` acoplados al nombre antiguo. | alta | `PED-AAAA-NNNNNN`; la secuencia cuenta también los `INV-` históricos y el seguimiento los acepta. | Resuelto |
| 4 | `protected-route.tsx`, `auth-provider.tsx` | Una sesión de cliente podría abrir `/admin`. | alta | `ProtectedRoute` usa solo la sesión del personal; `CustomerRoute` usa solo la del cliente. E2E verificado. | Resuelto |
| 5 | `login-page.tsx` | Texto que invitaba a comprar sin cuenta. | alta | Enlace “¿Eres cliente? Ingresa aquí”; el acceso quedó reservado al personal. | Resuelto |
| 6 | `router.tsx`, `customer-auth.ts` | No había registro, ingreso ni rutas `/cuenta/*`. | alta | Modelo `CustomerAccount`, servicio, store, provider, guardas y ocho rutas de cuenta. | Resuelto |
| 7 | `StoreChrome.tsx`, `cart-page.tsx`, `checkout-page.tsx` | Sin invitación a usar cuenta ni autocompletado. | alta | Tarjeta de cuenta en cabecera, carrito y paso de datos; hidratación borrador > cuenta > carrito. | Resuelto |
| 8 | `home-page.tsx` | Lenguaje interno y sección de inventario en la home. | alta | Home departamental con banners, beneficios, categorías y rieles; aviso de pago simulado discreto. | Resuelto |
| 9 | `StoreChrome.tsx` | Atajos globales que interferían con formularios. | media | Los atajos ignoran inputs, `textarea`, `select`, `contenteditable` y diálogos. | Resuelto |
| 10 | `ProductCard.tsx`, `StoreChrome.tsx` | SKU internos visibles. | media | Código oculto en tarjetas y autocompletado; búsqueda por nombre, categoría, marca y facetas. | Resuelto |
| 11 | `StoreChrome.tsx`, `CartPopover`, `CartSheet`, `cart-page.tsx` | Tres carritos sin componentes compartidos. | media | `CartLineItem` y `CartSummary` únicos para las tres superficies. | Resuelto |
| 12 | `checkout-page.tsx` | Estado y UI mezclados; hidratación que podía pisar datos. | alta | Accordion de cuatro pasos con resumen sticky, prioridad explícita y cuenta al inicio del paso de datos. | Resuelto |
| 13 | `ProductArt.tsx`, tarjetas, ficha, carrito | Las fotos nunca se mostraban. | media | `ProductImage` usa foto real si existe y `ProductArt` como respaldo con `aspect-ratio` fijo. | Resuelto |
| 14 | `products.ts` | Solo 25 productos y 5 categorías. | media | 489 productos reales verificados (DummyJSON + Open Food Facts), `subcategoria` y `marca`; se eliminaron las 60 fichas ilustradas y sus marcas ficticias. | Resuelto |
| 15 | `types/index.ts`, `inventory.ts`, `backup.ts` | Faltaban facetas, `clienteId` y cuentas en el respaldo. | alta | Campos opcionales, migración a inventario v6 y backup v3 con clientes. | Resuelto |
| 16 | `scripts/visual-check.mjs` | E2E roto y cobertura insuficiente. | alta | Selectores reales, 86 combinaciones, cinco anchos, cuenta/admin-clientes/filtros, claves derivadas de la marca y fallo por CLS/consola/externos/desbordes/objetivos táctiles/campos. | Resuelto |
| 17 | `store.css`, `chrome.css` | CSS muerto y valores mágicos. | media | CSS denso de tienda (`eshop-*.css`), reglas huérfanas eliminadas y colores solo en `tokens.css`. | Resuelto |
| 18 | `tokens.css`, scripts de paleta/contraste | Límites de color rígidos y separados de los tokens. | media | Límites y pares de contraste configurados al inicio de `tokens.css`; los scripts leen ese bloque. | Resuelto |
| 19 | `index.html` | Migración de tema incompleta. | media | `LEGACY_KEYS.theme` incluye `atelier-theme` e `inventario-theme`; `migrateLegacyStorage` conserva la elección. | Resuelto |
| 20 | `admin-layout.tsx`, `permissions.ts` | Sin sección Clientes ni permisos. | media | Panel Clientes buscable, `ver:clientes`/`gestionar:clientes` y auditoría sin datos sensibles. | Resuelto |
| 21 | `exportCsv.ts`, `print.css`, `order-page.tsx` | Riesgo de que CSV/PDF heredaran el nombre antiguo. | media | Los CSV no incluyen marca en encabezados ni nombres de archivo; impresión y pedido usan `storeName(settings)`/`BRAND`. | Resuelto |
| 22 | `Sistema de Control e Inventario.html` | HTML antiguo con nombre obsoleto. | baja | Eliminado junto a `index-completo.html`; `build:single` genera `ivoria.html` desde `BRAND.slug`. | Resuelto |
| 23 | `index.css`, `tokens.css` | Comentarios con el nombre antiguo. | baja | Comentarios actualizados; los tests pueden nombrar el pasado a propósito para verificar la migración. | Resuelto |
| 24 | `order-page.tsx`, `tracking-page.tsx` | Estados técnicos sin lenguaje claro. | media | `friendlyStatus`/`friendlyStatusDetail`, estimación de entrega y pasos comprensibles. | Resuelto |
| 25 | `src/motion/**`, `home-page.tsx` | Movimiento decorativo que penalizaba rendimiento. | media | Fuera de la tienda; solo queda movimiento funcional y respetuoso con `prefers-reduced-motion`. | Resuelto |
| 26 | `Field.tsx` | Los errores no se asociaban al campo. | media | `aria-describedby` se pasa siempre que hay error, con `role="alert"` en el mensaje. | Resuelto |

### Ronda 2 — Fase 1: marca Ivoria

| # | Archivo | Problema | Severidad | Resolución | Estado |
| --- | --- | --- | --- | --- | --- |
| 27 | `src/config/brand.ts`, `legacy.ts` | Marcadores `[NOMBRE_EMPRESA]`, slug `tienda`, prefijo `PED`. | alta | `Ivoria`, slug `ivoria`, prefijo `IVO`, `themeKey` y tagline definitivos; `LEGACY_SLUGS` incluye `tienda`. | Resuelto |
| 28 | `src/logic/services/storage.ts`, `images.ts`, `orders.ts` | Datos guardados con claves `tienda-*` e imágenes en la base antigua; pedidos `PED-`/`INV-`. | alta | Migración de claves e IndexedDB a `ivoria-*`; la secuencia `IVO-` cuenta los pedidos históricos. | Resuelto |
| 29 | `index.html`, `vite.config.ts`, `theme-provider.tsx`, `BrandMark.tsx` | Título/meta/favicon con inicial genérica y `theme-color` vacío. | alta | Metas `og:*` y `theme-color` por esquema inyectadas desde `BRAND`/`tokens.css`, actualizadas al cambiar de tema; monograma «I» compartido con el favicon SVG. | Resuelto |
| 30 | `README.md`, `docs/auditoria.md`, `docs/decisiones.md`, tests de marca | Documentación y pruebas con nombre pendiente y métricas antiguas. | media | Documentación y 62 pruebas alineadas con Ivoria, `IVO-` y migración `tienda-*`. | Resuelto |
| 31 | `tienda.html` | Artefacto con el slug anterior. | baja | Eliminado; `npm run build:single` genera `ivoria.html` (1.310.724 bytes). | Resuelto |

### Ronda 2 — Fase 2: diagnóstico móvil y limpieza

| # | Archivo | Problema | Severidad | Resolución | Estado |
| --- | --- | --- | --- | --- | --- |
| 32 | `scripts/mobile-audit.mjs`, `docs/verificacion-movil.*` | Sin medición sistemática en teléfono, apaisado ni tablet. | alta | Auditor de 10 viewports × 2 temas × 13 rutas con `hasTouch`, CLS, tareas largas, desbordes, recortes, solapes y externos. | Resuelto |
| 33 | `WordReveal.tsx`, `useScrollProgress.ts`, `wordMask`/`narrative`, `chrome.css` | Código muerto y CSS huérfano. | media | Componentes, hooks, exports y reglas eliminados; `store.css` 1462→917 y `chrome.css` 166→61 líneas. | Resuelto |
| 34 | `scripts/check-contrast.mjs` | Los `:root` dentro de `@media`/`@supports` se mezclaban con los canónicos. | media | El script extrae solo los bloques canónicos `:root`/`.dark`. | Resuelto |

### Ronda 2 — Fase 3: chrome móvil y sistema de diseño

| # | Archivo | Problema | Severidad | Resolución | Estado |
| --- | --- | --- | --- | --- | --- |
| 35 | `mobile.css`, `StoreChrome.tsx`, `StoreFooter.tsx` | Cabecera densa de escritorio en teléfono. | alta | Cabecera tipo app, buscador fullscreen con recientes, selector de zona, barra inferior de cinco entradas, pie acordeón y safe-area. | Resuelto |
| 36 | `Sheet.tsx`, `Modal.tsx` | Diálogos sin foco atrapado ni cierre con «atrás». | alta | Scroll lock, foco atrapado y devuelto, Escape, `popstate`, fondos sólidos. | Resuelto |
| 37 | `mobile.css`, `eshop-home.css`, `eshop-catalog.css`, `admin.css` | Objetivos táctiles por debajo de 44 px, slider de precios y cupones estrechos. | media | Área táctil de 44 px en dot, flechas, paso/drop, filtros, switch, cupones y enlaces de marcas; pulgar del slider de 22 px. | Resuelto |

### Ronda 2 — Fase 4: tienda móvil first

| # | Archivo | Problema | Severidad | Resolución | Estado |
| --- | --- | --- | --- | --- | --- |
| 38 | `eshop-home.css`, `eshop-catalog.css`, `store.css`, `mobile.css` | Rieles sin scroll táctil, catálogo de una columna, barras de acción sin anclar. | media | `scroll-snap`, catálogo a dos columnas, barra fija de ficha y carrito sobre la tabbar, navegación sticky de checkout. | Resuelto |
| 39 | Field, búsquedas, cupón, dirección, checkout, tracking, accesos | Teclados móviles inadecuados. | media | `inputMode`, `autoComplete` y `enterKeyHint` en todos los campos de compra y acceso. | Resuelto |
| 40 | `admin-layout.tsx` | Atajo de comandos sin equivalente para el panel. | baja | Atajo `C` con `(pointer: fine)`, fuera de campos y diálogos. | Resuelto |

### Ronda 2 — Fase 5: panel móvil/tablet

| # | Archivo | Problema | Severidad | Resolución | Estado |
| --- | --- | --- | --- | --- | --- |
| 41 | `admin-layout.tsx`, `admin.css` | Barra lateral fija que no cabía en tablet ni teléfono. | alta | Cajón con backdrop, foco atrapado, Escape, «atrás», botón con `aria-expanded` y barra inferior de cinco entradas. | Resuelto |
| 42 | `ResponsiveTable.tsx`, seis páginas de admin, `components.css` | Tablas con `min-width: 820px` y scroll horizontal en móvil. | alta | Tablas convertidas en tarjetas con `data-label` derivado de los `<th>`; envoltorio transparente. | Resuelto |
| 43 | `mobile.css` | Formularios encajados en hojas estrechas. | media | Hojas y modales a pantalla completa (`100dvh`) con safe-area en móvil. | Resuelto |
| 44 | `src/styles/*.css` | Breakpoints dispares (390, 600, 640, 820, 860, 900, 1100, 1400, 1440, 1441). | media | Unificados en 360, 480, 768, 1024 y 1280 (y 1281 en `min-width`), con caso explícito ≤360. | Resuelto |

### Ronda 2 — Fase 6: verificación ampliada

| # | Archivo | Problema | Severidad | Resolución | Estado |
| --- | --- | --- | --- | --- | --- |
| 45 | `scripts/visual-check.mjs` | `verify:visual` no medía móvil ni todos los anchos. | alta | Matriz de 50 mediciones en cinco anchos con CLS, desborde, objetivos <44 px y campos <16 px; el script falla si aparece alguno. | Resuelto |
| 46 | `storage-migration.test.ts` | La migración `tienda-*` solo se comprobaba leyendo el código fuente. | media | Tres pruebas con `localStorage` falso: traslado sin pérdida, no sobrescritura de claves actuales y recuperación de claves antiguas. | Resuelto |
| 47 | `src/styles/*.css` | 44 reglas `:hover` quedaban fuera de `@media (hover: hover)` y podían quedar pegadas tras un toque. | media | Las 52 reglas quedan protegidas (52/52 según `staticAudit`); en táctil manda `:active` y las acciones rápidas de tarjeta ya son visibles con `(hover: none)`. | Resuelto |

## Criterio de cierre

Todas las filas de severidad alta están resueltas y el resto también, con la justificación anotada. Se ejecutaron `npm run build`, `npm test`, `npm run verify:visual`, `npm run audit:mobile` y `npm run build:single`; los cinco pasan. El nombre comercial ya está decidido (Ivoria); siguen pendientes de producto la paleta definitiva, un logo real en lugar del monograma «I» y el mecanismo de recuperación de contraseña con backend. El panel ya usa barra inferior además del cajón, como estaba previsto.
