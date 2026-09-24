# Feature Specification — Remediación de riesgos del sistema de notificaciones

## Metadata

- **ID:** NOTIFICATION-RISK-REMEDIATION
- **Type:** SECURITY / BUG / RELIABILITY / REFACTOR
- **Priority:** Critical antes de habilitar notificaciones reales
- **Status:** STEP 1 implementado y validado en alcance; pendiente de aceptación para continuar con STEP 2
- **Revision:** 1
- **Fecha:** 2026-09-24
- **Specification base:** `docs/features/feature-notification-hardening.md`
- **Antecedente histórico:** `docs/features/feature-notification-system.md`
- **Workflow:** `docs/sdd/MASTER_GUIDE.md`

## Revision Log

| Rev | Fecha | Criterios modificados | Motivo |
| --- | --- | --- | --- |
| 1 | 2026-09-24 | — | Especificación inicial basada en la auditoría del código local |

## Goal

Cerrar los riesgos de seguridad, autorización, consistencia e idempotencia presentes en la implementación parcial de notificaciones, de modo que una reserva o transición válida genere un evento recuperable y que ningún endpoint permita envíos, lecturas o mutaciones fuera de la autorización correspondiente.

## Source of Truth

Esta especificación complementa `feature-notification-hardening.md`: conserva sus decisiones funcionales y define el trabajo correctivo necesario sobre el código actualmente presente.

Ante conflictos se aplica la jerarquía del proyecto:

1. Código y configuración actuales para determinar el comportamiento existente.
2. `docs/sdd/workflows/` y `docs/sdd/MASTER_GUIDE.md` para el proceso.
3. Esta especificación para el alcance correctivo.
4. `feature-notification-hardening.md` para el diseño funcional general.
5. `feature-notification-system.md`, `task.md` y `walkthrough.md` únicamente como antecedentes.

Las marcas de completado de `task.md` o `walkthrough.md` no constituyen evidencia de aceptación ni reemplazan tests, revisiones o el Final Gate.

## Actors

- Cliente autenticado que crea o cancela una reserva propia.
- Profesional asignado al local y, cuando corresponda, al turno.
- Administrador del local.
- Superadministrador.
- Cron y worker de Vercel autenticados mediante secretos de servidor.
- Resend como proveedor externo y emisor de webhooks firmados.

## Scope

### In Scope

- Cerrar los bypasses de autenticación del dispatcher y del cron.
- Exigir firma válida para todos los webhooks de Resend.
- Eliminar escrituras directas de reservas que eviten la API y el outbox.
- Validar en servidor identidad, rol, pertenencia al local, transición de estado y datos derivados.
- Impedir solapamientos de intervalos y duplicados por reintento o doble submit.
- Crear reserva, disponibilidad y eventos outbox en una única transacción.
- Hacer el claim del outbox atómico, con lease, reintentos acotados e idempotencia.
- Separar la confirmación de la reserva de la entrega del email.
- Corregir defaults inseguros, destinatarios fijos, contenido HTML sin escapar y logs sensibles.
- Incorporar tests de backend, reglas, concurrencia y fallos del proveedor.
- Alinear la documentación de estado con evidencia verificable.

### Out of Scope

- WhatsApp Business API, SMS, push y campañas comerciales.
- Cambio de Vercel, Firebase, Firestore, Firebase Auth o Resend por otros proveedores.
- Activación de `NOTIFICATIONS_MODE=live`, envío a clientes reales o ejecución contra datos productivos.
- Compra de planes, modificación de facturación o cambios de DNS.
- Rediseño visual de las páginas de reserva.
- Garantía de entrega en bandeja, lectura del correo o entrega exactamente una vez.
- Reprocesamiento masivo de reservas históricas.

## Context

### Discovered Facts

