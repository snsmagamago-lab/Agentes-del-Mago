# Known Issues

## KI-001 - Agents may edit the same file

### Risk

Codex and Claude may modify the same file in incompatible ways.

### Mitigation

Use branches, handoffs, and human-reviewed PRs.

## KI-002 - External agent terminals are not controlled

### Risk

An already-open Claude terminal may not automatically notice new files.

### Mitigation

Use the dashboard and inbox files as visible prompts. Tell Claude to read `.agents/inbox/claude_next_review.md`.

## KI-003 - GitHub credentials vary by machine

### Risk

Push or PR creation can fail if local credentials are missing.

### Mitigation

Keep the local repo functional first. Add remote and push only when credentials are available.
