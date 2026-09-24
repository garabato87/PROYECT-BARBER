# Evidencia TDD y revisión — Notificaciones, STEP 1

Fecha: 2026-09-24. Fuente: [feature-notification-risk-remediation.md](../features/feature-notification-risk-remediation.md).

## Alcance y arquitectura

Clasificación SECURITY / BUG. Se reutilizaron los handlers Vercel actuales y Svix instalado. Un helper compartido valida método, secreto y configuración; Firebase se importa únicamente después de las barreras de autorización. El webhook autentica el stream original antes de interpretar su JSON. No se cambió el contrato de reservas ni la estructura de Firestore.

## Garantías y evidencia

| Comportamiento | Prueba | Evidencia |
| --- | --- | --- |
| Cron/dispatcher rechazan secreto ausente, incorrecto, Bearer arbitrario y bypass de desarrollo antes de acceder a datos | `tests/api/notification-access.test.ts` | RED: 31 fallos / 4 aprobados antes del cambio; GREEN inicial: 35/35 |
| Modos inválidos quedan off; configuración de envío incompleta se rechaza; sin remitente/destinatario fijo | mismo archivo | GREEN final ampliado: 40/40 |
| Firma obligatoria sobre bytes originales, cuerpo limitado y errores categorizados | `tests/api/webhook-security.test.ts` | RED: 5 fallos / 2 aprobados; GREEN final ampliado: 12/12 |

Los tests simulan Firebase y Resend. Las firmas Svix son sintéticas y se generan localmente. No se contactó al proveedor ni se usaron datos productivos.

## Comandos y resultados

- `npm.cmd run test:api`: PASS, 52 tests en dos archivos, entorno Node.
- `npm.cmd test -- tests/api/notification-access.test.ts tests/api/webhook-security.test.ts`: PASS, los mismos 52 tests también bajo la configuración predeterminada.
- `npm.cmd run typecheck:api`: PASS.
- `npm.cmd run build`: PASS; advertencia de chunks superiores a 500 kB.
- `node node_modules/eslint/bin/eslint.js api/cron-reminder.ts api/dispatch-outbox.ts api/webhook-resend.ts api/_lib/notification-security.ts api/_lib/firebase-admin.ts tests/api vitest.api.config.ts`: PASS.
- `npm.cmd test -- --reporter=dot`: FAIL global, 67 tests pasan y 16 tests frontend fallan; además `server/appointments.test.ts` no carga por `window is not defined` en el setup existente. El test de server ya estaba sin seguimiento antes de este Step y referencia módulos ausentes. No se eliminó, ignoró ni modificó.
- `npm.cmd run lint`: FAIL global, 32 errores y 3 advertencias en archivos no modificados por este Step.
- `git diff --check`: PASS.

Los fallos globales incluyen providers faltantes en tests, expectativas desactualizadas y reglas de lint en componentes/API de reservas fuera del alcance actual. Se preservaron para tratar en los Steps correspondientes.

No se midió cobertura porcentual: el proveedor de coverage de Vitest no está instalado. No se afirma alcanzar el umbral del 80%. No se ejecutó E2E de navegador: este Step prueba límites HTTP con mocks, sin cambiar interfaz. No se crearon commits checkpoint; la evidencia RED/GREEN queda registrada aquí y los cambios permanecen disponibles para revisión.

## Revisión independiente

Se revisó con las guías ECC `code-reviewer` y `security-reviewer`: diff, código completo, consumidores y pruebas. Veredicto: APPROVE del alcance STEP 1, cero nuevos hallazgos CRITICAL/HIGH/MEDIUM/LOW. Esto no constituye aprobación de los riesgos heredados de los siguientes Steps.

## Límites y comportamiento operativo

- Solo se admite `Authorization: Bearer <CRON_SECRET>` en cron/dispatcher; ni un token Firebase ni `x-cron-secret` los habilitan.
- El frontend aún llama al dispatcher con un token Firebase: recibirá 401. Las reservas siguen usando sus endpoints existentes, pero los avisos inmediatos ya no se disparan desde el navegador.
- El cron programado solo encola recordatorios; recuperación/envío desde servidor es trabajo pendiente. Mantener `NOTIFICATIONS_MODE=off` hasta completar y validar los siguientes Steps.
- `RESEND_WEBHOOK_SECRET` ahora es obligatorio. Los cuerpos se verifican tal como llegan; no se usa `JSON.stringify(req.body)` como sustituto de los bytes firmados. No se validó el runtime desplegado en Vercel en esta fase.
- El worker conserva limitaciones heredadas de concurrencia, reintentos, plantillas y estados. No está listo para activar `live`.
- `.env.example` contiene campos vacíos para remitente y destinatario de prueba. No modifica las variables ya configuradas en Vercel.

## Gate

Implementación y pruebas específicas del STEP 1: PASS. Build/typecheck/lint acotado: PASS. Suite y lint globales: FAIL heredados y documentados. Cobertura porcentual: NO MEDIDA. E2E/deploy/piloto: NO EJECUTADOS. Final Gate de la feature: PENDING.

Se detiene la ejecución antes del STEP 2 conforme al gate de la especificación.
