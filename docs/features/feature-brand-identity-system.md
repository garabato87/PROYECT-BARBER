# Feature: Sistema de identidad visual VANITY

## 1. Metadata y estado

- **ID:** BRAND-IDENTITY-SYSTEM
- **Tipo:** Feature transversal de UI / Design System / Branding.
- **Prioridad:** Alta.
- **Workflow:** Spec-Driven Development (SDD), integrado al flujo existente.
- **Estado:** Completada y Auditada (COMPLETED).
- **Fecha:** 2026-09-16.
- **Marca:** VANITY.
- **Fuente de marca inspeccionada:** `LOGOS - ICONOS-20260916T211341Z-1-001.zip`.
- **Ubicación sugerida:** `docs/features/feature-brand-identity-system.md`, salvo convención existente diferente.
- **Ejecución:** 11 STEPs secuenciales con HARD APPROVAL GATE después de cada uno.

Este documento define el trabajo futuro. Su creación no aprueba ni ejecuta la migración. Se inspeccionó el ZIP y el contexto de la conversación; no se recibió ni auditó el repositorio de la aplicación, sus documentos SDD, ECC o UI/UX Pro Max. Rutas, tecnologías, pantallas y funcionalidades mencionadas como ejemplos deben verificarse en STEP 1. No considerar implementadas funcionalidades por aparecer en conversaciones anteriores.

## 2. Problema y objetivo

La aplicación utiliza una identidad visual de prueba. Debe migrarse a VANITY mediante una base visual centralizada que alcance todas las rutas, roles y superficies existentes, manteniendo sus funcionalidades, permisos y datos.

El resultado debe transmitir una identidad consistente: logos correctos, tipografía coherente, colores accesibles, componentes reutilizados y estados completos. No alcanza con cambiar el logo del encabezado o la pantalla principal.

### Resultados verificables

1. El 100 % de las rutas y superficies descubiertas tiene estado de migración y evidencia de validación.
2. Auth, público, cliente, profesional, admin y superadmin consumen la misma base visual.
3. No quedan referencias activas al branding de prueba, salvo excepciones justificadas y aprobadas.
4. No se crean temas, componentes o bloques de estilos duplicados por rol.
5. Los flujos existentes conservan su comportamiento y control de acceso.
6. Cada STEP termina con evidencia y una pausa real para aprobación humana.

## 3. Source of truth y resolución de conflictos

### Jerarquía del proyecto

1. Instrucciones explícitas vigentes del propietario y decisiones aprobadas para esta feature.
2. Código y configuración reales: evidencia de arquitectura, rutas, roles, funcionalidades y estado actual.
3. `docs/workflow/` y archivos de instrucciones aplicables al repositorio.
4. Especificaciones SDD y decisiones de arquitectura aprobadas.
5. Archivo o documentación de sprints.
6. `README.md`.
7. ECC: reglas, skills y agentes aplicables.
8. UI/UX Pro Max como apoyo de diseño y revisión.
9. Propuestas o supuestos del implementador, siempre identificados como tales.

El código describe lo que existe; no convierte el branding legacy en el diseño objetivo. Para identidad visual, los assets originales y la lámina `Plantillas.png` son la referencia inicial, seguida por las decisiones de marca aprobadas durante Discovery. No atribuir al ZIP decisiones que no contiene.

Ante contradicciones relevantes, registrar ambas fuentes, su ubicación, impacto y recomendación. No resolver silenciosamente contradicciones que alteren alcance, marca, permisos o arquitectura; presentar la decisión en el gate correspondiente. Si falta una fuente esencial, registrar el bloqueo y solicitarla antes del trabajo dependiente.

### Integración con ECC, SDD y UI/UX Pro Max

- Leer primero la inicialización del proyecto indicada en `docs/workflow/`, si existe, y después las guías SDD, README, sprints e instrucciones aplicables.
- Localizar las instalaciones reales de ECC y UI/UX Pro Max; no inventar rutas, comandos, versiones ni resultados de ejecución.
- Aplicar los controles de calidad, seguridad, organización y revisión de ECC pertinentes al cambio.
- Usar UI/UX Pro Max para revisar jerarquía, densidad, espaciado, tipografía, componentes, responsive y accesibilidad, siempre subordinado a VANITY y al stack existente.
- No adoptar automáticamente otra paleta, fuente o estética sugerida por una herramienta. Registrar recomendaciones aceptadas y descartadas con su motivo.
- Reutilizar formatos SDD existentes para requisitos, plan, tareas, decisiones, evidencias y aprobaciones; evitar sistemas paralelos de documentación.
- Si alguna herramienta no está disponible, declararlo. No afirmar que fue utilizada. Acordar la alternativa en Discovery sin instalar dependencias ajenas al alcance automáticamente.

## 4. Inventario real del ZIP

