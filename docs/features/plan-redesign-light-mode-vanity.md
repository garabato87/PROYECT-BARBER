# Plan SDD — Rediseño integral del modo claro VANITY

Fecha: 2026-09-18. Estado: propuesta para revisión, no implementada.
Proyecto: `C:\Users\usuario\Desktop\PROYECT-BARBER`.
Clasificación: UI/UX + accesibilidad + refactor visual acotado.

## Objetivo

Hacer legibles textos, controles, bordes, estados y navegación en todas las páginas/rutas/roles del modo claro, conservando identidad VANITY, comportamiento funcional y compatibilidad del modo oscuro.

No modificar permisos, autenticación, datos, reservas, reglas Firebase o funciones comerciales. No desplegar automáticamente. La auditoría presente es estática; no equivale a validación visual de cada ruta autenticada.

## Equipo y fuentes consultadas

- Arquitectura: instrucciones instaladas `architect.md`, skill `design-system` y referencia de tokens.
- Planificación: `planner.md`, Master Guide y reglas SDD.
- Diseño/accesibilidad/movimiento: `a11y-architect.md`, UI/UX Pro Max y dataset local de movimiento.
- Orquestación: consolidación de rutas, evidencia y modelo visual.

No se encontró agente o skill exclusivo de Framer Motion. Revisar la biblioteca ya instalada con las pautas de accesibilidad y movimiento; no incorporar GSAP. La CLI de búsqueda UI/UX Pro Max no se ejecutó por falta de Python disponible; se leyeron guía y datos locales. No se instalaron herramientas.

## Hallazgos comprobados

1. `src/styles/variables.css`: texto muted `#9CA3AF` sobre blanco = 2,54:1; insuficiente para texto normal.
2. Blanco sobre amarillo `#FFB817` = 1,73:1. Hay usos en auth, home y agenda; negro VANITY sobre amarillo = 11,35:1.
3. `--border: #EAEDF1` = 1,17:1 sobre blanco; útil como decoración tenue, insuficiente como único límite que identifica un input.
4. `--glass-border` negro al 5 % y superficies translúcidas reducen separación. No resolver aplicando bordes negros a todas las tarjetas.
5. `PremiumBookingPage.tsx` fuerza fondo oscuro y texto blanco: requiere migración explícita.
6. `SuperAdmin.css` mantiene amarillos/gradientes fijos; gráficos y tooltips requieren revisión propia.
7. `global.css` elimina outline global de botones; falta garantía compartida de foco visible.
8. `.text-muted` y `text-text-muted` consumen tokens diferentes; normalizar su significado.
9. `dark:` de Tailwind y `data-theme` pueden no responder a la misma fuente; revisar campo fecha de RegisterPage y sincronización de useTheme.
10. MotionConfig ya usa reducedMotion=user. Hay animaciones CSS duplicadas y AuthGallery con marquesinas infinitas que necesitan tratamiento propio.

Los ratios son cálculos sRGB de pares opacos; las transparencias, overlays y fotos deben medirse sobre la composición real en navegador.

## Dirección de diseño — Claro nítido

- Fondo gris casi blanco y paneles blancos opacos.
- Texto principal oscuro, texto secundario legible y placeholders sin apariencia deshabilitada.
- Amarillo como fondo de acción o acento decorativo; texto e iconos oscuros sobre él.
- Links oscuros y subrayado cuando haga falta identificarlos, sin amarillo pequeño sobre blanco.
- Separar bordes de tarjetas/divisores de bordes de controles. Jerarquía con espacio y superficies, no glows generalizados.
- Estados semánticos con fondo suave, texto oscuro e indicador textual/icono; nunca solo color.
- Mantener Inter y logos oficiales. Las islas oscuras deliberadas sobre foto/editorial usan tokens inversos y se registran como excepción.

### Valores propuestos en el modelo

| Token conceptual | Valor | Observación |
|---|---|---|
| canvas | `#F7F8FA` | Fondo de trabajo |
| surface | `#FFFFFF` | Paneles y controles opacos |
| text-primary | `#17202E` | Titulares y contenido principal |
| text-secondary | `#475467` | Descripciones |
| text-muted | `#667085` | 4,97:1 blanco; 4,68:1 canvas |
| border-subtle | `#D0D5DD` | División decorativa; no identidad única de controles |
| border-control | `#7A8494` | 3,78:1 blanco; 3,56:1 canvas |
| action-primary | `#FFB817` | Amarillo de marca |
| on-primary | `#0B0B0D` | Texto e iconos de CTA |
| action-border | `#936200` | Límite visible cuando sea necesario |
| focus-ring | `#17202E` | 3 px, offset 3 px; validar ambos lados |
| success | `#166534` / `#DCFCE7` | Texto/fondo: 6,49:1 |
| warning | `#854D0E` / `#FFF3CC` | Texto/fondo: 6,18:1 |
| danger | `#991B1B` / `#FEE2E2` | Texto/fondo: 6,80:1 |