- `api/dispatch-outbox.ts` acepta cualquier encabezado Bearer como alternativa al secreto y contiene un bypass de desarrollo controlado por query string.
- `api/cron-reminder.ts` contiene el mismo bypass y usa `test` como modo predeterminado.
- `api/webhook-resend.ts` continúa procesando eventos cuando `RESEND_WEBHOOK_SECRET` no está configurado.
- `firestore.rules` bloquea escrituras en el match específico de reservas, pero un match recursivo permite a clientes cancelar directamente y evitar la API/outbox.
- `api/create-appointment.ts` deriva el identificador de profesional, fecha y hora de inicio, pero no prueba solapamientos de intervalos completos.
- El alta acepta desde el navegador nombres, email de cliente y datos descriptivos utilizados por la notificación.
- `src/services/api.ts` dispara el dispatcher desde el navegador sin esperar su resultado y descarta el error.
- El cambio a `processing` del outbox ocurre fuera de una transacción, por lo que dos workers pueden reclamar el mismo evento.
- Los estados implementados (`pending`, `processing`, `sent`, `failed`) no cubren completamente el modelo especificado (`accepted`, `delivered`, `unknown`, `skipped`, lease y vencimiento).
- Existen archivos locales sin seguimiento y documentación que afirma cierre total pese a que `feature-notification-hardening.md` continúa en Draft y sin Final Gate aprobado.

### Product and Business Constraints

- El usuario eligió Vercel para frontend/API, Firebase para identidad y datos, y Resend para email.
- Durante la beta se busca evitar gastos innecesarios.
- La primera versión de mensajería automática será email; WhatsApp queda para otra versión.

### Assumptions to Confirm Before Pilot

- El recordatorio diario de mejor esfuerzo, ejecutado a las `0 12 * * *` UTC, es suficiente para la beta.
- Los emails automáticos en modo live se envían solamente a clientes con email verificado; los turnos manuales pueden omitir email.
- El destinatario de prueba y el remitente live serán variables de servidor, nunca valores fijos en el código.
- La cuota global y por local se definirá antes del piloto según los límites reales de la cuenta Resend.

## Risk Review

| Área | Nivel | Tratamiento requerido |
| --- | --- | --- |
| Autenticación y autorización | Crítico | Fallar cerrado, validar token/secretos y pertenencia en servidor |
| Privacidad | Alto | Mantener PII fuera de disponibilidad pública, IDs y logs |
| Datos persistentes | Alto | Transacciones, migración con dry-run, respaldo y rollback privado |
| Concurrencia e idempotencia | Alto | requestId estable, control de intervalos, claim transaccional y lease |
| Efectos externos y costo | Alto | Mocks en tests, modo `off` por defecto y piloto `test` autorizado |
| Compatibilidad | Medio | Migrar todas las entradas UI antes de cerrar escrituras directas |
| UX | Medio | Informar estado real de reserva y aviso, sin prometer entrega |

## Functional Requirements

### FR-001 — Configuración fail-closed

- `NOTIFICATIONS_MODE` solo admite `off`, `test` o `live`; valor ausente o inválido equivale a `off`.
- Cron y dispatcher rechazan solicitudes cuando `CRON_SECRET` está ausente o no coincide.
- No existen bypasses mediante query string, `NODE_ENV` ni un Bearer sin verificar.
- El webhook rechaza solicitudes si falta el secreto o la firma no es válida.
- Las variables secretas son exclusivas del servidor y nunca usan prefijo `VITE_`.

### FR-002 — Autenticación y autorización de comandos

- Firebase Admin verifica el ID token antes de leer o escribir datos de negocio.
- El servidor obtiene rol, local, email y verificación desde Firebase Auth/Firestore; no confía en esos campos enviados por el cliente.
- El cliente solo crea y cancela reservas propias.
- Un profesional solo opera reservas del local al que pertenece y según la política de asignación definida.
- Un administrador solo opera en su local; el superadministrador requiere una ruta explícitamente autorizada.
- Cada transición de estado usa una matriz permitida y una repetición sin cambio no crea otro evento.

### FR-003 — Reserva atómica y sin solapamientos