El archivo contiene **8 archivos PNG**, todos dentro de `LOGOS - ICONOS/`. No contiene fuentes, SVG, PDF, archivos editables, ICO, manifiestos de aplicación, CSS ni plantillas HTML.

| Archivo original | Dimensiones | Tamaño en bytes | Características y uso candidato |
|---|---:|---:|---|
| `Icono negro png.png` | 1254 × 1254 | 257650 | Símbolo oscuro con punto amarillo; canal alfa y fondo transparente. Candidato para superficies claras. |
| `Icono blanco png.png` | 1254 × 1254 | 290628 | Variante clara del símbolo; canal alfa y fondo transparente. Candidato para superficies oscuras. |
| `icono fondo negro.png` | 1254 × 1254 | 346597 | Variante con fondo negro opaco. Evaluar para icono de aplicación. |
| `Logo negro png.png` | 2172 × 724 | 112850 | Logotipo horizontal oscuro; canal alfa y fondo transparente. |
| `Logo blanco png.png` | 2172 × 724 | 146186 | Logotipo horizontal claro; canal alfa y fondo transparente. |
| `Logo negro fondo blanco.png` | 2172 × 724 | 524871 | Logotipo oscuro sobre fondo blanco opaco. |
| `Logo blanco fondo negro.png` | 2172 × 724 | 302663 | Logotipo claro sobre fondo negro opaco. |
| `Plantillas.png` | 1536 × 1024 | 1565799 | Lámina raster de identidad, paleta, tipografía, composiciones y aplicaciones de ejemplo. Referencia visual, no plantilla ejecutable. |

Las dimensiones, tamaños y formatos se verificaron leyendo los archivos. Se inspeccionaron visualmente la lámina, el logotipo negro sobre blanco y el símbolo negro; la validación individual de todas las variantes en sus fondos de uso forma parte del STEP 1.

### Identidad visible en `Plantillas.png`

- Nombre: **VANITY**.
- Eslogan: **“Conectá tu negocio. Simplificá tu día.”**
- Tipografía indicada: **Inter**. No se incluyen archivos ni licencia de la fuente.
- Paleta rotulada: **`#FFB817` Principal**, **`#0B0B0D` Fondo**, **`#FFFFFF` Texto**, **`#9CA3AF` Secundario**.
- Símbolo: forma de A abierta con punto amarillo; logotipo de trazos finos y espaciado amplio.
- Referencias: variante principal, oscura, horizontal, minúscula, iconos de app/favicon, zona de seguridad, producto y papelería.
- La lámina muestra variantes que no se entregan como assets independientes. No extraerlas ni reconstruirlas como originales aprobados automáticamente.

Los valores hexadecimales se transcriben de las etiquetas de la lámina, no de muestras de sus píxeles. Los PNG pueden contener antialiasing, texturas o variaciones: no deben usarse para inferir nuevos colores de tokens. El blanco cálido visible en algunas composiciones no define un token adicional aprobado.

### Pendientes de marca para Discovery

- Confirmar uso de “VANITY” frente a variantes de capitalización en metadatos y textos.
- Confirmar dónde corresponde el eslogan; no incorporarlo a toda pantalla por defecto.
- Validar visualmente todas las variantes, márgenes internos y legibilidad a tamaños pequeños.
- Definir tamaño mínimo y área de seguridad: la lámina ofrece una referencia gráfica, no medidas operativas completas.
- Resolver fuente de Inter, licencia, pesos y cobertura lingüística requeridos.
- Confirmar disponibilidad de originales vectoriales. No vectorizar ni redibujar el logo sin decisión explícita.
- Aprobar paleta semántica y adaptación clara si el producto ya ofrece light/dark.
- Aclarar convivencia entre marca de plataforma y marcas de negocios/tenants, si existen.

## 5. Alcance

### Incluido

- Inventario de branding, assets, fuentes, plantillas, colores, estilos y dependencias existentes.
- Sistema central de tokens/theme y registro compartido de assets de marca.
- Tipografía, logos, favicon, app icons y metadatos visuales aplicables.
- Colores de marca y semánticos, estados interactivos y visualización de datos.
- Componentes compartidos, shells, layouts, navegación y superficies superpuestas.
- Todas las páginas y rutas existentes: públicas, auth, cliente, profesional, admin y superadmin; también rutas anidadas, detalles, ajustes y páginas poco transitadas.
- Loading, skeleton, empty, error, éxito, validación, no autorizado, 404 y offline si existe.
- Responsive y todos los temas actualmente soportados.
- Emails, notificaciones, impresión, exportaciones y otras plantillas existentes bajo control del proyecto.
- Retiro de branding y estilos legacy, validación de rendimiento, pruebas y documentación.

### No incluido

