# deploy agents_dev

## 1. Objetivo del entorno

Este documento define el entorno de trabajo para coordinar agentes de programación, principalmente **Codex** y **Claude**, usando un repositorio Git como espacio compartido.

La meta es que los agentes puedan trabajar por turnos sobre tareas técnicas, dejar evidencia de sus cambios, revisar el trabajo del otro y continuar el desarrollo sin depender de conversaciones manuales largas.

El principio central es:

```txt
El repositorio es la memoria compartida.
Los commits son el historial verificable.
Los handoffs son los mensajes entre agentes.
Los PRs son los puntos de revisión.
El usuario mantiene la aprobación final.
```

---

## 2. Arquitectura general

El sistema debe funcionar como un flujo de trabajo por etapas:

```txt
Usuario crea tarea
    ↓
Codex implementa
    ↓
Codex deja handoff
    ↓
Claude revisa
    ↓
Claude deja handoff
    ↓
Codex corrige
    ↓
Se corren pruebas
    ↓
Usuario aprueba merge
```

El objetivo no es que Claude y Codex conversen directamente como chat, sino que se comuniquen mediante archivos dentro del repositorio.

---

## 3. Estructura final del repositorio

El repositorio debe quedar con esta estructura mínima:

```txt
project-name/
│
├─ README.md
├─ AGENTS.md
├─ ROADMAP.md
├─ CHANGELOG.md
├─ package.json / pyproject.toml / requirements.txt
│
├─ docs/
│  ├─ architecture.md
│  ├─ requirements.md
│  ├─ decisions.md
│  ├─ known_issues.md
│  └─ setup_notes.md
│
├─ tasks/
│  ├─ T001_initial_task.md
│  ├─ T002_next_task.md
│  └─ archive/
│
├─ .agents/
│  ├─ inbox/
│  │  ├─ codex_next_task.md
│  │  └─ claude_next_review.md
│  │
│  ├─ handoff/
│  │  ├─ codex_to_claude_T001.md
│  │  └─ claude_to_codex_T001.md
│  │
│  ├─ status/
│  │  ├─ current_task.json
│  │  ├─ codex_status.json
│  │  └─ claude_status.json
│  │
│  ├─ logs/
│  │  └─ agent_activity.md
│  │
│  └─ templates/
│     ├─ task_template.md
│     ├─ handoff_template.md
│     └─ review_template.md
│
├─ scripts/
│  ├─ new_task.js / new_task.py
│  ├─ start_codex_task.js / start_codex_task.py
│  ├─ start_claude_review.js / start_claude_review.py
│  ├─ close_task.js / close_task.py
│  └─ validate_agent_state.js / validate_agent_state.py
│
├─ tests/
│
└─ .github/
   └─ workflows/
      ├─ run_tests.yml
      ├─ claude_review.yml
      └─ handoff_router.yml
```

---

## 4. Archivos principales

### 4.1 README.md

Debe explicar qué hace el proyecto, cómo instalarlo y cómo ejecutar el sistema.

Debe incluir:

```md
# Project Name

## Purpose

## Installation

## Development

## Agent Workflow

## Testing

## Deployment
```

---

### 4.2 AGENTS.md

Este es el archivo más importante para los agentes. Debe explicar roles, límites y reglas.

Contenido recomendado:

