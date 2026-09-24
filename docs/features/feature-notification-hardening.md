# Feature: Notificaciones seguras y completas en Vercel

## Metadata
- Type: SECURITY / BUG / REFACTOR / FEATURE
- Priority: Critical antes de habilitar notificaciones a clientes reales
- Status: Draft — especificación creada; implementación pendiente
- Fecha: 2026-09-23
- Sprint: por asignar
- Base revisada: `05a56a2`
- Sustituye los requisitos técnicos contradictorios de `feature-notification-system.md` para esta corrección. Ese documento queda como antecedente histórico.
- Orquestación: `docs/sdd/MASTER_GUIDE.md`; ejecución y revisión mediante capacidades ECC instaladas.

## Objective
Que todos los flujos de reserva y cambios de estado generen avisos recuperables, autorizados y coherentes con el turno, manteniendo Vercel para el servidor, Firebase para Auth/Firestore y Resend para email.

## Why / Discovery
La revisión local y la consulta pública de la web identificaron:

| ID | Problema observado | Evidencia |
| --- | --- | --- |
| F01 | Contactos, incluido el nuevo email, dentro de turnos con lectura pública | `firestore.rules:78`, `src/pages/PremiumBookingPage.tsx:146` |
| F02 | Backend del cron incompatible con Firebase Admin 14 instalado | `api/cron-reminder.ts:6`; importación local: `admin.apps` es undefined |
| F03 | Envío sin autenticación ni comprobación de reserva; HTML construido desde datos arbitrarios del request | `api/send-email.ts:13` |
| F04 | Cron permite ejecutar si falta el secreto | `api/cron-reminder.ts:29` |
| F05 | Rechazos de Resend no comprobados; HTTP 200 y recordatorios marcados enviados indebidamente | `api/send-email.ts:61`, `api/cron-reminder.ts:94` |
| F06 | Destinatario de pruebas y remitente resend.dev fijos | Ambos archivos de `api/` |
| F07 | Solo Premium genera aviso al crear; faltan alta clásica, admin y profesional, y transiciones del profesional | Cuatro páginas de alta y `ProfessionalAgendaPage` |
| F08 | Avisos dependen de fetch del navegador posterior al guardado, sin cola ni recuperación | `PremiumBookingPage:162`, `ClientDashboardPage:53` |
| F09 | Turno pending presentado como confirmado; navegación a /mis-turnos inexistente | `PremiumBookingPage:155,167,181`, `App.tsx:60` |
| F10 | Recordatorios diarios 0–36 h, documentación promete 12 h; sin exclusión atómica ni protección contra obsolescencia | `vercel.json`, `api/cron-reminder.ts` |
| F11 | Build no comprueba api/; faltan tests específicos; suite/lint fallan | tsconfig, comandos de auditoría |
| F12 | README, spec y variables de ejemplo no reflejan despliegue Vercel | `README.md`, `.env.example`, spec anterior |

Estado de referencia: web pública responde 200 en `https://www.vanitysoftware.net/`; build frontend pasa; 15 tests pasan y 16 fallan; lint: 38 errores y 3 advertencias; chequeo separado de api/: 4 errores de tipos. Son resultados de auditoría, no validación de la futura implementación. No se verificaron paneles, secretos ni reglas efectivamente desplegadas.

## Actors
- Cliente autenticado: crea y cancela sus reservas.
- Profesional: opera únicamente turnos autorizados de su local y asignación.
- Administrador del local: gestiona reservas de su local.
- Superadministrador: operaciones administrativas explícitas.
- Worker/cron: procesa eventos autorizados pendientes y recordatorios.

## Scope
### In Scope
- Resolver F01–F12, incluyendo los fallos de tests/lint inventariados y cobertura del backend.
- Unificar las cuatro altas y los cambios de estado en comandos de servidor autenticados.
- Separar disponibilidad pública de turnos/contactos privados; migración compatible y verificable.
- Cola persistente de notificaciones, deduplicación, recuperación y control de cuota.
- Configuración explícita de modo test/live y remitente Resend de dominio verificado.
- Corregir estado comunicado, ruta postreserva y documentación.
- Conservar verificación de email en registro y enlaces manuales de WhatsApp; probarlos.

