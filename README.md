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

`npm run verify:visual` abre Chrome del sistema (`/usr/bin/google-chrome`) sobre `vite preview`, recorre las rutas principales en claro, oscuro y móvil, inicia sesión con el perfil de administrador, guarda capturas en `docs/capturas/verificacion/` y escribe `docs/verificacion-visual.json` con tamaño del HTML, CLS y errores de consola.

El presupuesto del HTML es **< 2.5 MB**. El informe incluye el tamaño real medido.
