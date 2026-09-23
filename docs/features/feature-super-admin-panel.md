# Feature Specification — Super Admin Pro

## Metadata

- Type: FEATURE + UI/UX + ADMIN PLATFORM
- Priority: High
- Status: Draft
- Area: Super Admin
- Primary Capability: UI/UX Pro Max
- Supporting Capabilities: Architecture, TDD, E2E, Code Review, Security, Refactor, Performance

## 1. Objective

Transformar el actual Panel Super Admin en un centro de control profesional para administrar y supervisar toda la plataforma de gestión de barberías.

El panel debe permitir al Super Admin:

- entender rápidamente el estado global de la plataforma;
- administrar locales/barberías;
- administrar usuarios;
- supervisar suscripciones;
- analizar actividad y métricas;
- detectar problemas;
- recibir alertas;
- consultar actividad administrativa;
- realizar acciones administrativas de forma segura;
- acceder rápidamente a cualquier entidad;
- trabajar cómodamente desde desktop, tablet y mobile.

La experiencia debe sentirse como un verdadero SaaS Admin Platform moderno y premium, no como un CRUD tradicional.

## 2. Current State

Actualmente existe un Panel Super Admin con:

- Resumen Global;
- Usuarios;
- Suscripciones;
- Reportes;
- contador de locales;
- suscripciones activas;
- suscripciones inactivas/vencidas;
- usuarios registrados;
- listado de locales;
- búsqueda de locales;
- responsable;
- vencimiento;
- estado;
- acciones;
- tipos de negocio;
- estado del sistema;
- perfil del Super Admin;
- cierre de sesión.

La nueva implementación debe evolucionar esta base, no reemplazar funcionalidades existentes sin justificación.

## 3. Product Vision

El Super Admin debería poder entrar al panel y responder rápidamente:

> ¿Cómo está funcionando toda la plataforma?

Y también:

> ¿Hay algo que requiera mi atención?

Y finalmente:

> ¿Puedo solucionar o investigar ese problema desde aquí?

La información importante debe estar disponible con pocos pasos.

## 4. Core Modules

### 4.1 Dashboard / Resumen Global

Mantener y ampliar el dashboard actual.

#### KPIs principales

Considerar:

- total de locales;
- locales activos;
- locales suspendidos;
- locales nuevos;
- usuarios registrados;
- usuarios activos;
- suscripciones activas;
- suscripciones por vencer;
- suscripciones vencidas;
- ingresos/recaudación si existe información de pagos;
- crecimiento mensual;
- actividad reciente.

No crear métricas que no puedan calcularse correctamente con los datos disponibles.

#### Comparación temporal

Cuando exista información suficiente:

- hoy vs período anterior;
- mes actual vs mes anterior;
- crecimiento porcentual;
- tendencia.

#### Gráficos

Considerar:

- crecimiento de locales;
- crecimiento de usuarios;
- suscripciones;
- altas/bajas;
- distribución por tipo de negocio;
- actividad de la plataforma.

Los gráficos deben ser útiles para tomar decisiones y no decoración.

#### Actividad reciente

Mostrar eventos importantes:

- nuevo local;
- nuevo usuario;
- suscripción creada;
- suscripción próxima a vencer;
- suspensión;
- reactivación;
- cambios administrativos relevantes.

## 5. Global Search

Agregar búsqueda global.

Debe permitir encontrar rápidamente:

- locales;
- usuarios;
- suscripciones.

Cuando sea posible, soportar nombre, email, DNI/identificador, teléfono, ID y otros identificadores existentes.

La búsqueda debe ofrecer resultados agrupados por entidad.

## 6. Locales / Barberías

Convertir la sección de locales en un centro de administración completo.

### Listado

Permitir:

- búsqueda;
- filtros;
- ordenamiento;
- paginación;
- selección múltiple cuando sea seguro;
- acciones;
- exportación cuando corresponda.

### Filtros

Considerar:

- estado;
- tipo de negocio;
- suscripción;
- fecha de creación;
- fecha de vencimiento.

### Vista de detalle

Al seleccionar un local, mostrar cuando los datos existan:

- información general;
- suscripción;
- actividad;
- estadísticas relevantes.

## 7. Gestión de estados de locales

Permitir acciones seguras:

- activar;
- suspender;
- reactivar.

Las acciones destructivas o sensibles deben requerir confirmación y explicar consecuencias.

## 8. Usuarios

Crear un módulo completo de usuarios.

Mostrar métricas de total, activos, nuevos, usuarios por local y usuarios por rol cuando existan esos datos.

