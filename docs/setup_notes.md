# Setup Notes

## Quick Start

```bash
npm install
npm run dev
```

Then open:

```txt
http://127.0.0.1:5177
```

## Claude Bash Bridge

If Claude is already open in this folder, give it this instruction:

```txt
Read AGENTS.md, .agents/inbox/shared_brief.md, .agents/status/current_task.json, and .agents/inbox/claude_next_review.md. Review the active task and write your result to .agents/handoff/.
```

## Codex Bridge

Codex should read:

```txt
AGENTS.md
.agents/inbox/shared_brief.md
.agents/status/current_task.json
.agents/inbox/codex_next_task.md
```

## GitHub Remote

The intended remote is:

```txt
https://github.com/snsmagamago-lab/Agentes-del-Mago.git
```

Use normal Git credentials or GitHub CLI authentication before pushing.
