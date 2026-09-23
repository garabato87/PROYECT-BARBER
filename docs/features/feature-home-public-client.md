# Feature Specification — Home público y del cliente VANITY

## Metadata

- **ID:** HOME-PUBLIC-CLIENT
- **Tipo:** FEATURE / UI/UX / REFACTOR acotado.
- **Sprint:** asignar según planificación existente; no inventar número.
- **Prioridad:** Alta.
- **Estado:** Completado
- **Fecha:** 2026-09-17.
- **Proyecto inspeccionado:** `C:\Users\usuario\Desktop\PROYECT-BARBER`.
- **Ubicación sugerida:** `docs/features/feature-home-public-client.md`.
- **Ejecutor previsto:** Antigravity, siguiendo SDD + ECC + UI/UX Pro Max instalados.

## 1. Objetivo

Transformar el home `/` en una experiencia de exploración VANITY, compartida por visitantes y clientes autenticados. Mantener una única base de componentes, con navegación horizontal y contenido adaptado a la sesión.

El visitante debe poder descubrir negocios y comenzar el recorrido de reserva. El cliente autenticado debe conservar esa exploración y acceder rápidamente a su próximo turno, sus reservas y su perfil.

La implementación debe reutilizar los datos, temas, componentes de marca y flujos reales del proyecto. El boceto no autoriza crear datos ficticios en producción ni funcionalidades que no existen.

## 2. Motivo

El home actual utiliza un layout de panel con sidebar, muestra prácticamente el mismo contenido antes y después del login y presenta algunas etiquetas que no están respaldadas por su lógica: “Populares cerca de ti” no utiliza popularidad ni distancia, y “Abierto” representa el estado activo del negocio, no su horario.

Se busca priorizar búsqueda y descubrimiento, dar contexto personal al cliente y comunicar con precisión lo que permite el producto.

## 3. Actores

- Visitante sin sesión.
- Cliente autenticado con próximo turno.
- Cliente autenticado sin próximo turno, con o sin historial.
- Admin, profesional o superadmin que acceda a `/`: conservar sus permisos y un acceso correcto a su panel, sin etiquetarlo como cliente.
- Propietario del proyecto: valida decisiones y aprueba cada STEP.

## 4. Fuentes de verdad y contexto verificado

### Jerarquía y workflow

1. Instrucciones explícitas vigentes del propietario y decisiones aprobadas para esta feature.
2. Código y configuración actuales para determinar capacidades reales.
3. `docs/sdd/workflows/`, incluyendo `SESSION-START.md`, y reglas aplicables en `.agents/`.
4. `docs/sdd/MASTER_GUIDE.md`.
5. Esta especificación y otras especificaciones aprobadas aplicables.
6. `docs/PROJECT_SPEC.md`, README y planificación/sprints existentes.
7. ECC y UI/UX Pro Max como capacidades especializadas subordinadas al proyecto.
8. Boceto como referencia de composición, sin atribuirle nuevos requisitos de backend.

Se encontró el directorio real `docs/sdd/workflows/` en plural. Algunos documentos mencionan `docs/sdd/workflow/` o `docs/workflow/`: localizar la ruta real, informar la discrepancia y no crear directorios duplicados.

Leer `.agents/rules/00-sdd-enforcement.md` y el Master Guide antes de proponer código. Aplicar las skills instaladas pertinentes; no asumir comandos o agentes por nombre. Usar UI/UX Pro Max para estructura, responsive y accesibilidad, sin reemplazar los tokens VANITY por una paleta genérica.

### Evidencia del código revisado

| Archivo | Estado observado y utilidad |
|---|---|
| `src/App.tsx` | `/` usa `HomePage`; `/client/dashboard` es el acceso a reservas; existen rutas por rol. |
| `src/pages/HomePage.tsx` | Consulta negocios activos en Firestore, filtra categoría y busca por nombre/dirección en los resultados cargados. |
| `src/components/ClientLayout.tsx` | Sidebar compartida entre exploración y otras páginas del cliente. Cambiarla globalmente puede afectar otras rutas. |
| `src/pages/LoginPage.tsx` | Respeta un redirect interno y, en ausencia de este, envía al cliente a `/` y a otros roles a su panel. |
| `src/pages/ClientDashboardPage.tsx` | Lee turnos del cliente; permite reutilizar conocimiento de datos para próximo turno. Su clasificación actual por estado no garantiza que el turno sea futuro. |
| `src/pages/BarbershopDetailsPage.tsx` | Guarda selección pendiente y redirige a login al intentar reservar sin sesión. |
| `src/utils/bookingSession.ts` | Almacena temporalmente selección de reserva en sessionStorage. |
| `src/components/ui/BrandLogo.tsx` | Logos VANITY por variante y tema. |
| `src/styles/variables.css` | Inter, colores VANITY y temas claro/oscuro existentes. |
| `src/types/index.ts` | Negocio con nombre, dirección, categoría y estado; no define portada, coordenadas ni valoración. |
| `package.json` | React, TypeScript, Vite, Firebase, Tailwind, Lucide, Framer Motion, Vitest y Testing Library. |