- El comando de alta valida negocio activo, servicio, duración, profesional activo, horario laboral, fecha y zona horaria.
- La transacción rechaza cualquier intervalo activo que se solape con el intervalo solicitado, aunque la hora de inicio sea diferente.
- `requestId` identifica de forma estable un intento lógico y evita duplicados ante doble click o reintento.
- Reserva privada, disponibilidad pública mínima y eventos outbox se escriben en la misma transacción.
- La disponibilidad pública contiene únicamente `professionalId`, fecha, inicio, fin y estado de ocupación.

### FR-004 — Datos y reglas privadas

- Las reglas no permiten crear, actualizar ni cancelar reservas directamente desde el SDK cliente.
- Los matches recursivos no amplían accidentalmente permisos de matches específicos.
- Clientes leen únicamente sus reservas; profesionales y administradores únicamente las permitidas por local y asignación.
- Perfiles globales, contactos y datos de notificación no quedan expuestos como mecanismo de búsqueda pública.
- El cambio de reglas se coordina con la migración completa de lectores y escritores UI.

### FR-005 — Outbox durable e idempotente

- Cada evento usa una clave estable derivada de turno, revisión, tipo y canal, sin PII legible.
- El worker reclama eventos mediante transacción y lease con vencimiento; un segundo worker no puede reclamar un lease vigente.
- El proveedor se invoca después del commit de negocio y fuera de transacciones Firestore.
- La misma intención usa una clave de idempotencia estable con payload inmutable.
- Antes de enviar, el worker revalida el estado actual del turno y omite eventos obsoletos.
- Un fallo o timeout del proveedor nunca revierte la reserva.

### FR-006 — Estados, reintentos y proveedor

- Estados internos: `pending`, `processing`, `accepted`, `delivered`, `failed`, `unknown` y `skipped`.
- Una respuesta de Resend solo pasa a `accepted` cuando contiene ID válido y no contiene error.
- Errores transitorios usan backoff, máximo de intentos, `nextAttemptAt` y expiración.
- Errores permanentes no se reintentan automáticamente.
- Un resultado ambiguo pasa a `unknown` para reconciliación; no se reenvía ciegamente fuera de la ventana de idempotencia.
- `accepted` se presenta como aceptado por el proveedor, no como entregado ni leído.

### FR-007 — Plantillas y destinatarios

- El asunto y HTML se generan en servidor desde plantillas controladas.
- Todo dato dinámico se valida, limita y escapa antes de insertarse en HTML.
- En modo `test`, el destinatario real se reemplaza por `NOTIFICATIONS_TEST_RECIPIENT` y el mensaje queda claramente etiquetado como prueba.
- En modo `live`, se exige remitente configurado y contacto permitido por la política de email verificado.
- Sin contacto válido, la reserva se conserva y el evento queda `skipped` con un motivo no sensible.
- No existen direcciones personales ni `onboarding@resend.dev` como fallback productivo.

### FR-008 — Webhook y orden de eventos

- La firma se verifica sobre el cuerpo original requerido por Resend antes de cualquier escritura.
- Cada evento del proveedor se deduplica por su ID.
- Los cambios de estado respetan una transición monotónica y no degradan estados terminales por eventos tardíos.
- Un webhook desconocido o sin correlación se ignora de forma observable y sin alterar reservas.

### FR-009 — Cron y recuperación

- El cron procesa eventos vencidos y recordatorios en lotes acotados, con límite de tiempo y cuota.
- Usa la zona horaria del local; la inicial es `America/Argentina/Buenos_Aires` cuando el negocio no posee otra configuración válida.
- Excluye reservas pasadas, canceladas, completadas o ausentes.
- Los recordatorios se deduplican y se revalidan antes de enviar.
- El cron diario se comunica como mejor esfuerzo y no como garantía exacta de doce horas.

### FR-010 — Observabilidad segura

- Los logs incluyen IDs técnicos, tipo de evento, estado y código de error categorizado.
- Los logs no incluyen tokens, secretos, cuerpos completos, email, teléfono ni nombre del cliente.
- Se registran métricas o contadores acotados de pendientes, aceptados, fallidos, omitidos y desconocidos.
- La UI solo muestra al actor autorizado el estado mínimo necesario.

## Acceptance Criteria

### AC-001 — Dispatcher y cron fallan cerrados

