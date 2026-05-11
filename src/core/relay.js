const fs = require('node:fs');
const path = require('node:path');
const { execFileSync } = require('node:child_process');

const CURRENT_TASK = '.agents/status/current_task.json';
const CODEX_STATUS = '.agents/status/codex_status.json';
const CLAUDE_STATUS = '.agents/status/claude_status.json';
const ACTIVITY_LOG = '.agents/logs/agent_activity.md';
const SHARED_BRIEF = '.agents/inbox/shared_brief.md';

const ALLOWED_STATUSES = new Set([
  'pending',
  'in_progress',
  'needs_review',
  'needs_changes',
  'approved',
  'blocked',
  'requires_human_decision',
  'closed'
]);

function rootOf(value = process.cwd()) {
  return path.resolve(value);
}

function toPosix(value) {
  return value.replace(/\\/g, '/');
}

function ensureInsideRoot(root, relativePath) {
  if (!relativePath || path.isAbsolute(relativePath)) {
    throw new Error('Path must be relative to the workspace.');
  }
  const resolved = path.resolve(root, relativePath);
  const normalizedRoot = path.resolve(root);
  if (resolved !== normalizedRoot && !resolved.startsWith(normalizedRoot + path.sep)) {
    throw new Error(`Refusing to access outside workspace: ${relativePath}`);
  }
  return resolved;
}

function ensureDir(root, relativePath) {
  fs.mkdirSync(ensureInsideRoot(root, relativePath), { recursive: true });
}

function writeText(root, relativePath, content) {
  const target = ensureInsideRoot(root, relativePath);
  fs.mkdirSync(path.dirname(target), { recursive: true });
  fs.writeFileSync(target, content, 'utf8');
}

function appendText(root, relativePath, content) {
  const target = ensureInsideRoot(root, relativePath);
  fs.mkdirSync(path.dirname(target), { recursive: true });
  fs.appendFileSync(target, content, 'utf8');
}

function readText(root, relativePath, fallback = '') {
  const target = ensureInsideRoot(root, relativePath);
  if (!fs.existsSync(target)) return fallback;
  return fs.readFileSync(target, 'utf8');
}

function writeJson(root, relativePath, value) {
  writeText(root, relativePath, `${JSON.stringify(value, null, 2)}\n`);
}

function readJson(root, relativePath, fallback = null) {
  const raw = readText(root, relativePath, '');
  if (!raw.trim()) return fallback;
  return JSON.parse(raw);
}

function fileExists(root, relativePath) {
  return fs.existsSync(ensureInsideRoot(root, relativePath));
}

function slugify(title, separator = '-') {
  const normalized = String(title || '')
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, separator)
    .replace(new RegExp(`^${separator}+|${separator}+$`, 'g'), '');
  return normalized.slice(0, 70) || 'task';
}

function taskFileSlug(title) {
  return slugify(title, '_');
}