### Out of Scope
- WhatsApp Business API, SMS, push y campañas de marketing.
- Migración a Supabase o Firebase Functions; activar Blaze no es requisito de este diseño de emails.
- Contratar planes, cambiar facturación, comprar dominios o desplegar reglas/migraciones durante la etapa de especificación.
- Rediseño visual, cambios comerciales de suscripciones o refactors ajenos a los fallos inventariados.
- Prometer avisos exactamente 12 horas antes con el cron diario actual.

## Architecture
Flujo propuesto:

`UI → comando autenticado en Vercel → transacción Firestore (turno + ocupación + evento outbox) → despachador → Resend`

- Mantener los usuarios de Firebase Auth. El servidor verifica ID token y obtiene rol/pertenencia de fuentes confiables; no acepta rol, email ni local autorizados por simple declaración del navegador.
- Usar imports modulares compatibles: `firebase-admin/app`, `firebase-admin/auth`, `firebase-admin/firestore`. Configuración compartida del servidor, fuera del bundle cliente.
- Contrato único para create/confirm/cancel y transiciones pertinentes. El cliente envía identificadores e intención, no HTML ni un destinatario libre.
- Propuesta de colecciones: reservas privadas en `businesses/{shopId}/appointments`, contactos privados según alcance de acceso, disponibilidad pública mínima en `businesses/{shopId}/availability`, cola backend en `notificationOutbox`.
- El backend usa permisos administrativos: debe aplicar aislamiento por local por sí mismo, además de probar las reglas del cliente.
- Crear evento y reserva en la misma transacción. Llamar al proveedor solo después del commit, nunca dentro del callback transaccional.
- Intentar despacho inmediato con ejecución esperada dentro del ciclo de vida soportado por Vercel; no lanzar promesas abandonadas al responder. Una caída deja evento recuperable. El resultado de reserva y el de email son independientes.
- Reutilizar cron como recuperación acotada. Con ejecución diaria la recuperación puede demorarse hasta el siguiente ciclo; no presentar ese mecanismo como reintento inmediato. Mayor frecuencia requiere revisar plan y costo antes de cambiarla.
- Control de concurrencia de reservas por profesional/día o mecanismo transaccional equivalente: impedir intervalos solapados en las cuatro altas y liberar disponibilidad al cancelar.

## Functional Requirements
### FR-001 — Contactos privados y migración
La consulta pública de disponibilidad solo expone datos imprescindibles de ocupación; nunca clientId, nombre, teléfono, email, notas, destinatario ni estado de envío. Clientes y personal leen reservas dentro de su autorización. Revisar también accesos globales a perfiles, evitando usarlos como atajo para resolver destinatarios.

Auditar todos los matches superpuestos, incluido `/{path=**}/appointments/{apptId}`: los permisos de Firestore se combinan con OR. Cerrar únicamente el match específico no basta. Definir un corte controlado para pestañas antiguas que todavía intenten escrituras directas.

Preparar migración idempotente con dry-run, recuentos, respaldo y verificación de equivalencia de disponibilidad. Publicar coordinación UI/reglas/datos por etapas. Retirar PII histórica de cualquier proyección pública. No generar emails por backfill. El rollback nunca reabre contactos públicamente: si es necesario, detener nuevas escrituras de forma controlada.

### FR-002 — Comandos autenticados
Cubrir `BarbershopDetailsPage`, `PremiumBookingPage`, `AdminAgendaPage`, `ProfessionalAgendaPage`, cancelación del cliente y confirmación/cancelación del personal. Verificar estado del negocio, identidad, permisos y transiciones permitidas. Tras migración, impedir escrituras directas que evadan comandos/outbox.

### FR-003 — Estado real del mensaje
Propuesta funcional para validar al implementar:
- Alta pending: «Turno registrado, pendiente de confirmación».
- Alta confirmed o transición real pending → confirmed: «Turno confirmado».
- Transición válida a cancelled: «Turno cancelado».
- Actualizaciones sin cambio relevante y cancelaciones repetidas: sin nueva intención de aviso.
- Completado/ausente: sin nuevos emails en esta versión.
- Navegación tras reservar: `/client/dashboard`.

No fusionar ambos flujos visuales sin necesidad; ambos consumen el mismo contrato de servidor. Revisar qué flujo es entrada canónica desde Home y documentarlo.

