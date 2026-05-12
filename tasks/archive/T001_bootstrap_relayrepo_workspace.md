# T001 - Bootstrap RelayRepo workspace

## Objective

Create a complete local workspace where Codex and Claude can coordinate through tasks, inbox files, handoffs, validation scripts, Git history, and a dashboard.

## Context

The source deployment document requested a Git-backed environment where the repository acts as shared memory and the user keeps final approval.

## Relevant Files

- README.md
- AGENTS.md
- src/core/relay.js
- src/server.js
- public/
- scripts/
- .agents/
- .github/workflows/

## Requirements

- Create the repository structure described in the deployment document.
- Add durable rules for Codex, Claude, and the human user.
- Add scripts for creating tasks, preparing reviews, validating state, routing handoffs, and closing tasks.
- Add a local dashboard that exposes the workflow without requiring direct terminal communication between agents.
- Add tests for the core relay behavior.
- Add GitHub Actions for validation.

## Acceptance Criteria

- [x] Dashboard can be started with `npm run dev`.
- [x] Tasks can be created from CLI or UI.
- [x] Shared brief and per-agent inbox files exist.
- [x] Handoff files can be created and routed.
- [x] State validation exists.
- [x] `npm test` passes.
- [x] `npm run agent:validate` passes.
- [x] Codex handoff exists for Claude review.

## Suggested Agent

```txt
Codex
```

## Review Agent

```txt
Claude
```

## Notes

Claude should review the implementation and decide whether the bootstrap is approved or needs changes.