Revalidar todo en Discovery: el repositorio tenía numerosos cambios locales sin confirmar. No sobrescribirlos, revertirlos ni considerar esta lectura una auditoría del estado futuro. No se verificaron datos ni reglas desplegadas, ni se ejecutó una auditoría visual completa en navegador.

## 5. Alcance

### Incluido

- Home único `/` con estados visitante/cliente.
- Layout de exploración con navegación horizontal, responsive y sin sidebar en el home.
- Hero público y bienvenida compacta para cliente.
- Buscador por nombre/dirección y filtros por categorías reales.
- Grilla de negocios activos con datos reales y fallback honesto sin portada.
- Próximo turno del cliente y accesos a reservas/perfil.
- Loading, error con reintento, resultados vacíos y ausencia de próximo turno.
- Bloque “Cómo funciona”, sección para negocios condicionada a destino válido y footer.
- Conservación del recorrido existente de reserva, login y retorno.
- Accesibilidad, ambos temas existentes, rendimiento y pruebas pertinentes.
- Documentación SDD y revisión especializada.

### No incluido

- Rediseño completo de ficha de negocio, checkout/reserva, auth, Mis Reservas o paneles internos.
- Geolocalización, mapas, distancias, rankings, reseñas, favoritos o recomendaciones personalizadas.
- Búsqueda transversal por servicios: hoy la búsqueda es de negocios por nombre/dirección.
- Nuevo sistema de imágenes/portadas, uploads, CMS o banco de fotografías de negocios.
- Alta comercial de negocios, pagos, nuevos roles o modificación de permisos como parte del rediseño.
- Reservas creadas automáticamente al volver del login.
- Migración global de marca: reutilizar lo implementado por la feature de branding.
- Datos de ejemplo del boceto en producción.
- Deploy, publicación o comunicaciones a usuarios reales.

Un hallazgo fuera de alcance se informa con impacto y propuesta separada. Si bloquea la seguridad o viabilidad de esta feature, detener la parte dependiente y resolverlo mediante una decisión explícita, sin ampliar el alcance silenciosamente.

## 6. Referencia visual acordada

### Visitante

1. Header: logo VANITY, Explorar, Para negocios si tiene destino válido e Ingresar.
2. Hero: **“Un momento para vos. Un lugar para encontrarlo.”**
3. Descripción: **“Explorá barberías, peluquerías y espacios de belleza. Elegí tu próximo turno.”**
4. Buscador **“Nombre o dirección”** y acción **“Buscar”**.
5. Categorías y sección **“Explorá negocios”**.
6. Cómo funciona: explorar un negocio, elegir servicio/profesional/horario e ingresar para confirmar.
7. Bloque para negocios: **“Conectá tu negocio. Simplificá tu día.”** solo con CTA de destino aprobado.
8. Footer con enlaces reales existentes o aprobados.

### Cliente autenticado

1. Mismo header, con Explorar, Mis reservas y Perfil.
2. Saludo breve con nombre real seguro; fallback “Hola” si no hay nombre utilizable.
3. Próximo turno cuando exista, con fecha, hora, negocio, servicio, estado y acceso a Mis Reservas.
4. Mismo buscador, categorías y grilla.
5. Sin bloque introductorio “Cómo funciona” ni bloque comercial prominente.
6. Si no tiene próximo turno: invitación breve a explorar. No decir “primer turno” cuando posee historial.

### Dirección visual

