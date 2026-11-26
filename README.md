# Ivoria — tienda departamental (demo local)

**Ivoria** — *Todo para tu casa y tu día, en un solo lugar.* Aplicación local de demostración con **tienda de cliente**, **cuentas de cliente** y **panel del personal** sobre una sola fuente de datos. El nombre definitivo vive en `src/config/brand.ts`; todo lo demás se deriva de ahí.

La tienda cubre nueve departamentos: Tecnología, Accesorios, Hogar y cocina, Papelería y oficina, Juguetes y juegos, Deportes y aire libre, Cuidado personal, Mascotas y Ferretería básica. No es una farmacia y no hay medicamentos ni recetas.

## Rutas

|Superficie|Rutas|
|---|---|
|Tienda|`#/` (portada pública), `#/inicio`, `#/tienda`, `#/tienda?categoria=…`, `#/tienda/:slug`, `#/carrito`, `#/pagar`, `#/pedido/:codigo`, `#/seguimiento`, `#/favoritos`, `#/arte`|
|Cuenta de cliente|`#/cuenta/ingresar`, `#/cuenta/registro`, `#/cuenta/recuperar`, `#/cuenta`, `#/cuenta/pedidos`, `#/cuenta/direcciones`, `#/cuenta/datos`, `#/cuenta/favoritos`|
|Personal|`#/ingresar`|
|Panel|`#/admin`, `#/admin/inventario`, `#/admin/movimientos`, `#/admin/pedidos`, `#/admin/reposicion`, `#/admin/reportes`, `#/admin/clientes`, `#/admin/configuracion`|

Las rutas `#/cuenta/*` usan la sesión de cliente; las de `#/admin` usan la del personal. Una sesión de cliente nunca abre el panel. La configuración y el panel de Clientes requieren permisos específicos.

## Stack

- React 19 + TypeScript estricto + Vite 8
- React Router 7 con `HashRouter` (funciona con `file://`)
- Zustand con persistencia versionada y migración de claves históricas
- Framer Motion con `MotionConfig reducedMotion="user"`
- Lucide React para iconos
- CSS propio; `src/styles/tokens.css` es el único archivo con colores literales
- Inter Variable embebida como woff2; sin recursos remotos
- `vite-plugin-singlefile`: un único HTML autocontenido

No se añadieron dependencias nuevas.

## Uso

```bash
npm install
npm run dev           # http://localhost:5173
npm test              # pruebas unitarias
npm run build         # chequeo de tipos + paleta + contraste + dist/index.html
npm run build:single  # genera ivoria.html en la raíz desde BRAND.slug
npm run preview       # sirve dist/
npm run seed:productos # descarga y verifica fotos; actualiza src/data/productos-reales.json
npm run clean:catalogo # elimina fichas no importadas y fotos rotas (--dry-run para solo informar)
npm run verify:seed    # comprueba fotos, precios y paginación (requiere preview y Chrome/Edge)
npm run verify:visual # capturas, métricas y E2E (requiere build previo)
npm run verify:motion # medición de 10 flujos con CPU ×4 y movimiento reducido
npm run audit:mobile  # auditoría de 10 viewports × 2 temas × 14 rutas
```

`prebuild` ejecuta `check:palette` y `check-contrast`; la build falla si aparece un color fuera de la familia permitida o un par de texto que no alcance WCAG AA. El artefacto descargable se llama `ivoria.html` y se abre con doble clic (`file://`). Los antiguos `Sistema de Control e Inventario.html`, `index-completo.html` y `tienda.html` se eliminaron.

## Credenciales de demostración

|Rol|Usuario|Contraseña|Alcance|
|---|---|---|---|
|Administrador|`admin`|`admin123`|Todo, incluida la configuración y la gestión de clientes|
|Operador|`operador`|`operador123`|Operación diaria y reportes; ve clientes, pero no los gestiona|
|Cliente|`cliente@ejemplo.com`|`cliente123`|Cuenta de compra con direcciones y pedidos|

