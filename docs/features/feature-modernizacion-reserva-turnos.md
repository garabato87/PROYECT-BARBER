# Feature Specification — Modernización de la página de reserva de turnos

## Metadata
- Type: UI/UX + FEATURE
- Priority: High
- Status: Draft
- Area: Booking / Turnos

## 1. Objective

Modernizar visualmente la página de reserva de turnos de la barbería, manteniendo la lógica funcional existente y mejorando claridad, jerarquía visual, usabilidad, responsive design y percepción del producto.

El flujo debe seguir siendo:

Barbería → Servicio → Profesional → Fecha → Hora → Confirmación

La implementación visual final debe surgir de un análisis de la interfaz actual mediante UI/UX Pro Max. Este documento define el objetivo y requisitos, no un diseño cerrado.

## 2. Problem

La página actual necesita una modernización. El usuario debe entender en todo momento:
- en qué paso está;
- qué seleccionó;
- qué opciones puede elegir;
- qué opciones no están disponibles;
- qué falta para confirmar.

La experiencia debe sentirse como un proceso guiado y no como un formulario largo.

## 3. Scope

### In Scope
- Rediseño visual de la página.
- Layout, tipografía, espaciado y jerarquía visual.
- Indicador de progreso.
- Presentación de barberías, servicios y profesionales.
- Selector de fecha y horarios.
- Estados selected / disabled / loading / empty / error.
- Resumen previo a la confirmación.
- Responsive mobile/tablet/desktop.
- Accesibilidad.
- Feedback de interacción.
- Mantener la lógica de negocio existente.

### Out of Scope
- Cambiar reglas de disponibilidad.
- Cambiar precios.
- Cambiar autenticación.
- Cambiar base de datos.
- Crear funcionalidades administrativas.
- Cambiar notificaciones.
- Cambiar APIs salvo que sea estrictamente necesario para soportar la UI.

Cualquier desviación debe reportarse antes de implementarse.

## 4. Existing Flow

Debe preservarse:

1. Seleccionar barbería.
2. Seleccionar servicio.
3. Seleccionar profesional.
4. Seleccionar fecha.
5. Seleccionar horario.
6. Confirmar turno.

Durante Discovery, el agente debe localizar la implementación real de cada etapa antes de modificarla.

## 5. UX Requirements

La nueva UI debe:
- mostrar claramente el paso actual y progreso;
- permitir volver atrás cuando sea seguro;
- mostrar feedback inmediato después de cada selección;
- diferenciar opciones disponibles/no disponibles;
- mantener visible o fácilmente accesible el resumen;
- hacer evidente la acción principal;
- priorizar la experiencia mobile;
- evitar decisiones simultáneas innecesarias.

## 6. UI Requirements

### Step Indicator
Mostrar:
- paso actual;
- pasos completados;
- pasos pendientes.

En mobile puede utilizarse una versión compacta.

### Barbería
Presentar las barberías de forma clara y seleccionable. Usar únicamente información que ya exista en el sistema.

### Servicio
Mostrar la información disponible actualmente, por ejemplo nombre, precio, duración o descripción. No inventar datos.

### Profesional
Presentación consistente. Si existen fotos/avatars, reutilizarlos; si no, usar un fallback apropiado.

### Fecha
Debe:
- indicar claramente la fecha seleccionada;
- diferenciar fechas disponibles/no disponibles;
- impedir selecciones inválidas;
- funcionar bien en mobile;
- respetar las reglas actuales de disponibilidad.

### Horarios
Presentar los horarios de forma fácil de escanear y diferenciar:
- disponible;
- seleccionado;
- no disponible;
- loading.

### Confirmación
Mostrar antes de confirmar:

- Barbería
- Servicio
- Profesional
- Fecha
- Hora

La acción de confirmar debe tener una jerarquía visual clara.

## 7. Responsive

Debe funcionar correctamente en:
- mobile;
- tablet;
- desktop.

Evitar overflow horizontal, targets táctiles pequeños, texto ilegible, calendarios inutilizables y necesidad de zoom.

## 8. Accessibility

Verificar:
- contraste;
- foco visible;
- navegación por teclado;
- labels accesibles;
- estados disabled comprensibles;
- feedback de errores;
- targets táctiles adecuados;
- semántica apropiada.

No depender solamente del color para comunicar estados.

## 9. States

Implementar/verificar cuando corresponda:

Loading:
- carga de barberías;
- servicios;
- profesionales;
- disponibilidad.

Empty:
- sin barberías;
- sin servicios;
- sin profesionales;
- sin fechas;
- sin horarios.

Error:
- error de carga;
- error de confirmación.

Los mensajes deben ser comprensibles y no exponer detalles técnicos innecesarios.

## 10. Business Rules

Las reglas existentes deben permanecer intactas.

