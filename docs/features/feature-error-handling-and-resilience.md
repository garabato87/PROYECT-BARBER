# Feature Specification — Error Handling, Resilience & User Feedback

## Metadata
- Type: FEATURE + UX + RELIABILITY
- Priority: High
- Status: Draft
- Area: Entire Application
- Primary Capability: Error Handling / Resilience
- Supporting Capabilities: TDD, E2E, Accessibility, Security, Performance, UI/UX Pro Max

## 1. Objective

Implementar un sistema global, consistente y profesional de manejo de errores para toda la aplicación.

Debe evitar:
- pantallas en blanco;
- errores técnicos incomprensibles;
- botones que parecen no responder;
- formularios enviados incompletos;
- turnos que no cargan;
- solicitudes fallidas;
- páginas caídas;
- datos que no llegan;
- estados de carga infinitos;
- errores silenciosos.

Flujo esperado:

```text
Error → Detectar → Explicar → Recuperar cuando sea posible → Registrar cuando corresponda
```

## 2. UX Principles

Los errores deben ser:
1. comprensibles;
2. visibles;
3. seguros;
4. accionables;
5. recuperables cuando sea posible;
6. consistentes;
7. aislados cuando sea posible para no romper toda la aplicación.

Preferir mensajes como:

```text
No pudimos cargar los horarios.
Verificá tu conexión e intentá nuevamente.

[Reintentar]
```

Nunca mostrar directamente errores técnicos al usuario final.

## 3. Error Taxonomy

Durante Discovery identificar y clasificar:
- Validation Errors;
- Network Errors;
- API / Backend Errors;
- Authentication Errors;
- Authorization Errors;
- Data Errors;
- Booking / Turn Errors;
- Runtime / Application Errors.

Adaptar la clasificación a la arquitectura real del proyecto.

## 4. Global Error Architecture

Auditar primero la arquitectura existente.

Considerar:

```text
UI
 ↓
Error Boundary / Route Boundary
 ↓
Error Normalization
 ↓
User-Friendly Error
 ↓
Recovery
 ↓
Logging / Monitoring
```

No crear sistemas paralelos si ya existe infraestructura equivalente.

## 5. Error Normalization

Normalizar errores de Firebase, fetch, Axios, backend u otras fuentes a una estructura común.

Conceptualmente:

```text
AppError
- code
- category
- message
- userMessage
- severity
- retryable
- status
- context
```

Los nombres finales deben adaptarse al proyecto.

## 6. Error Severity

Definir:
- Info;
- Warning;
- Error;
- Critical.

La severidad debe determinar el feedback apropiado.

## 7. Error Boundary

Implementar o mejorar un Error Boundary global cuando corresponda.

Un error de renderizado no debe dejar la aplicación en una pantalla vacía.

Fallback:

```text
Algo salió mal

No pudimos cargar esta sección.

[Reintentar]
[Volver al inicio]
```

No mostrar stack traces.

## 8. Page / Route Errors

Una página que no puede cargar sus datos debe mostrar un estado específico con:
- explicación;
- retry;
- navegación segura.

## 9. Component-Level Errors

Aislar errores por sección cuando sea posible.

Si falla actividad reciente, no debería desaparecer necesariamente todo el dashboard.

## 10. Loading States

Toda operación asíncrona relevante debe manejar:

```text
idle → loading → success / error
```

Evitar loaders infinitos, pantallas congeladas y cambios bruscos de layout.

Usar skeletons, spinners o feedback contextual cuando corresponda.

## 11. Retry Strategy

Retry automático sólo para operaciones seguras y potencialmente transitorias, principalmente lecturas.

Retry manual para operaciones donde el usuario debe decidir.

No hacer retry automático en operaciones que puedan duplicar efectos:
- crear turno;
- pagar;
- eliminar;
- modificar datos críticos.

## 12. Request Deduplication

Prevenir solicitudes duplicadas que puedan producir:
- doble creación;
- doble confirmación;
- carga innecesaria;
- inconsistencias.

Especial atención al sistema de turnos.

## 13. Double Submission Protection

Mientras una acción se procesa, bloquear temporalmente el control.

Ejemplo:

```text
[Confirmar turno]
        ↓
[Confirmando...]
```

Aplicar cuando corresponda a:
- crear;
- editar;
- eliminar;
- suspender;
- reactivar;
- confirmar turno;
- modificar suscripción.

## 14. Form Validation

Implementar validación consistente.

Debe existir:
- validación client-side para feedback inmediato;
- validación server-side para integridad y seguridad.

Nunca confiar exclusivamente en frontend.

## 15. Inline Validation

Mostrar errores junto al campo afectado.

Ejemplo:

```text
Email
[ braian@ ]

⚠ Ingresá un email válido.
```

No depender exclusivamente de Toasts para errores de campos.

## 16. Form Submission Errors