```md
# AGENTS.md

## General Rule

All agents must work through tasks, branches, commits, tests, and handoff files.
No agent may silently overwrite another agent's work.

---

## Agent Roles

### Codex

Codex is responsible for implementation.

Codex may:
- Create or modify code.
- Add tests.
- Fix bugs.
- Refactor small sections.
- Update technical documentation when required.

Codex must:
- Work on a dedicated branch.
- Leave a handoff file after every work session.
- List changed files.
- List tests executed.
- Mark unresolved issues clearly.

Codex must not:
- Change the global architecture without review.
- Delete documentation without justification.
- Merge its own branch into main.
- Continue after two failed correction rounds without human review.

---

### Claude

Claude is responsible for review, reasoning, architecture, and documentation quality.

Claude may:
- Review code.
- Review architecture.
- Suggest refactors.
- Validate whether a task matches requirements.
- Write review notes.
- Request changes.

Claude must:
- Read the task file before reviewing.
- Read Codex's handoff before reviewing.
- Leave a review handoff.
- Separate critical issues from optional improvements.

Claude must not:
- Rewrite the whole project without instruction.
- Approve incomplete work.
- Change public APIs without justification.
- Enter endless review loops.

---

### Human User

The user is the final project director.

The user is responsible for:
- Creating or approving task priorities.
- Resolving ambiguous requirements.
- Approving merges.
- Stopping loops.
- Deciding whether suggestions are accepted.

---

## Branch Policy

Use this format:

```txt
agent/codex/T001-short-name
agent/claude/review-T001-short-name
fix/codex/T001-round-2
```

---

## Commit Policy

Commits should be small and descriptive.

Recommended format:

```txt
T001: implement total ranking module
T001: add name normalization tests
T001: update handoff after Claude review
```

---

## Handoff Rule

Every agent work session must end with a file inside:

```txt
.agents/handoff/
```

The handoff must explain:

1. Task ID.
2. What was changed.
3. Files modified.
4. Tests run.
5. Current state.
6. Remaining doubts.
7. Recommended next action.

---

## Loop Limit

Maximum automatic rounds per task:

```txt
Codex implementation → Claude review → Codex fix → Claude final review
```

After two correction rounds, the task must be marked as:

```txt
requires_human_decision
```
```

---

### 4.3 ROADMAP.md

Debe contener la visión general del proyecto.

Ejemplo:

```md
# ROADMAP

## Phase 1 - Minimal working environment
- Create repo structure.
- Add AGENTS.md.
- Add task template.
- Add handoff template.
- Add basic scripts.

## Phase 2 - Local automation
- Add scripts to create tasks.
- Add scripts to launch Codex task sessions.
- Add scripts to launch Claude review sessions.
- Add validation of status files.

## Phase 3 - GitHub integration
- Add GitHub Actions.
- Run tests on push and PR.
- Trigger review workflows.
- Store agent logs.

## Phase 4 - Dashboard
- Add local UI.
- Show tasks, status, handoffs, branches and PRs.
```

---

### 4.4 CHANGELOG.md

Debe registrar cambios importantes.

Ejemplo:

```md
# CHANGELOG

## 0.1.0
- Created initial agent relay structure.
- Added AGENTS.md.
- Added task and handoff templates.
```

---

## 5. Carpeta docs/

### 5.1 docs/architecture.md

Debe explicar cómo está construido el proyecto.

Contenido recomendado:

```md
# Architecture

## System Overview

## Modules

## Data Flow

## Agent Workflow

## Testing Strategy

## Known Limitations
```

---

### 5.2 docs/requirements.md

Debe contener requisitos funcionales y técnicos.

```md
# Requirements

## Functional Requirements

## Non-functional Requirements

## Input Data

## Output Data

## Acceptance Criteria
```

---

### 5.3 docs/decisions.md

Debe registrar decisiones importantes.

```md
# Technical Decisions

## Decision 001 - Use Git as shared memory

### Context
Multiple agents need a stable coordination system.

### Decision
Use files, branches, commits and PRs as the shared workflow.

### Consequences
- Better traceability.
- More control.
- Less risk of chaotic agent loops.
```

---

### 5.4 docs/known_issues.md

Debe contener errores conocidos o riesgos.

```md
# Known Issues

## KI-001 - Agents may overwrite work

### Risk
Two agents may edit the same file in incompatible ways.

### Mitigation
Use separate branches and require PR review before merge.
```

---

## 6. Carpeta tasks/

Cada tarea debe tener un archivo individual.

Formato recomendado:

```txt
T001_short_description.md
T002_short_description.md
T003_short_description.md
```

---

### 6.1 Template de tarea

Guardar en:

```txt
.agents/templates/task_template.md
```

Contenido:

