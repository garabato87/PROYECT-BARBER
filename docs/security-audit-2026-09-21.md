# Auditoría de seguridad y consistencia — Vanity

Fecha: 2026-09-21. Rama inspeccionada: `testing`, HEAD `453704b`, con cambios locales pendientes. Se auditó el contenido actual del directorio de trabajo, no solamente el último commit.

**Dictamen: bloquear el lanzamiento público hasta corregir autorización y exposición de datos. Evaluación orientativa de preparación: 35/100.** Es una valoración de ingeniería, no un porcentaje de seguridad ni una certificación.

## Alcance y límites

Revisión de reglas completas de Firestore y Storage, autenticación, rutas, cuatro flujos de creación de turnos, gestión de locales/profesionales/suscripciones/usuarios, auditoría, subida de imágenes, configuración de despliegue y pruebas existentes. No se modificaron reglas ni lógica de la aplicación ni se escribieron datos en producción.

«Confirmado en código» significa que la condición permisiva o el defecto están presentes en los archivos locales. No implica que se haya explotado en producción. No se comprobó qué versión de las reglas está desplegada, ni la configuración de Firebase Auth, IAM, App Check, Cloudinary o respaldos. No se ejecutó un escáner externo de dependencias ni una auditoría completa del historial de secretos. Esta revisión no garantiza encontrar todas las vulnerabilidades.

## Restricción recomendada para un local desactivado

La suspensión debe ser una política aplicada en Firestore o en un backend confiable, además de reflejarse en la interfaz. Ocultar el local del home no limita las escrituras.

Para crear un turno se debe exigir conjuntamente:

1. Sesión válida y cuenta habilitada.
2. Local existente y `status == 'active'`.
3. Suscripción vigente, si el vencimiento debe bloquear la operación. Conviene representarlo con un Timestamp y compararlo con tiempo de servidor; definir explícitamente el día/hora de vencimiento en la zona del negocio.
4. Actor autorizado: cliente para su propia reserva; administrador vinculado al local; profesional vinculado y habilitado para su propia agenda.
5. Servicio y profesional existentes, pertenecientes al local y habilitados.
6. Datos y estado inicial válidos, y disponibilidad confirmada de forma atómica para todo el intervalo.

### Matriz propuesta para un local suspendido o vencido

| Acción | Cliente | Administrador / profesional | Superadministrador |
| --- | --- | --- | --- |
| Nueva reserva, incluso manual | Denegada | Denegada | Denegada por defecto; reactivar primero |
| Reprogramar hacia un nuevo horario | Denegada | Denegada | Gestión excepcional explícita |
| Consultar reservas existentes | Solo propias | Solo las autorizadas del local | Permitido |
| Cancelar reserva futura pendiente/confirmada | Solo propia | Según rol y pertenencia | Permitido |
| Cambiar servicios, equipo y horarios | No aplica | Solo lectura mientras está suspendido | Permitido |
| Cambiar suspensión, vencimiento o propietario | Denegada | Denegada | Permitido y auditado |
| Acceder a cuenta, soporte y renovación | Permitido | Permitido | Permitido |

No borrar reservas existentes al suspender. La consulta y cancelación permiten resolver compromisos anteriores. Si se permite completar atenciones previas, definir esa transición expresamente, sin habilitar cambios generales. Actualizar el aviso de suspensión en sesiones abiertas y volver a validar cada escritura en el servidor.

## Vulnerabilidades confirmadas en el código

### S01 — Alta: suspensión y vencimiento no impiden operar

**Evidencia:** `firestore.rules:80`, `src/pages/AdminAgendaPage.tsx:98`, `src/components/ProtectedRoute.tsx:38`, `src/pages/HomePage.tsx:65`.

El home filtra por estado activo. El guard de rutas comprueba autenticación y rol. La creación manual usa `addDoc` sin leer el estado del local. Las reglas tampoco comprueban estado ni vencimiento. Afecta a las reservas de clientes, profesionales y administradores, no solo al botón observado por el usuario. Las páginas públicas de reserva cargan el local por ID sin exigir que esté activo (`BarbershopDetailsPage.tsx:43`, `PremiumBookingPage.tsx:56`).

**Corrección:** política central de negocio operativo en todas las escrituras pertinentes y guard visual con mensaje de suspensión. Probar también URL directa y pestañas abiertas antes de suspender.

### S02 — Alta: el dueño puede revertir la suspensión y extender su vencimiento

**Evidencia:** `firestore.rules:42` y `:45`; `src/pages/MiLocalPage.tsx:79`.