- Nuevas funcionalidades de negocio, roles, permisos, pagos, reservas, integraciones o modelos de datos.
- Crear páginas o dashboards inexistentes para completar una lista hipotética.
- Rediseñar flujos o arquitectura sin necesidad demostrada y decisión aprobada.
- Introducir dark mode, PWA, apps nativas, emails o una nueva librería visual si no existen.
- Crear una nueva marca, redibujar el logo, producir fotografías o diseñar papelería física.
- Cambiar logos aportados por negocios, fotos de usuarios o datos históricos legítimos.
- Renombrar identificadores internos, dominios, paquetes, credenciales o entidades legales solo por branding.
- Desplegar a producción, enviar emails reales o publicar material externo: requieren autorización separada.

Las superficies inexistentes se registran como **N/A**, con evidencia y aprobación; no se omiten silenciosamente ni se implementan como expansión del alcance.

## 6. Requisitos funcionales y técnicos

### RF-01 — Cobertura trazable

Crear una matriz a partir del router, navegación, layouts, búsqueda en código y recorrido real. Registrar por superficie: ruta/patrón, rol o acceso público, componente/layout, estados, tema, breakpoint, branding actual, cambio requerido, STEP responsable, pruebas y evidencia. Incluir componentes montados fuera del árbol principal, portales, modales y contenido diferido.

### RF-02 — Tokens y theme centralizado

- Extender el mecanismo existente (variables, theme provider, configuración del framework u otro), evitando un segundo sistema paralelo.
- Separar primitivas de marca de tokens semánticos y, solo si aportan valor, aliases de componentes.
- Definir colores de fondo, superficies, texto principal/secundario/invertido, bordes, acciones, enlaces, selección, foco, overlay y estados.
- Cubrir success, warning, error/destructive e info con pares de foreground/background accesibles. La paleta del ZIP no contiene estos estados completos: deben diseñarse y aprobarse.
- Centralizar escala tipográfica, pesos, interlineado, espaciado, radios, sombras, tamaños de controles, capas y movimiento según necesidad real.
- Definir hover, active, focus-visible, selected, disabled, read-only y loading, sin depender solo del color.
- Prohibir valores de branding repetidos en páginas. Permitir excepciones locales solo para geometría o necesidades específicas justificadas, sin duplicar decisiones visuales globales.
- Mantener un único contrato de tokens para todos los roles. Los themes cambian valores, no generan copias completas de componentes.

Ejemplo conceptual, a adaptar al stack y aprobar en Discovery:

```text
brand.accent = #FFB817
brand.dark = #0B0B0D
brand.white = #FFFFFF
brand.gray = #9CA3AF
color.action.primary.background -> brand.accent
color.action.primary.foreground -> tono oscuro validado
color.text.primary -> valor por tema
color.status.error.* -> paleta semántica pendiente de aprobación
```

No mapear automáticamente `brand.gray` a texto sobre blanco ni texto blanco sobre amarillo. Validar cada combinación en contexto, incluidas transparencias y estados.

### RF-03 — Tipografía

- Utilizar Inter para la UI según la referencia, tras verificar licencia y disponibilidad.
- No recrear el logotipo escribiendo “VANITY” con Inter: el logotipo se renderiza como asset oficial.
- Definir familias fallback, tamaños, pesos e interlineados; evitar pesos sintéticos.
- Cubrir tildes, ñ, signos de apertura, números, monedas y demás idiomas soportados.
- Usar únicamente pesos necesarios; preferir formatos web eficientes compatibles con el proyecto y estrategia de carga que mantenga el texto legible.
- Evitar descargas repetidas entre roles, importaciones remotas dispersas y saltos de layout por métricas de fallback.
- Validar tablas densas, calendarios, formularios y nombres largos, si existen; el tracking del logo no debe trasladarse al texto de lectura.

### RF-04 — Logos, favicon y app icons

- Incorporar referencias centralizadas para variantes clara/oscura, horizontal y símbolo; nombres de producción normalizados con mapa al original.
- Preservar proporciones, colores y composición; usar ajuste contenido, nunca estirar, deformar o recolorear mediante filtros improvisados.
- Seleccionar variante según el fondo real, incluso dentro de un tema mixto.
- Definir márgenes, tamaño mínimo, comportamiento compacto y alternativa accesible en un componente reutilizable.
- Usar texto alternativo contextual; logo decorativo con texto equivalente cercano no debe duplicar anuncios del lector de pantalla.
- Generar derivados de favicon y touch/app icons según navegadores y plataformas realmente soportados; probar legibilidad a 16 y 32 px y derivados mayores aplicables.
- Actualizar manifest, `theme-color`, splash o service worker únicamente si existen. Validar zonas seguras de iconos maskable si aplica.
- Revisar cachés y versionado para evitar favicon o assets antiguos después de actualizar.
- No tratar PNG grandes como SVG ni ampliar derivados más allá de la calidad original.

### RF-05 — Componentes compartidos y layouts