```md
# TXXX - Task Title

## Objective

Describe the final expected result.

## Context

Explain why this task exists and what previous work it depends on.

## Relevant Files

- path/to/file1
- path/to/file2

## Requirements

- Requirement 1
- Requirement 2
- Requirement 3

## Acceptance Criteria

- [ ] The feature works.
- [ ] Tests were added or updated.
- [ ] Documentation was updated if needed.
- [ ] Handoff file was created.
- [ ] No unrelated files were modified.

## Suggested Agent

```txt
Codex
```

## Review Agent

```txt
Claude
```

## Notes

Any extra instruction goes here.
```

---

### 6.2 Ejemplo de tarea

```md
# T001 - Create total ranking module

## Objective

Create a module that calculates the total ranking by summing daily scores.

## Context

The project stores daily event scores. The final system needs a total ranking that updates when new daily data is added.

## Relevant Files

- src/ranking/
- data/daily_scores/
- docs/scoring_rules.md

## Requirements

- Sum points by player.
- Sum real points by player.
- Avoid duplicate names.
- Keep players with zero points.
- Sort ranking in descending order.

## Acceptance Criteria

- [ ] Total ranking is generated correctly.
- [ ] Missing players are handled.
- [ ] Tests cover at least three daily files.
- [ ] README explains how to run the module.
- [ ] Codex creates a handoff for Claude.
```

---

## 7. Carpeta .agents/

Esta carpeta contiene la coordinación interna del sistema.

---

### 7.1 .agents/inbox/

Sirve para dejar instrucciones directas al siguiente agente.

Ejemplo:

```txt
.agents/inbox/codex_next_task.md
.agents/inbox/claude_next_review.md
```

`codex_next_task.md` puede contener:

```md
# Next Codex Task

Task: T001
Branch: agent/codex/T001-total-ranking

Read:
- tasks/T001_total_ranking.md
- docs/requirements.md
- AGENTS.md

Expected output:
- Implementation
- Tests
- Handoff file
```

`claude_next_review.md` puede contener:

```md
# Next Claude Review

Task: T001
Branch to review: agent/codex/T001-total-ranking

Read:
- tasks/T001_total_ranking.md
- .agents/handoff/codex_to_claude_T001.md
- Changed files

Expected output:
- Review notes
- Required fixes
- Approval or rejection
- Handoff file
```

---

### 7.2 .agents/handoff/

Aquí se guardan los mensajes formales entre agentes.

Formato de nombre:

```txt
codex_to_claude_T001.md
claude_to_codex_T001.md
codex_to_claude_T001_round2.md
claude_final_review_T001.md
```

---

### 7.3 Template de handoff

Guardar en:

```txt
.agents/templates/handoff_template.md
```

Contenido:

```md
# Handoff: [Agent A] → [Agent B]

## Task

TXXX - Task title

## Current Status

```txt
implemented / needs_review / needs_changes / blocked / approved
```

## Summary of Work

Explain what was done.

## Files Modified

- file1
- file2

## Tests Run

```bash
command used to test
```

Result:

```txt
passed / failed / not run
```

## Important Notes

- Note 1
- Note 2

## Risks

- Risk 1
- Risk 2

## Questions for Next Agent

- Question 1
- Question 2

## Recommended Next Action

Explain what the next agent should do.
```

---

### 7.4 Ejemplo Codex → Claude

```md
# Handoff: Codex → Claude

## Task

T001 - Create total ranking module

## Current Status

```txt
needs_review
```

## Summary of Work

Implemented the total ranking module and added tests for multi-day score aggregation.

## Files Modified

- src/ranking/totalRanking.js
- tests/totalRanking.test.js
- README.md

## Tests Run

```bash
npm test
```

Result:

```txt
passed: 12/12
```

## Important Notes

- Player names are normalized using lowercase.
- Accent normalization is not implemented yet.

## Risks

- Players with similar names may be merged incorrectly.
- Alias handling may require a separate config file.

## Questions for Next Agent

- Should name aliases be handled in this task or a future task?
- Should players with zero points appear in the final ranking?

## Recommended Next Action

Claude should review the ranking logic, edge cases, tests and README clarity.
```

---

### 7.5 Ejemplo Claude → Codex