function parseTaskHeading(markdown, fallbackName) {
  const match = markdown.match(/^#\s+(T\d{3,})\s+-\s+(.+)$/m);
  if (match) {
    return { task_id: match[1], title: match[2].trim() };
  }
  const id = fallbackName.match(/(T\d{3,})/i)?.[1]?.toUpperCase() || 'T000';
  return { task_id: id, title: fallbackName.replace(/\.md$/i, '') };
}

function listMarkdownFiles(root, relativeDir) {
  const dir = ensureInsideRoot(root, relativeDir);
  if (!fs.existsSync(dir)) return [];
  return fs.readdirSync(dir)
    .filter((entry) => entry.toLowerCase().endsWith('.md'))
    .sort((a, b) => a.localeCompare(b))
    .map((entry) => toPosix(path.join(relativeDir, entry)));
}

function getTaskFiles(root, includeArchive = false) {
  const active = listMarkdownFiles(root, 'tasks').filter((file) => !file.includes('/archive/'));
  if (!includeArchive) return active;
  return active.concat(listMarkdownFiles(root, 'tasks/archive'));
}

function getNextTaskId(root) {
  const ids = new Set();
  for (const file of getTaskFiles(root, true)) {
    const match = path.basename(file).match(/^T(\d{3,})/i);
    if (match) ids.add(Number(match[1]));
  }
  const current = readJson(root, CURRENT_TASK, null);
  const currentMatch = current?.task_id?.match(/^T(\d{3,})$/i);
  if (currentMatch) ids.add(Number(currentMatch[1]));
  const next = ids.size ? Math.max(...ids) + 1 : 1;
  return `T${String(next).padStart(3, '0')}`;
}

function appendActivity(root, message) {
  const stamp = new Date().toISOString();
  appendText(root, ACTIVITY_LOG, `- ${stamp} - ${message}\n`);
}

function ensureBaseStructure(root) {
  [
    'docs',
    'tasks/archive',
    '.agents/inbox',
    '.agents/handoff',
    '.agents/status',
    '.agents/logs',
    '.agents/templates',
    'scripts',
    'src/core',
    'public',
    'tests',
    '.github/workflows'
  ].forEach((dir) => ensureDir(root, dir));

  if (!fileExists(root, ACTIVITY_LOG)) {
    writeText(root, ACTIVITY_LOG, '# Agent Activity\n\n');
  }
}

function formatList(items, fallback = '- TBD') {
  const clean = (Array.isArray(items) ? items : String(items || '').split(/\r?\n/))
    .map((item) => String(item).trim())
    .filter(Boolean);
  if (!clean.length) return fallback;
  return clean.map((item) => `- ${item.replace(/^-+\s*/, '')}`).join('\n');
}

function formatChecklist(items) {
  const clean = (Array.isArray(items) ? items : String(items || '').split(/\r?\n/))
    .map((item) => String(item).trim())
    .filter(Boolean);
  const values = clean.length ? clean : [
    'Implementation completed.',
    'Tests added or updated.',
    'Documentation updated if needed.',
    'Handoff file created.',
    'No unrelated files modified.'
  ];
  return values.map((item) => {
    const text = item.replace(/^-+\s*/, '').replace(/^\[[ xX]\]\s*/, '');
    return `- [ ] ${text}`;
  }).join('\n');
}

function createTask(rootInput, input) {
  const root = rootOf(rootInput);
  ensureBaseStructure(root);

  const title = String(input.title || '').trim();
  if (!title) throw new Error('Task title is required.');

  const taskId = input.task_id || getNextTaskId(root);
  const fileSlug = taskFileSlug(title);
  const branchSlug = slugify(title, '-');
  const taskPath = `tasks/${taskId}_${fileSlug}.md`;
  if (fileExists(root, taskPath)) {
    throw new Error(`Task already exists: ${taskPath}`);
  }

  const taskContent = `# ${taskId} - ${title}

## Objective

${String(input.objective || 'Describe the final expected result.').trim()}

## Context

${String(input.context || 'Add context here.').trim()}

## Relevant Files

${formatList(input.relevant_files)}

## Requirements

${formatList(input.requirements)}

## Acceptance Criteria

${formatChecklist(input.acceptance_criteria)}

## Suggested Agent

\`\`\`txt
Codex
\`\`\`

## Review Agent

\`\`\`txt
Claude
\`\`\`

## Notes

${String(input.notes || 'No extra notes yet.').trim()}
`;

  const branch = `agent/codex/${taskId}-${branchSlug}`;
  const state = {
    task_id: taskId,
    title,
    status: 'pending',
    owner: 'codex',
    branch,
    round: 0,
    max_rounds: Number(input.max_rounds || process.env.MAX_AGENT_ROUNDS || 2),
    last_handoff: null,
    next_action: 'codex_implementation',
    task_file: taskPath,
    updated_at: new Date().toISOString()
  };

  writeText(root, taskPath, taskContent);
  writeJson(root, CURRENT_TASK, state);
  writeJson(root, CODEX_STATUS, {
    agent: 'codex',
    current_task: taskId,
    status: 'queued',
    last_branch: branch,
    last_commit: '',
    last_handoff: null,
    updated_at: new Date().toISOString()
  });
  writeJson(root, CLAUDE_STATUS, {
    agent: 'claude',
    current_task: taskId,
    status: 'idle',
    last_review: null,
    decision: null,
    updated_at: new Date().toISOString()
  });
  writeText(root, '.agents/inbox/codex_next_task.md', codexInbox(state));
  appendActivity(root, `Created ${taskId}: ${title}`);
  return { task_id: taskId, task_path: taskPath, branch, state };
}

function codexInbox(state) {
  return `# Next Codex Task

Task: ${state.task_id}
Branch: ${state.branch}

Read:
- AGENTS.md
- ${state.task_file || `tasks/${state.task_id}.md`}
- .agents/inbox/shared_brief.md

Expected output:
- Implementation
- Tests
- Updated documentation when needed
- Handoff file in .agents/handoff/

Finish by running:

\`\`\`bash
npm test
npm run agent:validate
\`\`\`
`;
}

function claudeInbox(state) {
  const handoff = state.last_handoff || `.agents/handoff/codex_to_claude_${state.task_id}.md`;
  return `# Next Claude Review

Task: ${state.task_id}
Branch to review: ${state.branch}

Read:
- AGENTS.md
- ${state.task_file || `tasks/${state.task_id}.md`}
- ${handoff}
- .agents/inbox/shared_brief.md

Expected output:
- Review notes
- Required fixes or approval
- Handoff file in .agents/handoff/

Suggested local command:

\`\`\`bash
npm run agent:claude ${state.task_id}
\`\`\`
`;
}

function findTask(root, taskId) {
  const upper = String(taskId || '').toUpperCase();
  for (const file of getTaskFiles(root, true)) {
    if (path.basename(file).toUpperCase().startsWith(upper)) {
      const text = readText(root, file);
      return { path: file, text, ...parseTaskHeading(text, path.basename(file)) };
    }
  }
  return null;
}

function startCodexTask(rootInput, taskIdInput) {
  const root = rootOf(rootInput);
  const current = readJson(root, CURRENT_TASK, null);
  const taskId = taskIdInput || current?.task_id;
  if (!taskId) throw new Error('No task id was provided and no current task exists.');
  const task = findTask(root, taskId);
  if (!task) throw new Error(`Task not found: ${taskId}`);
  const branch = current?.branch || `agent/codex/${task.task_id}-${slugify(task.title)}`;
  const state = {
    ...(current || {}),
    task_id: task.task_id,
    title: task.title,
    status: 'in_progress',
    owner: 'codex',
    branch,
    task_file: task.path,
    next_action: 'codex_implementation',
    updated_at: new Date().toISOString()
  };
  writeJson(root, CURRENT_TASK, state);
  writeJson(root, CODEX_STATUS, {
    agent: 'codex',
    current_task: task.task_id,
    status: 'in_progress',
    last_branch: branch,
    last_commit: gitOutput(root, ['rev-parse', '--short', 'HEAD']).trim(),
    last_handoff: current?.last_handoff || null,
    updated_at: new Date().toISOString()
  });
  writeText(root, '.agents/inbox/codex_next_task.md', codexInbox(state));
  appendActivity(root, `Prepared Codex inbox for ${task.task_id}`);
  return state;
}

function startClaudeReview(rootInput, taskIdInput) {
  const root = rootOf(rootInput);
  const current = readJson(root, CURRENT_TASK, null);
  const taskId = taskIdInput || current?.task_id;
  if (!taskId) throw new Error('No task id was provided and no current task exists.');
  const task = findTask(root, taskId);
  if (!task) throw new Error(`Task not found: ${taskId}`);
  const latestHandoff = latestHandoffFor(root, 'codex', 'claude', task.task_id);
  const state = {
    ...(current || {}),
    task_id: task.task_id,
    title: task.title,
    status: 'needs_review',
    owner: 'claude',
    task_file: task.path,
    last_handoff: latestHandoff || current?.last_handoff || null,
    next_action: 'claude_review',
    updated_at: new Date().toISOString()
  };
  writeJson(root, CURRENT_TASK, state);
  writeJson(root, CLAUDE_STATUS, {
    agent: 'claude',
    current_task: task.task_id,
    status: 'queued_review',
    last_review: null,
    decision: null,
    updated_at: new Date().toISOString()
  });
  writeText(root, '.agents/inbox/claude_next_review.md', claudeInbox(state));
  appendActivity(root, `Prepared Claude review inbox for ${task.task_id}`);
  return state;
}

function latestHandoffFor(root, from, to, taskId) {
  const prefix = `${from}_to_${to}_${taskId}`;
  const files = listMarkdownFiles(root, '.agents/handoff')
    .filter((file) => path.basename(file).startsWith(prefix))
    .sort((a, b) => fs.statSync(ensureInsideRoot(root, b)).mtimeMs - fs.statSync(ensureInsideRoot(root, a)).mtimeMs);
  return files[0] || null;
}

function nextHandoffName(root, from, to, taskId, round, status) {
  if (from === 'claude' && status === 'approved') return `.agents/handoff/claude_final_review_${taskId}.md`;
  const base = `${from}_to_${to}_${taskId}`;
  if (round && Number(round) > 1) return `.agents/handoff/${base}_round${round}.md`;
  return `.agents/handoff/${base}.md`;
}

function cleanLines(value) {
  return (Array.isArray(value) ? value : String(value || '').split(/\r?\n/))
    .map((line) => String(line).trim())
    .filter(Boolean);
}

function createHandoff(rootInput, input) {
  const root = rootOf(rootInput);
  const from = String(input.from || '').toLowerCase();
  const to = String(input.to || (from === 'codex' ? 'claude' : 'codex')).toLowerCase();
  if (!['codex', 'claude'].includes(from) || !['codex', 'claude'].includes(to) || from === to) {
    throw new Error('Handoff must be from codex to claude or claude to codex.');
  }

  const current = readJson(root, CURRENT_TASK, null);
  const taskId = String(input.task_id || current?.task_id || '').toUpperCase();
  if (!taskId) throw new Error('Task id is required.');
  const task = findTask(root, taskId);
  if (!task) throw new Error(`Task not found: ${taskId}`);

  let nextRound = Number(current?.round || 0);
  if (from === 'codex') nextRound += 1;
  if (!nextRound) nextRound = 1;

  const maxRounds = Number(current?.max_rounds || process.env.MAX_AGENT_ROUNDS || 2);
  const requestedStatus = String(input.status || (from === 'codex' ? 'needs_review' : 'needs_changes')).trim();
  const status = requestedStatus === 'needs_changes' && nextRound >= maxRounds
    ? 'requires_human_decision'
    : requestedStatus;

  if (!ALLOWED_STATUSES.has(status)) throw new Error(`Invalid status: ${status}`);

  const handoffPath = input.path || nextHandoffName(root, from, to, task.task_id, nextRound, status);
  const files = cleanLines(input.files);
  const tests = String(input.tests || 'not run').trim();
  const result = String(input.result || 'not run').trim();
  const notes = cleanLines(input.notes);
  const risks = cleanLines(input.risks);
  const questions = cleanLines(input.questions);
  const summaryHeading = from === 'claude' ? 'Review Summary' : 'Summary of Work';
  const required = cleanLines(input.required_changes);
  const optional = cleanLines(input.optional_suggestions);

  const content = `# Handoff: ${capitalize(from)} -> ${capitalize(to)}

## Task

${task.task_id} - ${task.title}

## Current Status

\`\`\`txt
${status}
\`\`\`

## ${summaryHeading}

${String(input.summary || 'No summary provided.').trim()}

${from === 'claude' ? `## Required Changes

${formatList(required, '- None')}

## Optional Suggestions

${formatList(optional, '- None')}

` : ''}## Files Modified

${formatList(files, '- None listed')}

## Tests Run

\`\`\`bash
${tests}
\`\`\`

Result:

\`\`\`txt
${result}
\`\`\`

## Important Notes

${formatList(notes, '- None')}

## Risks

${formatList(risks, '- None')}

## Questions for Next Agent

${formatList(questions, '- None')}

## Recommended Next Action

${String(input.recommended_next_action || defaultNextAction(from, status)).trim()}
`;

  writeText(root, handoffPath, content);

  const nextOwner = status === 'approved' || status === 'blocked' || status === 'requires_human_decision'
    ? 'human'
    : to;
  const nextAction = status === 'needs_review'
    ? 'claude_review'
    : status === 'needs_changes'
      ? 'codex_fix'
      : status === 'approved'
        ? 'human_merge'
        : 'human_decision';

  const state = {
    ...(current || {}),
    task_id: task.task_id,
    title: task.title,
    status,
    owner: nextOwner,
    branch: current?.branch || `agent/codex/${task.task_id}-${slugify(task.title)}`,
    round: nextRound,
    max_rounds: maxRounds,
    task_file: task.path,
    last_handoff: handoffPath,
    next_action: nextAction,
    updated_at: new Date().toISOString()
  };
  writeJson(root, CURRENT_TASK, state);

  if (from === 'codex') {
    writeJson(root, CODEX_STATUS, {
      agent: 'codex',
      current_task: task.task_id,
      status: 'idle',
      last_branch: state.branch,
      last_commit: gitOutput(root, ['rev-parse', '--short', 'HEAD']).trim(),
      last_handoff: handoffPath,
      updated_at: new Date().toISOString()
    });
    writeText(root, '.agents/inbox/claude_next_review.md', claudeInbox(state));
  } else {
    writeJson(root, CLAUDE_STATUS, {
      agent: 'claude',
      current_task: task.task_id,
      status: 'idle',
      last_review: handoffPath,
      decision: status,
      updated_at: new Date().toISOString()
    });
    if (status === 'needs_changes') {
      writeText(root, '.agents/inbox/codex_next_task.md', codexInbox(state));
    }
  }

  appendActivity(root, `${capitalize(from)} created handoff for ${task.task_id}: ${status}`);
  return { path: handoffPath, state, content };
}

function defaultNextAction(from, status) {
  if (from === 'codex') return 'Claude should review the task, changed files, tests, and handoff.';
  if (status === 'approved') return 'Human user should review the PR and decide whether to merge.';
  if (status === 'needs_changes') return 'Codex should apply required changes and create a new handoff.';
  return 'Human user should decide the next step.';
}

function capitalize(value) {
  return value.charAt(0).toUpperCase() + value.slice(1);
}

function closeTask(rootInput, taskIdInput) {
  const root = rootOf(rootInput);
  const current = readJson(root, CURRENT_TASK, null);
  const taskId = String(taskIdInput || current?.task_id || '').toUpperCase();
  if (!taskId) throw new Error('Task id is required.');
  const task = findTask(root, taskId);
  if (!task) throw new Error(`Task not found: ${taskId}`);
  if (task.path.includes('tasks/archive/')) {
    throw new Error(`${taskId} is already archived.`);
  }
  const archivePath = toPosix(path.join('tasks/archive', path.basename(task.path)));
  fs.renameSync(ensureInsideRoot(root, task.path), ensureInsideRoot(root, archivePath));
  const closed = {
    ...(current || {}),
    task_id: task.task_id,
    title: task.title,
    status: 'closed',
    owner: 'human',
    task_file: archivePath,
    next_action: 'closed',
    updated_at: new Date().toISOString()
  };
  writeJson(root, CURRENT_TASK, closed);
  appendActivity(root, `Closed and archived ${task.task_id}`);
  return closed;
}

function validateAgentState(rootInput) {
  const root = rootOf(rootInput);
  const errors = [];
  const warnings = [];
  const required = ['AGENTS.md', CURRENT_TASK, CODEX_STATUS, CLAUDE_STATUS, ACTIVITY_LOG];

  for (const file of required) {
    if (!fileExists(root, file)) errors.push(`Missing required file: ${file}`);
  }

  let current = null;
  try {
    current = readJson(root, CURRENT_TASK, null);
  } catch (error) {
    errors.push(`Invalid JSON in ${CURRENT_TASK}: ${error.message}`);
  }

  if (current) {
    if (!current.task_id) errors.push('current_task.json is missing task_id.');
    if (!ALLOWED_STATUSES.has(current.status)) errors.push(`Invalid task status: ${current.status}`);
    if (current.task_file && !fileExists(root, current.task_file)) errors.push(`Task file does not exist: ${current.task_file}`);
    if (current.status === 'needs_review' && !current.last_handoff) {
      errors.push('Task needs review but last_handoff is empty.');
    }
    if (current.last_handoff && !fileExists(root, current.last_handoff)) {
      errors.push(`Registered handoff does not exist: ${current.last_handoff}`);
    }
    if (Number(current.round || 0) > Number(current.max_rounds || 2)) {
      errors.push('Task round exceeds max_rounds.');
    }
    if (current.status === 'requires_human_decision') {
      warnings.push('Task is waiting for human decision.');
    }
  }

  if (!fileExists(root, SHARED_BRIEF)) warnings.push('Shared brief does not exist yet.');
  return { ok: errors.length === 0, errors, warnings };
}

function listTasks(rootInput) {
  const root = rootOf(rootInput);
  const current = readJson(root, CURRENT_TASK, null);
  return getTaskFiles(root, true).map((file) => {
    const text = readText(root, file);
    const heading = parseTaskHeading(text, path.basename(file));
    const stats = fs.statSync(ensureInsideRoot(root, file));
    return {
      ...heading,
      path: file,
      archived: file.includes('tasks/archive/'),
      active: current?.task_id === heading.task_id,
      status: current?.task_id === heading.task_id ? current.status : (file.includes('tasks/archive/') ? 'closed' : 'backlog'),
      updated_at: stats.mtime.toISOString()
    };
  }).sort((a, b) => a.task_id.localeCompare(b.task_id));
}

function listHandoffs(rootInput) {
  const root = rootOf(rootInput);
  return listMarkdownFiles(root, '.agents/handoff').map((file) => {
    const text = readText(root, file);
    const stats = fs.statSync(ensureInsideRoot(root, file));
    const status = text.match(/```txt\s+([\s\S]*?)```/m)?.[1]?.trim() || '';
    return {
      path: file,
      name: path.basename(file),
      status,
      preview: text.split(/\r?\n/).slice(0, 12).join('\n'),
      updated_at: stats.mtime.toISOString()
    };
  }).sort((a, b) => new Date(b.updated_at) - new Date(a.updated_at));
}

function gitOutput(root, args) {
  try {
    return execFileSync('git', args, { cwd: root, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] });
  } catch {
    return '';
  }
}