- Reutilizar Inter y los tokens existentes, con amarillo VANITY para acciones relevantes y texto oscuro sobre amarillo cuando corresponda al par accesible.
- Espacio suficiente, jerarquía clara y bordes discretos; evitar efectos que oculten información.
- Reducir el protagonismo del hero para que el buscador y las opciones aparezcan pronto.
- No conservar por obligación el carrusel/marquee de fotos de stock actual. No usar fotos de stock como si fueran portadas reales de negocios.
- Preservar claro/oscuro y preferencia existente.
- Los controles de “Experiencia” y “Vista”, avisos de datos ficticios y mensajes explicativos del boceto son herramientas de revisión: **no forman parte del producto**.

## 7. Requisitos funcionales

### FR-001 — Home compartido y sesión

Mantener `/` como home de exploración. Determinar el estado mediante la autenticación existente, distinguiendo sesión cargando, visitante, cliente y otros roles.

Mientras se resuelve la sesión, evitar mostrar brevemente el contenido personal de otro usuario o controles incorrectos. Ante logout o cambio de usuario, cancelar suscripciones y limpiar datos personales inmediatamente.

### FR-002 — Layout y navegación

Construir o adaptar un layout de exploración aislado del panel existente. Extraer piezas compartidas si corresponde; no duplicar un Header completo ni mutar globalmente `ClientLayout` sin revisar consumidores.

El logo y Explorar deben permitir volver a `/`. Mis reservas enlaza a `/client/dashboard`; Perfil a `/profile`; Ingresar al flujo real de login. Otros roles deben conservar un acceso a su panel correspondiente y no recibir módulos personales exclusivos de cliente.

En móvil, mantener accesibles las acciones importantes mediante una disposición compacta o menú accesible. No ocultar funcionalidades sin alternativa. Los enlaces internos deben permitir navegación normal del navegador.

### FR-003 — Búsqueda real y filtros

- Buscar por nombre y dirección; no prometer búsqueda por servicios, geolocalización o ciudad normalizada.
- Ignorar mayúsculas/minúsculas y, si se implementa normalización, cubrir tildes con tests.
- Aplicar búsqueda y categoría conjuntamente, con campos ausentes manejados de forma segura.
- Reutilizar `BUSINESS_CATEGORIES` y tipos existentes; evitar otra lista divergente. Definir en Discovery qué categorías se muestran y conservar “Todos”.
- Buscar con Enter y botón; cualquier filtrado inmediato debe ser coherente con esas acciones.
- Permitir limpiar búsqueda y filtros desde el estado vacío.
- Mantener contexto de exploración al regresar desde una ficha; preferir URL para búsqueda/categoría si encaja con el router y plan aprobado. No introducir persistencia de ubicación implícita.
- Evitar respuestas fuera de orden al cambiar rápidamente filtros y actualizar contadores solo con resultados vigentes.

### FR-004 — Negocios y tarjetas

- Consultar negocios activos según reglas actuales y mostrar nombre, categoría y dirección reales.
- Encabezado “Explorá negocios” o equivalente aprobado. No afirmar cercanía, popularidad o disponibilidad instantánea sin lógica que lo pruebe.
- Quitar “Abierto/Cerrado” derivado de `status`. “Activo” no representa horario comercial.
- Tarjetas con enlace accesible a `/barbershop/:id`, mediante elementos semánticos y foco visible; no solo `div` con onClick.
- Si no existe portada válida, usar fallback visual consistente. No introducir campos nuevos solo para reproducir el boceto.
- Si Discovery encuentra un campo de imagen real, validar su uso, carga fallida, dimensiones y procedencia antes de mostrarlo.
- Nombres y direcciones largos deben mantener la información útil y no romper la grilla.

### FR-005 — Próximo turno

- Consultar únicamente turnos del cliente autenticado, nunca toda la colección para filtrar luego en la interfaz.
- Extraer una capa reutilizable de consulta/selección cuando reduzca duplicación con Mis Reservas, sin rediseñar esa página.
- Seleccionar el turno cronológicamente más próximo entre estados `pending` o `confirmed` cuyo inicio sea futuro respecto del criterio temporal aprobado.
- No mostrar turnos pasados, cancelados, completados o ausentes como próximos.
- Definir zona horaria usando la convención real del producto; no asumir UTC para cadenas locales de fecha/hora. Resolver empates de manera estable.
- Mostrar correctamente “Pendiente” o “Confirmado”, sin convertirlos en un único estado ficticio.
- Manejar fechas inválidas, campos faltantes y ausencia de negocio/servicio con fallback legible; no bloquear la exploración.
- Actualizar o invalidar el resumen cuando una cancelación o cambio vuelva desde Mis Reservas y cuando pase la hora relevante según estrategia aprobada.
- No suscribir ni consultar turnos para visitantes. Limpiar datos y listeners al cambiar sesión.
- Acción “Ver mi turno” debe conducir a una superficie existente; por defecto Mis Reservas. No inventar ruta de detalle.