Migrar, cuando existan: botones, enlaces, inputs, selects, textareas, checkbox/radio/switch, validación, cards, tablas, filtros, badges, tabs, paginación, menús, tooltips, modal/drawer, toast, alert, avatar, calendario, selector de fechas, gráficos y loaders. Conservar sus contratos funcionales y accesibilidad.

Aplicar la base a header, sidebar, navegación móvil, breadcrumbs, footer y contenedores. No clonar componentes por rol para cambiar colores. Los iconos funcionales deben usar el sistema existente de manera consistente; el símbolo de VANITY no reemplaza iconos de acciones.

### RF-06 — Roles, navegación y datos

- Migrar todas las rutas verificadas de cada rol, respetando permisos, guardas, enlaces profundos y sesión.
- Conservar los identificadores reales de rol: “superadmin” en esta especificación no exige renombrar un valor interno como `super-admin`.
- Comprobar usuarios con capacidades combinadas y cambios de contexto si existen.
- Distinguir marca de plataforma y branding de tenant. No reemplazar indiscriminadamente nombres o logos de negocios.
- No introducir datos de demostración para completar pantallas ni modificar contratos de API.

### RF-07 — Responsive y temas

- Validar breakpoints reales del proyecto, incluyendo móviles estrechos, tablet y escritorio, orientación y contenido largo.
- Mantener legibilidad, navegación y acciones primarias sin solapamientos ni recortes.
- Evitar scroll horizontal de página; tablas o calendarios pueden tener scroll localizado accesible cuando sea necesario.
- Si existen light/dark, cubrir ambos con tokens, assets adecuados, preferencias existentes y persistencia; evitar destellos de tema incorrecto en carga o hidratación.
- Si solo existe un tema, migrarlo y documentar esa decisión. La variante oscura de la lámina no autoriza un nuevo selector de tema.

### RF-08 — Accesibilidad y estados

Objetivo de aceptación: nivel AA de accesibilidad aplicable a las superficies modificadas, con verificación manual y automatizada cuando sea posible.

- Contraste mínimo de texto normal 4.5:1 y texto grande 3:1; controles, indicadores y gráficos esenciales 3:1 respecto de colores adyacentes, según corresponda.
- Foco visible, navegación por teclado, orden lógico, nombres accesibles, labels y errores asociados a campos.
- Comunicar estados con texto y/o iconos además del color, incluidos gráficos y reservas.
- Validar zoom al 200 %, reflow a 320 CSS px donde aplique y preferencias de movimiento reducido.
- Mantener anuncios accesibles y gestión de foco en estados dinámicos y modales.
- Loading, empty y error deben conservar contexto, mensajes comprensibles y acciones de recuperación existentes.
- Los colores decorativos del logo no autorizan combinaciones ilegibles en botones o texto funcional.

### RF-09 — Plantillas y superficies secundarias

- Inventariar emails transaccionales, notificaciones, impresión, PDF/exportaciones, páginas de mantenimiento, metadata social y pantallas externas configurables, si existen.
- `Plantillas.png` es una guía visual. No es una plantilla de email, una fuente de CSS ni una imagen que deba incrustarse como interfaz.
- Conservar variables dinámicas, enlaces, localización y contenidos transaccionales.
- Para emails, reutilizar tokens mediante el mecanismo compatible existente o valores generados desde una fuente única; no depender de variables CSS no soportadas por los clientes objetivo.
- Probar fallback de fuentes, imágenes bloqueadas, texto alternativo, móvil y tratamiento de modo oscuro en clientes de correo objetivo.
- Usar previews o sandbox, sin enviar a usuarios reales durante QA.
- Las superficies de terceros no controlables se documentan con su límite de personalización.

### RF-10 — Limpieza legacy

Buscar referencias antiguas en estilos, componentes, assets, HTML, metadatos, manifiestos, plantillas, pruebas y documentación vigente. Clasificar antes de sustituir: marca de prueba, identidad de tenant, contenido histórico o identificador técnico.

Retirar dependencias y archivos obsoletos solo después de comprobar referencias estáticas y dinámicas. No mantener dos fuentes de tokens activas como solución final. No cambiar snapshots masivamente sin revisar las diferencias. Los documentos históricos pueden conservar nombres anteriores con anotación y justificación.

### RNF-01 — Rendimiento

- Medir baseline antes de migrar: peso de fuentes/assets, solicitudes, bundle y métricas disponibles de carga y estabilidad visual.
- Definir presupuestos concretos en STEP 1 a partir del producto real; no inventar mediciones ni umbrales cumplidos.
- Crear derivados del tamaño requerido, conservar transparencia y revisar calidad antes/después de optimizar.
- No servir `Plantillas.png` ni originales sobredimensionados como elementos de UI.
- Cargar recursos compartidos una vez; preload solo de lo crítico demostrado, sin descargar todos los pesos o variantes.
- Fijar dimensiones o relación de aspecto y estrategia de caché coherente.
- Repetir mediciones en condiciones equivalentes y justificar cualquier regresión antes del cierre.

