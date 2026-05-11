# Technical Decisions

## Decision 001 - Use Git as shared memory

### Context

Multiple agents need a stable coordination system.

### Decision

Use files, branches, commits, and PRs as the shared workflow.

### Consequences

- Better traceability.
- More control.
- Less risk of chaotic agent loops.

## Decision 002 - Use Node without runtime dependencies

### Context

The user asked for a practical deploy with a memory cap of 20 GB.

### Decision

Build the dashboard and scripts with Node built-ins.

### Consequences

- Small install footprint.
- Easier local startup.
- More manual UI code, but fewer supply-chain concerns.

## Decision 003 - Keep Claude communication file-based

### Context

There may be a Claude bash open in the same folder, but this environment cannot reliably attach to that terminal.

### Decision

Claude reads `.agents/inbox/claude_next_review.md` and writes `.agents/handoff/claude_to_codex_*.md`.

### Consequences

- Works across terminals and tools.
- Avoids fragile interprocess assumptions.
- Can be upgraded later with a CLI bridge.
