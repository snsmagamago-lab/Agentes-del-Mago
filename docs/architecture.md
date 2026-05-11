# Architecture

## System Overview

RelayRepo is a file-backed coordination system for programming agents.

The local dashboard and CLI scripts read and write the same repository files. This keeps the workflow transparent: every important state change is visible in Git.

## Modules

- `src/core/relay.js`: core task, status, handoff, validation, and Git helpers.
- `src/server.js`: local HTTP server and JSON API.
- `public/`: browser dashboard.
- `scripts/`: CLI wrappers around the core module.
- `.agents/`: shared message bus for Codex and Claude.
- `tasks/`: task definitions and archived task history.

## Data Flow

```txt
User action
  -> Dashboard or CLI
  -> src/core/relay.js
  -> .agents/status, .agents/inbox, .agents/handoff, tasks
  -> Git commit / PR
  -> Next agent reads files
```

## Agent Workflow

Codex implements and leaves a handoff. Claude reviews and leaves a handoff. The dashboard shows the current owner and next action so the user can direct the loop without long manual messages.

## Testing Strategy

Tests use Node's built-in `node:test` runner. They create temporary workspaces inside the repository test folder and verify the core relay behavior without external services.

## Known Limitations

- The app does not directly control another open Claude or Codex terminal.
- Claude integration is file-based unless a future API or CLI bridge is added.
- GitHub PR creation is intentionally manual in this version.
- Secrets are never read or displayed by the dashboard.
