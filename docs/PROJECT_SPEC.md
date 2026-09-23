# SDD Starter Kit — Antigravity + ECC + UI/UX Pro Max

Starter kit reutilizable para proyectos que usan Spec-Driven Development como capa de orquestación, mientras ECC y otras skills aportan la ejecución especializada.

## Arquitectura

```text
YOU
 ↓
Feature / Bug Specification
 ↓
SDD ORCHESTRATOR
 ↓
Discovery → Planning → Architecture
 ↓
Approval Gate
 ↓
ECC / Specialized Skills
 ↓
TDD → Implementation → Verification
 ↓
Review → Security → E2E → Refactor
 ↓
Final Gate
```

## Importante

`.agents/` pertenece al ecosistema de agentes/workflows instalado en el proyecto, especialmente ECC.

Este starter NO reemplaza ni duplica `.agents/workflows/`.

Los documentos y workflows SDD propios viven en `docs/sdd/`.

## Instalación

Copiar estas carpetas al root del proyecto:

```text
docs/sdd/
docs/features/
docs/sprints/
```

No sobrescribir `.agents/`.

## Uso

Nueva feature:

```text
docs/features/my-feature.md
/sdd docs/features/my-feature.md
```

Bug:

```text
docs/features/bug-description.md
/sdd docs/features/bug-description.md
```

Sprint:

```text
docs/sprints/sprint-12.md
```

El Sprint agrupa features; cada feature puede tener su propia Specification.

## Regla central

La Specification define WHAT.

El SDD Orchestrator define el proceso.

ECC y skills especializadas ejecutan el HOW.

No duplicar agentes o workflows que ya existan.