Las contraseñas se almacenan como SHA-256 con sal y se verifican con Web Crypto. La cuenta de cliente se siembra sola la primera vez. Para comprar hace falta cuenta: `#/` es la portada pública y `#/inicio`, `#/tienda`, `#/carrito`, `#/pagar` y `#/favoritos` redirigen al ingreso si no hay sesión de cliente. `#/seguimiento` y `#/pedido/:codigo` siguen siendo públicos.

## Marca y paleta

`src/config/brand.ts` es la única fuente de marca. Cambia ahí `name`, `shortName`, `slug`, `orderPrefix`, `themeKey` y datos de contacto; de ahí salen el título y la meta del HTML (mediante el plugin `brandHtml` de `vite.config.ts`), el favicon, el monograma, las claves de almacenamiento, los códigos de pedido y los textos de la tienda. Los colores viven aparte, en `src/styles/tokens.css`, con los límites de matiz/saturación y los pares de contraste al principio de ese archivo; los scripts `check-palette` y `check-contrast` leen esa configuración.

El slug anterior `tienda` está en `LEGACY_SLUGS` (`src/config/legacy.ts`) para migrar sin pérdida carrito, favoritos, pedidos, cuentas, tema, borradores e imágenes de IndexedDB. Si vuelve a cambiar `slug`, añade el valor anterior a esa lista y corre `npm run build:single`: el nombre del HTML descargable sigue al slug. La prueba `brand-lint` prohíbe repetir el nombre fuera de `BRAND` y prohíbe el nombre histórico en la tienda, el encabezado, el pie, el acceso de clientes, el título, la meta y las claves activas.

## Portada, cuentas y checkout

- La portada de seis secciones vive en `#/` con tema oscuro propio: escaparate sticky, bento de beneficios, cómo funciona, departamentos y cierre con «Crear cuenta». La tienda privada empieza en `#/inicio`.
- `#/inicio` saluda al cliente, muestra fotos reales en el escaparate y las categorías, y ofrece el riel «Comprar de nuevo» con los productos de sus pedidos. El panel «Tu espacio» reúne pedidos, direcciones, favoritos y el estado del último pedido; ya no hay bloque de registro dentro de la tienda.
- El carrito permite «Comprar de nuevo» desde el último pedido: solo agrega lo que sigue disponible, limita las cantidades al `disponible` actual y valida el resultado antes de fusionarlo con el carrito.
- Personal y clientes guardan sesiones separadas (`KEYS.user` frente a `KEYS.customerSession`).
- La cuenta de cliente permite registrarse, entrar por correo o teléfono venezolano, editar datos, administrar direcciones, ver pedidos y recuperar la contraseña de forma simulada.
- El checkout conserva cuatro pasos (Datos, Entrega, Pago y Revisar) con resumen sticky. La tarjeta del paso de datos muestra siempre la cuenta con la que se compra; no hay modo invitado. El aviso de pago simulado es el mismo en pago, revisión y resumen.
- Prioridad de hidratación: borrador del checkout > datos de la cuenta > carrito.
- Los pedidos se numeran `IVO-AAAA-NNNNNN`; los históricos `PED-` e `INV-` siguen siendo válidos, se buscan igual en seguimiento y cuentan para la secuencia del año.
- La moneda respeta `settings.moneda`: si hay `tasaVES` y `mostrarSecundario`, se muestra el equivalente en bolívares junto al precio principal.

## Modelo de inventario

- `stock` solo cambia por movimientos (`Entrada`, `Salida`, `Ajuste`).
- `reservado =` unidades en pedidos activos; `disponible = stock - reservado`.
- Al entregar un pedido se generan salidas por `Venta` con el código del pedido como referencia.
- Al cancelar se libera la reserva; no se crea un movimiento.
- La compra revalida el stock antes de confirmar y muestra conflictos si cambió.
- El panel de Clientes busca por nombre, correo o teléfono; su auditoría no guarda contraseñas ni datos sensibles.
- El respaldo es v5 e incluye las cuentas de cliente y las fotos subidas desde el panel; los respaldos anteriores sin fotos siguen siendo válidos. “Restablecer datos de demostración” devuelve las 489 fichas reales sin borrar usuarios del personal ni auditoría.