```md
# Handoff: Claude → Codex

## Task

T001 - Create total ranking module

## Current Status

```txt
needs_changes
```

## Review Summary

The implementation is mostly correct, but name handling needs improvement before approval.

## Required Changes

1. Add accent normalization.
2. Separate `displayName` from `normalizedName`.
3. Add tests for aliases and repeated players.

## Optional Suggestions

- Add a warning log when two names collapse into the same normalized key.

## Files to Revisit

- src/ranking/totalRanking.js
- tests/totalRanking.test.js

## Recommended Next Action

Codex should implement the required changes and create a second handoff.
```

---

## 8. Status files

Los archivos de estado permiten que los scripts sepan qué está ocurriendo.

---

### 8.1 .agents/status/current_task.json

```json
{
  "task_id": "T001",
  "title": "Create total ranking module",
  "status": "needs_review",
  "owner": "claude",
  "branch": "agent/codex/T001-total-ranking",
  "round": 1,
  "max_rounds": 2,
  "last_handoff": ".agents/handoff/codex_to_claude_T001.md",
  "next_action": "claude_review"
}
```

Estados permitidos:

```txt
pending
in_progress
needs_review
needs_changes
approved
blocked
requires_human_decision
closed
```

---

### 8.2 .agents/status/codex_status.json

```json
{
  "agent": "codex",
  "current_task": "T001",
  "status": "idle",
  "last_branch": "agent/codex/T001-total-ranking",
  "last_commit": "",
  "last_handoff": ".agents/handoff/codex_to_claude_T001.md"
}
```

---

### 8.3 .agents/status/claude_status.json

```json
{
  "agent": "claude",
  "current_task": "T001",
  "status": "idle",
  "last_review": ".agents/handoff/claude_to_codex_T001.md",
  "decision": "needs_changes"
}
```

---

## 9. Branches y commits

### 9.1 Branches

Usar una branch por tarea y por agente.

Formato:

```txt
agent/codex/T001-total-ranking
agent/claude/review-T001-total-ranking
fix/codex/T001-round-2
```

No se debe trabajar directo en `main`.

---

### 9.2 Commits

Formato recomendado:

```txt
T001: implement total ranking module
T001: add tests for missing players
T001: update codex handoff
T001: apply Claude review changes
```

Reglas:

```txt
- Un commit debe representar un cambio lógico.
- No mezclar tareas distintas.
- No hacer commits gigantes sin explicación.
- No borrar archivos de handoff.
```

---

## 10. Flujo local recomendado

### 10.1 Crear una tarea

```bash
git checkout main
git pull
node scripts/new_task.js "Create total ranking module"
```

Resultado esperado:

```txt
tasks/T001_create_total_ranking_module.md
.agents/status/current_task.json
.agents/inbox/codex_next_task.md
```

---

### 10.2 Codex trabaja la tarea

```bash
git checkout -b agent/codex/T001-total-ranking
```

Codex debe leer:

```txt
AGENTS.md
tasks/T001_create_total_ranking_module.md
.agents/inbox/codex_next_task.md
```

Codex implementa, prueba y crea:

```txt
.agents/handoff/codex_to_claude_T001.md
```

Luego:

```bash
git add .
git commit -m "T001: implement total ranking module"
git push -u origin agent/codex/T001-total-ranking
```

---

### 10.3 Claude revisa

Claude debe leer:

```txt
AGENTS.md
tasks/T001_create_total_ranking_module.md
.agents/handoff/codex_to_claude_T001.md
```

Claude revisa los cambios y crea:

```txt
.agents/handoff/claude_to_codex_T001.md
```

La revisión debe terminar con uno de estos estados:

```txt
approved
needs_changes
blocked
requires_human_decision
```

---

### 10.4 Codex corrige

Si Claude marca `needs_changes`, Codex debe:

```bash
git checkout agent/codex/T001-total-ranking
```

Leer:

```txt
.agents/handoff/claude_to_codex_T001.md
```

Aplicar cambios, correr pruebas y crear:

```txt
.agents/handoff/codex_to_claude_T001_round2.md
```

Luego:

```bash
git add .
git commit -m "T001: apply Claude review changes"
git push
```

---

### 10.5 Cierre de tarea

Cuando Claude aprueba:

```bash
git checkout main
git merge agent/codex/T001-total-ranking
node scripts/close_task.js T001
git add .
git commit -m "T001: close completed task"
git push
```