function getGitInfo(rootInput) {
  const root = rootOf(rootInput);
  const initialized = fs.existsSync(path.join(root, '.git'));
  if (!initialized) return { initialized: false, branch: null, remote: null, status: '', commits: [] };
  return {
    initialized: true,
    branch: gitOutput(root, ['branch', '--show-current']).trim() || 'detached',
    remote: gitOutput(root, ['remote', 'get-url', 'origin']).trim() || null,
    status: gitOutput(root, ['status', '--short']).trim(),
    commits: gitOutput(root, ['log', '--oneline', '-5']).trim().split(/\r?\n/).filter(Boolean)
  };
}

function readWorkspaceState(rootInput) {
  const root = rootOf(rootInput);
  ensureBaseStructure(root);
  return {
    current_task: readJson(root, CURRENT_TASK, null),
    codex_status: readJson(root, CODEX_STATUS, null),
    claude_status: readJson(root, CLAUDE_STATUS, null),
    shared_brief: readText(root, SHARED_BRIEF, ''),
    codex_inbox: readText(root, '.agents/inbox/codex_next_task.md', ''),
    claude_inbox: readText(root, '.agents/inbox/claude_next_review.md', ''),
    activity_log: readText(root, ACTIVITY_LOG, ''),
    validation: validateAgentState(root),
    git: getGitInfo(root),
    tasks: listTasks(root),
    handoffs: listHandoffs(root)
  };
}