### FR-006 — Cliente sin próximo turno

Mostrar saludo y mensaje breve para explorar. Distinguir ausencia de próximo turno de ausencia total de historial si se usa texto de “primera reserva”. No consultar todo el historial únicamente para personalizar una frase; usar una frase neutral si evita lecturas innecesarias.

Error de consulta no equivale a “no tenés turnos”. Mostrar estado independiente con reintento, manteniendo operativo el catálogo.

### FR-007 — Continuidad de reserva

Preservar el flujo real de `BarbershopDetailsPage` y `bookingSession`: selección, acceso, retorno a ficha y confirmación consciente del cliente.

No cambiar las redirecciones por rol ni la ruta premium como efecto lateral. Comprobar login por métodos existentes y registro cuando conserve el redirect. La disponibilidad debe revalidarse al confirmar; una selección guardada no garantiza que siga libre.

Esta feature no exige rediseñar ni unificar los dos flujos de reserva existentes. Registrar incompatibilidades detectadas y resolver las que sean regresiones causadas por el home.

### FR-008 — Contenido público, negocios y footer

“Cómo funciona” debe describir el flujo realmente disponible. No incorporar testimonios, cifras, reseñas o promesas comerciales inventadas.

El CTA para negocios es una decisión pendiente: reutilizar una página/contacto existentes y aprobados, o no renderizar CTA y enlaces asociados hasta resolver su destino. No usar `#`, botones que no hacen nada, alertas de demostración ni registro de cliente como supuesto alta comercial.

Footer solo con enlaces válidos. No crear textos legales nuevos ni rutas inexistentes como relleno.

### FR-009 — Loading, empty y error

- Loading del catálogo con estructura estable y estado accesible; no mostrar contador “0 locales” como resultado final mientras carga.
- Diferenciar catálogo sin negocios, búsqueda sin coincidencias y error de carga.
- Mostrar mensaje comprensible y reintento ante fallo, usando manejo de errores existente cuando corresponda.
- Mantener búsqueda y categoría al reintentar.
- Un fallo del próximo turno no debe impedir buscar negocios y viceversa.

## 8. Reglas de negocio y seguridad

- `status: active` significa habilitado en plataforma, no abierto ahora.
- La autenticación no debe ser necesaria para explorar negocios que ya son públicos.
- La reserva conserva sus controles actuales de autenticación y disponibilidad.
- La interfaz no es una barrera de permisos: consultas y reglas deben asegurar aislamiento real de datos personales.
- No cargar secretos ni registrar datos personales en mensajes de depuración nuevos.
- No alterar roles, guardas, reglas de Firestore o índices sin análisis y alcance aprobado.
- El acceso administrativo a `/` no debe degradar su rol ni presentar controles de cliente prohibidos.

**Hallazgo a evaluar en Discovery:** las reglas locales inspeccionadas permiten `allow read: if true` sobre reservas de negocio. Filtrar por `clientId` en el frontend no corrige esa exposición. Revisar el impacto del resumen personal y documentar un trabajo separado si requiere rediseñar disponibilidad/reglas. No afirmar que las reglas desplegadas coinciden con el archivo local. Si el riesgo impide aceptar la feature, presentar un bloqueo concreto antes de producción.

## 9. UX, accesibilidad y responsive

- Diseñar desde móvil y verificar escritorio, con el mismo contenido funcional.
- Validar al menos 320, 390, 768 y 1440 CSS px, ajustados a breakpoints reales.
- Sin scroll horizontal de página, solapamientos ni acciones ocultas por elementos fijos.
- Un encabezado principal coherente, jerarquía semántica y regiones de navegación etiquetadas.
- Labels visibles en búsqueda, botones con nombres accesibles y filtros con estado seleccionado anunciado.
- Navegación completa por teclado, foco visible y enlaces semánticos en tarjetas.
- Texto normal con contraste mínimo 4.5:1; texto grande y elementos no textuales esenciales, 3:1 según corresponda.
- Validar ambos temas, zoom 200 %, reflow y preferencia de movimiento reducido.
- Actualizaciones relevantes de resultados y errores anunciadas sin saturar lectores de pantalla.
- Evitar animación continua innecesaria y movimiento automático al escribir. Scroll a resultados solo ante una acción explícita cuando resulte útil.
- Aplicar logos oficiales sin deformación y variante según fondo real.