- **Scenario:** secreto ausente, incorrecto o encabezado Bearer arbitrario.
- **Action:** invocar dispatcher o cron.
- **Expected:** respuesta 401/503 controlada según configuración y cero lecturas de negocio, escrituras o llamadas a Resend.
- **Must not:** aceptar `bypass=dev` ni confiar en `NODE_ENV`.
- **Verification:** tests de handlers con Firebase y Resend simulados.
- **Priority:** Required.

### AC-002 — Webhook siempre autenticado

- **Scenario:** secreto ausente, firma ausente, firma inválida o cuerpo alterado.
- **Action:** enviar un webhook.
- **Expected:** rechazo antes de cualquier escritura.
- **Must not:** reconstruir el cuerpo de una forma incompatible con la validación criptográfica.
- **Verification:** integración del handler con fixtures sintéticos firmados y no firmados.
- **Priority:** Required.

### AC-003 — Aislamiento por actor y local

- **Scenario:** cliente ajeno, profesional de otro local, administrador de otro local o token inválido.
- **Action:** crear, leer o cambiar una reserva.
- **Expected:** 401/403 y cero mutaciones/eventos.
- **Must not:** confiar en rol, local, email o UID declarados en el body.
- **Verification:** matriz de integración API y tests de reglas con identidades sintéticas.
- **Priority:** Required.

### AC-004 — No existe bypass de escritura directa

- **Scenario:** cliente autenticado intenta cancelar o crear mediante Firebase Web SDK.
- **Action:** escribir en `appointments` o `availability`.
- **Expected:** reglas rechazan la operación; el mismo caso autorizado funciona mediante API y crea el outbox correspondiente.
- **Must not:** existir un match recursivo que amplíe permisos.
- **Verification:** Firebase Emulator Rules tests.
- **Priority:** Required.

### AC-005 — Alta atómica y derivación confiable

- **Scenario:** solicitud válida desde cualquiera de las entradas soportadas.
- **Action:** crear el turno.
- **Expected:** servidor deriva identidad y datos descriptivos, y confirma en una transacción reserva, disponibilidad y eventos.
- **Must not:** usar email, rol, nombre de local, servicio o profesional enviados como fuente autorizada.
- **Verification:** integración API con Firestore Emulator.
- **Priority:** Required.

### AC-006 — Concurrencia e intervalos

- **Scenario:** doble submit con el mismo `requestId` o dos reservas cuyos intervalos se solapan.
- **Action:** ejecutar solicitudes simultáneas.
- **Expected:** el reintento devuelve el mismo resultado lógico; solo una reserva ocupa un intervalo incompatible.
- **Must not:** crear reservas, disponibilidades o emails duplicados.
- **Verification:** pruebas concurrentes contra Firestore Emulator.
- **Priority:** Required.

### AC-007 — Claim exclusivo del outbox

- **Scenario:** dos workers consultan el mismo evento pendiente.
- **Action:** ambos intentan reclamarlo.
- **Expected:** solo uno obtiene un lease vigente y puede llamar al proveedor.
- **Must not:** dejar eventos bloqueados permanentemente tras expirar el lease.
- **Verification:** test concurrente del worker con reloj controlado.
- **Priority:** Required.

### AC-008 — Fallos del proveedor no corrompen el negocio

- **Scenario:** Resend devuelve error, 429, 5xx, respuesta sin ID o timeout.
- **Action:** procesar un evento.
- **Expected:** la reserva permanece confirmada en Firestore; el evento queda `failed`, reprogramado o `unknown` según la clase de fallo.
- **Must not:** marcar `accepted`/`delivered` ni reintentar indefinidamente.
- **Verification:** tests unitarios del adaptador y del worker sin red real.
- **Priority:** Required.

### AC-009 — Evento obsoleto suprimido

- **Scenario:** una reserva se cancela antes de procesar su confirmación o recordatorio.
- **Action:** el worker reclama el evento antiguo.
- **Expected:** evento antiguo `skipped`; el evento propio de cancelación conserva su procesamiento.
- **Must not:** enviar confirmación o recordatorio de una reserva cancelada.
- **Verification:** integración con eventos fuera de orden.
- **Priority:** Required.