### FR-004 — Destinatarios y modo de operación
- `NOTIFICATIONS_MODE=off|test|live`, por defecto off ante configuración ausente o inválida.
- `RESEND_API_KEY`, `RESEND_FROM`, `NOTIFICATIONS_TEST_RECIPIENT`, `APP_BASE_URL`, credencial servidor Firebase y `CRON_SECRET`: configuración exclusivamente servidor cuando sea secreta, sin prefijo VITE.
- Test: redirigir a una casilla autorizada configurable y etiquetar mensaje de prueba. Preferir datos sintéticos; no fijar una casilla personal en código.
- Live: remitente de dominio verificado; email de cliente resuelto y validado en servidor. Política propuesta: identidad con correo verificado para envío automático; si no está verificado, conservar reserva y registrar motivo de omisión.
- Turno manual: contacto opcional capturado por personal autorizado; sin contacto válido registrar `skipped_missing_contact`, sin inventar destinatario ni perder reserva.
- Inicialmente avisar solo al cliente. Emails al personal son una decisión comercial separada.
- No cambiar a live ni hacer envío masivo retrospectivo al cambiar variables.

### FR-005 — Persistencia, errores e idempotencia
- Guardar evento con clave estable de turno + revisión/transición + canal + destinatario, sin PII legible en IDs/logs.
- Conservar payload inmutable de cada evento para reutilizar la misma clave con el mismo contenido; consultar estado vigente por separado para decidir si omitirlo.
- Usar requestId de comando para que doble submit no cree reservas/eventos duplicados.
- Estados internos: pending, processing con lease, accepted, delivered, failed, unknown, skipped; accepted no significa entregado ni leído.
- Comprobar `{data,error}` de Resend además de excepciones. Nunca marcar accepted/reminderSent ante error o respuesta sin ID válido.
- Reintentar errores temporales con backoff, máximo de intentos, nextAttemptAt y expiración; errores permanentes se detienen.
- Claim transaccional evita workers simultáneos. Clave de idempotencia Resend adicional; conservar deduplicación propia más allá de sus 24 h.
- Ante timeout ambiguo o caída después del envío, reconciliar antes de reenviar fuera de la ventana de idempotencia. No prometer exactly-once ni orden absoluto en la bandeja del cliente.
- Verificar revisión, estado y vigencia antes de despachar. Suprimir confirmación/recordatorio pendientes si el turno ya se canceló. No se puede retirar un correo ya aceptado por el proveedor.
- Webhook de Resend: firma verificada, deduplicación por evento proveedor y reconciliación sin degradar estados terminales por eventos antiguos.

### FR-006 — Cron y recordatorios
- Rechazar ejecución si CRON_SECRET no está configurado o no coincide; no confiar en CORS como autorización.
- Inicialmente conservar horario diario `0 12 * * *` UTC y comunicar «recordatorio diario de próximos turnos», no «12 horas antes».
- Calcular fecha/hora con zona del local; valor inicial propuesto `America/Argentina/Buenos_Aires`. Validar fechas, horarios y zona.
- Ventana inicial de hasta 36 horas como política de mejor esfuerzo: documentar que reservas posteriores al ciclo para ese mismo día pueden no recibir recordatorio separado. El aviso inicial sigue siendo obligatorio cuando corresponda.
- Si se exige recordar todas las reservas con antelación precisa, bloquear esa promesa hasta definir un scheduler compatible y su costo; no simular la garantía ampliando la ventana.
- Consultar por fecha/estado/vencimiento con índices y lotes acotados, no recorrer todas las reservas históricas de todos los negocios. Límite de envíos y tiempo por ejecución; continuar pendientes en ciclos posteriores.
- Revalidar estado/fecha/contacto antes de enviar, excluir pasados/cancelados y caducar pendientes inútiles.

### FR-007 — Seguridad y control de uso
Rate limit por usuario/local y cuota global configurable según cuenta Resend. Un local no puede agotar libremente el cupo de todos. Escape HTML y validación de longitud/esquema; contenido de plantillas controlado por servidor. Sanitizar logs, no registrar tokens, credenciales ni payloads completos con PII. La UI solo accede a estado mínimo autorizado de aviso.

### FR-008 — Verificación y documentación
Agregar typecheck de api/ al proceso de validación del proyecto. Corregir configuración y expectativas obsoletas de los tests existentes sin ocultar fallos, y resolver los 38 errores/3 advertencias de lint inventariados mediante cambios acotados. No deshabilitar reglas o tests globalmente para obtener verde.

