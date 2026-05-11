#!/usr/bin/env node
const relay = require('../src/core/relay');

const taskId = process.argv[2];

try {
  const state = relay.startCodexTask(process.cwd(), taskId);
  console.log(`Codex inbox prepared for ${state.task_id}`);
  console.log(`Read .agents/inbox/codex_next_task.md`);
} catch (error) {
  console.error(error.message);
  process.exit(1);
}