El listado debe permitir búsqueda, filtros, ordenamiento y paginación.

La vista de detalle debe mostrar, según permisos y datos disponibles:

- información básica;
- local asociado;
- rol;
- estado;
- fecha de registro;
- última actividad cuando exista.

No mostrar información sensible innecesaria.

## 9. Gestión de usuarios

Cuando el modelo de permisos lo permita:

- activar/desactivar;
- modificar rol;
- reasignar local;
- revisar actividad.

Las acciones sensibles deben estar protegidas por permisos y confirmación.

## 10. Suscripciones

Convertir la sección actual en un centro de gestión de suscripciones.

### Métricas

Mostrar, cuando exista la información:

- activas;
- próximas a vencer;
- vencidas;
- suspendidas;
- crecimiento;
- distribución por plan.

### Listado

Permitir búsqueda, filtros, ordenamiento y paginación.

### Filtros

- estado;
- plan;
- local;
- vencimiento.

### Alertas

Detectar suscripciones próximas a vencer, vencidas, posibles anomalías y estados inconsistentes cuando puedan determinarse correctamente.

## 11. Reportes y Analytics

Evolucionar "Reportes" hacia un módulo de análisis.

Considerar, si los datos están disponibles:

- crecimiento de locales;
- crecimiento de usuarios;
- evolución de suscripciones;
- distribución de negocios;
- actividad de usuarios;
- turnos de la plataforma;
- métricas de utilización;
- retención;
- locales activos/inactivos.

Permitir períodos de hoy, 7 días, 30 días, 90 días y período personalizado cuando corresponda.

## 12. Alert Center

Agregar un centro de alertas para:

- suscripciones por vencer;
- suscripciones vencidas;
- locales suspendidos;
- errores del sistema;
- actividad administrativa importante;
- anomalías de datos.

Prioridades:

- info;
- warning;
- critical.

El usuario debe poder ver, abrir, marcar como leída y acceder al contexto relacionado.

## 13. Notification Center

Agregar centro de notificaciones para eventos administrativos.

Diferenciar nuevas y leídas. Las notificaciones importantes deben enlazar con la entidad correspondiente.

## 14. Audit Log

Agregar registro de auditoría para acciones administrativas importantes:

- login;
- logout;
- creación;
- edición;
- suspensión;
- activación;
- cambios de permisos;
- cambios de suscripción;
- acciones masivas.

Cada evento debería contener, cuando sea posible:

- fecha/hora;
- actor;
- acción;
- entidad;
- resultado;
- contexto relevante.

No registrar secretos, contraseñas, tokens ni información sensible innecesaria.

## 15. System Health

Evolucionar "Estado del sistema" para mostrar información útil y real:

- estado de servicios;
- errores recientes;
- disponibilidad;
- estado de integraciones;
- operaciones fallidas;
- latencia si existe infraestructura para medirla.

No simular métricas. Si una métrica no existe actualmente, documentar que requiere infraestructura.

## 16. Quick Actions

Agregar acciones rápidas como:

- crear local;
- buscar usuario;
- revisar suscripciones;
- ver alertas;
- abrir reportes;
- revisar auditoría.

Adaptarlas a las capacidades reales del sistema.

## 17. Command Palette

Considerar una Command Palette accesible desde teclado, por ejemplo Ctrl/Cmd + K.

Acciones posibles:

- buscar local;
- buscar usuario;
- ir a suscripciones;
- abrir reportes;
- abrir auditoría;
- abrir configuración.

Implementarla sólo si encaja con la arquitectura existente.

## 18. Global Filters

Cuando tenga sentido, permitir filtros persistentes para período, estado, local y plan.

El comportamiento debe ser predecible y no generar requests innecesarios.

## 19. Bulk Actions

Permitir acciones múltiples sólo donde sean seguras.

Toda operación masiva sensible debe:

1. mostrar cantidad afectada;
2. explicar consecuencias;
3. pedir confirmación;
4. registrar la acción en Audit Log.

## 20. Data Tables

Las tablas administrativas deben tener experiencia profesional:

- sticky header;
- ordenamiento;
- filtros;
- paginación;
- columnas configurables cuando sea útil;
- loading/skeleton;
- empty state;
- error state;
- responsive behavior.

En mobile, transformar tablas en cards, rows adaptativas o detalles expandibles cuando sea más usable.

## 21. Detail Drawer / Detail View

Cuando sea apropiado, utilizar drawer o vista de detalle para investigar entidades sin perder el contexto de la lista.

No utilizar drawers para información excesivamente compleja.

## 22. Dashboard Personalization

