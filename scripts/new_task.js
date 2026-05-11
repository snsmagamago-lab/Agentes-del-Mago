#!/usr/bin/env node
const relay = require('../src/core/relay');

const title = process.argv.slice(2).join(' ').trim();

if (!title) {
  console.error('Usage: npm run task:new -- "Task title"');
  process.exit(1);
}

try {
  const result = relay.createTask(process.cwd(), { title });
  console.log(`Created ${result.task_path}`);
  console.log(`Next branch: ${result.branch}`);
} catch (error) {
  console.error(error.message);
  process.exit(1);
}