Estos valores consolidan las propuestas de los agentes para el modelo. La aprobación visual no certifica por sí sola accesibilidad completa; validar cada contexto renderizado antes de cerrar.

## Arquitectura propuesta

Mantener React, Tailwind, variables CSS y Framer Motion. Tres niveles: primitivas de marca → tokens semánticos por tema → componentes/variantes.

Crear aliases temporales para migración compatible; cada alias tendrá fecha/STEP de retiro. Evitar sistemas duplicados o copiar estilos por rol. Definir foreground/background/border para cada estado; no reutilizar indiscriminadamente un único color de éxito/error para texto, badge e icono.

Auditar el estado de tema compartido, preferencia guardada, sistema y carga inicial. Unificar selectores sin reescribir autenticación ni otras arquitecturas ajenas al tema.

Componentes base: Button, Input/Select/Textarea, Card, Badge, Table, Tabs, Dialog/Drawer, Toast, navegación, calendario y charts. Reutilizar implementaciones reales; introducir wrappers solo si reducen repetición demostrable.

## Cobertura: 21 rutas reales

| Familia | Rutas | Superficies adicionales |
|---|---|---|
| Público | `/`, `/para-negocios`, `/barbershop/:id` | Home visitante/cliente, filtros, tarjetas, footer, formulario comercial, selección de reserva |
| Auth | `/login`, `/register`, `/forgot-password` | Labels, errores, proveedores, loading y fondo editorial |
| Reserva premium | `/b/:id/premium` | Calendario, profesional, horarios, selección y resumen |
| Cliente | `/client/dashboard` | Próximas reservas, historial, menú y cancelación |
| Perfil compartido | `/profile` | Revisar como cliente, profesional, admin y superadmin |
| Profesional | `/agenda` | Calendario/listado, estados, diálogos y acciones existentes |
| Admin | `/admin/dashboard`, `/admin/mi-local`, `/admin/servicios`, `/admin/profesionales`, `/admin/agenda` | Formularios, creación/edición/eliminación, validación, charts y agenda |
| Superadmin | `/superadmin`, `/superadmin/locales`, `/superadmin/usuarios`, `/superadmin/suscripciones`, `/superadmin/reportes`, `/superadmin/audit` | Tablas, filtros, indicadores, gráficas, tooltips y modales |

Layouts activos observados: ExploreLayout y Layout (Sidebar/Header/CommandPalette). Comprobar referencias actuales a ClientLayout antes de migrar código potencialmente inactivo.

Por ruta: normal, loading, empty, error y variantes pertinentes; por componente: hover, focus-visible, active/selected, disabled, invalid y read-only. No introducir estados o funciones nuevos por completar la matriz.

## Plan por STEPs

### STEP 1 — Fundaciones del tema

Archivos: variables.css, global.css, tailwind.config.js, useTheme y consumidores necesarios.
Cambios: tokens semánticos, coherencia selectores, foco compartido y aliases. Baseline antes/después y presupuesto de excepciones.
Aceptación: contrato único; pares accesibles medidos; tema guardado/sistema consistente; modo oscuro sin regresión funcional.
Riesgo: alcance global. No cambiar de golpe valores con significados ambiguos sin inspeccionar consumidores.

### STEP 2 — Componentes y layouts compartidos

Cambios: headers, footer, sidebar, comandos, botones, campos, tablas, estados, modal/drawer y toast. Identificar estilos inline que eluden tokens.
Aceptación: componentes legibles en ambos temas; foco/teclado correctos y navegación intacta. Revisar móviles.

### STEP 3 — Público, auth y reserva

Cambios: home en dos estados, negocios/contacto, ficha, login/registro/recuperación y reserva premium. Sustituir dark hardcodes por tokens donde corresponda; conservar excepción editorial documentada.
Aceptación: rutas públicas completas, CTA negro sobre amarillo, etiquetas visibles y flujo de reserva/login preservado.

### STEP 4 — Cliente y perfil

