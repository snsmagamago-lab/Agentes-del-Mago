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

The watcher itself does not automatically run Codex or Claude. That is intentional for safety.

For guarded auto-run, use the daemon.

## Daemon Dry Run

The daemon builds the exact prompt it would send to the responsible agent and records launch state, but does not run the agent unless `--run` is passed.

```bash
npm run daemon -- --once
```

For one agent:

```bash
npm run daemon:claude -- --once
npm run daemon:codex -- --once
```

Prompts are written under:

```txt
.agents/wakeup/
```

The daemon state is written locally to:

```txt
.agents/status/daemon_state.json
```

That file is ignored by Git because it is machine-local runtime state.

## Configure Auto-Run Commands

Copy the example config:

```bash
copy .agents\daemon.config.example.json .agents\daemon.config.json
```

Example config:

```json
{
  "commands": {
    "codex": "codex exec --cd {root} --sandbox danger-full-access --ask-for-approval never - < {prompt}",
    "claude": "claude -p --permission-mode acceptEdits --add-dir {root} < {prompt}"
  }
}
```

Placeholders:

- `{root}`: repository root.
- `{prompt}`: generated wakeup prompt path.
- `{task_id}`: active task id.
- `{handoff}`: latest handoff path.
- `{agent}`: `codex` or `claude`.

Environment variables override the config file:

```bash
set RELAY_CODEX_COMMAND=codex exec --cd {root} --sandbox danger-full-access --ask-for-approval never - ^< {prompt}
set RELAY_CLAUDE_COMMAND=claude -p --permission-mode acceptEdits --add-dir {root} ^< {prompt}
```

PowerShell example:

```powershell
$env:RELAY_CODEX_COMMAND='codex exec --cd {root} --sandbox danger-full-access --ask-for-approval never - < {prompt}'
$env:RELAY_CLAUDE_COMMAND='claude -p --permission-mode acceptEdits --add-dir {root} < {prompt}'
```

## Run the Daemon

Start with dry-run:

```bash
npm run daemon -- --once
```

If the printed command looks correct, run once for real:

```bash
npm run daemon -- --once --run
```

Continuous mode:

```bash
npm run daemon -- --run --interval 10
```

Recommended safer layout:

```bash
npm run daemon:codex -- --run --interval 10
npm run daemon:claude -- --run --interval 10
```

The daemon:

1. Detects the responsible agent.
2. Builds a prompt from the inbox and handoff.
3. Starts the corresponding CLI command.
4. Enforces max rounds.
5. Stops at `human_merge`, `approved`, `blocked`, or `requires_human_decision`.

It also avoids launching the same agent for the same handoff twice unless `--force` is passed.

## Recommended Next Step

Use this sequence:

```bash
npm run daemon -- --once
copy .agents\daemon.config.example.json .agents\daemon.config.json
npm run daemon -- --once --run
```

If both agents run correctly, keep two daemon terminals open:

```bash
npm run daemon:codex -- --run --interval 10
npm run daemon:claude -- --run --interval 10
```