Al dueño con rol admin se le permite actualizar todo el documento del negocio. No hay una lista de campos permitidos que proteja `status`, `expirationDate` ni `ownerId`. Puede cambiar estos valores mediante el SDK, aunque la interfaz no tenga un control editable. La creación también permite escoger estado y vencimiento y no restringe al admin a un único local autorizado.

Además, “Mi local” guarda todo `formData`, incluido el estado leído previamente. Una pestaña abierta antes de la suspensión puede guardar datos de contacto y restaurar accidentalmente el estado anterior.

**Corrección:** separar datos públicos editables de campos de control; reservar activación, propietario y vigencia al superadmin o backend. Usar una lista explícita de campos modificables. Crear locales pendientes de aprobación mediante un flujo controlado.

### S03 — Alta: un administrador puede crear reservas en cualquier local

**Evidencia:** `firestore.rules:80` y `:81`.

La alternativa para el rol `admin` no compara su `barbershopId` con `shopId`. Con una cuenta admin del local A se puede solicitar crear un documento de reserva en B. La interfaz limita la ruta usada, pero la regla acepta la operación directa.

**Corrección:** exigir pertenencia al local para administradores; conservar la excepción global únicamente para operaciones explícitas del superadmin.

### S04 — Alta: reservas completas legibles sin iniciar sesión

**Evidencia:** `firestore.rules:78`; `src/pages/AdminAgendaPage.tsx:113`, `src/pages/BarbershopDetailsPage.tsx:162`.

`allow read: if true` deja leer las reservas de un local conocido. Los documentos contienen nombres, teléfonos, servicios, profesionales, fechas y horarios. Una regla posterior que permite al cliente leer sus propias reservas no revoca este permiso más amplio.

**Corrección:** reservas privadas con acceso por propietario y personal autorizado; disponibilidad pública en documentos separados sin identidad ni información de contacto del cliente. Ajustar simultáneamente las consultas de la web para no romper la reserva pública.

### S05 — Alta: administradores y profesionales pueden leer todos los perfiles

**Evidencia:** `firestore.rules:11`; `src/hooks/useAuth.tsx:101`.

La lectura de `users` depende del rol, no del local o de una relación de atención. Los perfiles registrados incluyen email, teléfono, DNI y fecha de nacimiento. Un profesional puede consultar perfiles ajenos a su negocio.

**Corrección:** separar perfil privado, datos públicos y datos mínimos para atención. Sustituir la búsqueda global de usuarios por un flujo de invitación controlado que no permita enumerar la base de usuarios. Revisar si es necesario recopilar DNI y nacimiento.

### S06 — Alta: un admin puede apropiarse de la vinculación de profesionales ajenos

**Evidencia:** `firestore.rules:27`; `src/pages/ProfesionalesPage.tsx:113`.

La regla comprueba que la pertenencia nueva sea el local del admin, pero no que la pertenencia anterior esté vacía o corresponda a ese mismo local. Puede cambiar un usuario `client` o `professional` a su local, aunque estuviera asignado a otro. La validación que rechaza este caso está solo en React. Tampoco se limitan los demás campos del perfil que el administrador puede alterar en esa operación.

**Corrección:** validar pertenencia anterior y posterior; restringir campos; usar invitación aceptada por el profesional y transferencias explícitas entre locales.

### S07 — Alta: cualquier cuenta puede crear su ficha profesional en otro negocio

**Evidencia:** `firestore.rules:65` y `:71`.

La alternativa `request.auth.uid == professionalId` permite escribir la ficha con el propio UID en cualquier local, sin exigir rol profesional, pertenencia ni ficha preexistente. Incluye creación, cambios de `isActive`, horarios y borrado. Un cliente puede añadir una ficha activa con su UID a un local ajeno; un profesional desactivado puede reactivarse en esa colección. Esto no le otorga por sí solo rol superadmin ni acceso admin, pero sí altera el catálogo de profesionales y su disponibilidad.

**Corrección:** creación, eliminación y activación reservadas al personal autorizado. Edición propia solo sobre una ficha existente, con membresía válida y campos permitidos.

### S08 — Alta: no se validan los datos ni las relaciones de las reservas

**Evidencia:** `firestore.rules:80`.

Para un cliente basta con que `clientId` sea su UID. Las reglas no validan campos obligatorios, tipos, estado inicial, fecha, duración, existencia del servicio/profesional o coincidencia entre `barbershopId` y la ruta. Tampoco obligan a usar el identificador determinista de la interfaz. Un cliente puede enviar datos inventados, estados como `completed` o múltiples documentos con IDs arbitrarios.