### RNF-02 — Mantenibilidad y seguridad funcional

No introducir estilos globales invasivos, dependencias innecesarias ni cambios en autenticación/autorización para facilitar QA. Mantener archivos de origen identificables, derivados reproducibles, licencias y decisiones documentadas. El cambio debe poder revertirse mediante el control de versiones sin migraciones de datos.

## 7. Política obligatoria de aprobación

**NO AVANZAR SIN `APPROVED STEP X`.**

1. La instrucción de iniciar esta feature habilita únicamente STEP 1. Crear o leer esta especificación no equivale a iniciarla.
2. Al finalizar cada STEP X, entregar resultados y detener toda implementación.
3. Solo un mensaje explícito del propietario con `APPROVED STEP X`, aplicado a esta feature y a la revisión entregada, habilita el siguiente STEP X+1.
4. Esa aprobación habilita un único STEP siguiente; nunca todo el plan. No permite saltarse su gate final.
5. Silencio, tiempo transcurrido, tests verdes, “continuá” ambiguo, aprobación de otra feature o texto citado no cuentan como aprobación.
6. Ningún agente, herramienta o documento puede autoaprobar un STEP. Registrar el mensaje humano y la revisión aprobada.
7. Ante cambios solicitados, corregir dentro del mismo STEP, presentar nueva evidencia y mantener el gate pendiente. Un cambio material a una decisión aprobada requiere revalidación antes del trabajo dependiente.
8. No adelantar implementación, limpieza o integración de STEPs futuros mientras se espera. Se pueden explicar resultados y atender correcciones del STEP actual.
9. Un STEP N/A requiere informe justificativo y el mismo gate; no se salta automáticamente.
10. `APPROVED STEP 11` acepta el cierre de la feature. No autoriza deploy o publicación.

### Entrega obligatoria en cada gate

- STEP, estado y revisión/commit cuando exista.
- Alcance ejecutado, archivos afectados y decisiones tomadas.
- Evidencia de criterios de aceptación, capturas o previews relevantes.
- Validaciones ejecutadas con resultado real; distinguir aprobado, fallido, no ejecutado y N/A.
- Problemas pendientes, riesgos, excepciones y cambios de alcance propuestos.
- Actualización de matriz de cobertura y documentación SDD correspondiente.
- Próximo STEP propuesto, sin iniciarlo.
- Cierre literal: **HARD STOP — esperando `APPROVED STEP X`.**

## 8. Plan de implementación por STEPs

### STEP 1 — Discovery / Brand Audit y arquitectura, sin implementar

**Entrada:** instrucción explícita de iniciar la feature y acceso al repositorio y referencias.

**Trabajo:**

- Leer workflow, SDD, README, sprints, instrucciones locales, ECC y UI/UX Pro Max aplicables.
- Auditar stack, router, roles, permisos, componentes, estilos, themes, fuentes, assets, plantillas e infraestructura de pruebas.
- Completar el inventario del ZIP con revisión visual de todas las variantes y su uso viable.
- Capturar baseline visual y de rendimiento representativo por rol, tema y viewport.
- Construir la matriz completa de rutas/superficies, incluidos estados y variantes.
- Proponer arquitectura de tokens, tipografía, registro de assets, componentes compartidos y estrategia incremental.
- Definir convivencia con branding de negocios, accesibilidad, presupuestos de rendimiento y alcance de QA.
- Resolver o elevar decisiones pendientes de marca, licencias y fuentes faltantes.

**Restricción:** no modificar código, estilos, configuración, dependencias ni assets; no hacer prototipos implementados o refactors. Entregar análisis en el informe; persistir documentos de Discovery solo si el workflow lo permite. No ejecutar comandos que alteren el proyecto bajo apariencia de auditoría.

**Aceptación:** inventario y matriz completos; arquitectura propuesta vinculada al código real; decisiones pendientes identificadas; pasos, pruebas y presupuestos definidos. No declarar aprobados tokens semánticos todavía pendientes.

**HARD APPROVAL GATE:** detenerse y esperar `APPROVED STEP 1` antes de implementar STEP 2.

### STEP 2 — Design Foundation / tokens / fonts / assets

**Entrada:** `APPROVED STEP 1` y decisiones de marca necesarias resueltas.

**Trabajo:** implementar tokens y theme central, cargar Inter con fallback y pesos aprobados, incorporar assets normalizados y derivados necesarios, registrar variantes y documentar su uso. Integrar temas existentes sin duplicación. Preparar muestra de tokens y contrastes mediante herramientas existentes.

**Límite:** no migrar páginas de roles. Si cambiar tokens globales afecta pantallas todavía pendientes, documentar el impacto, evitar estados rotos y validar regresiones; utilizar compatibilidad temporal acotada con retiro en STEP 10 cuando sea necesario.