Considerar widgets reordenables y preferencias del dashboard como funcionalidad secundaria.

No implementarla si agrega complejidad desproporcionada.

## 23. Admin Settings

Considerar configuración para:

- preferencias de dashboard;
- preferencias de notificaciones;
- configuración de alertas;
- apariencia si el sistema lo permite.

No permitir modificar configuraciones críticas sin un modelo de seguridad apropiado.

## 24. Security

Este módulo posee privilegios elevados.

Aplicar:

- autorización server-side;
- protección de acciones sensibles;
- validación de permisos;
- confirmación de acciones críticas;
- audit logging;
- protección contra acciones repetidas;
- validación de IDs;
- manejo seguro de errores.

La UI nunca debe ser considerada la única capa de seguridad.

La autorización real debe existir en backend cuando corresponda.

## 25. UX / UI

La implementación debe integrarse con el sistema visual premium definido por `premium-global-design-system.md`.

No crear un segundo lenguaje visual.

Utilizar:

- design tokens;
- componentes reutilizables;
- motion system;
- responsive system;
- accessibility rules.

La interfaz debe sentirse como un producto SaaS premium.

## 26. Motion

Utilizar movimiento para navegación, drawers, filtros, cambios de estado, feedback, charts, notifications, loaders y acciones importantes cuando aporte valor.

Evitar animaciones excesivas o que dificulten el trabajo administrativo.

## 27. Responsive

El panel debe ser usable en:

- small mobile;
- mobile;
- tablet;
- laptop;
- desktop;
- large desktop.

Desktop puede utilizar layouts más densos. Mobile debe priorizar navegación, búsqueda, acciones, información crítica, cards y drawers/bottom sheets cuando corresponda.

No simplemente reducir el desktop.

## 28. Accessibility

Verificar keyboard navigation, focus, contraste, semantic HTML, ARIA, screen readers, touch targets, estados, errores y reduced motion.

## 29. Performance

Evitar múltiples requests duplicadas, datasets completos innecesarios, gráficos pesados, renders innecesarios y polling agresivo.

Si existen grandes volúmenes de datos, considerar paginación, server-side filtering, agregaciones y lazy loading.

## 30. Discovery

Antes de implementar, inspeccionar:

- panel actual;
- rutas;
- componentes;
- servicios;
- hooks;
- APIs;
- modelos;
- Firestore/DB si corresponde;
- autenticación;
- autorización;
- roles;
- suscripciones;
- usuarios;
- locales;
- reportes;
- tests;
- E2E;
- design system.

Identificar qué funcionalidades ya existen y cuáles requieren backend.

## 31. Architecture Gate

Antes de implementar, documentar:

- arquitectura actual;
- módulos existentes;
- módulos nuevos;
- dependencias;
- queries;
- endpoints;
- permisos;
- componentes reutilizables;
- estrategia responsive;
- estrategia de datos;
- estrategia de auditoría;
- estrategia de alertas.

No implementar cambios de backend automáticamente sin justificar su necesidad.

## 32. Recommended Implementation Order

El agente debe evaluar esta propuesta después de Discovery:

### Phase 1 — Audit
Auditar panel actual y modelo de datos.

### Phase 2 — Admin Foundation
- layout;
- navegación;
- permissions;
- shared components;
- tables;
- filters;
- search.

### Phase 3 — Dashboard
- KPIs;
- activity;
- charts;
- alerts;
- system health.

### Phase 4 — Local Management
- listado;
- filtros;
- detalle;
- acciones.

### Phase 5 — User Management
- listado;
- filtros;
- detalle;
- acciones.

### Phase 6 — Subscription Management
- métricas;
- listado;
- detalle;
- alertas.

### Phase 7 — Reports
- analytics;
- filters;
- export.

### Phase 8 — Audit & Notifications
- audit log;
- notification center;
- alert center.

### Phase 9 — Advanced UX
- command palette;
- quick actions;
- detail drawers;
- personalization si corresponde.

### Phase 10 — QA
- TDD;
- integration;
- E2E;
- security;
- accessibility;
- performance;
- responsive;
- visual QA.

El agente puede modificar esta estrategia después de Discovery.

## 33. Acceptance Criteria

### AC-001 — Dashboard
Given el Super Admin entra al sistema
When abre el dashboard
Then puede comprender rápidamente el estado general de la plataforma.

### AC-002 — Locales
Given existen múltiples locales
When el Super Admin utiliza la sección de locales
Then puede buscar, filtrar, ordenar y consultar información relevante.

