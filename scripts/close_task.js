#!/usr/bin/env node
const relay = require('../src/core/relay');

const taskId = process.argv[2];

try {
  const state = relay.closeTask(process.cwd(), taskId);
  console.log(`Closed ${state.task_id}`);
  console.log(`Archived at ${state.task_file}`);
} catch (error) {
  console.error(error.message);
  process.exit(1);
}