Cambios: Mis Reservas, historial/cancelación y perfil de cuatro roles.
Aceptación: fechas/estados y errores distinguibles; datos/permisos intactos; modales verificables.

### STEP 5 — Profesional

Cambios: agenda, listas y acciones existentes.
Aceptación: celdas disponibles/seleccionadas/ocupadas legibles, controles y diálogos completos; sin depender únicamente del color.

### STEP 6 — Administración

Cambios: las cinco rutas admin y sus formularios/modales/reportes.
Aceptación: densidad adecuada, estados semánticos consistentes, gráficos/tooltip legibles; comportamiento existente conservado.

### STEP 7 — Superadmin

Cambios: las seis rutas globales y SuperAdmin.css. Tablas/filtros, estados, acciones críticas y visualización de datos.
Aceptación: contenido legible con datos extensos y sin datos; ninguna acción administrativa ejecutada en producción como prueba.

### STEP 8 — QA transversal y limpieza

Cambios: retirar overrides/aliases obsoletos, consolidar animaciones, documentar tokens y excepciones. Resolver hallazgos de revisión.
Aceptación: 21 rutas con evidencia o limitación explícita, controles requeridos verdes, regresión dark revisada y aceptación final del propietario.

## Movimiento — transversal a cada STEP

- Mantener Framer Motion existente; no instalar otra biblioteca.
- Hover/foco: 120–160 ms de color/sombra, sin saltos de layout.
- Paneles y diálogos: 180–220 ms; desplazamiento máximo orientativo 4–8 px.
- Tablas y agendas sin largas entradas escalonadas que retrasen lectura o interacción.
- Marquesinas: preferir composición estática; si se retienen, pausa accesible y detención con reduced motion/visibilidad.
- Aplicar reduced motion también a CSS, no solo a MotionConfig; mostrar estado final sin loops decorativos.
- No cambiar scroll ni foco por efectos visuales. Conservar la corrección de entrada arriba en Para negocios y sus anclas internas.

## Verificación y Definition of Done

- Vitest + Testing Library existentes; tests nuevos solo para comportamiento afectado (tema, foco, estados y navegación).
- Scripts reales: test, lint, build; build incluye TypeScript. Revalidarlos al comenzar implementación.
- No se encontró runner E2E/visual configurado en package.json; usar recorridos reproducibles y capturas. Proponer instalación separadamente si aporta valor.
- Medir texto normal >=4,5:1; texto grande >=3:1; controles/indicadores esenciales >=3:1 según contexto. No exigir este último criterio a cada divisor decorativo.
- Móvil 320/390, tablet 768 y escritorio 1280/1440; zoom 200 %, teclado y reduced motion. Sin overflow accidental.
- Acceso por rol con entorno/datos de prueba. Rutas sin credenciales o datos: NO VERIFICADAS, no PASS.
- Capturas representativas por familia y todos los patrones de modales críticos. Comprobar composiciones con transparencia/foto de forma independiente.
- Regresión oscura en componentes compartidos, logo y temas guardados. No declarar “oscuro intacto” sin comprobarlo.
- Sin cambios funcionales de auth, permisos, datos o reservas. Sin modificaciones a reglas Firebase ni deploy.
- Revisiones arquitectura, diseño/accesibilidad, React y movimiento según alcance. Fallas previas separadas de regresiones.

## Riesgos y límites

La auditoría actual cubre código, rutas y valores; no todas las pantallas con datos reales. Los ejemplos del modelo son ficticios y demuestran el sistema visual, no una promesa de nuevos dashboards ni datos existentes. Estado real del repositorio debe revalidarse antes de implementar: contiene trabajo previo sin confirmar.

No hacer un reemplazo masivo de `text-white`: hay contextos oscuros legítimos. No oscurecer todos los grises indiscriminadamente ni confundir disabled con texto secundario. Tampoco usar motion para ocultar problemas de jerarquía o contraste.

## Gates

Este turno entrega solamente plan y modelo. No se modificó el repositorio.

Antes de cada STEP, requerir `APPROVED STEP X` referido a esta feature. Autoriza únicamente ejecutar ese STEP X. Después de pruebas/revisión/reporte, HARD STOP antes del siguiente. No reutilizar aprobaciones de la página Para negocios.

Cada reporte: archivos, cambios, criterios cubiertos, contraste y capturas, tests realmente ejecutados, riesgos/excepciones, siguiente STEP propuesto. Cierre final solo con evidencia completa y aceptación explícita. No inferir aceptación a partir de una pregunta de estado.
