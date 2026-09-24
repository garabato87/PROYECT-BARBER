# Antecedente histórico — Notificaciones

Contenido previo de task.md, conservado como antecedente. Sus marcas no acreditan validación actual; ver ../../task.md.

## Implementación de Notificaciones Seguras y Completas en Vercel (feature-notification-hardening.md)

## Estado General
- `[x]` Step 1: Contener abuso y corregir runtime/errores.
- `[x]` Step 2: Preparar contactos privados y disponibilidad mínima.
- `[x]` Step 3: Centralizar comandos y outbox atómico.
- `[x]` Step 4: Despachador, plantillas, modo test/live, deduplicación y webhook.
- `[x]` Step 5: Recuperación/recordatorio diario acotado y observabilidad.
- `[x]` Step 6: Cerrar regresiones, rutas, documentación y piloto.

---

## Step 3: Centralizar comandos y outbox atómico

**Objetivo:** Migrar la lógica de creación y cancelación de turnos desde el frontend hacia la API de Vercel (Serverless). Al hacerlo, el backend podrá crear de forma **atómica** el turno, la disponibilidad y un registro en la colección `outbox` (para correos), evitando que una falla en el cliente deje un turno sin notificación. Finalmente, se bloqueará la escritura directa desde Firebase SDK para evitar bypass.

### Tareas a realizar en Step 3:
- `[x]` **API Endpoints**:
  - Crear `api/create-appointment.ts` (Validar Firebase JWT, chequear superposición, escribir atómicamente `appointments`, `availability` y `outbox`).
  - Crear `api/update-appointment.ts` (Cancelar/Completar turnos, con validación de roles y outbox).
- `[x]` **Servicios Cliente**: Crear utilitario `src/services/api.ts` o extender los hooks para llamar a las nuevas APIs con el token de Firebase.
- `[x]` **Migrar UI (Altas)**:
  - `PremiumBookingPage.tsx`
  - `BarbershopDetailsPage.tsx`
  - `AdminAgendaPage.tsx`
  - `ProfessionalAgendaPage.tsx`
- `[x]` **Migrar UI (Actualizaciones/Cancelaciones)**:
  - `ClientDashboardPage.tsx` (Cancelar)
  - `ProfessionalAgendaPage.tsx` (Completar/Ausente)
- `[x]` **Reglas de Firestore (`firestore.rules`)**:
  - Remover `allow create` y `allow update` de `appointments` y `availability`. Únicamente la API (Admin SDK) podrá escribir en estas colecciones (Bloquear Bypass).
- `[x]` **Validación (AC05-07, AC11)**:
  - Confirmar que cerrar el navegador no impide la creación del outbox (AC11).
  - Confirmar que superposiciones devuelven 409 Conflict (AC06).

---

## Step 4: Despachador, plantillas, modo test/live, deduplicación y webhook

**Objetivo:** Consumir la colección `outbox` mediante un proceso protegido (CRON) para enviar los correos a través de Resend. Esto implementa el patrón Transactional Outbox, asegurando que los correos nunca se pierdan ni se envíen múltiples veces. Además, agregar un Webhook para recibir acuses de recibo de Resend.

### Tareas a realizar en Step 4:
- `[x]` **Despachador (Outbox)**: Crear `api/dispatch-outbox.ts` que escanee la colección `outbox` buscando documentos con `status == 'pending'`.
  - Asegurar protección mediante `CRON_SECRET` o token Auth.
  - Actualizar el documento a `processing` antes de enviar (AC10).
  - Enviar email usando Resend con plantillas centralizadas.
  - Actualizar estado a `sent` o `failed` (AC09).
- `[x]` **Modo Test/Live**: Implementar `NOTIFICATIONS_MODE=off|test|live` en el despachador (AC08).
- `[x]` **Webhook de Resend**: Crear `api/webhook-resend.ts` para recibir actualizaciones de estado (entregado, rebotado).
  - Verificar firma criptográfica (AC14).
  - Actualizar estado sin degradar estados terminales antiguos (AC10).
- `[x]` **Limpieza**: Eliminar/limpiar `api/send-email.ts` obsoleto.

---

## Step 5: Recuperación/recordatorio diario acotado y observabilidad

**Objetivo:** Crear un CRON diario que agende el envío de recordatorios para los turnos de las próximas 36 horas. El CRON delegará el envío de correo a la colección `outbox` para centralizar el flujo.

### Tareas a realizar en Step 5:
- `[x]` **Endpoint de CRON**: Crear `api/cron-reminder.ts` que se ejecute diariamente (`0 12 * * *`).
  - Validar `CRON_SECRET` (AC03).
  - Determinar fecha "mañana" basado en `America/Argentina/Buenos_Aires` (FR-006).
  - Consultar `appointments` (lote acotado/Collection Group) donde la fecha coincida y el estado no sea cancelado/completado.
  - Insertar eventos tipo `reminder` en la colección `outbox` (con ID predecible para evitar duplicados diarios).
  - Marcar el campo `reminderQueued: true` en el `appointment` (AC12, AC13).
- `[x]` **Actualización Vercel**: Agregar el CRON `0 12 * * *` a `vercel.json`.
- `[x]` **Plantilla Recordatorio**: Añadir soporte para `type === 'reminder'` en `api/dispatch-outbox.ts`.

---

## Step 6: Cerrar regresiones, rutas, documentación y piloto

**Objetivo:** Asegurar que el sistema está completamente verde en las suites locales (Lint, TypeScript, Build), documentar el nuevo stack (Vercel Serverless + Resend) en el README, y preparar el piloto.

### Tareas a realizar en Step 6:
- `[x]` **Documentación (README)**: 
  - Explicar la arquitectura Vercel + Firebase + Resend.
  - Eliminar referencias obsoletas a requerir plan Firebase Blaze para correos.
  - Documentar variables de entorno (`NOTIFICATIONS_MODE`, `CRON_SECRET`, `RESEND_API_KEY`, etc.).
- `[x]` **Validaciones Globales (AC16)**:
  - Ejecutar y verificar `npm run lint`.
  - Ejecutar y verificar `npm run build`.
  - Ejecutar y verificar `npm run typecheck:api`.
- `[x]` **Helper WhatsApp (AC17)**: Verificar que los enlaces a WhatsApp funcionen sin autodisparo.
