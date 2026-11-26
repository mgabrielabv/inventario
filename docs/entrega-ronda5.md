# Entrega — ronda 5: portada e isla de búsqueda

Fecha: 2026-11-26. Todo el trabajo queda **sin commitear**. Sin dependencias nuevas: se mantienen React, Framer Motion para la tienda, CSS y Playwright, ya presentes en el proyecto. El artefacto funciona con `file://` en un único HTML.

## 1. Resumen por fase

| Fase | Trabajo | Cierre |
| --- | --- | --- |
| **1 · Isla de búsqueda y cabecera** | `SearchIsland.tsx` con píldora estable en reposo, hover, foco, texto largo y autocompletado; botón dentro de la isla, sugerencias ancladas por CSS y menú de cuenta que cierra por ruta, clic y Escape devolviendo el foco. La cabecera pasa a dos niveles y la cinta plegable anima solo `transform`/`opacity`. | Verde; 12 capturas `search-island-*` y 2 `account-menu-*` conservadas. |
| **2 · Datos y lenguaje** | Seis departamentos reales como única taxonomía (`category-rules.json`), plural centralizado en `pluralize()` y tarjetas con «marca + categoría» en una línea. Sin «Presentación · unidad». | Verde; mismos selectores de isla y menú. |
| **3 · Fondo vivo** | `LivingBackground` con malla, aurora, rejilla, grano, partículas y luz de cursor; `aria-hidden`, sin eventos y sin cambiar layout. `usePerformanceTier()` elige `full`/`lite`/`static` y degrada por hardware, puntero y muestreo. Solo `transform`/`opacity`. | Verde; 10 partículas en `full`, 5 en `lite`, 0 en estático. |
| **4 · Hero flotante** | `HeroScene.tsx` de la portada con producto rotativo, cinco satélites (tres en `lite`) con fotos locales, pods de luz y paralaje de puntero con `requestAnimationFrame`. Sin `DeviceOrientationEvent`. | Verde; animaciones CSS, sin framer-motion en la portada. |
| **5 · Portada de seis secciones** | Hero, escaparate sticky con capítulos, bento, «cómo se usa», departamentos y cierre. Scroll-spy y navegación por capítulos que actualizan el DOM por lista de clases, sin re-render de toda la landing. | Verde; `.landing > main > section` = 6. |
| **6 · Tarjeta y rejilla** | Tono por departamento, foto flotante, sombra de contacto, `.line-clamp`, rejilla con más aire y objetivos táctiles de 44 px. `ProductStage` acepta `categoria` para el fondo acorde. | Verde; 0 hallazgos en auditoría móvil. |
| **7 · Rendimiento y cierre** | Hero sin parallax de scroll (`requestAnimationFrame` solo para el puntero), marquesina de fotos retirada del fondo, `ProductImage` sin blur-up duplicado ni `filter` animado, `HomePage` con los rines desde el inicio, `StoreChrome` con listener pasivo en lugar de `useScroll()`, `StatusChip` memoizado y `Sheet` con fundido de `opacity`. `.living-bg` pasa a `fixed` con `100svh`. | Verde; portada a **60 FPS** a 1280×720 con CPU ×1,5. |

Tras cada fase se ejecutaron `npm run lint`, `npx tsc -b` y `npm test`. Al cierre se ejecutaron además `npm run build`, `npm run build:single`, `npm run verify:visual`, `npm run audit:mobile` y `npm run verify:motion`, todos en verde.

## 2. Cifras finales medidas

| Comprobación | Resultado |
| --- | --- |
| `npm run lint` | 0 errores; 22 advertencias preexistentes de fast-refresh y `set-state-in-effect` |
| `npx tsc -b` | correcto |
| `npm test` | **23 archivos / 116 pruebas** en verde |
| `npm run build:single` | correcto; paleta (168 archivos, 39 colores) y contraste AA en `prebuild`; `dist/index.html` 2.681.037 bytes (976.732 gzip) e `ivoria.html` **2618,20 KiB**, frente al límite de 4,5 MiB |
| `npm run verify:visual` | croma **100 %**, desborde máx. 0 px, CLS **0,0000** y **0 tareas largas** en claro y oscuro; 60 mediciones móviles con CLS máx. 0,000035, 0 objetivos <44 px, 0 campos <16 px |
| E2E | personal OK, cliente OK (`IVO-2026-000007`), visitante OK (6 secciones y redirecciones), filtros OK; 0 errores, 0 peticiones externas, 331 fotos importadas cargadas |
| `npm run audit:mobile` | **280 mediciones**, **0 familias de hallazgos**, 0 problemas en 10 viewports × 2 temas × 14 rutas |
| `npm run verify:motion` | **10/10 flujos** correctos; FPS mín. **44,4**, CLS máx. **0,0000**, 1 tarea larga, fotograma largo máx. 183,3 ms; 0 errores y 0 peticiones externas; **presupuestos de regresión OK** |
| Portada 1280×720 | **60 FPS**, 0 fotogramas largos en 3 s con CPU ×1,5 (`file://`, Chrome headless) |
| Umbrales | sin cambios: objetivo ≥55 FPS / 0 tareas largas, suelo ≥32 FPS / ≤6 tareas / ≤250 ms por tarea; las 10 desviaciones del objetivo se imprimen como avisos, no se silencian |

## 3. Capturas e informes

- `docs/capturas/verificacion/home-{1280,768,412,320}-{light,dark}.png` — portada final en cuatro anchos y ambos temas.
- `docs/capturas/verificacion/e2e-landing-visitante-light.png` — recorrido del visitante por las seis secciones.
- `docs/capturas/verificacion/search-island-*.png` — reposo, hover, foco, texto largo, autocompletado y sugerencias en claro y oscuro.
- `docs/capturas/verificacion/account-menu-{1280,1920}-light.png` — menú de cuenta en escritorio; en móvil se documenta como hoja lateral.
- `docs/capturas/movil/` — capturas de las 280 mediciones de la auditoría móvil.
- `docs/verificacion-visual.json`, `docs/verificacion-movil.{md,json}`, `docs/verificacion-motion.json` — detalles y avisos.
- `docs/decisiones.md` — alternativas descartadas (giroscopio, `backdrop-filter`, marquesina y throttling de CPU).

## 4. Archivos principales tocados en esta ronda

`src/pages/landing/landing-page.tsx`, `src/pages/landing/HeroScene.tsx`, `src/components/landing/LivingBackground.tsx`, `src/components/store/SearchIsland.tsx`, `src/components/store/ProductCard.tsx`, `src/components/store/ProductStage.tsx`, `src/components/ui/Sheet.tsx`, `src/pages/admin/orders-page.tsx`, `src/motion/tokens.ts`, `src/motion/hooks/usePerformanceTier.ts`, `src/styles/{landing,hero-scene,living-background,search-island,eshop-catalog,store,admin}.css`, `scripts/{visual-check,verify-motion}.mjs` y la documentación de `docs/`.

## 5. Salvedades

- `verify:motion` reporta 10 avisos de objetivo (FPS de 44,4 a 54,7 y una tarea larga en todo el recorrido), todos por encima del suelo de regresión. El recuento y las cifras varían entre ejecuciones con la carga externa (en otra medición: FPS mín. 48,4 y 2 tareas largas). No se rebajaron los umbrales.
- El pago y la recuperación de contraseña siguen siendo simulados y se dicen explícitamente en la interfaz; no hay backend.
- Existen archivos sin trackear preexistentes (`dist.zip`, `dist-debug.zip`, `*.tar.xz`) que se dejaron intactos.
