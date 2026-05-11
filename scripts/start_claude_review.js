#!/usr/bin/env node
const relay = require('../src/core/relay');

const taskId = process.argv[2];

try {
  const state = relay.startClaudeReview(process.cwd(), taskId);
  console.log(`Claude review inbox prepared for ${state.task_id}`);
  console.log(`Read .agents/inbox/claude_next_review.md`);
} catch (error) {
  console.error(error.message);
  process.exit(1);
}
