# Feature: Sistema de Notificaciones y Comunicación

**Versión:** 1.0  
**Estado:** ESPECIFICACIÓN  
**Fecha:** 2026-09-23  
**Clasificación SDD:** FEATURE

---

## Objective

Implementar un sistema de comunicación con el cliente compuesto por tres capacidades:

1. **Verificación de email** al momento del registro para garantizar que el email del cliente es real y válido.
2. **Botón de contacto rápido por WhatsApp** en las tarjetas de turno de los paneles de profesional y dueño de local.
3. **Emails transaccionales automáticos** disparados por eventos de Firestore via Firebase Cloud Functions + API de Resend.

---

## Why

- Los clientes actualmente pueden registrarse con emails inexistentes, lo que impide la comunicación real.
- Los profesionales y dueños no tienen una forma rápida de contactar al cliente desde la agenda.
- No existe ningún mecanismo de confirmación, recordatorio ni aviso de cancelación hacia el cliente.
- La falta de comunicación aumenta los "no-shows" y genera mala experiencia de usuario.

---

## Actors

- **Cliente:** Recibe emails de confirmación, cancelación y recordatorio de turno.
- **Profesional:** Ve el botón de WhatsApp en sus tarjetas de turno (`ProfessionalAgendaPage`).
- **Dueño de local (admin):** Ve el botón de WhatsApp en sus tarjetas de turno (`AdminAgendaPage`).
- **Sistema (Cloud Functions):** Dispara emails automáticos ante eventos de Firestore.

---

## Scope

- Email Verification al registrarse con email/contraseña.
- Botón de WhatsApp (deep link) en tarjetas de turno de profesional y admin.
- Email de confirmación al cliente cuando su turno pasa a estado `confirmed`.
- Email de cancelación al cliente cuando su turno pasa a estado `cancelled`.
- Email de recordatorio al cliente 12 horas antes del turno (via Cloud Function con scheduler).
- Agregar campo `clientEmail` al documento de appointment en Firestore.
- **Modo beta:** todos los emails se redirigen a `alvarez.braian87@gmail.com` (email de prueba de Resend).

## Out of Scope

- Notificaciones push (browser/mobile).
- Email al profesional o admin.
- SMS.
- WhatsApp automatizado (bot/API oficial).
- Diseño elaborado de templates HTML (beta = diseño simple funcional).
- Dominio propio de email (se usará el dominio de prueba de Resend en beta).
- Configuración de Firebase Auth email branding con dominio propio.

---

## Functional Requirements

### FR-01: Email Verification en Registro
- Al completar el registro con email/contraseña, el sistema debe llamar a `sendEmailVerification()` de Firebase Auth.
- El usuario debe ver un mensaje claro indicando que debe verificar su email.
- El login con Google queda exento (el email ya viene verificado).
- **Para beta:** no se bloquea el acceso si el email no está verificado. Solo se notifica.

### FR-02: Botón WhatsApp en Tarjetas de Turno
- En `ProfessionalAgendaPage`, cada tarjeta de turno activo (estado `pending` o `confirmed`) debe mostrar un botón/ícono de WhatsApp.
- En `AdminAgendaPage`, ídem.
- Al hacer clic, el botón abre WhatsApp (web o app) en una nueva pestaña con el número del cliente y el mensaje pre-cargado: `"Hola [clientName],"`.
- El botón solo se muestra si `clientPhone` existe y no está vacío en el documento del turno.
- El número se formatea limpiando espacios y caracteres no numéricos, manteniendo el `+` internacional si existe.
- El botón debe ser accesible (aria-label descriptivo).

### FR-03: Campo `clientEmail` en Appointments
- Al crear un turno desde `PremiumBookingPage` (flujo de cliente autenticado), se debe incluir `clientEmail: user?.email` en el documento de Firestore.
- Los turnos creados manualmente por profesional o admin (sin clientId real) no incluyen `clientEmail` (se guarda vacío `''`).

