# Movimiento — ronda 4

**Lenguaje:** marfil pulido. Las cosas aparecen con peso, se asientan y desaparecen sin dramatismo. Nada de rebotes caricaturescos, nada de confeti que tape la interfaz, nada que obligue a esperar para entender qué pasó.

Esta guía es la fuente de verdad del movimiento de la tienda y del panel. Todo número vive en [`src/motion/tokens.ts`](../src/motion/tokens.ts); los colores siguen viviendo solo en `src/styles/tokens.css`. Si necesitas un valor nuevo, añádelo a los tokens y reutilízalo.

---

## 1. Principios

1. **El movimiento confirma, no cuenta la historia.** Toda acción importante tiene su texto en `aria-live` o un `role="status"`. El movimiento es la capa amable, nunca el único canal.
2. **Solo `transform` y `opacity`.** `clip-path` y `filter` se permiten solo en efectos puntuales (corazón, brillo, backdrop de hojas) y nunca en bucles largos. Se prohíben animaciones de `width`, `height`, `top`, `left`, `margin` o `box-shadow`.
3. **Entrada pausada, salida rápida.** Entrada 320–450 ms, salida 180–240 ms, respuesta al toque < 100 ms. La jerarquía de duraciones es `dur.micro < fast < step < base < slow < hero`.
4. **Curvas con desaceleración larga.** `easeOutQuint` / `easeOutExpo` para todo lo que entra; `easeInOutSoft` solo para cambios de estado. Los muelles (`spring.press`, `spring.settle`) se reservan para respuesta táctil y asiento.
5. **Un stagger con techo.** `staggerDelay()` usa `stagger.maxTotal = 0.4 s`: la décima tarjeta no espera más que la sexta en una cuadrícula de dos columnas.
6. **Sin temporizadores de adorno.** Las limpiezas usan `onAnimationComplete` / `onAnimationEnd`. No hay `setTimeout` de 1200 ms para revelar ni para retirar el vuelo.
7. **Reduced-motion no es "sin feedback".** Se eliminan vuelo, brillo, chispas, flotación, inclinación y confeti; se conserva un fundido de 140 ms y, sobre todo, el mensaje accesible. Ver `motionSafe()` y `@media (prefers-reduced-motion: reduce)`.
8. **El dispositivo manda.** `isLightDevice()` desactiva inclinación, brillo y chispas en equipos modestos. La cola de vuelo está limitada a 3 miniaturas.

---

## 2. Arquitectura

| Pieza | Función |
| --- | --- |
| `src/motion/tokens.ts` | Única fuente de números: muelles, curvas, duraciones, distancias y parámetros por bloque. |
| `src/motion/css-vars.ts` | Inyecta `cssMotion` como variables `--m-*` en `:root`. Importado desde `src/main.tsx`. |
| `src/motion/helpers.ts` | `motionSafe`, `staggerDelay`, `riseFor`, `isLightDevice`, `enqueueFlight`. |
| `src/motion/components/Reveal.tsx` | Entrada al viewport con `whileInView`, `once`, `amount: 0.15`. Sin temporizadores. |
| `src/motion/components/RollingNumber.tsx` | Dígitos con ancho fijo; el texto accesible queda fuera del grupo animado. |
| `src/motion/hooks/useFlyToCart.tsx` | Vuelo arqueado, cola acotada y pulso separado en `BumpContext` para no repintar 59 tarjetas. |
| `src/styles/motion.css` | Vuelo, anillo, view transitions, keyframes CSS y reglas de reduced-motion. |
| `src/app/layouts/store-layout.tsx` | View Transitions con elemento compartido `ivoria-producto` y fallback Framer. La clave del `main` es la **ruta**, no la query: cambiar filtros no remonta la hoja. |

### View Transition compartida

La tarjeta → ficha usa `view-transition-name: ivoria-producto` (`PRODUCT_TRANSITION_NAME`) sobre `.eshop-photo`. La cabecera y la barra inferior viven fuera del `<main>` y permanecen estables. Si `startViewTransition` no existe o el usuario prefiere menos movimiento, se usa la variante Framer de `routeVariants`.

---

## 3. Catálogo B1–B9

