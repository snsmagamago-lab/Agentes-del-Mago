#!/usr/bin/env node
const relay = require('../src/core/relay');

try {
  const state = relay.routeLatestHandoff(process.cwd());
  console.log(`Routed latest handoff for ${state.task_id}`);
  console.log(`Status: ${state.status}`);
  console.log(`Owner: ${state.owner}`);
} catch (error) {
  console.error(error.message);
  process.exit(1);
}