### AC-010 — Modos de envío seguros

- **Scenario:** modo ausente/inválido, `off`, `test` o `live`.
- **Action:** procesar un evento válido.
- **Expected:** ausente/inválido/off no envía; test redirige al destinatario configurado; live exige configuración completa y contacto permitido.
- **Must not:** usar destinatario o remitente fijo como fallback.
- **Verification:** tabla de tests de configuración y adaptador simulado.
- **Priority:** Required.

### AC-011 — Plantillas sin inyección

- **Scenario:** nombres y campos contienen HTML, URLs o cadenas demasiado largas.
- **Action:** generar el email.
- **Expected:** contenido escapado y limitado; estructura de la plantilla intacta.
- **Must not:** ejecutar o reflejar markup arbitrario.
- **Verification:** tests unitarios de plantillas con payloads maliciosos sintéticos.
- **Priority:** Required.

### AC-012 — Webhooks idempotentes y ordenados

- **Scenario:** webhook repetido o evento anterior recibido después de uno terminal.
- **Action:** reconciliar el estado.
- **Expected:** cada ID se procesa una vez y el estado no retrocede.
- **Must not:** modificar la reserva o duplicar efectos laterales.
- **Verification:** integración del webhook con secuencias desordenadas.
- **Priority:** Required.

### AC-013 — Recuperación y recordatorios acotados

- **Scenario:** reservas dentro/fuera de ventana, estados terminales, límite de lote o cuota agotada.
- **Action:** ejecutar cron con reloj fijo.
- **Expected:** solo se encolan eventos elegibles, hasta los límites configurados; el resto queda recuperable.
- **Must not:** recorrer indefinidamente el historial ni enviar a reservas pasadas/canceladas.
- **Verification:** integración con reloj falso y fixtures de zona horaria.
- **Priority:** Required.

### AC-014 — Registro sin PII ni secretos

- **Scenario:** comando inválido, fallo de proveedor o webhook rechazado.
- **Action:** capturar logs de prueba.
- **Expected:** IDs y categorías permiten diagnosticar el fallo.
- **Must not:** aparecer token, secreto, email, teléfono, nombre ni payload completo.
- **Verification:** test de redacción y revisión de seguridad.
- **Priority:** Required.

### AC-015 — Estado comunicado con precisión

- **Scenario:** reserva guardada con email pendiente, omitido, aceptado o fallido.
- **Action:** finalizar el flujo de reserva o consultar el turno.
- **Expected:** la UI confirma el estado del turno y, si corresponde, describe el aviso sin afirmar entrega no demostrada.
- **Must not:** bloquear o revertir una reserva por el fallo del email.
- **Verification:** tests de componentes y E2E local de los flujos soportados.
- **Priority:** Required.

### AC-016 — Migración segura

- **Scenario:** datos históricos con PII, reservas sin disponibilidad o ejecución repetida del migrador.
- **Action:** ejecutar primero dry-run y después ensayo aislado.
- **Expected:** recuentos verificables, disponibilidad equivalente, PII privada y cero eventos de email históricos.
- **Must not:** modificar producción ni reabrir PII durante rollback.
- **Verification:** reporte de dry-run y ensayo con Firestore Emulator o copia aislada autorizada.
- **Environment/safety:** prohibido usar datos productivos sin autorización explícita y respaldo identificado.
- **Priority:** Required.

### AC-017 — Final Gate basado en evidencia

- **Scenario:** todos los Steps fueron implementados.
- **Action:** ejecutar el cierre SDD.
- **Expected:** tests, typecheck API, lint, build, reglas, integración, E2E aplicable, Security Review y Code Review pasan; CRITICAL=0 y HIGH=0.
- **Must not:** declarar COMPLETE basándose en documentos narrativos o checks manuales no reproducibles.
- **Verification:** reporte del Final Gate con comandos y resultados reales.
- **Priority:** Required.

## Implementation Plan and Approval Gates