**Aceptación:** fuente única de decisiones visuales; fuentes y logos cargan correctamente; derivados legibles; pares semánticos accesibles; comportamiento inicial de temas estable; pesos y solicitudes medidos.

**HARD APPROVAL GATE:** detenerse y esperar `APPROVED STEP 2` antes de STEP 3.

### STEP 3 — Shared Components / Layouts

**Entrada:** `APPROVED STEP 2`.

**Trabajo:** migrar componentes comunes, navegación y shells; crear o adaptar componente de marca; cubrir estados interactivos, overlays, loading/empty/error y responsive. Mantener contratos y composición existentes.

**Aceptación:** catálogo de componentes reales actualizado; variantes y estados completos; keyboard/foco correctos; layouts sin recortes; revisión de impacto en todos los roles consumidores. No crear copias por rol.

**HARD APPROVAL GATE:** detenerse y esperar `APPROVED STEP 3` antes de STEP 4.

### STEP 4 — Auth / Public

**Entrada:** `APPROVED STEP 3`.

**Trabajo:** migrar rutas públicas y de autenticación existentes: acceso, registro, recuperación, verificación, invitaciones, onboarding, páginas informativas y errores públicos, según Discovery. Aplicar metadatos de marca bajo control de la app.

**Aceptación:** todos los recorridos públicos/auth descubiertos cubiertos; validación y mensajes legibles; responsive correcto; redirecciones, sesión, proveedores y guardas conservan comportamiento. No agregar flujos ausentes.

**HARD APPROVAL GATE:** detenerse y esperar `APPROVED STEP 4` antes de STEP 5.

### STEP 5 — Client / Cliente

**Entrada:** `APPROVED STEP 4`.

**Trabajo:** migrar todas las rutas de cliente verificadas. Ejemplos a confirmar: exploración, filtros, ficha de negocio/servicio/profesional, reserva, confirmación, historial, perfil y ajustes.

**Aceptación:** matriz del cliente completa, incluidos carga, sin resultados, error y contenido largo; recorrido principal existente probado; estados de turnos comprensibles sin depender del color; identidad del negocio preservada.

**HARD APPROVAL GATE:** detenerse y esperar `APPROVED STEP 5` antes de STEP 6.

### STEP 6 — Professional / Profesional

**Entrada:** `APPROVED STEP 5`.

**Trabajo:** migrar todas las rutas profesionales existentes: dashboard, agenda, detalles, disponibilidad, historial, perfil u otras identificadas. Incluir formularios y modales propios del rol.

**Aceptación:** matriz profesional completa; calendarios y densidad de información legibles; acciones y permisos intactos; estados y responsive validados. Turnos manuales se cubren solo si ya existen.

**HARD APPROVAL GATE:** detenerse y esperar `APPROVED STEP 6` antes de STEP 7.

### STEP 7 — Admin

**Entrada:** `APPROVED STEP 6`.

**Trabajo:** migrar todas las rutas de administración existentes: dashboard, gestión de negocio, servicios, equipo, agenda, usuarios, ajustes y reportes, según inventario. Revisar tablas, filtros y formularios extensos.

**Aceptación:** matriz admin completa; gráficos y estados conservan significado; navegación y permisos intactos; branding de plataforma y negocio diferenciados. Si admin también puede actuar como profesional, revisar ambos contextos sin modificar el modelo de roles.

**HARD APPROVAL GATE:** detenerse y esperar `APPROVED STEP 7` antes de STEP 8.

### STEP 8 — Superadmin

**Entrada:** `APPROVED STEP 7`.

**Trabajo:** migrar todas las rutas globales existentes: panel, negocios, usuarios, configuración, auditoría u otras descubiertas. Aplicar los mismos tokens y componentes, manteniendo jerarquía de acciones críticas.

**Aceptación:** matriz superadmin completa; acciones destructivas distinguibles; tablas densas y estados cubiertos; guardas y separación entre tenants sin cambios. No usar cuentas reales privilegiadas para pruebas destructivas.

**HARD APPROVAL GATE:** detenerse y esperar `APPROVED STEP 8` antes de STEP 9.

### STEP 9 — Templates / superficies secundarias

**Entrada:** `APPROVED STEP 8`.

**Trabajo:** migrar emails, notificaciones, impresión, exportaciones, metadatos sociales y pantallas secundarias existentes. Revisar superficies configurables fuera del frontend e indicar límites de proveedores externos.

**Aceptación:** inventario secundario resuelto o N/A justificado; previews verificadas con datos de prueba; variables y enlaces preservados; lectura aceptable sin fuentes o imágenes remotas; sin envíos reales. No crear canales de notificación nuevos.

**HARD APPROVAL GATE:** detenerse y esperar `APPROVED STEP 9` antes de STEP 10.