### AC-003 — Usuarios
Given existen usuarios
When el Super Admin accede a usuarios
Then puede buscarlos y consultar su información según sus permisos.

### AC-004 — Suscripciones
Given existen suscripciones
When el Super Admin abre suscripciones
Then puede identificar activas, próximas a vencer y vencidas.

### AC-005 — Alertas
Given existe una situación que requiere atención
When el sistema la detecta
Then el Super Admin puede identificarla mediante el sistema de alertas.

### AC-006 — Auditoría
Given un administrador realiza una acción crítica
When la acción se completa
Then queda registrada en el Audit Log cuando corresponda.

### AC-007 — Seguridad
Given el usuario intenta realizar una acción no autorizada
When el sistema procesa la operación
Then la operación es rechazada por la capa de autorización correspondiente.

### AC-008 — Responsive
Given el Super Admin utiliza diferentes dispositivos
When utiliza las funciones principales
Then la interfaz permanece usable.

### AC-009 — Performance
Given el sistema contiene múltiples entidades
When el Super Admin navega
Then el panel evita cargas y consultas innecesarias.

### AC-010 — Functional Regression
Given existen funcionalidades actuales
When se moderniza el panel
Then las funcionalidades existentes continúan funcionando correctamente.

### AC-011 — Design System
Given el sistema utiliza un design system global
When se implementa el nuevo panel
Then utiliza los mismos tokens y componentes sin crear un lenguaje visual paralelo.

### AC-012 — Critical Actions
Given una acción puede afectar datos o acceso
When el Super Admin intenta ejecutarla
Then recibe confirmación y feedback apropiado.

## 34. Definition of Done

- [ ] Discovery completado.
- [ ] Auditoría del panel actual completada.
- [ ] Modelo de permisos documentado.
- [ ] Modelo de datos documentado.
- [ ] Architecture Plan aprobado.
- [ ] UX/UI Direction aprobada.
- [ ] Implementation Plan aprobado.
- [ ] Approval Gate aprobado.
- [ ] Dashboard implementado.
- [ ] Local management implementado.
- [ ] User management implementado.
- [ ] Subscription management implementado.
- [ ] Reports implementados cuando los datos estén disponibles.
- [ ] Alert Center implementado.
- [ ] Notification Center implementado cuando corresponda.
- [ ] Audit Log implementado.
- [ ] System Health implementado con datos reales.
- [ ] Global Search implementado.
- [ ] Quick Actions implementadas.
- [ ] Bulk Actions implementadas sólo donde sean seguras.
- [ ] Responsive completado.
- [ ] Accessibility completada.
- [ ] Reduced Motion soportado.
- [ ] Performance revisada.
- [ ] Security Review completado.
- [ ] Code Review completado.
- [ ] Integration tests completados.
- [ ] E2E completado cuando corresponda.
- [ ] Visual QA completado.
- [ ] Sin regresiones.
- [ ] Technical Debt registrada.
- [ ] Final Gate aprobado.

## 35. Agent Instructions

NO implementar inmediatamente.

Esta es una feature grande.

Primero ejecutar:

Discovery
→ Current Admin Audit
→ Data/Backend Audit
→ Permission Audit
→ UX/UI Analysis
→ Architecture
→ Feature Prioritization
→ Migration Strategy
→ Implementation Plan
→ Approval Gate

DETENERSE.

Esperar aprobación.

Durante Discovery:

- inspeccionar el código existente;
- reutilizar funcionalidades existentes;
- no inventar datos;
- no inventar endpoints;
- no inventar métricas;
- identificar qué requiere backend;
- identificar qué puede resolverse sólo en frontend;
- identificar riesgos de seguridad.

Utilizar UI/UX Pro Max para la experiencia visual.

Utilizar el Design System global existente.

Utilizar ECC y las skills disponibles para TDD, Code Review, Security, E2E, Refactor, Build Fix y otras tareas especializadas.

Después del Approval Gate:

Implementar en Steps pequeños.

Cada Step debe:

1. tener objetivo;
2. tener alcance limitado;
3. utilizar TDD cuando corresponda;
4. verificar funcionalidad;
5. ejecutar tests;
6. revisar cambios;
7. evitar tocar módulos no relacionados.

No ejecutar toda la feature en una sola operación.

Prioridad:

1. Seguridad.
2. Correctitud de datos.
3. UX.
4. Usabilidad.
5. Consistencia.
6. Responsive.
7. Accessibility.
8. Performance.
9. Estética.

El panel debe sentirse "super pro", pero la sofisticación nunca debe comprometer seguridad, claridad, rendimiento o confiabilidad.
