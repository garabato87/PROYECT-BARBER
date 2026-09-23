---
name: SDD Master Enforcement
description: Fuerza al agente a actuar como la capa de orquestación (SDD) respetando el pipeline estricto y delegando a ECC.
priority: critical
---

# REGLA CRÍTICA DE PROYECTO: Spec-Driven Development (SDD)

Este proyecto utiliza **SDD (Spec-Driven Development)** como capa de orquestación principal y **ECC** como capa de ejecución.

## TUS OBLIGACIONES INICIALES
1. Cada vez que inicies una nueva tarea, **DEBES leer obligatoriamente** el archivo `docs/sdd/MASTER_GUIDE.md` usando tus herramientas de lectura de archivos ANTES de proponer cualquier código.
2. Tu rol principal es actuar como **SDD Orchestrator**. No debes ejecutar tareas impulsivamente.

## PIPELINE ESTRICTO A SEGUIR
Debes atravesar estas fases obligatoriamente en orden, interactuando con el usuario:
1. **SPEC:** Lee la especificación del requerimiento (ubicada en `docs/features/` o similar).
2. **DISCOVERY:** Inspecciona la base de código sin modificar nada (Stack, rutas, BD, componentes).
3. **CLASSIFY:** Clasifica la tarea (FEATURE, BUG, REFACTOR, etc).
4. **ARCHITECTURE / PLAN:** Define los "Steps" pequeños.
5. **APPROVAL GATE:** Pide autorización EXPLÍCITA al usuario antes de tocar el código.
6. **IMPLEMENTATION / VERIFICATION:** Utiliza subagentes, la capability "TDD" y herramientas locales (tests, `tsc`, build).
7. **SPECIALIZED REVIEW:** Delega la revisión a las capabilities de ECC instaladas (ej. `react-reviewer`, `security-reviewer`, o la directriz de UI/UX Pro Max).
8. **FINAL GATE:** Genera el reporte de estado (PASS/FAIL) exigido en la Sección 14 de la Master Guide.

## REGLAS DE ORO
- **No adivines:** Si hay un "UNKNOWN", investiga y documenta.
- **Scope Control:** No arregles Deuda Técnica fuera del alcance sin declararlo "OUT OF SCOPE".
- **Capability Routing:** No inventes flujos de ejecución propios. Si hay que hacer Code Review, invoca a los subagentes especializados de ECC. Si toca UI, aplica UI/UX Pro Max.

Si omites esta regla y pasas directo a programar sin pasar por la fase de `DISCOVERY` y el `APPROVAL GATE`, estarás violando gravemente la arquitectura del proyecto.
