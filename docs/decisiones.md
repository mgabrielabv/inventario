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

`src/motion/tokens.ts` concentra muelles, duraciones, curvas y parámetros de interacción; `src/motion/variants.ts` expone las variantes. Los componentes importan esos módulos y no llevan números mágicos de animación. `MotionConfig reducedMotion="user"` y `@media (prefers-reduced-motion: reduce)` desactivan movimientos no esenciales.

|Token|Uso|
|---|---|
|A1|Transición de ruta en los dos layouts|
|A2|Resaltado deslizante de la navegación del panel|
|A3|Titular palabra por palabra con máscara y desenfoque|
|A4|Relato fijado de 400 vh ligado al scroll, sin resorte|
|A5|Aparición escalonada de tarjetas y secciones|
|A6|Inclinación del puntero sobre la caja del héroe|
|A7|Buscador y menú móvil como capas sobre la barra|
|A8|Cambio de tema con View Transitions|
|A9|Vuelo en arco al carrito y rebote del contador|
|A10|Hojas laterales e inferior con resorte|
|A11|Pasos direccionales del checkout|
|A12|Cifras que ruedan al cambiar|
|A13|Indicadores de existencias y reservas|
|A14|Avisos como isla dinámica centrada|
|A15|Resaltado de filas en buscador y paleta de comandos|
|A16|Popovers y conmutadores con `layoutId`|
|A17|Foco visible y anillos de control|
|A18|Presión y confirmación de botones y cajas|
|A19|Caja vacía que se asienta en estados sin datos|
|A20|Caja abierta que se dibuja en estados vacíos|

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
- `npm run verify:visual` — recorre rutas con Chrome del sistema, toma capturas en claro/oscuro y móvil, ejecuta el acceso del personal y un checkout completo, y mide croma, CLS, errores de consola, peticiones externas y tamaño del HTML.

La verificación detectó un fallo real en el checkout: React reutilizaba el nodo del botón “Continuar” al convertirlo en “Confirmar pedido” y el cambio de `type` a `submit` disparaba el envío antes de la revisión. Se corrigió dando claves distintas a ambos botones; el E2E cubre ahora los cuatro pasos hasta la confirmación.

Resultado final: HTML de 1.015.839 bytes (0,97 MiB; 424.684 bytes gzip), croma visible 100%, CLS 0,0000, 0 errores de consola, 0 peticiones externas y ambos flujos E2E correctos.

Las capturas anteriores quedan en `docs/capturas/` como referencia del estado inicial. Las nuevas se guardan en `docs/capturas/verificacion/` junto a `docs/verificacion-visual.json`.
