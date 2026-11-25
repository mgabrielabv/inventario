# Entrega — ronda 4 de movimiento

Cierre de M1–M7 y acabado B1–B9 de la tienda y el panel de Ivoria. Sin dependencias nuevas: `framer-motion`, CSS, SVG y Playwright ya presentes.

---

## 1. M1–M7: defecto → solución → evidencia

| ID | Defecto reproduceble «antes» | Solución «después» | Evidencia |
| --- | --- | --- | --- |
| **M1** | Vuelo al carrito con miniatura SVG de 11×11 y destino poco claro (`motion-anteces.json`). | Miniatura `ProductArt`, arco, destino visible (header/móvil/tabbar), cola máxima 3, pulso separado en `BumpContext`. | `antes-vuelo-390-no-preference.png` → `despues-390-anadir-carrito.png`; `anadir-carrito.webm`; `verify:motion` (`flight.tokens`, `thumb`, `ripple`). |
| **M2** | Toast duplicado «Agregado al carritoAgregado al carrito» y aviso solo visual. | `aria-live` funcional siempre; toast queda solo para errores/deshacer; `CartPopover` eliminado. | `antes-vuelo-390-no-preference.png` → `despues-390-*`; `verify:motion` (`live` contiene «Agregado al carrito», 0 tareas huérfanas). |
| **M3** | Con `prefers-reduced-motion` no había ningún aviso y los adornos seguían en juego. | `motionSafe()`, fundidos de 140 ms y `aria-live`; vuelo, brillo, chispas y confeti se ocultan. | `antes-catalogo-390-reduce.png` → `despues-390-*`; `verify:motion` → `Reducido: 390, 1280`, 0 adornos, 0 huérfanos. |
| **M4** | `Reveal` con `opacity: 1` / `transform: none` antes y después, retrasado por un `setTimeout` de 1200 ms. | `initial="hidden"`, `y 12/14`, `whileInView`, `once`, `amount 0.15`, sin temporizadores. | `antes-reveal-1280.png` → `despues-1280-abrir-ficha.png`; `src/motion/components/Reveal.tsx`. |
| **M5** | Navegación tarjeta → ficha sin transición ni elemento compartido (`route: opacity 1, transform none`). | View Transitions con `view-transition-name: ivoria-producto`, fallback Framer y restauración de scroll en `POP`. | `antes-ruta-1280.png` → `despues-1280-abrir-ficha.png`; `abrir-ficha.webm`. |
| **M6** | Tilt activo en táctil/reduced-motion y sin respeto por equipo ligero; microinteracciones sin respuesta inmediata. | `useParallaxTilt` solo con `(hover: hover) and (pointer: fine)`; `isLightDevice()`; `spring.press` y `tapScale` < 100 ms; vibración implementada pero apagada. | `antes-catalogo-390-no-preference.png` → `despues-390-anadir-carrito.png`; `useParallaxTilt.ts`, `tokens.ts`. |
| **M7** | Limpieza por `setTimeout`, nodos huérfanos y CLS intermitente hasta 0,0753 al volver arriba (barra de utilidades `hidden`). | Limpieza con `onAnimationComplete`/`onAnimationEnd`; barra de escritorio siempre en flujo; cabecera móvil oculta con `transform`. | `verify-motion.json`: CLS máx. 0, 0 huérfanos, 10/10 flujos; `hoja-filtros.webm`, `estado-pedido.webm`, `confirmar-pedido.webm`. |

Las capturas y grabaciones están en `docs/capturas/ronda4/`; el estado inicial quedó registrado en `docs/motion-anteces.json`.

---

## 2. B1–B9: archivo, tokens, duración y curva