### FR-04: Cloud Function — Email de Confirmación
- Se dispara cuando un documento en `businesses/{shopId}/appointments/{apptId}` es **creado** con `status === 'confirmed'`, O cuando es **actualizado** y el campo `status` cambia a `'confirmed'`.
- Si `clientEmail` está vacío o ausente, la función no hace nada.
- Envía email a `clientEmail` (en beta, redirigido a `alvarez.braian87@gmail.com`).
- Contenido mínimo: nombre del cliente, servicio, profesional, fecha, hora.

### FR-05: Cloud Function — Email de Cancelación
- Se dispara cuando un documento de appointment es **actualizado** y el campo `status` cambia a `'cancelled'`.
- Misma lógica de guard con `clientEmail`.
- Contenido mínimo: nombre del cliente, servicio, fecha y hora cancelada.

### FR-06: Cloud Function — Recordatorio 12hs Antes
- Una Cloud Function schedulada (cada hora) consulta los appointments con `status` `pending` o `confirmed` cuya fecha/hora de inicio sea en las próximas 12 a 13 horas.
- Por cada uno que tenga `clientEmail`, envía el email de recordatorio.
- Guard anti-duplicado: campo `reminderSent: boolean` en el documento del appointment.

---

## Business Rules

- BR-01: No se envían emails si `clientEmail` está vacío o ausente.
- BR-02: En modo beta, Resend redirige todos los emails a `alvarez.braian87@gmail.com`.
- BR-03: El botón de WhatsApp sólo aparece si `clientPhone` está presente.
- BR-04: Los recordatorios no se envían más de una vez por turno.
- BR-05: La verificación de email no bloquea el acceso en beta (solo informa).

---

## Acceptance Criteria

- AC-01: Al registrarse con email/contraseña, el usuario ve un mensaje de "verificá tu email" y Firebase envía el correo de verificación.
- AC-02: En `ProfessionalAgendaPage`, los turnos activos con `clientPhone` muestran un botón de WhatsApp que abre `wa.me/{numero}?text=Hola%20{nombre}%2C` en nueva pestaña.
- AC-03: En `AdminAgendaPage`, ídem AC-02.
- AC-04: Al crear un turno como cliente desde `PremiumBookingPage`, el documento en Firestore incluye el campo `clientEmail` con el email del usuario autenticado.
- AC-05: Cuando un turno es confirmado, el email de confirmación llega a `alvarez.braian87@gmail.com` (beta).
- AC-06: Cuando un turno es cancelado, el email de cancelación llega a `alvarez.braian87@gmail.com` (beta).
- AC-07: 12hs antes del turno, el email de recordatorio llega a `alvarez.braian87@gmail.com` (beta).
- AC-08: El recordatorio no se envía dos veces al mismo turno.

---

## Edge Cases

- EC-01: Registro con Google → No llamar a `sendEmailVerification` (ya verificado).
- EC-02: Turno manual (creado por profesional/admin) → `clientEmail` vacío → No disparar emails.
- EC-03: El cliente cancela su propio turno → Disparar email de cancelación igual.
- EC-04: Número de teléfono con espacios o caracteres (`+54 9 11 1234-5678`) → Limpiar antes de generar el deep link.
- EC-05: `clientPhone` sin código de país → El link de WhatsApp puede no funcionar. Limitación conocida para beta (TD-02).
- EC-06: Cloud Function de recordatorio falla → No bloquea nada en el frontend. Reintentos automáticos de Firebase.
- EC-07: Resend rechaza el email (bounce) → Loguear el error en Cloud Functions pero no propagar al usuario.

---

## Security

- SEC-01: La API Key de Resend **nunca** se expone en el frontend. Solo existe en las variables de entorno de Cloud Functions.
- SEC-02: Las Cloud Functions validan que el documento tiene los campos mínimos antes de enviar.
- SEC-03: Las Firestore Security Rules actuales no se modifican.
- SEC-04: El campo `clientEmail` en el appointment es de solo lectura para el cliente (reglas actuales no permiten modificarlo post-creación).

---

## UX

