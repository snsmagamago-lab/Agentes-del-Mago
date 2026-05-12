#!/usr/bin/env node
const fs = require('node:fs');
const path = require('node:path');
const { spawnSync } = require('node:child_process');

const relay = require('../src/core/relay');
const watcher = require('./watch_agent');

const DAEMON_STATE = '.agents/status/daemon_state.json';
const DAEMON_CONFIG = '.agents/daemon.config.json';
const VALID_AGENTS = new Set(['codex', 'claude', 'all']);

function parseArgs(argv) {
  const args = {
    agent: 'all',
    intervalMs: 5000,
    once: false,
    run: false,
    force: false,
    maxLaunches: 1
  };

  for (let index = 0; index < argv.length; index += 1) {
    const value = argv[index];
    if (VALID_AGENTS.has(value)) {
      args.agent = value;
    } else if (value === '--once') {
      args.once = true;
    } else if (value === '--run') {
      args.run = true;
    } else if (value === '--force') {
      args.force = true;
    } else if (value === '--interval') {
      const next = Number(argv[index + 1]);
      if (!Number.isFinite(next) || next < 1) {
        throw new Error('--interval must be a number of seconds greater than 0.');
      }
      args.intervalMs = next * 1000;
      index += 1;
    } else if (value === '--max-launches') {
      const next = Number(argv[index + 1]);
      if (!Number.isInteger(next) || next < 1) {
        throw new Error('--max-launches must be a positive integer.');
      }
      args.maxLaunches = next;
      index += 1;
    } else {
      throw new Error(`Unknown argument: ${value}`);
    }
  }

  return args;
}

function readJsonFile(root, relativePath, fallback) {
  try {
    return relay.readJson(root, relativePath, fallback);
  } catch {
    return fallback;
  }
}

function readDaemonState(root) {
  return readJsonFile(root, DAEMON_STATE, { launched: {} });
}

function writeDaemonState(root, state) {
  relay.writeJson(root, DAEMON_STATE, {
    ...state,
    updated_at: new Date().toISOString()
  });
}

function loadConfig(root) {
  const fileConfig = readJsonFile(root, DAEMON_CONFIG, {});
  const envCommands = {};
  if (process.env.RELAY_CODEX_COMMAND) envCommands.codex = process.env.RELAY_CODEX_COMMAND;
  if (process.env.RELAY_CLAUDE_COMMAND) envCommands.claude = process.env.RELAY_CLAUDE_COMMAND;

  return {
    commands: {
      ...(fileConfig.commands || {}),
      ...envCommands
    }
  };
}

function shellQuote(value) {
  const raw = String(value);
  return `"${raw.replace(/"/g, '\\"')}"`;
}

function expandCommand(template, values) {
  return String(template || '').replace(/\{(agent|root|prompt|task_id|handoff)\}/g, (_, key) => {
    if (!(key in values)) return '';
    return shellQuote(values[key]);
  });
}

function handoffText(root, currentTask) {
  if (!currentTask?.last_handoff) return '';
  return relay.readText(root, currentTask.last_handoff, '');
}

function buildAgentPrompt(root, readyItem) {
  const current = readyItem.currentTask;
  const sharedBrief = relay.readText(root, relay.SHARED_BRIEF, '');
  const taskText = current.task_file ? relay.readText(root, current.task_file, '') : '';
  const lastHandoff = handoffText(root, current);
  const roleLine = readyItem.agent === 'codex'
    ? 'You are Codex. Implement or fix the task, run tests, and finish with a Codex-to-Claude handoff.'
    : 'You are Claude. Review the task and latest Codex handoff, then finish with a Claude handoff.';

  return `# RelayRepo Auto-Agent Prompt

${roleLine}

## Hard Rules

- Work only inside this repository.
- Read and obey AGENTS.md.
- Use the repository files as shared memory.
- Do not merge to main.
- Do not delete handoff history.
- Do not continue beyond max_rounds.
- Stop and mark blocked or requires_human_decision if the task is unsafe or ambiguous.

## Current Task State

\`\`\`json
${JSON.stringify(current, null, 2)}
\`\`\`

## Shared Brief

${sharedBrief.trim() || '(empty)'}

## Agent Inbox

${readyItem.inbox.trim() || '(empty)'}

## Task File

${taskText.trim() || '(empty)'}

## Latest Handoff

${lastHandoff.trim() || '(none)'}

## Required Finish

Before ending:

1. Update files required by the task.
2. Run the relevant tests.
3. Run \`npm run agent:validate\`.
4. Create a handoff in \`.agents/handoff/\`.
5. Leave the task status ready for the next owner.
`;
}

function promptPathFor(root, readyItem) {
  const current = readyItem.currentTask;
  const dir = path.join(root, '.agents', 'wakeup');
  fs.mkdirSync(dir, { recursive: true });
  return path.join(dir, `${readyItem.agent}_${current.task_id}_prompt.md`);
}

