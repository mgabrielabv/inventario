# INVENTARIO — tienda y control de bodega

Aplicación local de demostración con **tienda de cliente** y **panel de inventario** sobre una sola fuente de datos. La interfaz usa movimiento contenido, tipografía Inter y una paleta de cuatro colores derivada del burdeos, la arcilla, la crema y el arena.

## Rutas

|Superficie|Rutas|
|---|---|
|Tienda|`#/`, `#/tienda`, `#/tienda/:slug`, `#/carrito`, `#/pagar`, `#/pedido/:codigo`, `#/seguimiento`, `#/favoritos`|
|Personal|`#/ingresar`|
|Panel|`#/admin`, `#/admin/inventario`, `#/admin/movimientos`, `#/admin/pedidos`, `#/admin/reposicion`, `#/admin/reportes`, `#/admin/configuracion`|

La configuración del panel requiere perfil de administrador.

## Stack

- React 19 + TypeScript estricto + Vite 8
- React Router 7 con `HashRouter` (funciona con `file://`)
- Zustand con persistencia versionada
- Framer Motion con `MotionConfig reducedMotion="user"`
- Lucide React para iconos
- CSS propio; `tokens.css` es el único archivo con colores literales
- Inter Variable embebida como woff2; sin recursos remotos
- `vite-plugin-singlefile`: un único HTML autocontenido

## Uso

```bash
npm install
npm run dev          # http://localhost:5173
npm test             # pruebas unitarias
npm run build        # chequeo de tipos + paleta + contraste + dist/index.html
npm run build:single # copia el HTML a "Sistema de Control e Inventario.html"
npm run preview      # sirve dist/
npm run verify:visual # capturas y comprobación visual (requiere build previo)
```

`prebuild` ejecuta `check:palette` y `check-contrast`; la build falla si aparece un color fuera de la familia permitida o un par de texto que no alcance WCAG AA.

## Credenciales de demostración

|Rol|Usuario|Contraseña|Alcance|
|---|---|---|---|
|Administrador|`admin`|`admin123`|Todo|
|Operador|`operador`|`operador123`|Operación diaria y reportes; sin configuración ni acciones destructivas|

Las contraseñas se almacenan como SHA-256 con sal y se verifican con Web Crypto.

## Modelo de inventario

- `stock` solo cambia por movimientos (`Entrada`, `Salida`, `Ajuste`).
- `reservado =` unidades en pedidos activos; `disponible = stock - reservado`.
- Al entregar un pedido se generan salidas por `Venta` con el código del pedido como referencia.
- Al cancelar se libera la reserva; no se crea un movimiento.
- La compra revalida el stock antes de confirmar y muestra conflictos si cambió.

Los estados llevan siempre punto, icono y texto. Los pagos son simulados y están marcados como demostración; los PDF se obtienen con la impresión del navegador.

## Estructura

```text
src/
├── app/            # router, layouts, providers y rutas protegidas
├── components/     # cajas ilustradas, chrome de tienda y biblioteca de UI
├── data/           # productos, movimientos y pedidos semilla
├── logic/          # tipos, stores de Zustand y servicios puros
├── motion/         # tokens A1–A20, variantes, hooks y componentes
├── pages/          # páginas de tienda, acceso y panel
└── styles/         # tokens, tipografía, base, movimiento, componentes y páginas
scripts/            # comprobaciones de paleta/contraste y verificación visual
docs/capturas/      # capturas del estado anterior
docs/decisiones.md  # criterios de diseño y verificación
```

## Verificación

`npm run verify:visual` abre Chrome del sistema (`/usr/bin/google-chrome`) sobre el HTML generado (`file://`), inicia sesión con el perfil de administrador, completa un checkout hasta la confirmación del pedido, recorre las rutas en claro, oscuro y móvil, guarda capturas en `docs/capturas/verificacion/` y escribe `docs/verificacion-visual.json` con tamaño del HTML, CLS, errores de consola y peticiones externas.

El presupuesto del HTML es **< 2.5 MB**. Resultado medido en `npm test` (14 pruebas), `npm run build` y `npm run verify:visual`:

- `dist/index.html`: **1.016.080 bytes** (0,97 MiB; 424.758 bytes gzip).
- Croma visible dentro de 350°–40°: **100 %** en las 34 capturas.
- Durante el scroll del héroe con CPU ×4: **CLS 0** y **0 tareas largas** (máx. 0 ms).
- **0** errores de consola y **0** peticiones externas.
- E2E correcto: acceso `admin/admin123` y checkout completo hasta `INV-2026-000007`.

Índice de capturas: `home-*.png`, `narrative-{0,0.2,0.4,0.6,0.8,1}-*.png` (A4), `fly-to-cart-{0..5}-*.png` (A9) y `e2e-*.png`, todas en `docs/capturas/verificacion/`.