- El botón de WhatsApp usa ícono verde de WhatsApp o `MessageCircle` de Lucide como fallback, con aria-label: `"Contactar a [nombre] por WhatsApp"`.
- El email HTML es simple: fondo blanco, fuente sans-serif, datos del turno en lista, pie de página con nombre del negocio.

---

## Constraints

- CONST-01: Firebase plan requerido: **Blaze (pago por uso)**. El free tier cubre la beta ampliamente.
- CONST-02: Se requiere cuenta en [Resend](https://resend.com) con API Key configurada en variables de entorno de Firebase Functions.
- CONST-03: Firebase CLI debe estar configurado para hacer deploy de Functions.
- CONST-04: Las Cloud Functions se escriben en **TypeScript**.
- CONST-05: El recordatorio usa `firebase-functions/v2/scheduler`.

---

## Dependencies

- Firebase Cloud Functions (v2) — a configurar en Step 4.
- Resend SDK (`resend` npm package) — a instalar en `functions/`.
- `sendEmailVerification` de Firebase Auth SDK (ya disponible).

---

## Unknowns

- UNK-01: El proyecto no tiene carpeta `functions/`. Se inicializa en Step 4.
- UNK-02: El plan Blaze debe activarse en la consola de Firebase antes del deploy.

---

## Technical Debt

- TD-01: Turnos manuales sin `clientEmail` no reciben notificaciones.
- TD-02: `clientPhone` sin código de país internacional puede generar links de WhatsApp no funcionales.
- TD-03: Migrar remitente de Resend y branding de Firebase Auth cuando se tenga dominio propio.

---

## Implementation Plan

### Step 1 — Email Verification en Registro

**Objective:** Llamar a `sendEmailVerification()` post-registro y mostrar feedback al usuario.

**Files:**
- `MODIFY` `src/hooks/useAuth.tsx`
- `MODIFY` `src/pages/RegisterPage.tsx`

**Changes:**
- En `useAuth.tsx`: llamar a `sendEmailVerification(firebaseUser)` después del `setDoc`.
- En `RegisterPage.tsx`: mostrar paso visual "Revisá tu email" en lugar de redirigir de inmediato.

**Tests:** Test unitario verificando que tras submit exitoso se muestra el mensaje de verificación.

**Acceptance Criteria:** AC-01.

**Definition of Done:**
- [ ] `sendEmailVerification` se llama post-registro.
- [ ] Usuario ve mensaje de verificación en pantalla.
- [ ] Google login no llama a `sendEmailVerification`.
- [ ] Test unitario pasa.
- [ ] `npm run lint` sin errores.
- [ ] `npm run build` sin errores.

---

### Step 2 — Botón WhatsApp en Tarjetas de Turno

**Objective:** Agregar botón de deep link a WhatsApp en tarjetas de turno activos.

**Files:**
- `MODIFY` `src/pages/ProfessionalAgendaPage.tsx`
- `MODIFY` `src/pages/AdminAgendaPage.tsx`
- `NEW` `src/utils/whatsapp.ts`

**Changes:**
- Crear `buildWhatsAppUrl(phone: string, name: string): string` que limpia el número y construye `https://wa.me/{phone}?text=Hola%20{name}%2C`.
- Agregar botón en sección de actions de cada tarjeta de turno activo con `clientPhone`.

**Tests:** Test unitario para `buildWhatsAppUrl` con distintos formatos de teléfono.

**Acceptance Criteria:** AC-02, AC-03.

**Definition of Done:**
- [ ] Botón visible en tarjetas activas con `clientPhone`.
- [ ] Botón oculto si no hay `clientPhone`.
- [ ] URL generada correctamente.
- [ ] Abre en nueva pestaña (`target="_blank" rel="noopener noreferrer"`).
- [ ] aria-label correcto.
- [ ] Tests pasan.
- [ ] `npm run lint` sin errores.
- [ ] `npm run build` sin errores.

---

### Step 3 — Campo `clientEmail` en Appointments

**Objective:** Persistir el email del cliente en el documento de appointment.

**Files:**
- `MODIFY` `src/pages/PremiumBookingPage.tsx`

**Changes:**
- Agregar `clientEmail: user?.email || ''` al objeto en `transaction.set()`.

**Tests:** Review de código + verificación manual en Firestore emulator.

**Acceptance Criteria:** AC-04.

**Definition of Done:**
- [ ] Campo `clientEmail` presente en el documento de appointment.
- [ ] `npm run lint` sin errores.
- [ ] `npm run build` sin errores.

---

### Step 4 — Inicializar Vercel Serverless Functions

**Objective:** Configurar la carpeta `api/` para usar las Serverless Functions de Vercel.

**Files:**
- `NEW` `api/send-email.ts`
- `NEW` `vercel.json`

**Changes:**
- Instalar `resend` en el `package.json` raíz de React (ya que Vercel usa las dependencias del proyecto).
- Crear `api/send-email.ts` que recibirá una petición HTTP POST desde el frontend.
- Enviar email (en beta hacia `alvarez.braian87@gmail.com`).

**Acceptance Criteria:** Prerequisito para Step 5.

**Definition of Done:**
- [ ] Carpeta `api/` creada.
- [ ] Endpoint `/api/send-email` creado.

---

### Step 5 — Frontend triggers para Confirmación y Cancelación

**Objective:** Llamar al backend de Vercel desde React cuando se cree o cancele un turno.

**Files:**
- `MODIFY` `src/pages/PremiumBookingPage.tsx`
- `MODIFY` `src/pages/ClientDashboardPage.tsx` (o donde se cancele el turno)

**Changes:**
- Al finalizar `transaction.set()` exitosamente, hacer un `fetch('/api/send-email', { method: 'POST', body: JSON.stringify({...}) })`.
- Manejar los errores silenciosamente (no bloquear la UX si el mail falla).

**Acceptance Criteria:** AC-05, AC-06.

**Definition of Done:**
- [ ] El cliente al agendar dispara la petición HTTP de confirmación.
- [ ] El cliente al cancelar dispara la petición HTTP de cancelación.

---

### Step 6 — Vercel Cron Job: Recordatorio 12hs Antes

**Objective:** Enviar recordatorio automático 12hs antes del turno.

**Files:**
- `NEW` `api/cron-reminder.ts`
- `MODIFY` `vercel.json`

**Changes:**
- Agregar `"crons": [{ "path": "/api/cron-reminder", "schedule": "0 * * * *" }]` en `vercel.json` (cada hora).
- La función consulta Firestore (usando `firebase-admin` inicializado con variables de entorno) buscando turnos activos con `reminderSent != true` en la ventana +12h/+13h.
- Envía el email y actualiza Firestore.

**Acceptance Criteria:** AC-07, AC-08.

**Definition of Done:**
- [ ] Endpoint de cron creado.
- [ ] Configurado en `vercel.json`.

---

## Verification Plan

- `npm run test` → Vitest (tests unitarios frontend)
- `npm run lint` → ESLint
- `npm run build` → TypeScript + Vite build
- Firebase Emulator Suite → Cloud Functions localmente

---

## Final Gate (a evaluar al cierre)

```
Specification:        PASS
Acceptance Criteria:  PENDING
Implementation:       PENDING
Tests:                PENDING
Typecheck:            PENDING
Lint:                 PENDING
Build:                PENDING
E2E:                  N/A (beta)
Security:             PENDING
Code Review:          PENDING
UI/UX:                N/A
Documentation:        PENDING

CRITICAL: 0
HIGH: 0

Technical Debt:
- TD-01: Turnos manuales sin clientEmail no reciben notificaciones
- TD-02: clientPhone sin código de país puede generar links de WhatsApp no funcionales
- TD-03: Migrar dominio de email cuando se tenga dominio propio

Known Limitations:
- Beta: todos los emails van a alvarez.braian87@gmail.com
- Requiere plan Blaze activo en Firebase
- Verificación de email no bloquea el acceso en beta
```