**Corrección:** esquema estricto, campos derivados en servidor, referencias válidas e identificadores/control de ocupación verificados. Agregar cuotas de negocio para reservas activas; el bloqueo de un botón no es un límite efectivo.

### S09 — Alta: un profesional puede modificar turnos ajenos de su local

**Evidencia:** `firestore.rules:86`.

El profesional necesita pertenecer al local, pero la regla no compara `resource.data.professionalId` con su UID. Tampoco limita los campos de actualización. Puede cambiar cliente, profesional, horarios o estado de turnos de compañeros mediante acceso directo.

**Corrección:** comprobar profesional asignado, hacer inmutables las relaciones sensibles y definir transiciones y campos específicos para cada rol.

### S10 — Media: un cliente puede cancelar turnos ya completados o ausentes

**Evidencia:** `firestore.rules:103`.

La regla restringe el cambio a `status = 'cancelled'`, pero no comprueba el estado anterior ni la fecha. Ocultar el botón en el historial no evita el cambio directo, que puede alterar reportes y estadísticas.

**Corrección:** cancelación solo desde estados permitidos y dentro de la política temporal del negocio. Aplicar la misma máquina de estados al personal.

### S11 — Alta: las reservas concurrentes pueden superponerse

**Evidencia:** `AdminAgendaPage.tsx:113`, `BarbershopDetailsPage.tsx:145`, `PremiumBookingPage.tsx:126`, `ProfessionalAgendaPage.tsx:162`.

La agenda admin usa IDs aleatorios. Los otros tres flujos usan un ID basado en profesional, fecha y hora de inicio. Una transacción protege ese documento concreto, pero no el intervalo entero: un turno de 10:00 a 11:00 y otro de 10:30 a 11:00 usan IDs distintos. Tampoco comparten bloqueo con el turno manual del admin. Dos clientes con disponibilidad previamente leída pueden obtener reservas incompatibles.

**Corrección:** unificar todos los flujos en una operación confiable con bloqueo atómico de todos los intervalos ocupados, o un documento de agenda por profesional/día que se lea y actualice transaccionalmente. Verificar autorización, disponibilidad e idempotencia en esa operación. Si se usa Admin SDK, implementar allí los controles, porque no se debe depender de reglas cliente para ese backend.

### S12 — Media: registro de auditoría no operativo y no atómico

**Evidencia:** `src/services/audit.ts:30`, `firestore.rules` completo, `src/pages/SuperAdminAudit.tsx:26`, `src/pages/SuperAdminDashboard.tsx:48`.

El servicio escribe en `audit_logs`, pero no hay reglas que permitan acceder a esa colección: con estas reglas las escrituras y lecturas cliente son denegadas. El logger captura el error y la operación principal puede mostrar éxito sin registro. El dashboard también cambia estados sin llamar al logger. En las acciones masivas de suscripciones se intenta registrar antes de confirmar el batch, lo que sería inconsistente incluso tras abrir permisos.

**Corrección:** auditoría generada en un backend confiable, actor y tiempo derivados de la sesión/servidor, y consistencia con la operación real. No solucionar con escritura pública de logs.

## Errores funcionales y de consistencia adicionales

### F01 — Alta operativa: cancelación no libera realmente el ID de reserva

Las tres transacciones rechazan cualquier documento existente, incluso cancelado (`BarbershopDetailsPage.tsx:152`, `PremiumBookingPage.tsx:131`, `ProfessionalAgendaPage.tsx:167`). `availability.ts:83` excluye cancelados al calcular ocupación, por lo que la interfaz puede ofrecer un horario que luego no permite reservar.

**Corrección:** separar historial de reservas y ocupación vigente. Liberar el bloqueo al cancelar sin sobrescribir el historial ni borrar la reserva anterior.

### F02 — Media: turnos de otros días o profesionales ocultan disponibilidad

`getAvailableSlots` compara horas, pero no filtra fecha ni profesional (`src/utils/availability.ts:81`). La agenda admin y la reserva estándar filtran antes; la agenda profesional pasa todos sus días (`ProfessionalAgendaPage.tsx:98`) y Premium pasa reservas de todos los profesionales y días (`PremiumBookingPage.tsx:97`).

**Reproducción local ejecutada:** profesional A, lunes 2030-01-07, horario 09:00–11:00, servicios de 30 minutos. Sin reservas devuelve 09:00, 09:30, 10:00, 10:30. Al introducir una reserva de otro profesional para 2030-01-08 de 09:00–10:00, devuelve solo 10:00 y 10:30. Se ejecutó la función real transpiliada localmente, sin Firebase.