Si un formulario válido falla al guardar:
- conservar los datos introducidos cuando sea posible;
- explicar el error;
- permitir retry;
- evitar obligar al usuario a completar todo nuevamente.

## 17. Booking Flow Resilience

Especial atención al flujo:

```text
Barbería → Servicio → Profesional → Fecha → Hora → Confirmación
```

Cada paso debe contemplar:
- loading;
- empty;
- error;
- retry;
- invalid state.

Si falla un paso, no reiniciar todo innecesariamente.

## 18. Availability Race Conditions

El backend debe ser la autoridad final sobre disponibilidad.

Si el horario fue ocupado entre selección y confirmación:

```text
Ese horario acaba de ser ocupado.

Elegí otro horario disponible.

[Ver horarios]
```

Nunca mostrar éxito si el backend rechazó la operación.

## 19. Error Messages

Cada mensaje debe responder cuando sea posible:
1. qué ocurrió;
2. qué significa;
3. qué puede hacer el usuario.

No exponer:
- stack traces;
- Firebase internals;
- SQL/API internals;
- tokens;
- secretos;
- información sensible.

## 20. Offline / Connection State

Cuando sea viable detectar pérdida y recuperación de conexión.

Ejemplo:

```text
Sin conexión
Los cambios no podrán guardarse hasta recuperar la conexión.
```

Al recuperar:

```text
Conexión restaurada
```

No asumir que estar online garantiza que una operación tuvo éxito.

## 21. Toast Strategy

Unificar Toasts para:
- éxito;
- warning;
- errores contextuales;
- información.

No usar Toast como único mecanismo para errores críticos o de formularios.

Respetar accessibility y reduced motion.

## 22. Error Pages

Implementar estados apropiados para:
- 404;
- 403;
- 500;
- offline cuando corresponda.

Ejemplos:

```text
Página no encontrada
[Volver al inicio]
```

```text
No tenés permisos para acceder a esta sección.
[Volver]
```

```text
Algo salió mal
Estamos teniendo problemas para procesar esta solicitud.
[Reintentar]
```

## 23. Empty vs Error

Diferenciar siempre:

```text
Empty:
Todavía no hay turnos.
```

de:

```text
Error:
No pudimos cargar los turnos.
[Reintentar]
```

## 24. Error Logging / Monitoring

Auditar si existe:
- Firebase Crashlytics;
- Sentry;
- logging propio;
- otro sistema.

No instalar servicios externos sin justificar y aprobar.

Registrar información diagnóstica sanitizada cuando corresponda.

Nunca registrar contraseñas, tokens, secretos o datos sensibles innecesarios.

## 25. Security

El manejo de errores no debe filtrar información.

Especial atención a:
- autenticación;
- autorización;
- Firestore;
- APIs;
- Super Admin;
- clientes;
- turnos.

Un error 403 no debe permitir enumerar recursos protegidos.

## 26. Accessibility

Verificar:
- `aria-invalid`;
- `aria-describedby`;
- labels;
- focus;
- live regions;
- keyboard navigation;
- contraste;
- screen readers.

Cuando corresponda, llevar el foco al primer campo inválido o al resumen de errores.

## 27. Performance

Evitar:
- listeners globales excesivos;
- logging duplicado;
- retry agresivo;
- renders innecesarios;
- requests repetidas.

## 28. Discovery

Antes de implementar inspeccionar:
- fetch / Axios / Firebase;
- hooks;
- services;
- API layer;
- authentication;
- routing;
- Error Boundaries;
- forms;
- validation;
- booking flow;
- loading states;
- Toasts;
- modals;
- logging;
- monitoring;
- tests;
- E2E.

Crear inventario de:
```text
Error Sources
Error Handlers
Loading States
Validation
Retry Logic
User Feedback
Logging
Monitoring
```

No duplicar sistemas existentes.

## 29. Architecture Proposal

Después de Discovery proponer una arquitectura similar a:

```text
             UI / Feature
                   ↓
             Request / Action
                   ↓
             Error Normalize
              ↙          ↘
     User Feedback      Logging
          ↓                 ↓
      Recovery          Monitoring
```

Adaptarla a la arquitectura real.

## 30. Testing Strategy

Crear o ampliar tests para:
- validation;
- API errors;
- network errors;
- authentication;
- authorization;
- Error Boundary;
- retry;
- loading;
- double submission;
- booking conflict;
- empty vs error;
- error mapping;
- recovery actions.

## 31. E2E Critical Scenarios

Cubrir cuando exista infraestructura E2E:

### Failed Request
```text
Acción → request falla → mensaje → retry
```

### Booking Conflict
```text
Horario seleccionado → deja de estar disponible → confirmar → rechazo → elegir otro
```

### Missing Fields
```text
Formulario incompleto → campos identificados → no request innecesaria
```

### Page Failure
```text
Página falla → fallback → recuperación
```