## 10. Rendimiento y arquitectura

- Reutilizar tokens y fuentes ya existentes; no cargar Inter de nuevo desde cada componente.
- Evitar nuevas dependencias para resolver layout, búsqueda o estados simples.
- No hacer lecturas por cada tarjeta para inferir precios, fotos o disponibilidad no requeridos.
- Evaluar volumen real de negocios y costo del patrón actual de consulta. Si necesita paginación/búsqueda remota, proponer alcance explícito; no aplicar `limit` de forma que se anuncie una búsqueda completa sobre un subconjunto oculto.
- Controlar listeners, carreras entre consultas y actualizaciones tras desmontaje.
- Definir límite/estrategia de consulta del próximo turno compatible con índices y datos reales, sin descargar historial ilimitado innecesariamente.
- No añadir fuentes de datos simuladas como fallback de errores.
- Mantener dimensiones estables en imágenes y skeletons; cargar imágenes de forma eficiente solo cuando existan.
- Comparar solicitudes, peso y comportamiento con baseline local; no inventar resultados de rendimiento.

## 11. Dependencias y decisiones pendientes

Discovery debe resolver y registrar:

1. Estado actual de branding y solapamiento con `feature-brand-identity-system.md` y otras features activas.
2. Archivos modificados por trabajo anterior y forma de preservar esos cambios.
3. Estado de carga de autenticación y comportamiento de cada rol al entrar a `/`.
4. Esquema real de turnos, fechas, zona horaria, campos desnormalizados e índices disponibles.
5. Destino de Para negocios/Conocer VANITY y enlaces de footer.
6. Categorías visibles y estrategia de persistencia de filtros al volver.
7. Volumen del catálogo, consulta actual y necesidad real de optimización.
8. Disponibilidad de pruebas E2E, emuladores, fixtures y entorno seguro de revisión.
9. Riesgo de lectura pública de reservas y si requiere una feature de seguridad bloqueante.

Resolver con inspección antes de preguntar. No asumir que una dependencia está completada por encontrar su especificación.

## 12. Casos límite

- Sesión tarda en resolver, falla o cambia con consultas pendientes.
- Cliente sin nombre, nombre largo o caracteres especiales.
- Cliente sin próximo turno pero con historial.
- Turno pendiente cuya fecha ya pasó; turno exactamente en el límite temporal; fechas inválidas.
- Turno cancelado en otra pantalla o sesión.
- Negocio con dirección/categoría faltante o imagen rota.
- Búsqueda sin coincidencias, solo espacios, tildes y cambios rápidos de categoría.
- Error de Firestore o índice ausente; no confundirlo con resultados vacíos.
- Regreso desde login, registro, ficha o Mis Reservas mediante navegación y botón Atrás.
- Profesional/admin/superadmin abre el home público con sesión iniciada.
- Pantalla estrecha, zoom, tema oscuro, teclado y movimiento reducido.

## 13. Criterios de aceptación

| ID | Dado / Cuando | Entonces |
|---|---|---|
| AC-01 | Visitante abre `/` | Ve header horizontal, hero, búsqueda, categorías y catálogo; no consulta ni muestra turnos privados. |
| AC-02 | Cliente inicia sesión sin redirect de reserva | Llega a `/` con bienvenida compacta y accesos a reservas/perfil. |
| AC-03 | Cliente tiene varios turnos | Se muestra solo el próximo elegible por fecha, hora y estado, con información real. |
| AC-04 | Cliente no tiene próximo turno | Puede explorar; no se muestra una tarjeta ficticia ni se afirma que no existe historial. |
| AC-05 | Consulta personal falla | Se comunica el error y se puede reintentar; catálogo sigue utilizable. |
| AC-06 | Se combina búsqueda y categoría | Solo aparecen coincidencias vigentes; Enter y Buscar funcionan y Limpiar restablece el catálogo. |
| AC-07 | No hay coincidencias o no hay negocios | Se muestra el estado correcto, diferente de error y loading. |
| AC-08 | Visitante elige un negocio | Abre la ficha existente; puede continuar el recorrido de reserva sin pérdida causada por el nuevo home. |
| AC-09 | Se pide login durante reserva | Se conserva la selección conforme al flujo existente, se vuelve al destino correcto y no se reserva automáticamente. |
| AC-10 | Negocio está activo | No se infiere “Abierto”, distancia, popularidad ni valoración. |
| AC-11 | Usuario navega con teclado o móvil | Todos los controles son accesibles y el contenido se adapta sin desbordamientos. |
| AC-12 | Se cambia tema | Todo el home mantiene identidad y contraste, incluido logo, filtros y estados. |
| AC-13 | Se cierra o cambia sesión | Se eliminan datos personales previos y suscripciones asociadas. |
| AC-14 | Otro rol visita `/` | Mantiene acceso correcto a su panel, sin identidad ni permisos de cliente inventados. |
| AC-15 | No existe destino comercial aprobado | No hay botones vacíos ni rutas comerciales ficticias. |
| AC-16 | Se revisa producción | No aparecen datos, controles de simulación ni avisos del boceto. |