Durante Discovery identificar:
- cómo se determina disponibilidad;
- dependencias entre barbería, servicio y profesional;
- obtención de fechas;
- obtención de horarios;
- validación de reserva;
- comportamiento si un horario deja de estar disponible;
- comportamiento ante errores o expiración de sesión.

No asumir estas reglas.

## 11. Technical Constraints

- Reutilizar componentes existentes cuando sea razonable.
- Mantener arquitectura actual.
- Evitar dependencias nuevas sin justificación.
- No duplicar lógica.
- No modificar backend innecesariamente.
- Respetar convenciones existentes.

## 12. UI/UX Process

Esta feature requiere UI/UX Pro Max.

Antes de implementar:

1. Inspeccionar la interfaz actual.
2. Identificar problemas de UX/UI.
3. Identificar componentes reutilizables.
4. Analizar el design system existente.
5. Proponer dirección visual.
6. Evaluar responsive y accesibilidad.
7. Presentar las decisiones relevantes dentro del plan.
8. Esperar Approval Gate.

No comenzar modificando componentes directamente.

## 13. Discovery

Localizar y documentar:
- página principal;
- componentes;
- estado del wizard;
- APIs/endpoints;
- consultas;
- lógica de disponibilidad;
- calendario;
- horarios;
- confirmación;
- estilos/design system;
- tests existentes.

## 14. Acceptance Criteria

### AC-001 — Flujo
Given el usuario inicia una reserva
When completa el proceso
Then puede realizar Barbería → Servicio → Profesional → Fecha → Hora → Confirmación.

### AC-002 — Progreso
Given el usuario está reservando
When avanza
Then identifica claramente el paso actual y progreso.

### AC-003 — Selección
Given selecciona una opción
When la selección se realiza
Then la UI la representa claramente.

### AC-004 — Disponibilidad
Given existen opciones no disponibles
When las visualiza
Then puede diferenciarlas y no seleccionarlas de forma inválida.

### AC-005 — Resumen
Given llegó al paso final
When revisa el turno
Then ve barbería, servicio, profesional, fecha y hora.

### AC-006 — Confirmación
Given los datos son válidos
When confirma
Then se utiliza el mecanismo actual de confirmación y se muestra el resultado.

### AC-007 — Errores
Given ocurre un error
When el sistema lo recibe
Then muestra feedback comprensible y permite recuperarse cuando sea posible.

### AC-008 — Responsive
Given utiliza mobile, tablet o desktop
When completa el flujo
Then la interfaz permanece usable sin problemas de layout.

### AC-009 — Accessibility
Given utiliza teclado o tecnologías asistivas compatibles
When navega
Then los elementos, estados y errores son comprensibles y utilizables.

### AC-010 — Regression
Given la UI fue modernizada
When realiza una reserva válida
Then el comportamiento funcional existente continúa funcionando.

## 15. Testing

Priorizar:
- component/unit tests para estados y selección;
- integration tests para el flujo;
- E2E si existe infraestructura.

E2E recomendado:
Barbería → Servicio → Profesional → Fecha → Hora → Confirmar

También cubrir errores y disponibilidad cuando corresponda.

## 16. Performance

Evitar:
- renders innecesarios;
- requests duplicadas;
- assets excesivamente pesados;
- animaciones costosas;
- dependencias innecesarias.

## 17. Security

Verificar que la nueva UI no permita:
- confirmar turnos inválidos;
- acceder a datos no autorizados manipulando IDs;
- saltarse validaciones;
- confirmar horarios no disponibles.

La validación definitiva debe continuar en el backend cuando corresponda.

## 18. Definition of Done

- [ ] Discovery completado.
- [ ] Arquitectura actual documentada.
- [ ] Dirección UI/UX definida.
- [ ] Plan aprobado.
- [ ] Componentes modificados siguiendo patrones existentes.
- [ ] Tests implementados cuando corresponda.
- [ ] Flujo completo funcionando.
- [ ] Acceptance Criteria satisfechos.
- [ ] Responsive verificado.
- [ ] Accessibility verificada.
- [ ] Loading/empty/error states verificados.
- [ ] E2E ejecutado cuando corresponda.
- [ ] Code Review completado.
- [ ] Security Review completado cuando corresponda.
- [ ] Sin regresiones.
- [ ] Technical Debt registrada.
- [ ] Final Gate aprobado.

## 19. Agent Instructions

No implementar directamente desde esta Specification.

Primero ejecutar:

Discovery → UI/UX Analysis → Architecture → Planning → Approval Gate

Después de aprobación:

TDD → Implementation → Verification → UI/UX Review → Code Review → E2E/Security cuando corresponda → Final Gate

Reutilizar las capabilities existentes de ECC y UI/UX Pro Max. No crear workflows paralelos si ya existe una capability adecuada.

Si una decisión de diseño puede cambiar significativamente la UX, presentarla antes de implementarla.