| ID | Archivos principales | Tokens | Duración / curva |
| --- | --- | --- | --- |
| **B1** Tarjeta y badge | `ProductCard.tsx`, `ProductImage.tsx`, `eshop-catalog.css` | `cardMotion`, `dur.fast/base/check`, `easeOutQuint`, `spring.settle` | badge 180 ms · check 600 ms · toque 80 ms |
| **B2** Respuesta táctil | `ProductCard.tsx`, `ui/Button.tsx`, `tokens.ts` | `haptics.enabled=false`, `spring.press`, `tapScale` | < 100 ms, muelle sin rebote |
| **B3** Vuelo al carrito | `useFlyToCart.tsx`, `StoreChrome.tsx`, `motion.css` | `flyCart`, `easeOutQuint`, `spring.settle` | ida 660 ms · anillo 400 ms |
| **B4** Portada y carrusel | `home-page.tsx`, `eshop-home.css` | `bannerMotion`, `dur.hero`, `easeOutExpo` | autoavance 6,5 s · desplazamiento 480 ms |
| **B5** Pedido confirmado | `order-page.tsx`, `order.css` | `dur.check`, `easeOutQuint`, `cardMotion` | check 600 ms · entrada 320 ms |
| **B6** Chrome de tienda | `StoreChrome.tsx`, `chrome.css`, `eshop-chrome.css` | `chromeMotion`, `spring.ui`, `dur.step` | cabecera 240 ms · píldora con muelle |
| **B7** Celebración contenida | `order-page.tsx`, `motion.css` | `celebration`, `dur.celebration` | 1,2 s · 16 partículas · radio 96 |
| **B8** Checkout, vacíos y skeletons | `checkout-page.tsx`, `EmptyState.tsx`, `styles/*.css` | `feedback`, `dur.slow`, `easeOutQuint` | skeleton 480 ms · sacudida 6 px |
| **B9** Panel sobrio | `dashboard-page.tsx`, `orders-page.tsx`, `admin-layout.tsx`, `admin.css` | `panelMotion`, `stagger.base`, `dur.base/fast` | KPI 320 ms · barra 480 ms · resaltado 900 ms |

Detalle completo en `docs/motion.md`. Todos los números de movimiento salen de `src/motion/tokens.ts` y se inyectan en CSS desde `src/motion/css-vars.ts`; los colores siguen solo en `src/styles/tokens.css`.

---

## 3. Archivos nuevos, modificados y eliminados

**Nuevos**
- `scripts/verify-motion.mjs`, `scripts/record-motion.mjs`.
- `src/motion/css-vars.ts`, `src/motion/helpers.ts`, `src/motion/helpers.test.ts`, `src/motion/shared-transition.ts`.
- `docs/motion.md`, `docs/motion-anteces.json`, `docs/verificacion-motion.json`, `docs/entrega-ronda4.md`.
- `docs/capturas/ronda4/` (7 capturas «antes», 10 «después», 5 `.webm`).

**Modificados**
- `package.json` (`verify:motion`, `record:motion`, umbrales de `verify:visual`).
- `scripts/visual-check.mjs`.
- `src/main.tsx`, `src/app/layouts/store-layout.tsx`, `src/app/layouts/admin-layout.tsx`.
- `src/motion/tokens.ts`, `src/motion/variants.ts`, `src/motion/components/Reveal.tsx`, `src/motion/hooks/useFlyToCart.tsx`, `src/motion/hooks/useParallaxTilt.ts`.
- `src/components/store/ProductCard.tsx`, `ProductImage.tsx`, `CartSummary.tsx`, `CartLineItem.tsx`, `StoreChrome.tsx`.
- `src/components/ui/Button.tsx`, `src/components/ui/EmptyState.tsx`.
- `src/pages/store/catalog-page.tsx`, `product-page.tsx`, `home-page.tsx`, `checkout-page.tsx`, `order-page.tsx`.
- `src/pages/admin/dashboard-page.tsx`, `src/pages/admin/orders-page.tsx`.
- `src/styles/motion.css`, `eshop-catalog.css`, `eshop-chrome.css`, `eshop-home.css`, `chrome.css`, `admin.css`, `components.css`, `mobile.css`, `store.css`.

**Eliminados**
- `src/components/store/CartPopover.tsx` y su CSS asociado.
- Grabaciones temporales `page@*.webm` de intentos fallidos del grabador.

