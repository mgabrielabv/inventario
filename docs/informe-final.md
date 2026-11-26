# Informe final — Rediseño de Ivoria (ronda 2)

Fecha: 2026-11-23. Base Git: `fbb2035`. Todo el trabajo de la ronda 2 continúa sin commitear.

## 1. Resumen por fase

| Fase | Trabajo realizado | Cierre |
| --- | --- | --- |
| 1 · Marca definitiva | `BRAND.name`/`shortName` = «Ivoria», `slug` = `ivoria`, `orderPrefix` = `IVO`, `themeKey` = `ivoria-theme`. Título, meta/og, `theme-color`, favicon SVG y monograma «I» derivados de `src/config/brand.ts`. Migración `tienda-*` → `ivoria-*` en `localStorage` e IndexedDB; pedidos `PED-`/`INV-` válidos y contados; `tienda.html` eliminado. | Verde |
| 2 · Diagnóstico y limpieza | Nuevo `scripts/mobile-audit.mjs` y script `audit:mobile`: 260 mediciones (10 viewports × 2 temas × 13 rutas). Eliminados `WordReveal.tsx`, `useScrollProgress.ts`, exports `wordMask`/`narrative` y CSS huérfano; `store.css` 1462→917 y `chrome.css` 166→61 líneas. `check-contrast.mjs` corregido para distinguir `:root` canónicos. | Verde |
| 3 · Chrome y sistema de diseño | `src/styles/mobile.css`: cabecera tipo app, buscador fullscreen con recientes, selector de zona, barra inferior de cinco entradas, pie plegable y safe-area. `Sheet`/`Modal` con scroll lock, foco atrapado/devuelto, Escape y cierre con «atrás». Corregidos M2/M4/M5; fondos de barras sólidos. | 0 hallazgos |
| 4 · Tienda móvil first | Scroll-snap y barras fijas, catálogo a dos columnas, barra de acción fija en ficha y carrito, navegación sticky de checkout, `inputMode`/`autoComplete`/`enterKeyHint` en formularios y atajo `C` solo con puntero fino. | Verde |
| 5 · Panel móvil/tablet | Drawer con `role="dialog"`, `aria-modal`, foco atrapado, Escape, «atrás» y backdrop; `aria-expanded`/`aria-controls`; barra inferior de cinco entradas; KPIs a dos columnas; `ResponsiveTable` en seis tablas con `data-label` desde `<th>`; hojas y modales a `100dvh`; breakpoints unificados. | Verde |
| 6 · Verificación ampliada | `visual-check.mjs` ampliado a 320/390/412/768/1280, CLS móvil, objetivos táctiles y tipografía de campos; exención WCAG 2.5.8 para enlaces inline y reinicio de `__perf` por ruta hash. Tres pruebas reales de migración `localStorage`. Las 52 reglas `:hover` quedaron protegidas con `@media (hover: hover)`. | 0 problemas |

Tras cada fase se ejecutaron `npm run build`, `npm test` y `npm run verify:visual`; `audit:mobile` y `build:single` se añadieron al cierre. Los cinco comandos pasan al final.

## 2. Archivos nuevos, modificados y eliminados

**Nuevos (33 unidades de código/documentación + capturas):**
- Marca y configuración: `src/config/brand.ts`, `src/config/legacy.ts`, `src/components/brand/BrandMark.tsx` y tres pruebas de marca/idioma.
- Cuentas y sesiones: `src/app/providers/customer-provider.tsx`, `src/logic/services/customer-auth.ts`, `src/logic/store/customer.ts`, `src/pages/customer/` (7 páginas), `src/pages/admin/customers-page.tsx` y tres pruebas de sesión/cuenta.
- Catálogo y datos: `src/data/banners.ts`, `src/data/facets.ts`, `src/components/store/HomeRail.tsx`, `src/components/store/ProductImage.tsx`, `src/logic/services/product-migrate.ts`, `src/logic/services/demo-reset.ts`, `src/logic/services/order-labels.ts` y sus pruebas.
- Móvil y panel: `src/styles/mobile.css`, `src/styles/eshop-{account,catalog,checkout,chrome,home}.css`, `src/components/ui/ResponsiveTable.tsx`.
- Verificación: `scripts/mobile-audit.mjs`, `scripts/build-single.mjs`, `src/logic/services/storage-migration.test.ts`, `src/app/session-routes-v6.test.ts`, `docs/verificacion-movil.{md,json}`, `docs/auditoria.md`, este informe, `ivoria.html` y 96 capturas nuevas (56 en `docs/capturas/verificacion/` y 40 en `docs/capturas/movil/`).

**Modificados (120):** `README.md`, `index.html`, `package.json`, `vite.config.ts`, `scripts/{check-palette,check-contrast,visual-check}.mjs`, `docs/decisiones.md`, `docs/verificacion-visual.json`, 61 capturas de `docs/capturas/verificacion/`, 4 archivos de `src/app/`, 7 de `src/components/`, 13 de `src/logic/`, 13 de `src/pages/`, 9 hojas de `src/styles/`, `src/data/products.ts`, `src/main.tsx` y 2 archivos de `src/motion/`.

