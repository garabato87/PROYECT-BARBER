# Runbook: Notificaciones y Emails (Resend)

Este runbook describe la operación del sistema asíncrono de emails (reservas y recordatorios diarios).

## Variables de Entorno (Vercel)

| Variable | Uso | Valores Válidos | Requerida |
|---|---|---|---|
| `NOTIFICATIONS_MODE` | Controlador maestro de estado | `off`, `test`, `live` (si falta = `off`) | Sí |
| `NOTIFICATIONS_TEST_RECIPIENT` | En modo `test`, todos los correos se envían a este email | Ej: `dev@example.com` | Sí en `test` |
| `RESEND_API_KEY` | Autenticación con Resend | | Sí en `test`/`live` |
| `RESEND_FROM` | Remitente verificado en Resend | Ej: `Reservas <no-reply@tudominio.com>` | Sí en `test`/`live` |
| `RESEND_WEBHOOK_SECRET` | Verificación criptográfica del Webhook | `whsec_...` | Sí en `test`/`live` |
| `CRON_SECRET` | Header `Authorization: Bearer <secret>` para el cron | | Sí |
| `APP_BASE_URL` | Base para links en los correos | `https://midominio.com` | Sí |

## Secuencia para ir a Producción (Piloto)

El sistema nunca debe pasarse a `live` sin antes ensayar en `test`.

1. **Test Mode (Aislamiento):**
   - Configurar `NOTIFICATIONS_MODE=test` en Vercel.
   - Configurar `NOTIFICATIONS_TEST_RECIPIENT=tu-email@gmail.com`.
   - Realizar reservas. Los clientes verán la confirmación en UI, el backend encolará y procesará correos, pero *todos* llegarán a `tu-email@gmail.com`.
   - Revisar logs de Vercel por posibles cuelgues o timeouts.

2. **Migración Histórica (Opcional):**
   - Correr localmente `npx tsx scripts/migrate-notifications.ts --dry-run` contra la base de datos (se requiere clave de servicio).
   - Revisar recuento. Ejecutar sin `--dry-run` si aplica (actualiza campos de revisión).

3. **Activación Live:**
   - Asegurarse de tener un dominio validado en Resend para `RESEND_FROM`.
   - Eliminar `NOTIFICATIONS_TEST_RECIPIENT` de Vercel.
   - Cambiar `NOTIFICATIONS_MODE=live`.

## Monitoreo y Solución de Problemas

- **Fallo: Los correos no salen (estado `pending` o `processing` permanente)**
  - Causa probable: El worker de Vercel falló silenciosamente o Resend está teniendo latencia.
  - Mitigación: El lease del outbox expira a los 30s. Si no se resuelve, verificar logs de Vercel buscando `outbox_worker_error`.

- **Fallo: El webhook devuelve 503 o 400**
  - Causa probable: `RESEND_WEBHOOK_SECRET` incorrecto o ausente.
  - Mitigación: Resend reintentará automáticamente. Actualizar la variable en Vercel.

- **Fallo: Cron falla con 401**
  - Causa probable: `CRON_SECRET` no coincide con la configuración de `vercel.json` o la petición HTTP manual no incluye `Authorization: Bearer <secret>`.
