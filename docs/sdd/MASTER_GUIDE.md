# SDD Master Guide — ECC Compatible

## 1. Purpose

Define el proceso Spec-Driven Development del proyecto.

SDD es la capa de orquestación. ECC y otras skills instaladas son la capa de ejecución especializada.

## 2. Responsibility Boundaries

### SDD

Responsable de:
- validar Specification;
- decidir cuándo investigar;
- Discovery;
- coordinar Planner / Architect;
- definir Steps;
- establecer Gates;
- decidir capacidades especializadas;
- controlar scope;
- exigir evidencia;
- coordinar cierre.

### ECC / Specialized Skills

Ejecutan tareas especializadas como:
- TDD;
- code review;
- security review;
- E2E;
- build fixes;
- refactoring;
- investigación;
- performance;
- documentación.

### Project Rules

Las reglas específicas del proyecto tienen prioridad cuando sean compatibles con este proceso.

## 3. Pipeline

```text
SPEC
 ↓
DISCOVERY
 ↓
CLASSIFY
 ↓
ARCHITECTURE
 ↓
PLAN
 ↓
APPROVAL GATE
 ↓
IMPLEMENTATION
 ↓
VERIFICATION
 ↓
SPECIALIZED REVIEW
 ↓
FINAL GATE
```

No todas las fases especializadas son obligatorias.

## 4. Specification First

La Specification es la fuente de verdad sobre comportamiento y alcance.

Debe definir, según corresponda:
- Objective;
- Why;
- Actors;
- Scope;
- Out of Scope;
- Functional Requirements;
- Business Rules;
- Acceptance Criteria;
- Edge Cases;
- Error Handling;
- Security;
- UX;
- Constraints;
- Dependencies;
- Unknowns.

Nunca inventar requisitos críticos.

## 5. Discovery

Antes de modificar código, inspeccionar:
- stack;
- arquitectura;
- package manager;
- scripts;
- módulos;
- rutas;
- API;
- database;
- auth;
- componentes;
- estilos;
- tests;
- dependencias;
- documentación.

Output:

```text
Context
Relevant Files
Existing Patterns
Reusable Components
Risks
Unknowns
Technical Debt
Recommended Capabilities
```

No modificar código.

## 6. Classification

Clasificar:
FEATURE / BUG / REFACTOR / PERFORMANCE / SECURITY / UI/UX / ARCHITECTURE

Bug:

```text
Reproduce → Root Cause → Regression Test → Fix → Verify → Review
```

Feature:

```text
Discovery → Architecture → Plan → TDD → Implementation → Verify → Review
```

Refactor:

```text
Discovery → Characterization Tests → Refactor → Verify → Review
```

## 7. Capability Routing

Inspeccionar las capabilities realmente instaladas. No asumir nombres exactos.

Ejemplos conceptuales:
- TDD → ECC tdd workflow / skill;
- Code Review → ECC code-review;
- Security → ECC security workflow / skill;
- Build Error → ECC build-fix;
- Refactor → ECC refactor-clean;
- E2E → capability E2E instalada;
- UI/UX → UI/UX Pro Max;
- Planning → ECC planner / architect;
- Research → ECC researcher.

No crear un reemplazo si ya existe una capability adecuada.

## 8. UI/UX Pro Max

Activar cuando afecte interfaces, layouts, componentes, responsive design, accesibilidad, jerarquía visual, design systems o UX flows.

## 9. TDD

Cuando exista comportamiento verificable, preferir:

```text
RED → GREEN → REFACTOR → VERIFY
```

Seguir la capability TDD instalada.

## 10. Implementation Steps

Cada Step:

```text
Objective
Files
Changes
Dependencies
Tests
Acceptance Criteria
Risks
Definition of Done
```

Un Step debe ser pequeño.

## 11. Verification

Usar comandos reales del proyecto:
- tests;
- typecheck;
- lint;
- build;
- integration;
- E2E;
- performance.

No asumir que un comando existe.

## 12. Review

Usar la capability de Code Review disponible, preferentemente ECC si está instalada.

Revisar:
- correctness;
- architecture;
- maintainability;
- security;
- performance;
- error handling;
- testing;
- complexity;
- duplication.

Severidad:

```text
CRITICAL / HIGH / MEDIUM / LOW / NIT
```

Resolver CRITICAL/HIGH antes del cierre o documentar explícitamente la excepción.

## 13. Security

Activar para authentication, authorization, usuarios, permisos, APIs, datos sensibles, archivos, secretos, pagos o integraciones.

Buscar:
- auth bypass;
- privilege escalation;
- IDOR;
- input validation;
- data exposure;
- secret leakage;
- vulnerable dependencies;
- insecure API behavior.

## 14. Final Gate

```text
Specification: PASS / FAIL
Acceptance Criteria: PASS / FAIL
Implementation: PASS / FAIL
Tests: PASS / FAIL
Typecheck: PASS / FAIL / N/A
Lint: PASS / FAIL / N/A
Build: PASS / FAIL / N/A
E2E: PASS / FAIL / N/A
Security: PASS / FAIL / N/A
Code Review: PASS / FAIL
UI/UX: PASS / FAIL / N/A
Documentation: PASS / FAIL / N/A

CRITICAL: 0
HIGH: 0

Technical Debt:
- ...

Known Limitations:
- ...
```

No declarar DONE si falla un gate obligatorio.

## 15. No Guessing

```text
UNKNOWN
→ Investigate
→ Document
→ Ask if still blocking
```

## 16. Scope Control

Trabajo no relacionado:

```text
OUT OF SCOPE
```

o:

```text
TECHNICAL DEBT
```

No incorporarlo silenciosamente.