## Catálogo con productos reales

`npm run seed:productos` consulta DummyJSON (`?limit=0`) y Open Food Facts (páginas 1–3) y escribe `src/data/productos-reales.json` con el esquema exacto de `Product`: **489 fichas reales** (194 de DummyJSON y 295 de supermercado). Solo se guardan URLs de imágenes (713 en total); no se descarga ningún archivo binario. El script reintenta ante los `503` intermitentes de Open Food Facts, conserva las fichas ya sembradas si una página falla y es idempotente: al repetirlo, el JSON queda byte a byte idéntico.

`npm run clean:catalogo` comprueba cada URL con HEAD (o GET parcial), descarta respuestas `404`/`410`/`timeout`/HTML y tipos MIME no imagen, y elimina cualquier producto que se quede sin foto válida. También descarta fichas que no vengan de las dos APIs. El informe queda en `docs/limpieza-catalogo.json`. La limpieza está integrada en el seeder para que las futuras cargas mantengan el mismo filtro.

El catálogo ya no incluye las 60 fichas de relleno con ilustraciones inventadas: el store se migra a la versión **10**, conserva solo productos importados, fusiona por `id` y `codigo` y normaliza el escenario opcional; las reglas semánticas de `category-rules.json` reclasifican las fichas ambiguas. Resultado: **489 productos limpios**, paginados de 24 en 24 mediante «Cargar más». Las 48 miniaturas WebP de `src/data/imagenes-locales.json` van embebidas en el HTML (sin fetch local bajo `file://`) y se priorizan así: foto subida en IndexedDB → miniatura local con blur-up → URL importada → ilustración del arquetipo.

Los estados llevan siempre punto, icono y texto; el lenguaje de pago deja claro que no hay cobro real. Los PDF se obtienen con la impresión del navegador.

## Panel del personal

El inventario muestra la foto real en cada fila y separa **Stock**, **Reservado** y **Disponible** en columnas propias; los dos últimos se derivan de los pedidos activos y nunca se guardan. Los filtros rápidos «Sin foto» y «Bajo mínimo» se suman a los de texto, categoría, estado y archivados, sin modificar existencias.

En el formulario se pueden subir varias fotos, elegir la principal (la primera), recorrer las miniaturas y reordenarlas con «Antes»/«Después». Quitar una foto programa su borrado en IndexedDB al guardar; si se cancela, las fotos nuevas se descartan. El campo «Escenario» (`natural`, `estudio`, `arena`, `noche`) cambia solo el fondo de la ficha en la tienda y de la vista previa del panel; las fichas antiguas se muestran en `natural`.

El botón «Mover» abre una hoja de movimiento rápido con los mismos tipos, motivos, validaciones, permisos y auditoría que la página de movimientos. Al exportar, el respaldo v5 añade las fotos subidas como data URLs (fichas y comprobantes); al importar se validan y restauran con sus ids antes de reemplazar los datos. Las imágenes importadas siguen siendo URLs y no se duplican.

## Accesibilidad

Contraste WCAG AA en claro y oscuro, foco visible, etiquetas y errores asociados con `aria-describedby`, navegación por teclado, `prefers-reduced-motion` y avisos que no se comunican solo por color.

La ronda móvil añade cabecera tipo app, buscador a pantalla completa, selector de zona, barra inferior de cinco entradas y hojas con foco atrapado y cierre con «atrás». El panel usa un cajón con backdrop y foco atrapado, barra inferior de cinco entradas y tablas convertidas en tarjetas con `data-label` (`ResponsiveTable`). Todos los controles miden al menos 44 × 44 px, los campos mantienen 16 px para evitar el zoom de iOS y el contenido respeta las áreas seguras. Los atajos `/` y `C` solo se activan con puntero fino y fuera de campos. Los breakpoints están unificados en 360, 480, 768, 1024 y 1280 px, con `tokens.css` como lista de verdad.

## Estructura