Documentar ejecución local de Vercel (Vite por sí solo no ejecuta api/), variables, cron, índices, despliegue/rollback y modo test/live. El README debe explicar Vercel + Firebase + Resend y retirar la exigencia obsoleta de Blaze para emails. Conservar una lista explícita de dependencias externas no verificadas.

## Acceptance Criteria
Todos obligatorios salvo la decisión de frecuencia de recordatorios, que debe quedar explícitamente aceptada antes del piloto.

| AC | Given / When | Then / efecto prohibido | Verificación |
| --- | --- | --- | --- |
| 01 | Visitante consulta disponibilidad; otro local consulta reserva/contacto | Solo ocupación pública; acceso cruzado rechazado, sin PII | Emulador de reglas con identidades sintéticas |
| 02 | Request sin token, token inválido o usuario ajeno llama comandos | 401/403; cero escrituras y envíos | Integración API con mocks |
| 03 | Falta secreto del cron o token incorrecto | Rechazo sin lecturas de negocio ni llamada proveedor | Test del handler |
| 04 | Backend arranca con dependencias del lockfile y config válida/inválida | Arranca con config válida; error controlado con inválida, sin TypeError de Admin | Typecheck API y smoke local |
| 05 | Cada una de cuatro altas válidas o transición autorizada | Reserva y evento consistentes; un fallo del proveedor no revierte reserva | Matriz de integración de cuatro entradas |
| 06 | Doble submit o dos reservas solapadas | No duplicar reserva/evento; solo una reserva ocupa intervalo en conflicto | Tests concurrentes con emulador |
| 07 | Alta pending, confirmación real y cancelación repetida | Texto acorde; una intención por transición; postreserva abre dashboard existente | Tests de plantilla y E2E |
| 08 | Modo off/test/live, sin email o identidad no verificada | Se respeta destinatario/modo; omisión explícita no rompe reserva; no envío arbitrario | Tests de configuración y contacto |
| 09 | Resend retorna error, 429, 5xx o timeout | No marcar enviado; reintento limitado o revisión unknown según resultado | Proveedor simulado sin red |
| 10 | Workers concurrentes, webhook repetido o caída tras envío | Claim/deduplicación evita reenvío ciego; resultado ambiguo reconciliable | Tests de fallos entre pasos |
| 11 | Navegador cierra después del commit | Evento persiste y puede recuperarse sin navegador | Integración comando/cola |
| 12 | Se cancela antes de procesar aviso o recordatorio | Evento obsoleto omitido; cancelación conserva aviso propio | Test con eventos fuera de orden |
| 13 | Cron diario procesa fechas límite y cupo agotado | Ventana/horario documentados; no avisar turnos pasados; lotes/cupo respetados | Reloj falso, fixtures UTC/local |
| 14 | Webhook sin firma o firma inválida | Rechazo sin alterar envíos | Integración webhook |
| 15 | Backfill/reintento de migración y rollback | Datos completos y privados; cero emails históricos; disponibilidad equivalente | Dry-run y ensayo en entorno aislado |
| 16 | Se ejecuta validación completa | Build, typecheck API, suite y lint pasan; tests nuevos ejecutados | Comandos del plan y reporte con resultados |
| 17 | Registro con Google/email y contacto manual WhatsApp | No duplicar verificación Google; fallo de envío de verificación no se presenta como cuenta inexistente; enlaces válidos sin envío automático | Tests de registro/helper/componentes |

## Error Handling / Edge Cases
- Cuenta Firebase creada pero correo de verificación falla: informar estado real y permitir reintento controlado.
- Turnos históricos sin email/clientId real, local inactivo, usuario eliminado, cambio de email o de fecha.
- Revocación de permisos entre request y escritura, datos manipulados y HTML en nombres.
- Fecha cruzando medianoche, fines de mes y zona horaria; no basarse en zona del servidor.
- Falta de cuota, ejecución incompleta, cancelación durante envío y webhook desordenado.
- Límite Resend compartido por toda Vanity, no por barbería; contabilizar avisos iniciales, confirmaciones, cancelaciones y recordatorios.

## Implementation Plan
Cada paso termina con evidencia y revisión de su alcance; no habilitar envíos reales durante pruebas automatizadas.