**Corrección:** filtrar explícitamente por ambos campos dentro del contrato del cálculo y cubrir ambas pantallas.

### F03 — Media: alta y baja de profesionales no son atómicas

`ProfesionalesPage.tsx:131` actualiza el usuario y después crea la ficha profesional. Si falla la segunda operación queda una vinculación parcial. La baja (`:157`) intenta asignar `barbershopId: null`, pero la regla del admin exige que el valor nuevo sea el ID de su local: para un admin con local asignado la baja de otro usuario es rechazada.

La creación de local en `MiLocalPage.tsx:87` también crea primero el negocio y luego intenta cambiar el `barbershopId` del propio admin, lo que las reglas no autorizan en ese caso. Puede quedar un local sin vinculación usable.

**Corrección:** operaciones atómicas controladas, reglas coherentes con alta/baja y pruebas de fallo parcial.

### F04 — Media: fechas dependientes de UTC y reloj del navegador

Se usa `toISOString().split('T')[0]` para fechas de agenda y Premium. En Argentina, después de las 21:00 puede representar el día siguiente, mientras que etiquetas y horarios usan hora local. La disponibilidad confía en el reloj del dispositivo. Usar fechas del negocio y tiempos de servidor para validaciones; cubrir cambio de día.

### F05 — Baja: redirección posterior a reserva Premium inexistente

`PremiumBookingPage.tsx:160` navega a `/mis-turnos`; `src/App.tsx` registra `/client/dashboard`, pero no `/mis-turnos`. Puede terminar en una pantalla sin contenido tras una reserva exitosa.

### F06 — Media: listeners y permisos en pantalla pueden quedar desactualizados

Premium crea un `onSnapshot` sin devolver su cancelación (`:78`), lo que puede acumular suscripciones. `useAuth.tsx:82` vuelve a leer el perfil al cambiar autenticación, pero no escucha cambios del documento de usuario. Un cambio de rol no se refleja inmediatamente en la sesión abierta. Esto no demuestra que sobrevivan privilegios en Firestore: las reglas consultan el documento actual. La interfaz sí puede quedar incoherente.

## Riesgos pendientes de verificar fuera del repositorio

- **Cloudinary:** `ProfilePage.tsx:65` realiza una subida con preset sin firma. Los límites de 5 MB y tipo están en el cliente. Comprobar restricciones efectivas del preset, formatos, cuotas y control de abuso; no se verificó la consola. Que un preset sea público no demuestra por sí solo una vulnerabilidad.
- **Storage:** las reglas permiten leer archivos de cualquier usuario a cualquier cuenta autenticada; confirmar si son exclusivamente avatares públicos. No guardar documentos privados bajo esa política. El filtro `image/.*` es amplio; verificar formatos permitidos. La pantalla de perfil usa Cloudinary, por lo que estas reglas no protegen ese flujo.
- **Protección contra abuso:** no se encontró integración de App Check, límites de reservas por cliente ni flujo MFA en el código revisado. Verificar configuración efectiva del proveedor; considerar MFA para superadmin y límites de negocio aplicados en servidor. App Check no sustituye autorización.
- **Hosting:** `firebase.json` no declara cabeceras de endurecimiento como CSP o protección contra enmarcado. Verificar las cabeceras realmente servidas antes de concluir que faltan en producción.
- **Dependencias:** no se consultó una base de vulnerabilidades del lockfile; no hay fundamento para declarar las dependencias libres de CVE ni para inventar vulnerabilidades concretas.
- **Operación:** confirmar reglas desplegadas, IAM, respaldos, recuperación, alertas de uso/costo y logs. No se encontraron pruebas de reglas ni configuración de emulador en los archivos revisados.
- **Secretos:** `.env.local` no figura entre los archivos versionados consultados. La búsqueda de marcadores de claves privadas/cuentas de servicio en `src`, `public`, `docs`, `package.json` y `.env.example` no dio coincidencias. No constituye una auditoría completa de secretos o historial. No se imprimieron valores del entorno privado.

## Validación realizada

