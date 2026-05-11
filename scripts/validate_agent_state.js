#!/usr/bin/env node
const relay = require('../src/core/relay');

const result = relay.validateAgentState(process.cwd());

if (result.ok) {
  console.log('Agent state is valid.');
  for (const warning of result.warnings) console.log(`Warning: ${warning}`);
  process.exit(0);
}

console.error('Agent state is invalid.');
for (const error of result.errors) console.error(`Error: ${error}`);
for (const warning of result.warnings) console.error(`Warning: ${warning}`);
process.exit(1);