La tarea debe moverse a:

```txt
tasks/archive/T001_create_total_ranking_module.md
```

Y el estado debe cambiar a:

```txt
closed
```

---

## 11. Flujo con GitHub

### 11.1 Eventos principales

GitHub debe usarse para:

```txt
- Guardar historial remoto.
- Abrir Pull Requests.
- Ejecutar tests automáticos.
- Activar revisión de Claude.
- Mantener control humano del merge.
```

---

### 11.2 Pull Request

Cada tarea debe terminar en un PR.

Formato de título:

```txt
T001: Create total ranking module
```

Descripción del PR:

```md
## Task

Closes T001

## Summary

- Implemented total ranking module.
- Added tests.
- Updated README.

## Handoff

- .agents/handoff/codex_to_claude_T001.md
- .agents/handoff/claude_to_codex_T001.md

## Tests

```bash
npm test
```

## Status

Ready for review.
```

---

### 11.3 GitHub Actions básico para pruebas

Guardar en:

```txt
.github/workflows/run_tests.yml
```

Ejemplo para Node.js:

```yml
name: Run Tests

on:
  push:
  pull_request:

jobs:
  test:
    runs-on: ubuntu-latest

    steps:
      - name: Checkout repository
        uses: actions/checkout@v4

      - name: Setup Node
        uses: actions/setup-node@v4
        with:
          node-version: 20

      - name: Install dependencies
        run: npm install

      - name: Run tests
        run: npm test
```

Ejemplo para Python:

```yml
name: Run Tests

on:
  push:
  pull_request:

jobs:
  test:
    runs-on: ubuntu-latest

    steps:
      - name: Checkout repository
        uses: actions/checkout@v4

      - name: Setup Python
        uses: actions/setup-python@v5
        with:
          python-version: '3.11'

      - name: Install dependencies
        run: |
          pip install -r requirements.txt

      - name: Run tests
        run: pytest
```

---

## 12. Scripts mínimos

Los scripts pueden hacerse en Node.js o Python. La primera versión no necesita ser compleja.

---

### 12.1 scripts/new_task.js

Responsabilidad:

```txt
- Crear ID de tarea.
- Crear archivo en tasks/.
- Actualizar current_task.json.
- Crear codex_next_task.md.
```

Pseudocódigo:

```js
// scripts/new_task.js

const fs = require('fs');
const path = require('path');

const title = process.argv.slice(2).join(' ');

if (!title) {
  console.error('Usage: node scripts/new_task.js "Task title"');
  process.exit(1);
}

const taskId = 'T001'; // Later: auto-detect next number
const slug = title.toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_|_$/g, '');
const taskPath = `tasks/${taskId}_${slug}.md`;

const content = `# ${taskId} - ${title}

## Objective

Describe the expected result.

## Context

Add context here.

## Relevant Files

- TBD

## Requirements

- TBD

## Acceptance Criteria

- [ ] Implementation completed.
- [ ] Tests added or updated.
- [ ] Documentation updated if needed.
- [ ] Handoff created.
`;

fs.writeFileSync(taskPath, content);

fs.writeFileSync('.agents/status/current_task.json', JSON.stringify({
  task_id: taskId,
  title,
  status: 'pending',
  owner: 'codex',
  branch: `agent/codex/${taskId}-${slug}`,
  round: 0,
  max_rounds: 2,
  last_handoff: null,
  next_action: 'codex_implementation'
}, null, 2));

fs.writeFileSync('.agents/inbox/codex_next_task.md', `# Next Codex Task

Task: ${taskId}
Branch: agent/codex/${taskId}-${slug}

Read:
- AGENTS.md
- ${taskPath}

Expected output:
- Implementation
- Tests
- Handoff file
`);

console.log(`Created ${taskPath}`);
```

---

### 12.2 scripts/validate_agent_state.js

Responsabilidad:

```txt
- Verificar que exista AGENTS.md.
- Verificar que exista current_task.json.
- Verificar que exista handoff si el estado es needs_review.
- Evitar avanzar si faltan archivos obligatorios.
```

Pseudocódigo:

