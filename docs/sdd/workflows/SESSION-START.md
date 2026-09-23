# 🧠 SDD SESSION START — INICIALIZACIÓN DE SESIÓN

Este documento define el procedimiento obligatorio que el agente debe ejecutar al comenzar una nueva sesión de desarrollo.

> **REGLA CRÍTICA:** Durante esta fase NO debes implementar, modificar, crear ni eliminar archivos. Primero debes comprender el proyecto y su workflow.

## 1. DESCUBRIMIENTO DEL WORKFLOW

Inspecciona y lee completamente:

```text
docs/sdd/workflow/
```

Comprende las reglas reales de:

- workflow general;
- SDD;
- Discovery;
- planificación;
- arquitectura;
- implementación;
- TDD;
- testing;
- Code Review;
- Security Review;
- Refactor/Clean;
- E2E;
- QA;
- Accessibility;
- Performance;
- Definition of Done;
- Approval Gates;
- Final Gates;
- roles de agentes;
- uso de skills;
- documentación y convenciones.

Si existen varios documentos, determina su jerarquía y relación. No inventes reglas.

## 2. SDD MASTER GUIDE

Localiza y lee completamente el **Master Guide de SDD**.

Comprende:

- cómo se crean especificaciones;
- requisitos;
- Discovery;
- arquitectura;
- Implementation Plans;
- Steps;
- Approval Gates;
- validación;
- TDD;
- Code Review;
- Security Review;
- criterios de finalización.

El Master Guide es fuente de verdad. No lo reemplaces por un workflow propio.

## 3. DOCUMENTACIÓN SDD

Inspecciona:

```text
docs/sdd/
```

Lee la documentación relevante sobre:

- arquitectura;
- convenciones;
- decisiones técnicas;
- patrones;
- restricciones;
- estándares;
- reglas de desarrollo.

Si un documento referencia otro documento necesario, inspecciónalo.

## 4. FEATURES

Inspecciona:

```text
docs/features/
```

Identifica:

- features activas;
- completadas;
- pendientes;
- especificaciones;
- dependencias;
- estado de implementación.

No modifiques specs durante esta fase.

Si la tarea corresponde a una feature existente, úsala como fuente de verdad. Si no existe una especificación para una funcionalidad importante, determina si el SDD exige crearla antes de implementar.

## 5. AUDITORÍA DEL PROYECTO

Inspecciona el estado real del proyecto:

- estructura;
- `package.json`;
- scripts;
- framework;
- lenguaje;
- frontend;
- backend;
- base de datos;
- autenticación;
- autorización;
- API;
- servicios;
- routing;
- state management;
- componentes;
- hooks;
- tests;
- E2E;
- lint;
- typecheck;
- build;
- error handling;
- design system;
- dependencias.

No inventes archivos, componentes, APIs, endpoints, colecciones, campos, hooks, servicios, permisos, dependencias ni arquitectura.

## 6. JERARQUÍA DE FUENTES DE VERDAD

Ante conflictos, utiliza:

1. Código y configuración actuales.
2. `docs/sdd/workflow/`.
3. SDD Master Guide.
4. `docs/sdd/`.
5. `docs/features/`.
6. Documentación existente.
7. Suposiciones del agente.

Si hay conflicto, identifícalo y repórtalo. No lo resuelvas silenciosamente.

## 7. APPROVAL GATE — HARD STOP

Los Approval Gates son **HARD STOPS**.

Un plan NO autoriza la implementación completa.

La aprobación es granular por Step:

```text
PLAN
 ↓
APROBACIÓN DEL PLAN
 ↓
STEP 1
 ↓
TESTS + VALIDACIÓN
 ↓
CODE REVIEW
 ↓
REPORTE
 ↓
🛑 HARD STOP
 ↓
APROBACIÓN STEP 1
 ↓
STEP 2
 ↓
TESTS + VALIDACIÓN
 ↓
CODE REVIEW
 ↓
REPORTE
 ↓
🛑 HARD STOP
 ↓
APROBACIÓN STEP 2
 ↓
STEP 3
```

Aprobar STEP 1 solamente autoriza STEP 1.

No autoriza Steps posteriores ni trabajo adicional.

Después de completar cada Step debes detenerte y esperar aprobación explícita.

### Aprobaciones válidas

```text
APPROVED STEP 2
APROBADO STEP 2
CONTINUAR CON STEP 2
```

No interpretes como aprobación:

- ok;
- bien;
- perfecto;
- dale;
- sí;
- comentarios positivos;
- aprobación de un Step anterior;
- aprobación del plan general.

## 8. NO SCOPE CREEP

No amplíes el alcance automáticamente.

