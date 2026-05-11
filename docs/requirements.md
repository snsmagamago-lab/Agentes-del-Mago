# Requirements

## Functional Requirements

- Create structured task files.
- Maintain current task state in JSON.
- Maintain separate Codex and Claude status files.
- Write shared instructions both agents can read.
- Prepare per-agent inbox files.
- Create handoff files from Codex to Claude and Claude to Codex.
- Validate required files and state transitions.
- Show a local dashboard for the user.
- Archive closed tasks.

## Non-functional Requirements

- Stay within the repository folder.
- Avoid heavy dependencies.
- Keep memory use far below 20 GB.
- Keep all coordination state human-readable.
- Preserve human approval for merges.

## Input Data

- Task title and optional objective.
- Shared brief text.
- Handoff summaries, files, test commands, and next actions.
- Existing task and status files.

## Output Data

- Markdown task files.
- Markdown handoff files.
- JSON status files.
- Activity log entries.
- Dashboard state.

## Acceptance Criteria

- `npm test` passes.
- `npm run agent:validate` passes.
- `npm run dev` opens the dashboard.
- Codex and Claude can coordinate by reading `.agents/inbox/`.