---

## 4. Métricas finales

| Comprobación | Resultado |
| --- | --- |
| `npm run build` | OK · `dist/index.html` 1,326.84 kB · gzip 497.28 kB (límite 2,5 MB) · paleta y contrato AA OK |
| `npm test` | 15 archivos · 70 pruebas pasadas |
| `npm run verify:motion` | 10/10 flujos · FPS mín. 38.8 · **CLS máx. 0.0000** · 2 tareas largas · max task ≤ 250 ms · 0 huérfanos · 0 externas · 0 errores · **0 problemas** |
| `npm run verify:visual` | HTML 1,27 MiB / gzip 0,47 MiB · CLS 0.0000 en claro y oscuro · 0 tareas largas · móvil 50 mediciones, CLS máx. 0.0004 · desborde 0 px · E2E personal/cliente/invitado/filtros OK |
| `npm run audit:mobile` | 260 mediciones · 0 familias de hallazgos · 10 viewports (incluye 360×740 y 390×844) |
| Recorrido guiado 390×844 y 360×740 | 12/12 comprobaciones en cada tamaño (catálogo, vuelo, aviso, ficha, volver, filtros, checkout, cambio de estado) |
| Grabaciones | 5 `.webm` de 10 s: añadir, abrir ficha, hoja de filtros, confirmar pedido, estado del panel |
| Condiciones de estrés | `file://` · CPU ×4 · latencia 180 ms · 120/60 KBps · 390×844 táctil y 1280×800 ratón |

`verify:motion` conserva dos niveles: **objetivo** (≥55 fps, 0 tareas largas) y **suelo de regresión** (≥32 fps, ≤6 tareas largas, ≤250 ms/tarea, CLS ≤0,05, 0 huérfanos). Las 15 desviaciones del objetivo se imprimen como avisos y se guardan en `report.warnings`; no se silencian.

---

## 5. Lo que no se hizo y por qué

- **FPS ≥55 en los 10 flujos bajo CPU ×4:** no se alcanzó en abrir ficha, hoja de filtros, confirmar pedido y estado del panel (mínimo 38,8). El coste está en renderizar la ficha completa y la hoja del panel con el procesador a un cuarto; se mantuvo el suelo de 32 fps y se documentaron los avisos en vez de relajar la medición.
- **0 tareas largas:** bajo el mismo estrés aparecen 1–3 por flujo (máx. ≤250 ms). Se mitigaron las causas identificables (pulso fuera del contexto de tarjetas, `layout` eliminado en el stepper, limpieza sin temporizadores); el resto es ruido del primer fotograma y se reporta como aviso.
- **Prueba manual humana:** no se pudo ejecutar en este entorno. Se sustituyó por un recorrido guiado automatizado en 390×844 y 360×740 con 12 comprobaciones por tamaño, todas correctas.
- **Hápticos:** `haptics.enabled = false`; el código está listo pero no se activa sin confirmación.
- **Celebración del panel:** se entregó la versión sobria; no se añadió confeti al panel de administración.
- **Capturas generadas:** las capturas de `docs/capturas/verificacion` y `docs/capturas/movil` se regeneraron al repetir las verificaciones; no son cambios de código.

---

## 6. Decisiones a confirmar

1. **Hápticos:** ¿activar `navigator.vibrate` en móvil o mantenerlos apagados?
2. **Celebración:** ¿mantener 16 partículas / 1,2 s o bajar a 8 partículas?
3. **Panel:** ¿conservar la versión sobria o añadir un acento visible al completar un pedido?
4. **Barra de utilidades del escritorio:** se dejó siempre visible para eliminar el CLS de 44 px al volver arriba. ¿preferir recuperar el colapso visual con `transform` (sin CLS) o mantener este comportamiento?
5. **Umbrales de `verify:motion`:** ¿conservar objetivo + suelo con avisos, o elevar el suelo a 55 fps asumiendo fallos intermitentes en CI con CPU ×4?