Si encuentras bugs, deuda técnica, problemas de arquitectura, performance, seguridad o mejoras visuales no relacionadas:

- documenta el hallazgo;
- NO lo implementes sin autorización explícita.

## 9. TDD

Cuando corresponda, sigue el workflow TDD del proyecto:

```text
RED → TEST FALLA → IMPLEMENTAR → GREEN → REFACTOR → VALIDAR
```

Usa las herramientas y convenciones existentes. No inventes comandos.

## 10. SKILLS Y AGENTES

Usa skills/agentes instalados cuando sean relevantes:

- Planner / Architect;
- TDD;
- Code Reviewer;
- Security;
- E2E;
- Refactor/Clean;
- UI/UX;
- Performance;
- Accessibility.

Antes de usar uno, determina si realmente aplica. Evita capacidades redundantes.

## 11. IMPLEMENTACIÓN

Cuando una implementación sea autorizada:

1. Confirma el alcance del Step.
2. Inspecciona el código relevante.
3. Crea/actualiza tests cuando corresponda.
4. Implementa el cambio mínimo coherente.
5. Ejecuta validaciones.
6. Realiza Code Review.
7. Comprueba regresiones.
8. Comprueba seguridad, accesibilidad y performance cuando corresponda.
9. Reporta el resultado.
10. **DETENTE.**

Nunca continúes silenciosamente al siguiente Step.

## 12. VALIDACIÓN

Usa solamente comandos reales del proyecto.

Consulta `package.json` antes de ejecutar:

- tests;
- typecheck;
- lint;
- build;
- E2E;
- security checks.

Si algo falla:

1. investiga;
2. determina si fue causado por el cambio;
3. corrígelo si está dentro del alcance;
4. si no corresponde, repórtalo.

Nunca ocultes una validación fallida.

## 13. CODE REVIEW

Antes de cerrar un Step revisa:

- correctness;
- arquitectura;
- mantenibilidad;
- duplicación;
- performance;
- accesibilidad;
- seguridad;
- manejo de errores;
- efectos secundarios;
- complejidad;
- regresiones.

Que compile NO significa que esté terminado.

## 14. SECURITY

Cuando corresponda revisa:

- autenticación;
- autorización;
- Firebase Security Rules;
- APIs;
- inputs;
- datos sensibles;
- secretos;
- permisos;
- operaciones destructivas.

Nunca expongas contraseñas, tokens, secretos o credenciales.

## 15. DOCUMENTACIÓN

Mantén la documentación sincronizada cuando el SDD lo requiera.

Si la implementación necesita desviarse de una especificación:

**DETENTE Y REPORTA LA DESVIACIÓN.**

No modifiques silenciosamente la especificación para justificar otra implementación.

## 16. RESPUESTA OBLIGATORIA DE INICIALIZACIÓN

Al terminar la lectura y auditoría:

**NO IMPLEMENTES NADA.**

Responde exactamente con:

# SESSION INITIALIZED

## Workflow Cargado

- Workflow:
- SDD Master Guide:
- Documentación SDD:
- Documentación de Features:

## Contexto del Proyecto

- Framework:
- Lenguaje:
- Arquitectura:
- Base de datos:
- Autenticación:
- Testing:
- E2E:
- Build:
- Lint:
- Typecheck:

## Documentación Activa

Lista los documentos relevantes de:

- SDD;
- features;
- arquitectura;
- workflow.

## Reglas del Workflow Confirmadas

Confirma:

- SDD es obligatorio.
- Approval Gates son obligatorios.
- La aprobación es granular por Step.
- Completar un Step NO autoriza el siguiente.
- Durante la inicialización no se implementa nada.
- No existe scope creep.
- TDD se usa cuando corresponde.
- Las validaciones son obligatorias.
- Code Review es obligatorio.
- Security Review se realiza cuando corresponde.

## Riesgos Actuales

Lista únicamente riesgos realmente descubiertos.

## Preguntas Pendientes

Lista únicamente preguntas que realmente necesiten aclaración.

Si no existen:

```text
No hay preguntas bloqueantes.
```

## Estado

```text
Contexto inicializado. Esperando la tarea.
```

## 17. RESTRICCIONES ABSOLUTAS

Durante la inicialización está PROHIBIDO:

- modificar código;
- crear archivos;
- eliminar archivos;
- instalar dependencias;
- modificar configuración;
- modificar base de datos;
- ejecutar migraciones;
- refactorizar;
- implementar features;
- corregir bugs;
- realizar deploy.

El único objetivo es comprender:

```text
WORKFLOW
+
SDD
+
PROJECT
+
CURRENT STATE
```

Después de entregar `SESSION INITIALIZED`:

**DETENTE y espera la siguiente instrucción del usuario.**
