# RelayRepo

## Purpose

RelayRepo is a local and GitHub-compatible workspace for coordinating Codex and Claude through files, tasks, handoffs, Git branches, commits, and human-approved merges.

The repository is the shared memory. Agents do not need to talk to each other directly; they read and write structured files in `.agents/`.

## Installation

Requirements:

- Node.js 20 or newer.
- Git.
- Optional GitHub credentials if you want to push to the remote repository.

Install dependencies:

```bash
npm install
```

This first version uses only Node built-ins, so install should be fast and small.

## Development

Start the local dashboard:

```bash
npm run dev
```

Open the URL printed by the server. The default is:

```txt
http://127.0.0.1:5177
```

The dashboard lets the user:

- Create tasks.
- Update the shared brief both agents must read.
- Prepare Codex and Claude inbox files.
- Save handoffs.
- Validate state.
- Close tasks after human approval.

## Agent Workflow

1. The user creates a task from the dashboard or `npm run task:new -- "Task title"`.
2. Codex reads `AGENTS.md`, the task file, `.agents/inbox/shared_brief.md`, and `.agents/inbox/codex_next_task.md`.
3. Codex implements, tests, and creates a handoff in `.agents/handoff/`.
4. Claude reads `AGENTS.md`, the task file, Codex handoff, and `.agents/inbox/claude_next_review.md`.
5. Claude approves, blocks, or requests changes with a review handoff.
6. Codex applies required fixes when needed.
7. The user reviews and merges. No agent merges its own work into `main`.

## CLI Commands

```bash
npm run task:new -- "Task title"
npm run agent:codex
npm run agent:claude
npm run agent:route
npm run agent:validate
npm run task:close -- T001
```

## Testing

```bash
npm test
```

The tests cover task creation, state validation, and handoff routing.

## Deployment

For local use, run:

```bash
npm run start
```

For GitHub, push this repository to:

```txt
https://github.com/snsmagamago-lab/Agentes-del-Mago
```

GitHub Actions will run `npm test` on push and pull request.
