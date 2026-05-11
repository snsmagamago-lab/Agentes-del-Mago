const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const relay = require('../src/core/relay');

function makeRoot() {
  const root = fs.mkdtempSync(path.join(__dirname, '.tmp-'));
  relay.ensureBaseStructure(root);
  relay.writeText(root, 'AGENTS.md', '# AGENTS\n');
  relay.writeText(root, '.agents/inbox/shared_brief.md', '# Shared Brief\n');
  return root;
}

function removeRoot(root) {
  fs.rmSync(root, { recursive: true, force: true });
}

test('slugify creates stable ascii slugs', () => {
  assert.equal(relay.slugify('Crear ranking total!'), 'crear-ranking-total');
  assert.equal(relay.slugify('   '), 'task');
});

test('createTask writes task, state, and Codex inbox', () => {
  const root = makeRoot();
  try {
    const result = relay.createTask(root, {
      title: 'Build review queue',
      objective: 'Create a queue for review handoffs.',
      requirements: ['Create status files', 'Prepare Codex inbox']
    });

    assert.equal(result.task_id, 'T001');
    assert.equal(fs.existsSync(path.join(root, result.task_path)), true);
    assert.equal(relay.readJson(root, relay.CURRENT_TASK).status, 'pending');
    assert.match(relay.readText(root, '.agents/inbox/codex_next_task.md'), /Build review queue|T001/);
  } finally {
    removeRoot(root);
  }
});

test('createHandoff updates current task for Claude review', () => {
  const root = makeRoot();
  try {
    relay.createTask(root, { title: 'Wire dashboard' });
    const handoff = relay.createHandoff(root, {
      from: 'codex',
      to: 'claude',
      status: 'needs_review',
      summary: 'Dashboard wired.',
      files: ['public/app.js'],
      tests: 'npm test',
      result: 'passed'
    });

    const current = relay.readJson(root, relay.CURRENT_TASK);
    assert.equal(current.status, 'needs_review');
    assert.equal(current.owner, 'claude');
    assert.equal(current.round, 1);
    assert.equal(current.last_handoff, handoff.path);
    assert.equal(fs.existsSync(path.join(root, handoff.path)), true);
  } finally {
    removeRoot(root);
  }
});

test('Claude needs_changes at max round requires human decision', () => {
  const root = makeRoot();
  try {
    relay.createTask(root, { title: 'Add router' });
    relay.createHandoff(root, {
      from: 'codex',
      to: 'claude',
      status: 'needs_review',
      summary: 'Round one ready.'
    });
    relay.createHandoff(root, {
      from: 'codex',
      to: 'claude',
      status: 'needs_review',
      summary: 'Round two ready.'
    });
    relay.createHandoff(root, {
      from: 'claude',
      to: 'codex',
      status: 'needs_changes',
      summary: 'Still not ready.'
    });

    const current = relay.readJson(root, relay.CURRENT_TASK);
    assert.equal(current.status, 'requires_human_decision');
    assert.equal(current.owner, 'human');
  } finally {
    removeRoot(root);
  }
});

test('validateAgentState reports a valid initialized workspace', () => {
  const root = makeRoot();
  try {
    relay.createTask(root, { title: 'Validate relay' });
    relay.createHandoff(root, {
      from: 'codex',
      to: 'claude',
      status: 'needs_review',
      summary: 'Ready for review.'
    });
    const validation = relay.validateAgentState(root);
    assert.equal(validation.ok, true);
    assert.deepEqual(validation.errors, []);
  } finally {
    removeRoot(root);
  }
});
