# Sistema de Control e Inventario — Atelier de Almacén

Una aplicación web premium para gestión de inventario con dirección visual editorial e industrial. Inspirada en catálogos de museo y cuartos de control de precisión.

## Concepto Creativo

*"Cada cosa, en su lugar."* 

Inventario tratado como colección curada: editorial, cálido, táctil, con carácter. Cada número es protagonista y cada pantalla se siente compuesta, no ensamblada.

## Stack Tecnológico

- **React 19** + **TypeScript** + **Vite**
- **Tailwind CSS v4** con tokens propios en variables CSS
- **Framer Motion** - Animaciones y transiciones
- **Zustand** - Estado global con persistencia en localStorage
- **React Router** - Navegación
- **Lucide React** - Iconos de línea fina
- **Sonner** - Toasts personalizados
- **jsPDF** - Exportación a PDF

## Paleta de Colores

**Modo Claro "Papel"**
- Fondo: `#F4F1EA` (marfil cálido)
- Superficies: `#FBFAF6`
- Tinta: `#14130F`
- Acento: `#FF4A1C` (bermellón)
- Musgo: `#5E7A4B` (Normal)
- Ocre: `#C9A227` (Advertencia)

**Modo Oscuro "Tinta"**
- Fondo: `#0E0E0C`
- Superficies: `#171714`
- Texto: `#ECE8DD`
- Acentos cálidos, nunca azulados

## Tipografía

- **Display**: Instrument Serif (títulos, cifras grandes)
- **Interfaz**: Satoshi (UI general)
- **Datos/Códigos**: JetBrains Mono (cifras tabulares)

## Instalación y Ejecución

```bash
# Instalar dependencias
npm install

# Ejecutar en modo desarrollo
npm run dev

# Build para producción
npm run build

# Previsualizar build
npm run preview
```

La aplicación estará disponible en `http://localhost:5173`

## Credenciales de Acceso

**Administrador (acceso completo)**
- Usuario: `admin`
- Contraseña: `admin123`

**Operador (solo lectura en Reportes)**
- Usuario: `operador`
- Contraseña: `operador123`

## Funcionalidades

### 0. Login Cinematográfico
- Layout dividido con formulario sobrio y panel 3D interactivo
- Cubo isométrico que rota con el movimiento del mouse
- Animación de expansión del panel al iniciar sesión
- Validación con vibración sutil
- Chips para autocompletar credenciales

### Layout General
- Sidebar estrecha de 72px que se expande al hover
- Navegación con ítems numerados editorialmente
- Indicador activo con barra bermellón
- Header minimalista con fecha en serif cursiva
- Toggle de tema con transición
- Responsive con menú móvil

### 1. Dashboard
- Saludo editorial con resumen inteligente
- KPI gigante con contador animado tipo odómetro
- Alerta de stock en color bermellón sólido con pulso
- Gráfico SVG de barras finas con animación
- Lista de últimos movimientos

### 2. Inventario
- Encabezado gigante con conteo
- Búsqueda instantánea con filtro por categoría
- Tabla estilo plano técnico sin cajas
- Estados con puntos de color y pulso
- Barra de nivel de stock por fila
- Drawer lateral con spring physics para CRUD
- Confirmación "mantén presionado" para eliminar

### 3. Movimientos
- Línea de tiempo vertical editorial
- Agrupado por día
- Formulario rápido para registrar entradas/salidas
- Actualización automática de stock

### 4. Alertas
- Fichas por producto en riesgo
- Indicador de severidad visual
- Medidor de nivel
- Acciones para atender o reabastecer

### 5. Reportes
- Tarjetas selectoras invertidas cuando activas
- Filtros con segmented controls
- Tabla de resultados
- Exportación a CSV y PDF

## Decisiones de Diseño

- **Paleta cálida**: Evitamos azules/fríos. Usamos marfil, tinta y un único bermellón como acento
- **Tipografía dramática**: Cifras gigantes en Instrument Serif contra etiquetas diminutas en mayúsculas
- **Sin sombras difusas**: Usamos líneas finas de 1px como estructura
- **Movimiento intencional**: Curvas `cubic-bezier(0.22, 1, 0.36, 1)` y spring physics sutiles
- **Textura artesanal**: Grano sutil de ruido SVG (3-5% opacidad)
- **Números como protagonistas**: Uso extensivo de `tabular-nums` y `JetBrains Mono`
- **Editorial**: Numeración "01 / Inicio", superíndices, itálicas para énfasis
- **Sin plantillas genéricas**: Cada componente diseñado con intención, sin elementos pre-fabricados

## Datos Iniciales

25 productos distribuidos en las categorías con stock variado, incluyendo productos con bajo stock (3, 4, 6, 7, 8 unidades) para demostrar las alertas.

## Notas

- Respeta `prefers-reduced-motion`
- Datos persistidos en localStorage
- Diseño 100% responsive
- Navegación completa por teclado
- Sin emojis, sin degradados, sin glassmorphism
