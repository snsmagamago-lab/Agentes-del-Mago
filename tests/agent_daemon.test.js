const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const relay = require('../src/core/relay');
const watcher = require('../scripts/watch_agent');
const daemon = require('../scripts/agent_daemon');

function makeRoot() {
  const root = fs.mkdtempSync(path.join(__dirname, '.tmp-daemon-'));
  relay.ensureBaseStructure(root);
  relay.writeText(root, 'AGENTS.md', '# AGENTS\n');
  relay.writeText(root, '.agents/inbox/shared_brief.md', '# Shared Brief\n');
  return root;
}

function removeRoot(root) {
  fs.rmSync(root, { recursive: true, force: true });
}

test('daemon builds a complete prompt for a ready Codex task', () => {
  const root = makeRoot();
  try {
    relay.createTask(root, { title: 'Daemon prompt' });
    const snapshot = watcher.buildTurnSnapshot(root, 'codex');
    const prompt = daemon.buildAgentPrompt(root, snapshot.ready[0]);

    assert.match(prompt, /RelayRepo Auto-Agent Prompt/);
    assert.match(prompt, /You are Codex/);
    assert.match(prompt, /Current Task State/);
    assert.match(prompt, /Daemon prompt/);
    assert.match(prompt, /Required Finish/);
  } finally {
    removeRoot(root);
  }
});

test('daemon expands command placeholders with quoted paths', () => {
  const command = daemon.expandCommand('tool --root {root} --prompt {prompt} --task {task_id}', {
    root: 'C:\\Users\\Name\\repo folder',
    prompt: 'C:\\Users\\Name\\repo folder\\.agents\\wakeup\\codex_T001_prompt.md',
    task_id: 'T001'
  });

  assert.match(command, /"C:\\Users\\Name\\repo folder"/);
  assert.match(command, /"T001"/);
});

test('daemon dry-run writes daemon state without executing command', () => {
  const root = makeRoot();
  try {
    relay.createTask(root, { title: 'Daemon dry run' });
    relay.writeJson(root, '.agents/daemon.config.json', {
      commands: {
        codex: 'node --version'
      }
    });
    const messages = [];
    const result = daemon.daemonTick(root, {
      agent: 'codex',
      run: false,
      force: false,
      maxLaunches: 1
    }, (line) => messages.push(line));

    assert.equal(result.ready, 1);
    assert.equal(result.launched, 1);
    assert.equal(fs.existsSync(path.join(root, '.agents/status/daemon_state.json')), true);
    assert.match(messages.join('\n'), /Dry-run codex/);
  } finally {
    removeRoot(root);
  }
});