## 14. Política de aprobación — HARD APPROVAL GATES

**No avanzar sin aprobación explícita del STEP que se va a ejecutar.**

Para esta feature se usa la convención del workflow local: `APPROVED STEP X` autoriza ejecutar **STEP X**, no el siguiente. También son válidas las expresiones equivalentes que admite el workflow local y que identifican expresamente ese STEP. No heredar aprobaciones de otras features.

1. La orden de analizar/iniciar habilita la inicialización y Discovery de solo lectura. No habilita implementación.
2. Después de Discovery, entregar plan concreto y detenerse antes del primer STEP de código.
3. Antes de cada STEP de implementación debe existir `APPROVED STEP X` para esa revisión y alcance.
4. Al terminar STEP X, ejecutar validación/revisión, entregar evidencia y hacer HARD STOP. Para ejecutar STEP X+1 se necesita `APPROVED STEP X+1`.
5. “OK”, silencio, aprobación del plan global o tests verdes no autorizan STEPs posteriores.
6. No adelantar tareas de otro STEP mientras se espera. Correcciones del STEP actual permanecen dentro de ese alcance.
7. Cambios materiales de alcance o arquitectura requieren revalidación del plan afectado.
8. La aceptación final de la feature no autoriza deploy.

**Conflicto conocido:** la especificación anterior de branding define otra convención, donde aprobar X habilita X+1. No mezclar ambos mecanismos. Esta feature adopta el STEP a ejecutar, como indica `SESSION-START.md`. Si el propietario establece otra convención, registrarla antes de implementar.

### Reporte obligatorio después de cada STEP

- Objetivo y alcance ejecutado.
- Archivos afectados y decisiones tomadas.
- Criterios cubiertos y evidencia visual/funcional.
- Comandos reales ejecutados y resultados, distinguiendo no ejecutado y N/A.
- Revisión ECC/UI/UX/seguridad pertinente y hallazgos.
- Pendientes, riesgos y excepciones.
- Próximo STEP propuesto, sin ejecutarlo.
- **HARD STOP — esperando `APPROVED STEP [siguiente]`.**

## 15. Plan SDD por STEPs

Los nombres de componentes o hooks nuevos deben acordarse tras Discovery; los siguientes describen responsabilidades, no archivos existentes ficticios.

### STEP 1 — Discovery y arquitectura, solo lectura

**Objetivo:** verificar esta especificación contra el repositorio actual y definir el cambio mínimo.

**Inspeccionar:** workflow, Master Guide, reglas ECC, UI/UX Pro Max, specs relacionadas, rutas, HomePage, ClientLayout/Header, auth, BrandLogo, tokens, categorías, tipos, reservas, reglas, índices y tests.

**Entregar:** mapa visitante/cliente/otros roles; datos disponibles; dependencias; baseline visual local; arquitectura del layout y consulta de próximo turno; estrategia de filtros; decisiones pendientes; riesgos y plan de archivos/tests por STEP.

**Restricciones:** no tocar código, dependencias, assets, datos o configuración. Persistir informe solo si el workflow y autorización lo permiten.

**Aceptación / DoD:** decisiones necesarias resueltas o bloqueos concretos; referencias verificadas; plan trazable a AC-01–16. Reportar capacidad disponible para TDD, revisión y E2E.

**Gate:** HARD STOP. Esperar `APPROVED STEP 2` antes de escribir código.