| Step | Objetivo / cambios | Archivos o superficies | Dependencias | Tests / AC | Riesgo y cierre |
| --- | --- | --- | --- | --- | --- |
| 1 | Contener abuso y corregir runtime/errores | api/, módulo compartido servidor, configuración TS, ejemplos env | Ninguna | AC02–04,09,14 | Fallar cerrado; endpoints autenticados; no declarar resuelta privacidad aún |
| 2 | Preparar contactos privados y disponibilidad mínima | firestore.rules, índices, modelos, lectores de agenda/disponibilidad, migrador | Diseño aprobado y respaldo para producción | AC01,15 | Ensayo sin pérdida; rollback privado; reglas desplegadas verificadas |
| 3 | Centralizar comandos y outbox atómico | APIs create/status, servicios cliente, cuatro páginas de alta y cancelación | Step 2 | AC05–07,11 | Compatibilidad gradual; bloquear bypass solo después de migrar UI |
| 4 | Despachador, plantillas, modo test/live, deduplicación y webhook | api/send-email, módulos notificaciones, colección outbox, webhook | Step 3, dominio verificado para live | AC08–12,14 | No enviar doble ni marcar entregado por simple aceptación |
| 5 | Recuperación/recordatorio diario acotado y observabilidad | api/cron-reminder, vercel.json, índices y estados autorizados | Step 4 y decisión frecuencia | AC10,12,13 | No prometer 12h; documentar retrasos; monitorear pendientes/cupo |
| 6 | Cerrar regresiones, rutas, documentación y piloto | tests existentes/nuevos, setupTests, App/Premium, helper WhatsApp, README/spec | Steps anteriores | AC16,17 y matriz E2E | Cero fallos ocultados; alcance de pruebas externas explícito |

Capacidades instaladas: ECC architect/planner para revisar contrato; tdd-workflow y verification-loop para ejecución; agentes security-reviewer y code-reviewer para revisión independiente; e2e-testing/browser-qa cuando se implemente el piloto. No asumir herramientas externas no disponibles.

## Verification Plan
- Base actual: `npm.cmd run build`, `npm.cmd test`, `npm.cmd run lint`.
- Agregar un script reproducible `typecheck:api` antes de declarar el backend validado; el chequeo aislado de auditoría fue `node node_modules/typescript/bin/tsc --noEmit --skipLibCheck --esModuleInterop --module nodenext --moduleResolution nodenext --target ES2023 api/send-email.ts api/cron-reminder.ts`.
- Nuevos tests de APIs/proveedor/cola con dependencias simuladas; emulador para reglas/transacciones y migración, sin credenciales productivas.
- E2E local de las cuatro altas y cambios de estado con fixtures; comprobar que UI no afirma email entregado sin evidencia.
- Piloto posterior con cuenta/local de prueba y destinatario autorizado. No ejecutar cron productivo como chequeo de salud.
- Verificar DNS/remitente, variables presentes sin imprimir valores, plan Vercel, reglas/índices desplegados y logs acotados antes de activar live.

## Unknowns / decisiones pendientes de activación
- Si la cuenta Resend ya verificó `vanitysoftware.net` o un subdominio y qué remitente utilizar.
- Estado real de CRON_SECRET/credencial Firebase y permisos del servidor, sin solicitar claves por chat.
- Plan Vercel contratado, límites y adecuación a uso comercial; no asumir Hobby válido para la plataforma.
- Reglas Firestore desplegadas y volumen de datos históricos para migración.
- Aceptación del recordatorio diario de mejor esfuerzo o necesidad de mayor frecuencia con presupuesto.
- Política de email verificado, conservación de datos de envío, contactos manuales y límite por local: propuestas técnicas a confirmar, no hechos de negocio descubiertos.

## Definition of Done / Final Gate
- [ ] F01–F12 resueltos y AC01–17 verificados con evidencia.
- [ ] Tests frontend/backend, typecheck y lint pasan sin silenciar fallos.
- [ ] Privacidad y autorización revisadas; cero hallazgos críticos/altos abiertos.
- [ ] Migración/rollback ensayados y despliegue de reglas verificado.
- [ ] Cuota, retrasos del scheduler y estados de entrega observables.
- [ ] Documentación consistente con Vercel y envíos test/live.
- [ ] Piloto autorizado completado antes de activar para todos los locales.

Estado al crear esta especificación: Specification PASS como borrador accionable; Implementation, Acceptance Criteria, Tests, Security Review, E2E y Deployment PENDING. No se realizaron cambios de aplicación ni despliegues al redactarla.