**Eliminados (4):** `Sistema de Control e Inventario.html`, `index-completo.html`, `src/motion/components/WordReveal.tsx` y `src/motion/hooks/useScrollProgress.ts`.

## 3. Hallazgos no arreglados

- **No hay hallazgos funcionales, visuales ni de accesibilidad abiertos:** 0 en la auditoría móvil, 0 problemas en `verify:visual`, 0 errores de consola/página y 0 peticiones externas.
- El análisis estático lista 4 usos de `100vh`: tres son `min-height` de los contenedores de la aplicación (`admin.css` ×2, `chrome.css`), no bloqueos de altura; el cuarto es `--app-h: 100vh` en `tokens.css`, sustituido por `100dvh` en `@supports (height: 100dvh)`. Hojas y modales usan directamente `100dvh` con safe-area. No afecta al comportamiento medido.
- `npm audit` informa 1 aviso moderado y 2 críticos en dependencias del toolchain. No bloquea build, tests ni verificación, pero conviene revisarlos antes de publicar.
- Las decisiones de producto de la sección 6 siguen abiertas por diseño, no por defecto técnico.

## 4. Tabla de viewports

Medidos con Chrome sobre `file://`, ambos temas y 13 rutas cada uno; `hasTouch: true` en los ocho primeros y puntero fino en los dos escritorios.

| Viewport | Dispositivo | Claro | Oscuro | Desborde máx. | Objetivos <44 px | Campos <16 px | CLS máx. |
| --- | --- | --- | --- | ---: | ---: | ---: | ---: |
| 320×568 | Teléfono pequeño | OK | OK | 0 px | 0 | 0 | 0,0000 |
| 360×740 | Android | OK | OK | 0 px | 0 | 0 | 0,0000 |
| 390×844 | iPhone | OK | OK | 0 px | 0 | 0 | 0,0000 |
| 412×915 | Android grande | OK | OK | 0 px | 0 | 0 | 0,0000 |
| 430×932 | iPhone grande | OK | OK | 0 px | 0 | 0 | 0,0000 |
| 844×390 | Apaisado | OK | OK | 0 px | 0 | 0 | 0,0000 |
| 768×1024 | Tablet | OK | OK | 0 px | 0 | 0 | 0,0000 |
| 820×1180 | Tablet grande | OK | OK | 0 px | 0 | 0 | 0,0000 |
| 1280×800 | Escritorio | OK | OK | 0 px | 0 | 0 | 0,0000 |
| 1440×900 | Escritorio grande | OK | OK | 0 px | 0 | 0 | 0,0000 |

`verify:visual` añade una matriz de 50 mediciones en 320, 390, 412, 768 y 1280 px × 2 temas × 5 rutas, con CLS máximo 0,0066, 0 tareas largas con CPU ×4 y 0 objetivos/campos problemáticos.

## 5. Peso y métricas

| Métrica | Resultado |
| --- | --- |
| `npm run build` / `build:single` | Correctos; paleta y contraste AA en `prebuild` |
| `npm test` | 14 archivos, 65 pruebas en verde |
| `npm run audit:mobile` | 260 mediciones, 0 hallazgos, 0 problemas |
| `npm run verify:visual` | 86 combinaciones + 50 mediciones móviles, 0 problemas |
| `dist/index.html` / `ivoria.html` | **1.310.724 bytes** (1.280,00 KiB; 490.031 gzip), límite 2,5 MB |
| Croma visible | 100 % dentro de 350°–40° |
| Desborde horizontal | 0 px |
| CLS | 0,0052 escritorio; 0,0066 móvil (límite 0,01) |
| Tareas largas | 0 (interacción con CPU ×4) |
| Objetivos táctiles / campos | 0 por debajo de 44 px / 0 por debajo de 16 px |
| Hover | 52/52 reglas dentro de `@media (hover: hover)` |
| Errores / peticiones externas | 0 / 0 |
| E2E | personal, cliente, visitante (portada, guardas y rutas públicas) y filtros por URL: OK |
| Humo final `file://` | Título Ivoria, marca visible, 5 entradas en la tabbar, 0 desbordes, 0 errores, 0 externas |

## 6. Decisiones pendientes

Ya resueltas en esta ronda: nombre comercial, monograma «I» compartido con el favicon, breakpoints unificados (360/480/768/1024/1280, más 1281 en `min-width`) y barra inferior del panel.

Pendientes de confirmación de producto:
1. **Paleta definitiva** — la actual burdeos/arcilla/crema/arena cumple AA y está bloqueada en `src/styles/tokens.css`.
2. **Logo real** — sustituir el monograma mediante `BRAND.logoUrl`.
3. **Backend de recuperación de contraseña** — hoy es una pantalla simulada en `customer-auth.ts`.
4. **Pago real** — hoy es simulado y se indica explícitamente en el checkout.
5. **Revisión de `npm audit`** antes de publicar (1 moderada, 2 críticas en el toolchain).

Todo el cambio sigue sin commitear sobre la base `fbb2035`; la entrega lista para revisión es `ivoria.html`.
