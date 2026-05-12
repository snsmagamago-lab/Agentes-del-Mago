const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const relay = require('../src/core/relay');
const watcher = require('../scripts/watch_agent');

function makeRoot() {
  const root = fs.mkdtempSync(path.join(__dirname, '.tmp-watch-'));
  relay.ensureBaseStructure(root);
  relay.writeText(root, 'AGENTS.md', '# AGENTS\n');
  relay.writeText(root, '.agents/inbox/shared_brief.md', '# Shared Brief\n');
  return root;
}

function removeRoot(root) {
  fs.rmSync(root, { recursive: true, force: true });
}

test('watcher detects Codex turn for pending task', () => {
  const root = makeRoot();
  try {
    relay.createTask(root, { title: 'Watcher Codex turn' });
    const snapshot = watcher.buildTurnSnapshot(root, 'codex');

    assert.equal(snapshot.ready.length, 1);
    assert.equal(snapshot.ready[0].agent, 'codex');
    assert.match(watcher.formatNotice(snapshot), /READY FOR CODEX/);
  } finally {
    removeRoot(root);
  }
});

test('watcher detects Claude turn after Codex handoff', () => {
  const root = makeRoot();
  try {
    relay.createTask(root, { title: 'Watcher Claude turn' });
    relay.createHandoff(root, {
      from: 'codex',
      to: 'claude',
      status: 'needs_review',
      summary: 'Ready for review.'
    });
    const snapshot = watcher.buildTurnSnapshot(root, 'claude');

    assert.equal(snapshot.ready.length, 1);
    assert.equal(snapshot.ready[0].agent, 'claude');
    assert.match(watcher.formatNotice(snapshot), /READY FOR CLAUDE/);
  } finally {
    removeRoot(root);
  }
});

test('watcher is idle when human owns the next action', () => {
  const root = makeRoot();
  try {
    relay.createTask(root, { title: 'Watcher human turn' });
    relay.createHandoff(root, {
      from: 'codex',
      to: 'claude',
      status: 'needs_review',
      summary: 'Ready for review.'
    });
    relay.createHandoff(root, {
      from: 'claude',
      to: 'codex',
      status: 'approved',
      summary: 'Approved.'
    });
    const snapshot = watcher.buildTurnSnapshot(root, 'all');

    assert.equal(snapshot.ready.length, 0);
    assert.match(watcher.formatNotice(snapshot), /No watched agent/);
  } finally {
    removeRoot(root);
  }
});
