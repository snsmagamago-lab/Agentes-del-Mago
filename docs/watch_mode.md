# Watch Mode

RelayRepo can run lightweight watchers that wait for task ownership changes.

This solves the manual step where the user has to tell an agent that a new handoff exists.

## Safe Watch Mode

Open one terminal for Codex handoffs:

```bash
npm run watch:codex
```

Open one terminal for Claude handoffs:

```bash
npm run watch:claude
```

Or watch both:

```bash
npm run watch
```

The watcher reads:

- `.agents/status/current_task.json`
- `.agents/inbox/codex_next_task.md`
- `.agents/inbox/claude_next_review.md`
- `.agents/handoff/`

When it detects that an agent owns the next action, it prints a clear wakeup block and writes a helper file under:

```txt
.agents/wakeup/
```

Examples:

```txt
.agents/wakeup/codex_T003.md
.agents/wakeup/claude_T003.md
```

## One-Shot Check

Use this for scripts or quick checks:

```bash
node scripts/watch_agent.js claude --once
node scripts/watch_agent.js codex --once
```

Exit codes:

- `0`: watched agent has work now.
- `2`: watched agent does not have work now.
- `1`: watcher error.

## Optional Sound

```bash
npm run watch:claude -- --beep
```

## What This Does Not Do Yet

The watcher does not automatically run Codex or Claude. That is intentional for safety.

Full auto-run requires a known CLI command for each agent, for example:

```txt
claude --some-noninteractive-mode < prompt.md
codex --some-noninteractive-mode < prompt.md
```

Once the exact commands are confirmed, RelayRepo can add a guarded daemon mode that:

1. Detects the responsible agent.
2. Builds a prompt from the inbox and handoff.
3. Starts the corresponding CLI command.
4. Enforces max rounds.
5. Stops at `human_merge`, `approved`, `blocked`, or `requires_human_decision`.

Until then, safe watch mode removes the "go check the handoff" reminder without giving scripts authority to run agents unattended.