```js
const fs = require('fs');

const required = [
  'AGENTS.md',
  '.agents/status/current_task.json'
];

for (const file of required) {
  if (!fs.existsSync(file)) {
    console.error(`Missing required file: ${file}`);
    process.exit(1);
  }
}

const state = JSON.parse(fs.readFileSync('.agents/status/current_task.json', 'utf8'));

if (state.status === 'needs_review' && !state.last_handoff) {
  console.error('Task needs review but no handoff file is registered.');
  process.exit(1);
}

console.log('Agent state is valid.');
```

---

## 13. Variables de entorno

Crear archivo local:

```txt
.env
```

Ejemplo:

```env
GITHUB_TOKEN=
ANTHROPIC_API_KEY=
OPENAI_API_KEY=
PROJECT_ROOT=
DEFAULT_BRANCH=main
MAX_AGENT_ROUNDS=2
```

Reglas:

```txt
- Nunca subir .env al repositorio.
- Agregar .env a .gitignore.
- Usar GitHub Secrets para workflows remotos.
```

`.gitignore` debe incluir:

```gitignore
.env
node_modules/
__pycache__/
.pytest_cache/
.DS_Store
*.log
```

---

## 14. Seguridad y control

Reglas obligatorias:

```txt
1. Ningún agente puede hacer merge automático a main.
2. Ningún agente debe modificar secrets.
3. Ningún agente debe borrar .agents/handoff/.
4. Ningún agente debe borrar historial de tareas.
5. Ningún agente debe ejecutar comandos destructivos sin aprobación.
6. Ningún agente debe modificar archivos fuera del repositorio.
7. Máximo dos rondas automáticas por tarea.
```

Comandos que requieren aprobación humana:

```bash
rm -rf
sudo
chmod -R
git reset --hard
git push --force
git clean -fd
```

---

## 15. Modo local con worktrees

Para evitar que Claude y Codex se pisen, se pueden usar worktrees.

Estructura:

```txt
main-project/
worktrees/
├─ codex-T001/
└─ claude-T001-review/
```

Crear worktree para Codex:

```bash
git worktree add ../worktrees/codex-T001 -b agent/codex/T001-total-ranking
```

Crear worktree para revisión:

```bash
git worktree add ../worktrees/claude-T001-review agent/codex/T001-total-ranking
```

Ventaja:

```txt
- Cada agente trabaja en una carpeta aislada.
- Se reduce riesgo de conflictos.
- Puedes revisar cambios sin tocar tu rama principal.
```

---

## 16. Dashboard opcional

Más adelante se puede crear una interfaz web local.

Nombre sugerido:

```txt
Agent Relay Dashboard
```

Debe mostrar:

```txt
- Lista de tareas.
- Estado actual.
- Agente responsable.
- Branch activa.
- Último handoff.
- Últimos commits.
- Estado de pruebas.
- Botones de acción.
```

Botones útiles:

```txt
- New Task
- Start Codex
- Start Claude Review
- Validate State
- Open Pull Request
- Close Task
- Stop Loop
```

Stack sugerido:

```txt
Frontend: React / Next.js
Backend: Node.js o Python FastAPI
Control de Git: Git CLI
Estado: archivos JSON
Documentación: Markdown
```

---

## 17. Fases de implementación

### Fase 1 - Estructura mínima

Objetivo: tener el entorno base funcionando manualmente.

Tareas:

```txt
- Crear estructura de carpetas.
- Crear AGENTS.md.
- Crear task template.
- Crear handoff template.
- Crear current_task.json.
- Crear primera tarea de prueba.
```

Resultado esperado:

```txt
Ya se puede trabajar con Codex y Claude usando archivos manuales.
```

---

### Fase 2 - Automatización local básica

Objetivo: reducir trabajo repetitivo.

Tareas:

```txt
- Crear script new_task.
- Crear script validate_agent_state.
- Crear script close_task.
- Crear comandos npm o Makefile.
```

Ejemplo `package.json`:

```json
{
  "scripts": {
    "task:new": "node scripts/new_task.js",
    "agent:validate": "node scripts/validate_agent_state.js",
    "task:close": "node scripts/close_task.js"
  }
}
```

