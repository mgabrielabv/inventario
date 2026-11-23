# Decisiones de la reconstrucción

## Alcance

La aplicación vuelve a construirse como una sola página con tres superficies:

- **Tienda**: inicio, catálogo, ficha de producto, carrito, checkout, confirmación, seguimiento y favoritos.
- **Acceso del personal**: `/ingresar`.
- **Panel**: inicio, inventario, movimientos, pedidos, reposición, reportes y configuración.

La navegación usa `HashRouter` para que el HTML funcione también con `file://`. El resultado de `npm run build` es un único `dist/index.html` generado por `vite-plugin-singlefile`; no hay peticiones a recursos remotos.

## Paleta y contraste

Los únicos colores literales están en `src/styles/tokens.css`. Los cuatro colores base son ley:

| Color | Valor |
| --- | --- |
| Burdeos | `#890000` |
| Arcilla | `#BA8376` |
| Crema | `#FFF4ED` |
| Arena | `#D2B48C` |

Todas las superficies, textos, líneas, estados y sombras se derivan de esos cuatro valores. `npm run check:palette` falla si aparece un literal fuera de `tokens.css` o si un color de tokens sale de la familia burdeos–arcilla–crema–arena. `npm run check:contrast` comprueba los pares reales de texto y controles en claro y oscuro contra WCAG AA. Ambos scripts corren en `prebuild`.

Los estados nunca se comunican solo con color: llevan punto, icono y texto.

## Tipografía

Inter Variable embebida como woff2 (subconjuntos latin y latin-ext) en `src/styles/fonts.css`. Vite la inlinea en el HTML. Se usan pesos 100–900 y optical sizing; titulares en oración normal, tracking negativo, sin condensados ni mayúsculas decorativas. El mínimo absoluto es 12 px.

## Movimiento

`src/motion/tokens.ts` concentra muelles, duraciones y curvas (A1–A20). Los componentes importan esos tokens o las variantes de `src/motion/variants.ts`; no llevan números mágicos de animación. `MotionConfig reducedMotion="user"` y `@media (prefers-reduced-motion: reduce)` desactivan movimientos no esenciales.

Los avisos son una “isla dinámica” centrada debajo de la barra: no tapan la navegación ni usan el toast de Sonner. El cambio de tema usa View Transitions cuando el navegador lo permite.

## Datos y stock

Tienda y panel comparten el mismo inventario. `reservado` es la suma de líneas de pedidos en estados activos (`Pendiente`, `Confirmado`, `Preparando`, `Listo`) y `disponible = stock - reservado`. Al entregar un pedido se generan movimientos `Salida/Venta` que bajan el stock real; al cancelar se libera la reserva sin crear movimientos. La confirmación de compra revalida el stock antes de crear el pedido.

El estado se persiste con Zustand en `localStorage`, con versiones y migración de claves antiguas. Si `localStorage` no está disponible, se usa un mapa en memoria para que la app siga funcionando.

## Acceso y permisos

`admin/admin123` y `operador/operador123` son credenciales de demostración. Las contraseñas se guardan como SHA-256 con sal y se verifican con Web Crypto. La matriz de permisos vive en `src/logic/services/permissions.ts`: la interfaz oculta acciones, pero la lógica también las valida. El operador puede operar el día a día; el administrador puede configurar, exportar, anular, archivar y eliminar.

## Simulación

No hay pasarela de pago, notificaciones ni reseñas. El checkout declara explícitamente que es una demostración. Los PDF se generan con la impresión del navegador y una hoja `@media print`, sin dependencias adicionales.

## Verificación

- `npm test` — pruebas unitarias de stock, reservas, pedidos, catálogo, precios, permisos, validación y hashing.
- `npm run check:palette` y `npm run check:contrast` — ejecutados por `prebuild`.
- `npm run build` — chequeo de tipos y HTML único.
- `npm run verify:visual` — recorre rutas con Chrome del sistema, toma capturas en claro/oscuro y móvil, mide CLS, errores de consola y tamaño del HTML.

Las capturas anteriores quedan en `docs/capturas/` como referencia del estado inicial. Las nuevas se guardan en `docs/capturas/verificacion/` junto a `docs/verificacion-visual.json`.