### STEP 10 — Cleanup legacy

**Entrada:** `APPROVED STEP 9`.

**Trabajo:** eliminar assets sin uso, colores y fuentes antiguos, reglas duplicadas, tokens de compatibilidad temporal, referencias de marca de prueba y documentación vigente obsoleta. Verificar imports dinámicos, plantillas y cachés antes de retirar archivos.

**Aceptación:** búsqueda documentada sin referencias legacy activas no justificadas; excepciones inventariadas; una única fuente de tokens y assets; sin enlaces o recursos rotos; build y verificaciones pertinentes aprobados.

**HARD APPROVAL GATE:** detenerse y esperar `APPROVED STEP 10` antes de STEP 11.

### STEP 11 — Final QA

**Entrada:** `APPROVED STEP 10`.

**Trabajo:** cerrar la matriz integral, revisar todos los roles y superficies, ejecutar controles del repositorio y pruebas pertinentes, comparar capturas, medir rendimiento final, completar documentación y preparar instrucciones de entrega y reversión.

**Aceptación:** Definition of Done satisfecha; evidencia trazable, defectos resueltos y excepciones aceptadas; ningún resultado inventado; no se declara verde una prueba que no se ejecutó.

**HARD APPROVAL GATE:** detenerse y esperar `APPROVED STEP 11`. Solo entonces marcar la feature como aceptada/cerrada. El despliegue queda fuera de esta aprobación.

## 9. Estrategia de validación y criterios de aceptación

### Matriz de cobertura obligatoria

Usar una fila por superficie real, ampliada por estados relevantes. No sustituirla por una lista de roles marcada globalmente como completa.

| ID | Ruta/superficie real | Acceso/rol | Layout/componente | Estado | Tema | Viewport | STEP | Requisito | Evidencia | Resultado |
|---|---|---|---|---|---|---|---|---|---|---|
| Por completar en STEP 1 | Por descubrir | Por verificar | Por verificar | normal/loading/empty/error/etc. | existente | existente | asignado | RF/RNF | captura/test/revisión | pendiente |

Cubrir todas las rutas al menos en su estado normal, y los estados relevantes de cada patrón reutilizable y flujo crítico. Documentar el muestreo de combinaciones para evitar una matriz inabarcable, sin excluir roles, temas o variantes únicas.

### Pruebas

- **Controles existentes:** ejecutar lint, chequeo de tipos, tests y build según scripts reales; registrar comando, entorno y resultado.
- **Componentes, si existe infraestructura:** verificar variantes del logo, estados de controles, theme, accesibilidad y comportamiento que pueda afectarse por la migración.
- **Visuales, si existen:** baseline previa y comparación posterior por roles, temas y tamaños representativos; fijar datos, fuentes, animaciones y reloj cuando sea necesario para resultados reproducibles.
- **E2E, si existen:** cubrir auth y flujos principales ya implementados de cada rol; comprobar navegación, permisos y estados críticos. Usar fixtures o entorno de pruebas y evitar operaciones reales destructivas.
- **Accesibilidad:** contrastes medidos, teclado, foco, zoom/reflow y revisión de anuncios y nombres accesibles; complementar con herramientas existentes.
- **Manual:** inspección de todas las superficies, recursos rotos, contenido largo, estados y plataformas objetivo.
- **Rendimiento:** comparar fuentes, assets y métricas seleccionadas con la baseline usando condiciones equivalentes.

Si faltan suites visuales, de componentes o E2E, registrarlo en Discovery y proponer cobertura manual reproducible o incorporación acotada para aprobación. No instalar una infraestructura completa sin decisión de alcance, ni confundir “suite ausente” con “tests aprobados”. Revisar las diferencias visuales antes de aceptar nuevas referencias.

### Escenarios de aceptación

1. **Identidad compartida:** dado un usuario de cualquier rol, cuando navega entre sus páginas, entonces conserva tipografía, componentes y semántica visual consistentes.
2. **Variante de logo:** dado un fondo claro u oscuro soportado, el logo se muestra legible, proporcionado y con nombre accesible correcto.
3. **Fallo de fuente:** si Inter no carga, el contenido sigue legible y el layout permanece utilizable.
4. **Acción y error:** ante un error de formulario o acción destructiva, existe texto identificable y un estado semántico accesible, sin depender solo del amarillo de marca.
5. **Responsive:** en móvil estrecho y con zoom, navegación y acciones críticas siguen disponibles sin superposiciones.
6. **Temas:** si hay light/dark, cambiar o restaurar la preferencia conserva legibilidad y assets apropiados en todas las superficies.
7. **Compatibilidad funcional:** los flujos existentes completan las mismas operaciones y mantienen permisos y datos previos.
8. **Legacy:** las búsquedas finales y recorridos no encuentran identidad de prueba activa fuera de excepciones aprobadas.
9. **Gate:** al terminar un STEP, no existe implementación del siguiente sin aprobación humana registrada.