```text
src/
├── app/            # router, layouts, providers y rutas protegidas
├── components/     # chrome de tienda, tarjetas, carrito unificado y biblioteca de UI
├── config/         # brand.ts, legacy.ts y pruebas de marca/idioma
├── data/           # 489 productos reales verificados, facetas, movimientos y pedidos
├── logic/          # tipos, stores de Zustand y servicios puros
├── motion/         # tokens, variantes, hooks y componentes funcionales
├── pages/          # portada pública, tienda, cuenta, acceso y panel
└── styles/         # tokens, tipografía, base, movimiento, móvil, componentes y páginas
scripts/            # paleta, contraste, artefacto único, verificación visual y auditoría móvil
docs/               # auditoría, decisiones, capturas e informes visual y móvil
```

## Verificación

`npm run verify:visual` abre Chrome del sistema (`/usr/bin/google-chrome`) sobre el HTML generado (`file://`), recorre 19 combinaciones de ruta/tema —incluidas la portada y la tienda en `#/inicio`—, inicia sesión con el personal y con un cliente, completa el checkout con cuenta, comprueba que un visitante ve la portada y es redirigido desde las rutas privadas, verifica las consultas públicas y los filtros en la URL, guarda capturas en `docs/capturas/verificacion/` y escribe `docs/verificacion-visual.json`. Las 60 mediciones móviles cubren 320, 390, 412, 768 y 1280 px en claro y oscuro, con CLS, desborde, objetivos táctiles y tipografía de campos.

`npm run audit:mobile` mide 10 viewports (320×568, 360×740, 390×844, 412×915, 430×932, 844×390, 768×1024, 820×1180, 1280×800 y 1440×900) × 2 temas × 14 rutas = **280 mediciones**, con `hasTouch: true` en móvil/tablet. Detecta desbordes, texto recortado, solapes, objetivos <44 px, campos <16 px, CLS, tareas largas, errores y peticiones externas. Escribe `docs/verificacion-movil.{json,md}` y capturas en `docs/capturas/movil/`.

Presupuesto: HTML **< 4,5 MB**. Cifras de la Fase 8 / pulido de código (el detalle está en `docs/verificacion-visual.json`, `docs/verificacion-motion.json` y `docs/verificacion-movil.json`):

- `npm test`: **21 archivos, 109 pruebas** en verde; `npm run lint` sin errores (quedan advertencias benignas de fast-refresh y de sincronizaciones deliberadas) y `npx tsc -b` correcto.
- `npm run build`: correcto; `dist/index.html` = **2.638.198 bytes** (2.638,19 KiB; 970.847 bytes gzip), por debajo del límite.
- Croma visible dentro de 350°–40°: **100 %**; desborde horizontal máximo: **0 px**; CLS **0,0000** y **0 tareas largas** en la verificación visual de escritorio.
- `npm run verify:seed`: **9/9** comprobaciones; `npm run verify:visual`: 60 mediciones móviles sin hallazgos en la ejecución final (CLS máx. 0,0000), 247 fotos importadas cargadas y E2E correcto (personal, cliente con compra, visitante y filtros). La primera ejecución registró de forma transitoria una tarea larga de 394 ms en `1280-light-inicio`, ruta no modificada en el pulido; se repitió sin problemas con CPU ×4 y alta carga externa. No se ajustaron umbrales.
- `npm run audit:mobile`: **280 mediciones, 0 problemas**.
- `npm run verify:motion`: **10/10 flujos funcionales**, CLS 0, 0 errores y 0 peticiones externas. Salvedad: `1280-estado-pedido` queda por debajo del suelo de 32 FPS (30,5 en la medición final; 28,0 en la anterior) con CPU ×4 y alta carga externa; es un flujo del panel no modificado, con la misma salvedad aceptada en fases anteriores. Aparecieron además tareas largas transitorias en `hoja-filtros` (276 ms y 255 ms) que no se repitieron. El presupuesto del script no se rebajó.

Las capturas anteriores quedan en `docs/capturas/` como referencia histórica; las nuevas están en `docs/capturas/verificacion/` y `docs/capturas/movil/`. El detalle de hallazgos y decisiones está en `docs/auditoria.md` y `docs/decisiones.md`.