### STEP 2 — Layout de exploración y navegación

**Dependencia:** STEP 1 y `APPROVED STEP 2`.

**Objetivo/cambios:** integrar layout horizontal del home, logo/tema, navegación responsive y variantes de sesión/rol. Preservar consumidores existentes de ClientLayout.

**Archivos candidatos:** HomePage, piezas compartidas de header/layout, tests relacionados. No modificar paneles como parte del rediseño.

**Tests/aceptación:** visitante, sesión cargando, cliente y otros roles; destinos correctos, teclado y móvil; regresión de layouts consumidores. AC-01, 02, 11, 12, 14 parcialmente.

**Riesgo:** cambio compartido afecta rutas ajenas; revisar consumidores y limitar extracción.

**DoD/gate:** navegación revisable y validada; HARD STOP, esperar `APPROVED STEP 3`.

### STEP 3 — Home público y exploración

**Dependencia:** STEP 2 y `APPROVED STEP 3`.

**Objetivo/cambios:** hero compacto, búsqueda por nombre/dirección, categorías reales, grilla y enlaces semánticos; retirar etiquetas no sustentadas; loading/empty/error/reintento; continuidad de filtros; contenido público y CTA comercial solo si resuelto.

**Archivos candidatos:** HomePage, componentes de búsqueda/grilla/estados y constantes compartidas cuando sea necesario.

**Tests/aceptación:** combinaciones búsqueda/categoría, reset, datos incompletos, consultas fuera de orden, estados de fallo y navegación a ficha. AC-01, 06–08, 10, 15, 16.

**Riesgo:** catálogo incompleto presentado como búsqueda completa; evitar optimizaciones que alteren semántica sin acuerdo.

**DoD/gate:** visitante completo en ambos temas y tamaños; HARD STOP, esperar `APPROVED STEP 4`.

### STEP 4 — Personalización y próximo turno

**Dependencia:** STEP 3, decisiones temporales/de datos resueltas y `APPROVED STEP 4`.

**Objetivo/cambios:** saludo, selección real del próximo turno, estados independientes, accesos y limpieza por sesión. Reutilizar consulta o lógica con Mis Reservas solo donde sea necesario.

**Archivos candidatos:** HomePage, hook/servicio de turnos, selector temporal y tests; cambios mínimos en ClientDashboardPage si se extrae código común.

**Tests/aceptación:** turno futuro pendiente/confirmado, pasado/cancelado, empate, fecha inválida, ausencia de próximo turno, error, logout/cambio de usuario y cleanup. AC-02–05, 13, 14.

**Riesgo:** zona horaria equivocada, exposición de información entre sesiones o lecturas excesivas. Revisar seguridad y consulta.

**DoD/gate:** tres experiencias completas con datos reales en ejecución; HARD STOP, esperar `APPROVED STEP 5`.

### STEP 5 — Integración del recorrido y regresiones

**Dependencia:** STEP 4 y `APPROVED STEP 5`.

**Objetivo/cambios:** verificar explorar → ficha → selección → login/registro → retorno, Mis Reservas/perfil, Atrás y navegación de otros roles; corregir regresiones dentro del alcance.

**Archivos candidatos:** pruebas de integración, bookingSession y rutas afectadas; tocar auth/reserva solo si una regresión causada por esta feature lo exige y está revisada.

**Tests/aceptación:** AC-08, 09, 13, 14; no crear reservas reales. Preservar ruta premium y reglas funcionales existentes.

**Riesgo:** mezclar el rediseño del home con reimplementación de reservas; limitar cambios.

**DoD/gate:** recorridos y límites documentados; HARD STOP, esperar `APPROVED STEP 6`.

### STEP 6 — QA final, limpieza y documentación

**Dependencia:** STEP 5 y `APPROVED STEP 6`.

**Objetivo/cambios:** completar matriz de aceptación, responsive, accesibilidad, temas y rendimiento; retirar código/assets del home que queden sin uso, verificando otros consumidores; actualizar documentación.

**Tests/aceptación:** suite pertinente y scripts reales; revisión visual de tres estados principales y errores; revisión ECC y UI/UX; seguridad cuando aplique; todos los AC resueltos.

**Riesgo:** eliminar assets compartidos o aprobar diferencias visuales sin inspección. Comprobar referencias y evidencia.

**DoD/gate:** Definition of Done y Final Gate satisfechos. HARD STOP, solicitar aceptación final. No desplegar.