## 10. Riesgos y tratamiento

| Riesgo | Tratamiento y evidencia requerida |
|---|---|
| Contraste insuficiente de amarillo o gris | Medir pares reales, definir foregrounds adecuados y reservar combinaciones decorativas para usos no funcionales. |
| PNG pierde legibilidad en favicon | Probar derivados a tamaño real; solicitar original o adaptación aprobada si no funciona. |
| Variante disponible solo en la lámina | No extraer como asset oficial; usar variante entregada o resolver faltante en gate. |
| Fuente no incluida o licencia sin verificar | Resolver origen y licencia antes de distribuir; mantener fallback aprobado y declarar el pendiente. |
| Cambio global rompe páginas no migradas | Auditar consumidores, validar regresiones y acotar compatibilidad temporal. |
| Duplicación de estilos entre roles | Contrato compartido, revisión de imports y búsqueda de valores repetidos. |
| Cambio de marca invade identidad de negocios | Inventariar propiedad de cada asset/texto y preservar datos de tenants. |
| Correos no respetan CSS/theme web | Renderizado compatible desde fuente común, fallback y pruebas de clientes objetivo. |
| Caché mantiene logo anterior | Revisar referencias, versionado y mecanismos de actualización existentes. |
| Regresión de carga o estabilidad visual | Optimización de derivados, fuentes limitadas y medición comparable. |
| Rutas o estados olvidados | Matriz basada en router y recorrido, con trazabilidad por superficie. |
| Snapshots ocultan regresiones | Revisión explícita de diferencias antes de actualizar baselines. |
| Alcance crece hacia rediseño funcional | Separar propuesta adicional; no implementarla dentro de branding sin aprobación. |

## 11. Definition of Done

- [ ] ZIP y assets del proyecto inventariados; mapa origen → producción → consumidores documentado.
- [ ] Fuente, licencia, pesos, fallback y carga definidos y verificados.
- [ ] Tokens/theme centralizados y paleta semántica aprobada; sin sistemas visuales paralelos.
- [ ] Logos, favicon y app icons aplicables legibles y correctamente referenciados.
- [ ] Componentes y layouts comunes migrados sin copias por rol.
- [ ] Auth/público, cliente, profesional, admin y superadmin cubiertos según existencia real.
- [ ] Estados loading/empty/error y demás variantes aplicables revisados.
- [ ] Responsive y todos los temas existentes validados.
- [ ] Contraste, teclado, foco, zoom y demás controles de accesibilidad documentados.
- [ ] Plantillas y superficies secundarias migradas o N/A aprobado.
- [ ] Branding legacy y compatibilidad temporal retirados; excepciones justificadas.
- [ ] Funcionalidades, permisos y datos conservados.
- [ ] Pruebas y controles pertinentes ejecutados; limitaciones explícitas.
- [ ] Rendimiento final dentro de presupuestos aprobados o excepción aceptada con evidencia.
- [ ] Matriz de cobertura completa y diferencias visuales revisadas.
- [ ] Guía de marca aplicada, tokens, componentes, assets y decisiones documentados según SDD.
- [ ] README/sprints actualizados si el workflow lo requiere, sin duplicar especificaciones.
- [ ] Instrucciones de entrega y reversión preparadas; sin despliegue implícito.
- [ ] Gates 1–11 con aprobaciones humanas registradas para esta feature.

## 12. Documentación y registro de decisiones

Adaptar los nombres y ubicaciones a las convenciones existentes. Mantener:

- Auditoría de marca y cobertura de rutas/superficies.
- Registro de tokens, temas, tipografía y combinaciones accesibles.
- Catálogo de assets con procedencia, licencia cuando corresponda, uso, dimensiones y derivados.
- Guía de componentes compartidos y reglas para páginas nuevas.
- Decisiones de arquitectura o marca, alternativas y aprobación asociada.
- Evidencia por STEP, pruebas, capturas, métricas y limitaciones.
- Excepciones legacy y N/A con justificación.
- Registro de aprobaciones: STEP, revisión entregada, fecha, mensaje humano exacto y alcance habilitado.

**Regla de mantenimiento:** toda página o componente nuevo debe reutilizar el sistema aprobado. No agregar colores de marca, familias tipográficas o variantes de logo directamente en una página para resolver una necesidad local.

## 13. Instrucción de ejecución

Al recibir la orden de iniciar esta feature, leer el workflow existente y ejecutar solamente **STEP 1 — Discovery / Brand Audit y arquitectura**, sin implementación. Presentar hallazgos, decisiones pendientes y propuesta verificable.

**HARD STOP. No iniciar STEP 2 hasta recibir `APPROVED STEP 1`. Repetir el mismo control después de cada STEP hasta `APPROVED STEP 11`.**