- Lectura de reglas y trazado de cada escritura crítica contra sus permisos.
- `npm.cmd test -- --reporter=dot`: **31 pruebas, 15 aprobadas y 16 fallidas; 7 archivos fallidos y 4 aprobados**. Fallas observadas: proveedores `ToastProvider` ausentes en pruebas, `IntersectionObserver` no simulado, selectores desactualizados y sincronización de carga. No se interpretan como 16 vulnerabilidades.
- Las pruebas inspeccionadas simulan Firestore o autenticación; no ejercitan las reglas reales.
- Reproducción aislada y exitosa de F02 con la función real.
- No se ejecutaron pruebas contra producción. No se ejecutó el emulador: no se encontró `@firebase/rules-unit-testing` instalado ni Java disponible en PATH. Las vulnerabilidades de reglas son conclusiones de revisión estática, pendientes de confirmación automatizada contra emulador.
- No se ejecutó build ni lint en esta revisión de seguridad. No se modificó la lógica para corregir fallas dentro del alcance de este reporte.

## Plan de corrección y aceptación

1. **Cerrar exposición y permisos:** S02–S09, con modelo de datos público/privado y campos administrativos protegidos. No desplegar un cierre de lectura sin adaptar el cálculo de disponibilidad.
2. **Hacer efectiva la suspensión:** S01 para todos los canales, incluidos admin, profesional, URL directa y sesión abierta. Proteger el estado evita que este control sea reversible por el dueño.
3. **Unificar reserva/cancelación:** S10–S11 y F01–F04 con operación atómica, estados e idempotencia.
4. **Restaurar trazabilidad y verificación:** S12, pruebas existentes, emulador de reglas y controles de infraestructura pendientes.

Matriz mínima automatizada en emulador, con locales A/B y usuarios anónimo/cliente/admin/profesional/superadmin:

| Caso | Resultado esperado |
| --- | --- |
| Anónimo lee reserva completa | Denegado |
| Anónimo consulta disponibilidad sin PII | Permitido |
| Profesional/admin A lee perfiles privados de B | Denegado |
| Admin A crea reserva en B | Denegado |
| Dueño modifica estado/vencimiento/propietario | Denegado |
| Admin A transfiere profesional de B sin autorización | Denegado |
| Cliente crea su ficha profesional en A | Denegado |
| Profesional inactivo se reactiva | Denegado |
| Cliente/admin/profesional crea turno en local suspendido o vencido | Denegado |
| Usuario activo reserva correctamente en local operativo | Permitido |
| Profesional modifica turno de compañero | Denegado |
| Cliente cancela turno completado | Denegado |
| Cliente cancela turno propio futuro permitido | Permitido |
| Datos inválidos, referencias ajenas, duración manipulada | Denegado |
| Dos reservas concurrentes superpuestas, incluidos turnos manuales | Solo una confirmada |
| Reserva posterior a cancelación | Permitida con historial conservado |
| Cambio de rol/estado con sesión abierta | Próxima escritura reevaluada y UI actualizada |
| Operación administrativa fallida | Ningún log de éxito falso ni estado parcial |

## Referencias técnicas

- [Firebase: estructura y coincidencia de reglas](https://firebase.google.com/docs/firestore/security/rules-structure): cuando varias reglas coinciden, basta una autorización positiva; una regla más restrictiva no cancela otra permisiva.
- [Firebase: transacciones y escrituras atómicas](https://firebase.google.com/docs/firestore/manage-data/transactions): la protección transaccional depende de los documentos implicados; leer únicamente el ID de inicio no valida todos los intervalos.
- [Cloudinary: subidas sin firma](https://cloudinary.com/documentation/upload_images#unsigned_upload): el preset define las restricciones de las subidas sin firma; verificar la configuración efectiva.

## Autoevaluación del reporte

Se aplicó la skill `agent-self-evaluation` para revisar precisión y límites, sin presentar una auditoría estática como prueba de explotación.

| Criterio | Nota | Evidencia y mejora |
| --- | --- | --- |
| Exactitud | 4/5 | Evidencia por archivo y reproducción de F02; falta ejecutar reglas en emulador. |
| Completitud | 3/5 | Cubre superficies locales; faltan despliegue, CVE, IAM y configuración de proveedores. |
| Claridad | 4/5 | Se distinguen permisos, errores funcionales y riesgos pendientes; conviene acompañar la corrección con matriz visual por rol. |
| Accionabilidad | 4/5 | Plan y casos de aceptación concretos; correcciones aún no implementadas. |
| Concisión | 4/5 | Detalle necesario para revisión técnica; el resumen conversacional prioriza lo urgente. |

Promedio: **3,8/5**. Mejoras prioritarias: ejecutar emulador; comparar reglas desplegadas; revisar configuración externa y dependencias. La falta de estas verificaciones impide afirmar exhaustividad. Autoevaluación: el usuario debería poder distinguir lo probado localmente de lo pendiente sin asumir que el sistema ya fue corregido.