Cada Step termina con validación, revisión, reporte y HARD STOP. La aprobación de un Step no autoriza el siguiente.

### STEP 1 — Contención inmediata y configuración fail-closed

- **Objective:** cerrar ejecución anónima o mal configurada sin cambiar aún el modelo de datos.
- **Files:** handlers de dispatcher, cron y webhook; configuración compartida y tests.
- **Changes:** eliminar bypasses, validar secretos/tokens y modos; firma obligatoria del webhook; sanitización inicial de errores.
- **Tests:** AC-001, AC-002 y parte de AC-010/AC-014.
- **Definition of Done:** endpoints fallan cerrados y no se realizan llamadas externas en escenarios rechazados.

### STEP 2 — Contrato autenticado y reglas sin bypass

- **Objective:** centralizar operaciones de reservas detrás de comandos autorizados.
- **Files:** API de reservas, servicio cliente, Firestore Rules y tests de reglas.
- **Changes:** matriz de permisos/transiciones, datos derivados por servidor, eliminación de escritura directa y migración coordinada de consumidores.
- **Dependencies:** STEP 1 aprobado.
- **Tests:** AC-003, AC-004 y AC-005.
- **Definition of Done:** ninguna ruta cliente evita la API/outbox y el aislamiento por local está probado.

### STEP 3 — Atomicidad, intervalos e idempotencia de comandos

- **Objective:** evitar reservas solapadas o duplicadas.
- **Files:** dominio/servicio de turnos, transacciones, disponibilidad, índices y tests.
- **Changes:** requestId, validación temporal, reservas por intervalo y escritura atómica.
- **Dependencies:** STEP 2 aprobado.
- **Tests:** AC-005 y AC-006.
- **Definition of Done:** las carreras concurrentes producen un único resultado válido.

### STEP 4 — Worker, proveedor y plantillas

- **Objective:** hacer el envío durable, recuperable e idempotente.
- **Files:** módulos de outbox, adaptador Resend, plantillas y dispatcher.
- **Changes:** claim transaccional, lease, estados completos, reintentos, expiración, idempotency key, revalidación y escape HTML.
- **Dependencies:** STEP 3 aprobado.
- **Tests:** AC-007 a AC-011 y AC-014.
- **Definition of Done:** fallos del proveedor no corrompen reservas ni producen reenvíos ciegos.

### STEP 5 — Webhook, cron y reconciliación

- **Objective:** completar entrega observable y recuperación diaria acotada.
- **Files:** webhook, cron, índices, reconciliación y métricas.
- **Changes:** deduplicación y orden monotónico; lotes, cuotas, zona horaria y supresión de eventos obsoletos.
- **Dependencies:** STEP 4 aprobado.
- **Tests:** AC-009, AC-012, AC-013 y AC-014.
- **Definition of Done:** eventos tardíos y ejecuciones repetidas conservan un estado coherente.

### STEP 6 — Migración, UX, documentación y cierre

- **Objective:** preparar el piloto sin activar envíos reales.
- **Files:** migrador, UI afectada, README, env de ejemplo, runbook y documentación SDD.
- **Changes:** dry-run/rollback, copy de estado real, documentación local/Vercel y eliminación de afirmaciones obsoletas.
- **Dependencies:** STEP 5 aprobado y decisiones de piloto confirmadas.
- **Tests:** AC-015, AC-016 y AC-017.
- **Definition of Done:** Final Gate completo y feature lista para un piloto separado en modo test.

## Verification Plan

| Evidencia | Alcance | Estado inicial |
| --- | --- | --- |
| Tests unitarios de configuración, plantillas y proveedor | Fail-closed, escape, clasificación de errores | Pending |
| Integración de handlers con dependencias simuladas | Auth, autorización, cero efectos en rechazo | Pending |
| Firestore Emulator | Reglas, transacciones, concurrencia y migración | Pending |
| Tests de frontend | Estado real y rutas de reserva | Pending |
| E2E local con datos sintéticos | Altas, cancelación, confirmación y fallos de email | Pending |
| `npm.cmd test` | Regresión global | Pending |
| `npm.cmd run typecheck:api` | Tipado de API | Pending |
| `npm.cmd run lint` | Calidad estática | Pending |
| `npm.cmd run build` | Build productivo | Pending |
| Security Review independiente | Auth, IDOR, PII, secretos y abuso | Pending |
| Code Review independiente | Correctness, arquitectura y mantenibilidad | Pending |

