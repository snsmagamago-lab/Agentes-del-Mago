# AGENTS.md

## General Rule

All agents must work through tasks, branches, commits, tests, and handoff files.
No agent may silently overwrite another agent's work.

The repository is the shared memory. The files in `.agents/` are the message bus.

## Required Reading

Before doing work, every agent must read:

- `AGENTS.md`
- `.agents/inbox/shared_brief.md`
- `.agents/status/current_task.json`
- The active task file under `tasks/`
- Its own inbox file under `.agents/inbox/`

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

- Work on a dedicated branch for substantial implementation.
- Leave a handoff file after every work session.
- List changed files.
- List tests executed.
- Mark unresolved issues clearly.

Codex must not:

- Change the global architecture without review.
- Delete documentation without justification.
- Merge its own branch into `main`.
- Continue after two failed correction rounds without human review.

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

### Human User

The user is the final project director.

The user is responsible for:

- Creating or approving task priorities.
- Resolving ambiguous requirements.
- Approving merges.
- Stopping loops.
- Deciding whether suggestions are accepted.

## Branch Policy

Use this format:

```txt
agent/codex/T001-short-name
agent/claude/review-T001-short-name
fix/codex/T001-round-2
```

Do not work directly on `main` for task implementation.

## Commit Policy

Commits should be small and descriptive.

Recommended format:

```txt
T001: implement dashboard state panel
T001: add handoff routing tests
T001: update handoff after Claude review
```

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

## Loop Limit

Maximum automatic rounds per task:

```txt
Codex implementation -> Claude review -> Codex fix -> Claude final review
```

After two correction rounds, the task must be marked:

```txt
requires_human_decision
```

## Safety Rules

1. No agent may merge automatically to `main`.
2. No agent may modify secrets.
3. No agent may delete `.agents/handoff/`.
4. No agent may delete task history.
5. No agent may execute destructive commands without human approval.
6. No agent may modify files outside this repository.
7. No more than two automatic review rounds per task.
