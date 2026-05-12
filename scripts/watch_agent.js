#!/usr/bin/env node
const fs = require('node:fs');
const path = require('node:path');
const relay = require('../src/core/relay');

const VALID_AGENTS = new Set(['codex', 'claude', 'all']);

function parseArgs(argv) {
  const args = {
    agent: 'all',
    intervalMs: 5000,
    once: false,
    beep: false,
    showInbox: true
  };

  for (let index = 0; index < argv.length; index += 1) {
    const value = argv[index];
    if (VALID_AGENTS.has(value)) {
      args.agent = value;
    } else if (value === '--once') {
      args.once = true;
    } else if (value === '--beep') {
      args.beep = true;
    } else if (value === '--no-inbox') {
      args.showInbox = false;
    } else if (value === '--interval') {
      const next = Number(argv[index + 1]);
      if (!Number.isFinite(next) || next < 1) {
        throw new Error('--interval must be a number of seconds greater than 0.');
      }
      args.intervalMs = next * 1000;
      index += 1;
    } else {
      throw new Error(`Unknown argument: ${value}`);
    }
  }

  return args;
}

function inboxPathFor(agent) {
  if (agent === 'codex') return '.agents/inbox/codex_next_task.md';
  if (agent === 'claude') return '.agents/inbox/claude_next_review.md';
  return null;
}

function actionForAgent(agent, current) {
  if (!current) return null;
  if (agent === 'codex') {
    if (current.owner === 'codex') return 'codex_turn';
    if (current.next_action === 'codex_implementation') return 'codex_turn';
    if (current.next_action === 'codex_fix') return 'codex_turn';
    if (current.status === 'pending' || current.status === 'needs_changes') return 'codex_turn';
  }
  if (agent === 'claude') {
    if (current.owner === 'claude') return 'claude_turn';
    if (current.next_action === 'claude_review') return 'claude_turn';
    if (current.status === 'needs_review') return 'claude_turn';
  }
  return null;
}

function buildTurnSnapshot(root, agent) {
  const state = relay.readWorkspaceState(root);
  const agents = agent === 'all' ? ['codex', 'claude'] : [agent];
  const ready = [];

  for (const name of agents) {
    const action = actionForAgent(name, state.current_task);
    if (!action) continue;
    const inboxPath = inboxPathFor(name);
    ready.push({
      agent: name,
      action,
      inboxPath,
      inbox: inboxPath ? relay.readText(root, inboxPath, '') : '',
      currentTask: state.current_task
    });
  }

  const current = state.current_task || {};
  const signature = [
    current.task_id || 'no-task',
    current.status || 'no-status',
    current.owner || 'no-owner',
    current.next_action || 'no-action',
    current.last_handoff || 'no-handoff',
    ready.map((item) => item.agent).join(',')
  ].join('|');

  return {
    state,
    ready,
    signature
  };
}

function formatNotice(snapshot, options = {}) {
  const current = snapshot.state.current_task;
  if (!current) return 'RelayRepo watcher: no current task exists yet.';

  const lines = [
    '',
    '============================================================',
    `RelayRepo watcher: ${current.task_id} is ${current.status}`,
    `Owner: ${current.owner}`,
    `Next action: ${current.next_action}`,
    `Last handoff: ${current.last_handoff || 'none'}`,
    `Branch: ${current.branch || 'none'}`,
    '============================================================'
  ];

  if (!snapshot.ready.length) {
    lines.push('No watched agent is responsible right now.');
    lines.push('Waiting for the next handoff or state change...');
    return lines.join('\n');
  }

  for (const item of snapshot.ready) {
    lines.push('');
    lines.push(`READY FOR ${item.agent.toUpperCase()}`);
    lines.push(`Read: ${item.inboxPath}`);
    lines.push(`Command helper: npm run agent:${item.agent} ${current.task_id}`);
    lines.push('');
    if (options.showInbox !== false) {
      lines.push(item.inbox.trim() || '(Inbox is empty.)');
      lines.push('');
    }
  }

  return lines.join('\n');
}

function writeWakeFiles(root, snapshot) {
  const dir = path.join(root, '.agents', 'wakeup');
  fs.mkdirSync(dir, { recursive: true });

  for (const item of snapshot.ready) {
    const current = item.currentTask;
    const wakePath = path.join(dir, `${item.agent}_${current.task_id}.md`);
    const content = `# Wakeup: ${item.agent}

Task: ${current.task_id}
Status: ${current.status}
Owner: ${current.owner}
Next action: ${current.next_action}
Last handoff: ${current.last_handoff || 'none'}

Read:
- AGENTS.md
- .agents/inbox/shared_brief.md
- .agents/status/current_task.json
- ${item.inboxPath}

Then follow the handoff rules in AGENTS.md.
`;
    fs.writeFileSync(wakePath, content, 'utf8');
  }
}

function runWatcher(root, args, output = console.log) {
  let lastSignature = null;
  let printedIdle = false;

  const tick = () => {
    const snapshot = buildTurnSnapshot(root, args.agent);
    const changed = snapshot.signature !== lastSignature;
    const hasReady = snapshot.ready.length > 0;

    if (changed || (args.once && !printedIdle)) {
      lastSignature = snapshot.signature;
      printedIdle = !hasReady;
      if (hasReady) writeWakeFiles(root, snapshot);
      if (hasReady && args.beep) process.stdout.write('\x07');
      output(formatNotice(snapshot, { showInbox: args.showInbox }));
    }

    if (args.once) return hasReady ? 0 : 2;
    return null;
  };

  const first = tick();
  if (args.once) return first;

  setInterval(tick, args.intervalMs);
  return null;
}

if (require.main === module) {
  try {
    const args = parseArgs(process.argv.slice(2));
    const exitCode = runWatcher(process.cwd(), args);
    if (typeof exitCode === 'number') process.exit(exitCode);
  } catch (error) {
    console.error(error.message);
    console.error('Usage: node scripts/watch_agent.js [codex|claude|all] [--interval seconds] [--once] [--beep] [--no-inbox]');
    process.exit(1);
  }
}

module.exports = {
  actionForAgent,
  buildTurnSnapshot,
  formatNotice,
  parseArgs,
  runWatcher
};
