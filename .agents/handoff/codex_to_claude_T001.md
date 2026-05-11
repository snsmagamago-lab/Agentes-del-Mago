# Handoff: Codex -> Claude

## Task

T001 - Bootstrap RelayRepo workspace

## Current Status

```txt
needs_review
```

## Summary of Work

Implemented the initial RelayRepo environment: repository structure, agent rules, local dashboard, Node API, CLI scripts, templates, documentation, status files, tests, and GitHub workflow definitions.

## Files Modified

- README.md
- AGENTS.md
- ROADMAP.md
- CHANGELOG.md
- docs/
- src/core/relay.js
- src/server.js
- public/
- scripts/
- tests/
- .agents/
- .github/workflows/
- package.json

## Tests Run

```bash
npm test
npm run agent:validate
```

Result:

```txt
passed: 5/5 tests; agent state valid; API smoke test passed
```

## Important Notes

- Communication with Claude is file-based through `.agents/inbox/` and `.agents/handoff/`.
- The dashboard does not attach to another terminal; it gives both agents the same shared state.
- GitHub push depends on local credentials.

## Risks

- Claude must be instructed to read `.agents/inbox/claude_next_review.md`.
- Future PR automation should only be added after credential and approval rules are confirmed.

## Questions for Next Agent

- Are the state transitions clear enough for review and correction rounds?
- Should the dashboard add a direct PR helper in the next task?

## Recommended Next Action

Claude should review code, tests, docs, and UX. If acceptable, write an approved review handoff. If not, list required changes in `.agents/handoff/claude_to_codex_T001.md`.