## 16. Estrategia de pruebas y validación

- Usar Vitest y Testing Library existentes para comportamiento; TDD donde corresponda.
- Tests unitarios del selector de próximo turno con reloj controlado y casos temporales acordados.
- Tests de componentes para sesión/rol, búsqueda/categoría, errores, retry y navegación.
- Pruebas de integración para listeners, cambio de usuario y continuidad de reserva.
- E2E si existe infraestructura real; si no, recorrido manual reproducible documentado. No instalar Playwright/Cypress automáticamente.
- Capturas comparables en claro/oscuro y móvil/escritorio para visitante, cliente con turno y cliente sin próximo turno. Capturar también loading/error/empty representativos.
- Verificar build/lint/tests con scripts reales encontrados: `npm run test`, `npm run lint`, `npm run build`; revalidarlos antes de ejecución. El build inspeccionado incluye TypeScript. No inventar un script `typecheck` inexistente.
- Registrar fallas preexistentes por separado; no corregir deuda ajena para hacer parecer verde el resultado.
- No usar producción para pruebas destructivas ni guardar ejemplos del boceto en Firestore.

Matriz mínima de evidencia: AC → STEP → test/recorrido → resultado → archivo/captura/referencia. “No ejecutado” no equivale a PASS.

## 17. Definition of Done

- [ ] Discovery y decisiones documentadas; cambios previos preservados.
- [ ] Home compartido con tres estados principales y comportamiento correcto para otros roles.
- [ ] Header horizontal responsive, sin sidebar en el home y sin regresiones en otros layouts.
- [ ] Catálogo real, búsqueda/filtros correctos y estados completos.
- [ ] Sin etiquetas de popularidad, cercanía u horarios no sustentadas.
- [ ] Próximo turno correcto por estado/tiempo, con aislamiento y cleanup de sesión.
- [ ] Recorrido existente de reserva/login/retorno conservado.
- [ ] CTA comercial y footer con destinos válidos o ausencia justificada.
- [ ] VANITY y temas existentes reutilizados; sin nuevos estilos globales duplicados.
- [ ] Responsive, teclado, contraste y movimiento reducido revisados.
- [ ] Rendimiento y consultas revisados sin datos ficticios ni lecturas innecesarias.
- [ ] Tests, build y lint ejecutados con resultados y límites explícitos.
- [ ] Revisión especializada y hallazgo de seguridad evaluados; bloqueantes resueltos antes de cierre.
- [ ] No quedaron controles ni datos del prototipo en producción.
- [ ] Documentación actualizada y aprobación por STEP registrada.
- [ ] Aceptación final recibida; deploy separado.

## 18. Final Gate

Usar el formato del Master Guide y adjuntar evidencia:

```text
Specification: PASS / FAIL
Acceptance Criteria: PASS / FAIL
Implementation: PASS / FAIL
Tests: PASS / FAIL
Typecheck: PASS / FAIL / N/A
Lint: PASS / FAIL / N/A
Build: PASS / FAIL / N/A
E2E: PASS / FAIL / N/A
Security: PASS / FAIL / N/A
Code Review: PASS / FAIL
UI/UX: PASS / FAIL / N/A
Documentation: PASS / FAIL / N/A

CRITICAL: [cantidad real]
HIGH: [cantidad real]
Technical Debt: [hallazgos fuera de alcance]
Known Limitations: [limitaciones verificadas]
```

Si una comprobación no se ejecutó, indicar **NO EJECUTADO** con motivo; no forzar PASS/N/A. No declarar completada la feature si falla un gate obligatorio o queda un riesgo bloqueante sin resolver.

## 19. Instrucción inicial para Antigravity

Leer `docs/sdd/workflows/SESSION-START.md`, `docs/sdd/MASTER_GUIDE.md`, las reglas aplicables de `.agents/` y esta especificación. Verificar el estado actual del repositorio y las features relacionadas.

Ejecutar únicamente **STEP 1 — Discovery y arquitectura**, sin modificar código, estilos, configuración, dependencias ni datos. Aplicar ECC y UI/UX Pro Max instalados donde corresponda. Presentar hallazgos, decisiones pendientes y plan verificable para los STEPs siguientes.

**HARD STOP. No implementar STEP 2 hasta recibir `APPROVED STEP 2`. Cada aprobación autoriza solamente el STEP expresamente nombrado.**