| ID | Qué cambió | Archivos | Tokens principales | Duración / curva |
| --- | --- | --- | --- | --- |
| **B1** | Tarjeta de producto: imagen, badge, favorito con corazón relleno, check dibujado, suscripción por línea. | `src/components/store/ProductCard.tsx`, `ProductImage.tsx`, `src/styles/eshop-catalog.css` | `cardMotion`, `dur.fast/base/check`, `ease.easeOutQuint`, `spring.settle` | badge 180 ms; check 600 ms; toque 80 ms (`tapScale`) |
| **B2** | Respuesta táctil inmediata en botones y stepper; vibración implementada pero apagada. | `ProductCard.tsx`, `src/components/ui/Button.tsx`, `src/motion/tokens.ts` | `haptics.enabled = false`, `spring.press`, `cardMotion.tapScale` | < 100 ms, muelle sin rebote |
| **B3** | Vuelo al carrito con miniatura `ProductArt`, arco, destino visible, cola de 3 y pulso del contador. | `src/motion/hooks/useFlyToCart.tsx`, `StoreChrome.tsx`, `src/styles/motion.css` | `flyCart`, `ease.easeOutQuint`, `spring.settle`, `reduced.duration` | 660 ms ida; anillo 400 ms; pulso con muelle |
| **B4** | Carrusel de portada con capas en paralaje y barra de autoavance. | `src/pages/store/home-page.tsx`, `src/styles/eshop-catalog.css` | `bannerMotion`, `dur.hero`, `ease.easeOutExpo` | autoavance 6,5 s; desplazamiento 480 ms |
| **B5** | Confirmación de pedido: check que se dibuja y resumen que entra sin desplazar el layout. | `src/pages/store/order-page.tsx`, `src/styles/order.css` | `dur.check`, `ease.easeOutQuint`, `cardMotion` | check 600 ms; entrada 320 ms |
| **B6** | Cabecera móvil que se oculta al bajar mediante `transform`, barra de escritorio siempre en flujo (evita 44 px de CLS al volver arriba), píldora `layoutId`, contadores rodantes, megamenú sin destello. | `src/components/store/StoreChrome.tsx`, `src/styles/chrome.css`, `src/styles/eshop-chrome.css` | `chromeMotion`, `spring.ui`, `dur.step` | cabecera 240 ms; píldora con muelle |
| **B7** | Celebración contenida al confirmar: 16 partículas, radio 96, apagada con reduced-motion o equipo ligero. | `src/pages/store/order-page.tsx`, `src/styles/motion.css` | `celebration`, `dur.celebration` | 1,2 s, una sola vez |
| **B8** | Checkout, estados vacíos y skeletons: progreso, errores con sacudida corta y contenedores tambaleantes sin CLS. | `src/pages/store/checkout-page.tsx`, `src/components/ui/EmptyState.tsx`, `src/styles/*.css` | `feedback`, `dur.slow`, `ease.easeOutQuint`, `openBox` | skeleton 480 ms; sacudida 6 px |
| **B9** | Panel sobrio: KPI escalonados, barras que crecen desde la base, chip de estado y resaltado de fila. | `src/pages/admin/dashboard-page.tsx`, `orders-page.tsx`, `src/app/layouts/admin-layout.tsx`, `src/styles/admin.css` | `panelMotion`, `stagger.base`, `dur.base/fast`, `ease.easeOutQuint` | KPI 320 ms; barra 480 ms; resaltado 900 ms |

`CartPopover.tsx` y su CSS se eliminaron: el carrito se comunica con `aria-live` y la chrome, no con un toast duplicado.

---

## 4. Verificación

```bash
npm run build:single
npm run verify:motion    # 10 flujos + reduced-motion
npm run record:motion    # 5 clips .webm de 10 s
npm run verify:visual
npm run audit:mobile
```

`verify:motion` abre `dist/index.html` con `file://` en 390×844 y 1280×800, con CPU ×4, latencia 180 ms y 120/60 KBps. Repite cada flujo una vez como calentamiento y mide la segunda interacción (estado estacionario). Escribe `docs/verificacion-motion.json`, capturas `despues-*.png` y comprueba:

- **Objetivo:** ≥ 55 fps; 0 tareas largas > 50 ms; CLS ≤ 0,05; 0 nodos huérfanos tras 2 s.
- **Suelo de regresión (lo que bloquea el script):** ≥ 32 fps, ≤ 6 tareas largas, ≤ 250 ms por tarea, CLS ≤ 0,05, 0 huérfanos, 0 errores, 0 peticiones externas, reduced-motion correcto.
- Las desviaciones del objetivo se imprimen como **avisos** y se guardan en `report.warnings`; nunca se ocultan.

Evidencia: `docs/motion-anteces.json` y `docs/capturas/ronda4/antes-*.png` (antes), `docs/verificacion-motion.json` y `despues-*.png` (después), y los cinco `.webm` del mismo directorio.

---

## 5. Checklist para tocar movimiento

- [ ] ¿El número nuevo está en `tokens.ts` y, si CSS lo necesita, en `cssMotion`?
- [ ] ¿Solo animo `transform` / `opacity`? Si no, ¿está justificado y es puntual?
- [ ] ¿La acción se entiende con `prefers-reduced-motion: reduce` sin el adorno?
- [ ] ¿Hay texto accesible aunque la animación no se vea?
- [ ] ¿La limpieza usa eventos de animación, no `setTimeout`?
- [ ] ¿La píldora/elemento compartido sigue teniendo un `layoutId` / `view-transition-name` único?
- [ ] ¿He pasado `npm run build`, `npm test`, `npm run verify:motion` y `npm run verify:visual`?

---

## 6. Decisiones pendientes de confirmación

1. **Hápticos:** `haptics.enabled = false`. El código llama a `navigator.vibrate` solo si se activa el token. ¿Se enciende en móvil?
2. **Celebración:** 16 partículas en 1,2 s. ¿Se mantiene esta intensidad o se baja a 8?
3. **Panel:** se ha elegido la versión sobria (sin celebraciones). ¿Debe quedarse así o quiere un acento algo más visible al entregar un pedido?
