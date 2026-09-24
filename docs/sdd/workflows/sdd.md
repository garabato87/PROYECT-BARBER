# /sdd — SDD Orchestrator

Uso:

```text
/sdd docs/features/[feature].md
```

Actuar como SDD Orchestrator. Coordinar el proceso sin duplicar agentes especializados.

## 1. Read

Leer:
- `docs/sdd/MASTER_GUIDE.md`;
- `.agents/` si existe;
- reglas del proyecto;
- Specification indicada.

## 2. Inspect Capabilities

Inspeccionar qué agents/workflows/skills están realmente instalados.

Considerar:
Planner, Architect, TDD, Code Review, Security, E2E, Refactor, Build Fix, Research y UI/UX Pro Max.

No asumir nombres exactos.

## 3. Validate Spec

Validar Objective, Scope, Requirements y Acceptance Criteria.

Si falta información crítica, preguntar.

## 4. Discovery

Analizar el repositorio sin modificar código.

## 5. Classify

FEATURE / BUG / REFACTOR / PERFORMANCE / SECURITY / UI/UX / ARCHITECTURE

## 6. Architecture

Determinar la solución mínima compatible con el proyecto.

## 7. Plan

Crear Steps pequeños y verificables.

## 8. Capability Routing

Indicar qué capability existente ejecutará cada fase.

No duplicar ECC.

## Approval Gate

DETENERSE.

Presentar:
- Classification;
- Complexity;
- Discovery;
- Architecture;
- Capabilities Selected;
- Implementation Plan;
- Risks;
- Unknowns.

Esperar aprobación.

## After Approval

Implementar solo el Step aprobado.

Pipeline general:

```text
TDD
→ Implementation
→ Verification
→ Review
→ Security / E2E / UI/UX when applicable
```

No implementar Steps futuros automáticamente.

## Final

Ejecutar Final Gate.