function writeAgentPrompt(root, readyItem) {
  const target = promptPathFor(root, readyItem);
  const content = buildAgentPrompt(root, readyItem);
  fs.writeFileSync(target, content, 'utf8');
  return target;
}

function launchKey(readyItem) {
  const current = readyItem.currentTask;
  return [
    readyItem.agent,
    current.task_id || 'no-task',
    current.status || 'no-status',
    current.owner || 'no-owner',
    current.next_action || 'no-action',
    current.round || 0,
    current.last_handoff || 'no-handoff'
  ].join('|');
}

function buildLaunchPlan(root, readyItem, config) {
  const promptPath = writeAgentPrompt(root, readyItem);
  const current = readyItem.currentTask;
  const commandTemplate = config.commands?.[readyItem.agent] || '';
  const command = expandCommand(commandTemplate, {
    agent: readyItem.agent,
    root,
    prompt: promptPath,
    task_id: current.task_id || '',
    handoff: current.last_handoff || ''
  });

  return {
    agent: readyItem.agent,
    task_id: current.task_id,
    key: launchKey(readyItem),
    promptPath,
    commandTemplate,
    command
  };
}

function executePlan(root, plan, args, state, output = console.log) {
  if (!args.force && state.launched?.[plan.key]) {
    output(`Skipping ${plan.agent} for ${plan.task_id}; this handoff was already launched.`);
    return { skipped: true };
  }

  if (!plan.commandTemplate) {
    output(`No command configured for ${plan.agent}. Prompt written to ${plan.promptPath}`);
    output(`Configure RELAY_${plan.agent.toUpperCase()}_COMMAND or .agents/daemon.config.json, then rerun with --run.`);
    return { skipped: true, missingCommand: true };
  }

  output(`${args.run ? 'Launching' : 'Dry-run'} ${plan.agent} for ${plan.task_id}`);
  output(`Prompt: ${plan.promptPath}`);
  output(`Command: ${plan.command}`);

  const record = {
    agent: plan.agent,
    task_id: plan.task_id,
    prompt: plan.promptPath,
    command: plan.command,
    dry_run: !args.run,
    started_at: new Date().toISOString()
  };

  if (!args.run) {
    state.launched = state.launched || {};
    state.launched[plan.key] = {
      ...record,
      exit_code: null,
      status: 'dry_run'
    };
    writeDaemonState(root, state);
    return { dryRun: true };
  }

  const result = spawnSync(plan.command, {
    cwd: root,
    shell: true,
    encoding: 'utf8',
    maxBuffer: 1024 * 1024 * 20
  });

  const logsDir = path.join(root, '.agents', 'daemon-logs');
  fs.mkdirSync(logsDir, { recursive: true });
  const safeName = `${plan.agent}_${plan.task_id}_${Date.now()}`;
  fs.writeFileSync(path.join(logsDir, `${safeName}.stdout.log`), result.stdout || '', 'utf8');
  fs.writeFileSync(path.join(logsDir, `${safeName}.stderr.log`), result.stderr || '', 'utf8');

  state.launched = state.launched || {};
  state.launched[plan.key] = {
    ...record,
    exit_code: result.status,
    signal: result.signal,
    status: result.status === 0 ? 'completed' : 'failed',
    finished_at: new Date().toISOString(),
    stdout_log: `.agents/daemon-logs/${safeName}.stdout.log`,
    stderr_log: `.agents/daemon-logs/${safeName}.stderr.log`
  };
  writeDaemonState(root, state);

  output(`${plan.agent} exited with code ${result.status}`);
  return { exitCode: result.status };
}

function daemonTick(root, args, output = console.log) {
  const snapshot = watcher.buildTurnSnapshot(root, args.agent);
  const config = loadConfig(root);
  const state = readDaemonState(root);

  output(watcher.formatNotice(snapshot, { showInbox: false }));

  if (!snapshot.ready.length) return { ready: 0, launched: 0 };

  let launched = 0;
  for (const item of snapshot.ready) {
    if (launched >= args.maxLaunches) break;
    const plan = buildLaunchPlan(root, item, config);
    const result = executePlan(root, plan, args, state, output);
    if (!result.skipped) launched += 1;
  }

  return { ready: snapshot.ready.length, launched };
}

function runDaemon(root, args, output = console.log) {
  const run = () => daemonTick(root, args, output);
  const first = run();

  if (args.once) return first.ready ? 0 : 2;

  setInterval(run, args.intervalMs);
  return null;
}

if (require.main === module) {
  try {
    const args = parseArgs(process.argv.slice(2));
    const exitCode = runDaemon(process.cwd(), args);
    if (typeof exitCode === 'number') process.exit(exitCode);
  } catch (error) {
    console.error(error.message);
    console.error('Usage: node scripts/agent_daemon.js [codex|claude|all] [--once] [--run] [--force] [--interval seconds] [--max-launches n]');
    process.exit(1);
  }
}

module.exports = {
  buildAgentPrompt,
  buildLaunchPlan,
  daemonTick,
  expandCommand,
  launchKey,
  parseArgs,
  runDaemon,
  writeAgentPrompt
};