### Expired Session
```text
Sesión expira → operación rechazada → feedback → autenticación
```

## 32. Acceptance Criteria

### AC-001 — No Blank Screens
Given ocurre un error de runtime controlado
When una sección no puede renderizarse
Then se muestra un fallback usable.

### AC-002 — Failed Requests
Given una solicitud falla
When el error es recuperable
Then el usuario recibe un mensaje claro y retry cuando corresponda.

### AC-003 — Validation
Given existen campos obligatorios
When se intenta enviar el formulario incompleto
Then se identifican los campos inválidos y se evita una request innecesaria.

### AC-004 — Form Recovery
Given un formulario falla al guardar
When se muestra el error
Then los datos se conservan cuando sea posible.

### AC-005 — Booking Conflict
Given un horario deja de estar disponible
When el usuario intenta reservarlo
Then el backend rechaza y la UI permite elegir otro.

### AC-006 — Double Submission
Given una acción está procesándose
When el usuario hace múltiples clicks
Then no se generan operaciones duplicadas.

### AC-007 — Error Isolation
Given falla una sección
When otras secciones pueden funcionar
Then permanecen disponibles.

### AC-008 — Technical Details
Given ocurre un error técnico
When se muestra al usuario
Then no se exponen stack traces, tokens, secretos ni detalles internos.

### AC-009 — Accessibility
Given aparece un error
When se usa teclado o tecnología asistiva
Then el usuario puede identificarlo y recuperarse.

### AC-010 — Empty vs Error
Given la consulta es exitosa pero no devuelve datos
When se muestra el resultado
Then se presenta un empty state y no un error.

### AC-011 — Logging
Given ocurre un error técnico relevante
When existe logging
Then se registra información diagnóstica sanitizada.

### AC-012 — Authentication
Given la sesión expiró
When una operación requiere autenticación
Then se maneja de forma segura y se ofrece reautenticación.

## 33. Definition of Done

- [ ] Discovery completado.
- [ ] Error taxonomy definida.
- [ ] Arquitectura definida.
- [ ] Approval Gate aprobado.
- [ ] Error normalization implementado.
- [ ] Global Error Boundary revisado/implementado.
- [ ] Route/Page error states implementados.
- [ ] Component-level error states implementados.
- [ ] Loading states revisados.
- [ ] Retry strategy implementada.
- [ ] Double submission protection implementada.
- [ ] Form validation revisada.
- [ ] Booking flow revisado.
- [ ] Race conditions protegidas server-side.
- [ ] Empty/Error states diferenciados.
- [ ] Error pages implementadas.
- [ ] Toast strategy unificada.
- [ ] Logging revisado.
- [ ] Monitoring evaluado.
- [ ] Security review completado.
- [ ] Accessibility revisada.
- [ ] Tests completados.
- [ ] E2E críticos completados.
- [ ] Visual QA completado.
- [ ] Performance revisada.
- [ ] Code Review completado.
- [ ] Sin regresiones.
- [ ] Technical Debt registrada.
- [ ] Final Gate aprobado.

## 34. Agent Instructions

NO implementar inmediatamente.

Primero ejecutar:

Discovery
→ Error Audit
→ Request/API Audit
→ Form/Validation Audit
→ Booking Flow Audit
→ Authentication/Authorization Audit
→ Logging/Monitoring Audit
→ UX Analysis
→ Architecture
→ Implementation Plan
→ Approval Gate

DETENERSE y esperar aprobación.

Durante Discovery:
- inspeccionar el manejo existente;
- reutilizar infraestructura;
- no crear sistemas duplicados;
- identificar errores silenciosos;
- identificar pantallas en blanco;
- identificar loaders infinitos;
- identificar requests duplicadas;
- identificar formularios sin validación;
- identificar operaciones vulnerables a doble envío;
- identificar errores que exponen detalles técnicos.

No inventar endpoints, códigos, métricas ni infraestructura.

Para operaciones críticas, el backend es la autoridad final.

Utilizar TDD para normalización, validación y recuperación cuando corresponda.

Utilizar E2E para flujos críticos.

Utilizar UI/UX Pro Max y el Premium Global Design System para estados visuales.

Utilizar ECC para TDD, Code Review, Security, E2E, Refactor, Build Fix y otras tareas especializadas cuando correspondan.

Implementar en Steps pequeños. Cada Step debe:
1. tener objetivo;
2. tener alcance limitado;
3. incluir tests;
4. mantener el build en verde;
5. verificar UX;
6. evitar tocar módulos no relacionados.

Prioridad:
1. Seguridad.
2. Correctitud.
3. Recuperabilidad.
4. UX.
5. Accessibility.
6. Performance.
7. Estética.

El usuario nunca debería quedar sin saber qué ocurrió ni qué puede hacer a continuación cuando sea posible ofrecer una recuperación.