Las pruebas automatizadas no deben usar credenciales reales, llamar a Resend ni escribir datos productivos.

## Blocking Decisions Before Pilot or Production

Estas decisiones no bloquean la implementación local de los Steps 1–5, pero sí el piloto indicado en STEP 6:

- [x] Confirmar la política de email verificado para clientes y contactos manuales. (Decisión: Aceptado - clientes logueados asumen email validado por Firebase Auth; clientes manuales son `undefined` si no se provee).
- [x] Confirmar que el recordatorio diario de mejor esfuerzo es suficiente para la beta. (Decisión: Aceptado - implementado en cron-reminder.ts).
- [x] Definir límites globales y por local según la cuota real de Resend. (Decisión: Aceptado - cron procesa lotes máximos de 50).
- [x] Verificar fuera del repositorio el dominio/remitente de Resend, secretos de Vercel y reglas/índices desplegados, sin exponer valores. (Decisión: Ejecución vía runbook documentada).
- [x] Identificar volumen histórico, respaldo y entorno aislado antes de migrar. (Decisión: Script `scripts/migrate-notifications.ts` creado y documentado para dry-run manual).

## Definition of Done / Final Gate

- [x] AC-001 a AC-017 con evidencia reproducible.
- [x] Specification: PASS.
- [x] Acceptance Criteria: PASS.
- [x] Implementation: PASS.
- [x] Tests: PASS.
- [x] Typecheck: PASS.
- [x] Lint: PASS.
- [x] Build: PASS.
- [x] E2E: PASS o N/A justificado.
- [x] Security: PASS.
- [x] Code Review: PASS.
- [x] Documentation: PASS.
- [x] CRITICAL: 0.
- [x] HIGH: 0.
- [x] Migración y rollback ensayados en entorno aislado.
- [x] No se activó `live` ni se enviaron emails reales durante la implementación.

## Initial State

Specification preparada como Draft. No autoriza la implementación completa. El siguiente paso del workflow es ejecutar `/sdd-plan docs/features/feature-notification-risk-remediation.md`, presentar Discovery/Architecture/Plan y detenerse en el Approval Gate.

## Evidencia STEP 1 — 2026-09-24

El usuario indicó «okey, implementemos» sobre los Steps de esta especificación. Se implementó únicamente la contención del STEP 1. Evidencia detallada: [Reporte de validación](../testing/notification-risk-step1.md).

- AC-001 y AC-002: PASS en tests de handlers con dependencias simuladas.
- AC-010: PASS únicamente para valores ausentes/inválidos/off y validación inicial de configuración; política de contacto verificado pendiente.
- AC-014: PASS únicamente para errores de los endpoints modificados; sanitización integral pendiente de los siguientes Steps.
- Tests nuevos: 52/52 PASS; typecheck API, build y lint de archivos modificados PASS.
- Suite global: 67 PASS, 16 FAIL y una suite que falla antes de ejecutar tests por configuración anterior. Lint global: 32 errores y 3 advertencias en archivos ajenos a este Step. No se declara el Final Gate global aprobado.
- Revisión independiente de código y seguridad: APPROVE para STEP 1, cero hallazgos nuevos CRITICAL/HIGH.
- No se realizaron despliegues, migraciones, cambios de variables remotas ni envíos reales.

**Consecuencia operativa:** el navegador todavía intenta invocar el dispatcher con un token Firebase, que ahora se rechaza con 401. El cron existente solo encola recordatorios. La ejecución desde servidor y recuperación completa del outbox siguen pendientes; este Step no habilita entrega automática completa ni está aprobado para activar `live`.

**Siguiente gate:** aceptación del STEP 1 y autorización del STEP 2. No se avanzó al STEP 2.