function updateSharedBrief(rootInput, content) {
  const root = rootOf(rootInput);
  const next = `# Shared Brief

Updated: ${new Date().toISOString()}

${String(content || '').trim() || 'No shared instructions yet.'}
`;
  writeText(root, SHARED_BRIEF, next);
  appendActivity(root, 'Updated shared brief for both agents');
  return next;
}

function routeLatestHandoff(rootInput) {
  const root = rootOf(rootInput);
  const current = readJson(root, CURRENT_TASK, null);
  if (!current?.task_id) throw new Error('No current task to route.');
  const handoffs = listHandoffs(root).filter((handoff) => handoff.name.includes(current.task_id));
  if (!handoffs.length) throw new Error(`No handoffs found for ${current.task_id}.`);
  const latest = handoffs[0];
  const text = readText(root, latest.path);
  const from = /# Handoff:\s+(Codex|Claude)\s+->\s+(Codex|Claude)/i.exec(text);
  const status = latest.status || current.status;
  const state = {
    ...current,
    status,
    owner: from?.[2]?.toLowerCase() || current.owner,
    last_handoff: latest.path,
    next_action: status === 'needs_review' ? 'claude_review' : status === 'needs_changes' ? 'codex_fix' : 'human_decision',
    updated_at: new Date().toISOString()
  };
  writeJson(root, CURRENT_TASK, state);
  appendActivity(root, `Routed latest handoff ${latest.name}`);
  return state;
}

module.exports = {
  ALLOWED_STATUSES,
  ACTIVITY_LOG,
  CLAUDE_STATUS,
  CODEX_STATUS,
  CURRENT_TASK,
  SHARED_BRIEF,
  appendActivity,
  closeTask,
  createHandoff,
  createTask,
  ensureBaseStructure,
  ensureInsideRoot,
  fileExists,
  findTask,
  getGitInfo,
  getNextTaskId,
  listHandoffs,
  listTasks,
  readJson,
  readText,
  readWorkspaceState,
  routeLatestHandoff,
  slugify,
  startClaudeReview,
  startCodexTask,
  taskFileSlug,
  updateSharedBrief,
  validateAgentState,
  writeJson,
  writeText
};