Resultado esperado:

```txt
Se pueden crear y cerrar tareas con comandos simples.
```

---

### Fase 3 - GitHub Actions

Objetivo: validar cambios automáticamente.

Tareas:

```txt
- Agregar run_tests.yml.
- Configurar protección de main.
- Exigir PR antes de merge.
- Agregar revisión automática si aplica.
```

Resultado esperado:

```txt
Cada push o PR corre pruebas automáticamente.
```

---

### Fase 4 - Handoff router

Objetivo: preparar comunicación más automática.

Tareas:

```txt
- Detectar cuándo Codex deja handoff.
- Cambiar status a needs_review.
- Preparar claude_next_review.md.
- Detectar revisión de Claude.
- Cambiar status a needs_changes o approved.
```

Resultado esperado:

```txt
El sistema puede mover tareas entre agentes de forma semi-automática.
```

---

### Fase 5 - Dashboard

Objetivo: tener una interfaz visual.

Tareas:

```txt
- Mostrar tareas.
- Mostrar estados.
- Mostrar handoffs.
- Mostrar ramas.
- Mostrar pruebas.
- Permitir acciones manuales seguras.
```

Resultado esperado:

```txt
El usuario puede dirigir el sistema desde una página local.
```

---

## 18. Proceso diario recomendado

Uso normal:

```bash
git checkout main
git pull
npm run task:new "Nombre de la tarea"
git checkout -b agent/codex/TXXX-task-name
```

Después de Codex:

```bash
npm test
npm run agent:validate
git add .
git commit -m "TXXX: implement task"
git push -u origin agent/codex/TXXX-task-name
```

Después de Claude:

```bash
git add .
git commit -m "TXXX: add Claude review handoff"
```

Si hay cambios:

```bash
git checkout agent/codex/TXXX-task-name
# Codex fixes changes
npm test
git add .
git commit -m "TXXX: apply review changes"
git push
```

Si está aprobado:

```bash
git checkout main
git merge agent/codex/TXXX-task-name
npm run task:close TXXX
git add .
git commit -m "TXXX: close task"
git push
```

---

## 19. Reglas para evitar caos

```txt
1. Una tarea por branch.
2. Un agente responsable a la vez.
3. Todo cambio debe tener handoff.
4. Todo handoff debe tener siguiente acción.
5. Todo PR debe tener pruebas.
6. El usuario aprueba el merge.
7. No más de dos rondas automáticas.
8. Las dudas se marcan como blocked o requires_human_decision.
9. No se borran logs.
10. La documentación se actualiza junto con el código.
```

---

## 20. Resultado final esperado

Cuando el entorno esté completo, el proyecto debe permitir este tipo de operación:

```txt
1. El usuario crea una tarea.
2. Codex implementa en su rama.
3. Codex crea handoff.
4. Claude revisa el trabajo.
5. Claude aprueba o solicita cambios.
6. Codex corrige.
7. Las pruebas corren automáticamente.
8. El usuario revisa el PR.
9. El usuario hace merge.
10. La tarea se archiva.
```

Este entorno convierte el repositorio en un sistema de coordinación entre agentes, manteniendo trazabilidad, control humano y documentación clara.

---

## 21. Resumen corto de comandos

```bash
# Crear tarea
npm run task:new "Task name"

# Validar estado
npm run agent:validate

# Crear branch de Codex
git checkout -b agent/codex/TXXX-task-name

# Correr pruebas
npm test
# o
pytest

# Commit
git add .
git commit -m "TXXX: implement task"

# Push
git push -u origin agent/codex/TXXX-task-name

# Cerrar tarea
npm run task:close TXXX
```

---

## 22. Nombre conceptual del sistema

Nombre recomendado:

```txt
RelayRepo
```

Descripción:

```txt
RelayRepo is a Git-based agent coordination workspace where programming agents collaborate through tasks, branches, commits, handoff files, reviews and controlled merges.
```

Nombre alternativo:

```txt
Agent Relay Workspace
```

Descripción:

```txt
A local and GitHub-compatible workspace for coordinating multiple coding agents through structured documentation and controlled development loops.
```

