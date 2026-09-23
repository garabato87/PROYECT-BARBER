# Feature: Admin & Professional Enhancements

## Objetivo
Actualizar el sistema para:
1. Reemplazar datos mock del dashboard admin por datos reales.
2. Permitir subir/cambiar foto de perfil mediante archivo para clientes, profesionales, admins y superadmins.
3. Eliminar emojis de los filtros de servicios del panel cliente.
4. Permitir que admin/owner también actúe como profesional.
5. Permitir que profesionales creen turnos manualmente.
6. Agregar historial de cortes/servicios al dashboard profesional.

## Discovery obligatorio
Antes de modificar código, inspeccionar arquitectura, package.json, scripts, autenticación/autorización, roles, modelos/types, Firestore/DB, Storage, dashboard, flujo de turnos, tests, E2E y design system. No asumir estructuras inexistentes.

## 1. Dashboard admin con datos reales
Reemplazar datos mock por consultas reales. Adaptar las métricas a las entidades existentes, por ejemplo usuarios, clientes, profesionales, turnos, servicios y estados. No hardcodear números ni mostrar métricas que no puedan calcularse correctamente. Implementar loading, empty y error states y evitar consultas innecesarias.

## 2. Foto de perfil mediante archivo
Todos los roles deben poder seleccionar una imagen desde el dispositivo, previsualizarla, confirmar/cancelar y ver estados de carga/error. Validar formato, tamaño y tipo real del archivo; la validación de seguridad no debe depender solo del frontend. Usar el Storage existente. Proteger paths/permisos para impedir modificar fotos ajenas. Guardar en DB solo la referencia necesaria (URL/path), no el binario.

## 3. Filtros de servicios
Eliminar emojis de los filtros/botones del panel cliente y reemplazarlos por iconos del design system existente. No agregar una librería nueva si ya existe una. Mantener la lógica actual y accesibilidad/responsive.

## 4. Admin/Owner como profesional
Permitir que admin/owner tenga perfil profesional, servicios, disponibilidad, turnos e historial cuando corresponda. No reemplazar simplemente el rol admin por professional si eso elimina permisos administrativos. Usar capacidades múltiples si la arquitectura lo permite.

## 5. Turnos manuales por profesionales
El profesional debe poder crear manualmente un turno indicando cliente, servicio, fecha y hora. Si crea para sí mismo, puede quedar preseleccionado. Validar server-side cliente, servicio, profesional, fecha/hora, disponibilidad, conflictos y permisos. El frontend no debe ser la única capa de autorización.

## 6. Historial profesional
Agregar una sección con los servicios/cortes realizados por el profesional. Mostrar, según datos existentes: fecha, cliente, servicio, precio, estado, duración y observaciones. Agregar filtros/paginación cuando sea necesario. Contemplar loading, empty, error y responsive.

## Seguridad y permisos
Cliente: modificar su propio perfil.
Profesional: modificar perfil, gestionar disponibilidad si corresponde, crear sus turnos y consultar sus datos/historial.
Admin/Owner: conservar administración y poder actuar como profesional cuando esté habilitado.
Superadmin: conservar permisos globales.
Toda operación sensible debe estar protegida por backend, reglas o capa de autorización correspondiente.

## Plan SDD y Approval Gates

### STEP 1 — Discovery & Architecture
Analizar arquitectura, roles, DB, Storage, dashboard, turnos y tests; definir solución.
**STOP. No implementar. Esperar `APPROVED STEP 1`.**

### STEP 2 — Admin Dashboard Real Data
Eliminar mocks, implementar consultas/métricas reales, estados y tests.
**STOP. Esperar `APPROVED STEP 2`.**

### STEP 3 — Profile Image Upload
Implementar upload, preview, validaciones, Storage, actualización de perfil, seguridad y tests.
**STOP. Esperar `APPROVED STEP 3`.**

### STEP 4 — Client Service Filters
Eliminar emojis, usar iconos existentes, mantener comportamiento y accesibilidad.
**STOP. Esperar `APPROVED STEP 4`.**

### STEP 5 — Admin as Professional
Adaptar roles/capabilities sin perder permisos administrativos; habilitar servicios, disponibilidad, turnos e historial.
**STOP. Esperar `APPROVED STEP 5`.**

### STEP 6 — Manual Appointment Creation
UI, cliente/servicio/fecha/hora, validaciones, conflictos, autorización y tests.
**STOP. Esperar `APPROVED STEP 6`.**

### STEP 7 — Professional Cut History
Historial, filtros/paginación, estados y tests.
**STOP. Esperar `APPROVED STEP 7`.**

### STEP 8 — Final QA
Unit/integration/E2E si existen, lint, typecheck, build, security review, code review y accessibility review.
**STOP. Esperar `APPROVED STEP 8`.**

## TDD
Cuando corresponda: test que falla -> implementación -> test verde -> refactor -> volver a validar. No modificar tests solo para hacerlos pasar.

## Definition of Done
- Dashboard con datos reales y sin mocks en producción.
- Upload de avatar seguro para todos los roles.
- Emojis eliminados de filtros.
- Admin/owner puede actuar como profesional sin perder permisos.
- Profesionales pueden crear turnos manuales con prevención de conflictos.
- Historial profesional funcionando.
- Permisos protegidos.
- Responsive correcto.
- Tests, lint, typecheck y build pasan.
- Security/code/accessibility review completados.
- Sin cambios fuera del alcance.

## Regla final
El agente debe leer `docs/workflow/`, el SDD Master Guide y este feature antes de trabajar. Solo puede ejecutar el STEP explícitamente aprobado. Debe detenerse al terminar cada STEP y nunca avanzar automáticamente.

Autorizaciones válidas:
`APPROVED STEP X`
`APROBADO STEP X`
`CONTINUAR CON STEP X`

Cualquier otra instrucción no autoriza avanzar al siguiente step.
