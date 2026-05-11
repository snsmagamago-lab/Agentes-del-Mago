const state = {
  data: null,
  toastTimer: null
};

const $ = (id) => document.getElementById(id);

function escapeHtml(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

async function api(path, options = {}) {
  const response = await fetch(path, {
    method: options.method || 'GET',
    headers: { 'content-type': 'application/json' },
    body: options.body ? JSON.stringify(options.body) : undefined
  });
  const payload = await response.json();
  if (!response.ok) throw new Error(payload.error || 'Request failed.');
  return payload;
}

function showToast(message) {
  const toast = $('toast');
  toast.textContent = message;
  toast.classList.add('show');
  clearTimeout(state.toastTimer);
  state.toastTimer = setTimeout(() => toast.classList.remove('show'), 3200);
}

function pillClass(status) {
  if (['approved', 'closed', 'valid', 'idle'].includes(status)) return 'pill good';
  if (['needs_review', 'needs_changes', 'queued', 'queued_review', 'in_progress', 'pending'].includes(status)) return 'pill warn';
  if (['blocked', 'requires_human_decision', 'invalid'].includes(status)) return 'pill bad';
  return 'pill neutral';
}

function setText(id, value) {
  $(id).textContent = value || '-';
}

function currentTask() {
  return state.data?.current_task || null;
}

async function refresh() {
  state.data = await api('/api/state');
  render();
}

function render() {
  const data = state.data;
  const task = data.current_task;
  const validation = data.validation;

  $('validationPill').textContent = validation.ok ? 'Valid' : 'Needs attention';
  $('validationPill').className = validation.ok ? 'pill good' : 'pill bad';

  setText('currentTitle', task ? `${task.task_id} - ${task.title}` : 'No task loaded');
  setText('taskStatus', task?.status || 'idle');
  $('taskStatus').className = pillClass(task?.status || 'idle');
  setText('currentOwner', task?.owner);
  setText('currentRound', task ? `${task.round || 0}/${task.max_rounds || 2}` : '-');
  setText('currentBranch', task?.branch);
  setText('currentNext', task?.next_action);

  const codex = data.codex_status || {};
  const claude = data.claude_status || {};
  setText('codexStatus', codex.status || 'idle');
  $('codexStatus').className = pillClass(codex.status || 'idle');
  setText('claudeStatus', claude.status || 'idle');
  $('claudeStatus').className = pillClass(claude.status || 'idle');
  $('codexSummary').textContent = codex.current_task
    ? `Task ${codex.current_task}. Branch ${codex.last_branch || 'not set'}. Last handoff ${codex.last_handoff || 'none'}.`
    : 'No Codex state yet.';
  $('claudeSummary').textContent = claude.current_task
    ? `Task ${claude.current_task}. Decision ${claude.decision || 'pending'}. Last review ${claude.last_review || 'none'}.`
    : 'No Claude state yet.';

  $('sharedBriefInput').value = data.shared_brief || '';
  $('codexInbox').textContent = data.codex_inbox || 'No Codex inbox yet.';
  $('claudeInbox').textContent = data.claude_inbox || 'No Claude inbox yet.';
  $('activityLog').textContent = data.activity_log || 'No activity yet.';

  renderTasks(data.tasks || []);
  renderHandoffs(data.handoffs || []);
  renderGit(data.git || {});
}

function renderTasks(tasks) {
  const box = $('taskList');
  if (!tasks.length) {
    box.innerHTML = '<p class="muted">No tasks yet.</p>';
    return;
  }
  box.innerHTML = tasks.map((task) => `
    <article class="item">
      <strong>${escapeHtml(task.task_id)} - ${escapeHtml(task.title)}</strong>
      <small>${escapeHtml(task.path)}</small>
      <span class="${pillClass(task.status)}">${escapeHtml(task.status)}</span>
    </article>
  `).join('');
}

function renderHandoffs(handoffs) {
  const box = $('handoffList');
  if (!handoffs.length) {
    box.innerHTML = '<p class="muted">No handoffs yet.</p>';
    return;
  }
  box.innerHTML = handoffs.map((handoff) => `
    <article class="item">
      <strong>${escapeHtml(handoff.name)}</strong>
      <small>${escapeHtml(handoff.path)}</small>
      <span class="${pillClass(handoff.status)}">${escapeHtml(handoff.status || 'recorded')}</span>
    </article>
  `).join('');
}

function renderGit(git) {
  const box = $('gitBox');
  if (!git.initialized) {
    box.innerHTML = '<div><strong>Git:</strong> not initialized yet.</div>';
    return;
  }
  const dirty = git.status ? `<pre class="activity-log">${escapeHtml(git.status)}</pre>` : '<div>Working tree clean.</div>';
  box.innerHTML = `
    <div><strong>Branch:</strong> ${escapeHtml(git.branch || '-')}</div>
    <div><strong>Remote:</strong> ${escapeHtml(git.remote || '-')}</div>
    ${dirty}
    <div><strong>Recent commits:</strong> ${escapeHtml((git.commits || []).join(' | ') || '-')}</div>
  `;
}

function requireTaskId() {
  const task = currentTask();
  if (!task?.task_id) throw new Error('Create or select a task first.');
  return task.task_id;
}

async function handleNewTask(event) {
  event.preventDefault();
  const title = $('taskTitleInput').value.trim();
  const objective = $('taskObjectiveInput').value.trim();
  await api('/api/tasks', {
    method: 'POST',
    body: { title, objective }
  });
  $('taskTitleInput').value = '';
  $('taskObjectiveInput').value = '';
  showToast('Task created.');
  await refresh();
}

async function handleHandoff(event) {
  event.preventDefault();
  const from = $('handoffFrom').value;
  const to = from === 'codex' ? 'claude' : 'codex';
  await api('/api/handoff', {
    method: 'POST',
    body: {
      task_id: requireTaskId(),
      from,
      to,
      status: $('handoffStatus').value,
      summary: $('handoffSummary').value,
      files: $('handoffFiles').value,
      tests: $('handoffTests').value,
      result: $('handoffTests').value ? 'pending manual confirmation' : 'not run',
      recommended_next_action: $('handoffNext').value
    }
  });
  $('handoffSummary').value = '';
  $('handoffFiles').value = '';
  $('handoffTests').value = '';
  $('handoffNext').value = '';
  showToast('Handoff saved.');
  await refresh();
}

async function postAction(path, body, message) {
  await api(path, { method: 'POST', body });
  showToast(message);
  await refresh();
}

function wireEvents() {
  $('refreshBtn').addEventListener('click', () => refresh().catch(showToast));
  $('validateBtn').addEventListener('click', async () => {
    const result = await api('/api/validate', { method: 'POST', body: {} });
    showToast(result.ok ? 'Agent state is valid.' : `Validation failed: ${result.errors.join('; ')}`);
    await refresh();
  });
  $('newTaskForm').addEventListener('submit', (event) => handleNewTask(event).catch((error) => showToast(error.message)));
  $('handoffForm').addEventListener('submit', (event) => handleHandoff(event).catch((error) => showToast(error.message)));
  $('saveBriefBtn').addEventListener('click', () => postAction('/api/shared-brief', {
    content: $('sharedBriefInput').value
  }, 'Shared brief saved.').catch((error) => showToast(error.message)));
  $('startCodexBtn').addEventListener('click', () => postAction('/api/start-codex', {
    task_id: requireTaskId()
  }, 'Codex inbox prepared.').catch((error) => showToast(error.message)));
  $('startClaudeBtn').addEventListener('click', () => postAction('/api/start-claude', {
    task_id: requireTaskId()
  }, 'Claude inbox prepared.').catch((error) => showToast(error.message)));
  $('routeBtn').addEventListener('click', () => postAction('/api/route', {}, 'Latest handoff routed.').catch((error) => showToast(error.message)));
  $('closeTaskBtn').addEventListener('click', () => {
    const taskId = requireTaskId();
    const ok = window.confirm(`Close and archive ${taskId}?`);
    if (!ok) return;
    postAction('/api/close-task', { task_id: taskId }, `${taskId} archived.`).catch((error) => showToast(error.message));
  });
  document.querySelectorAll('.copy-btn').forEach((button) => {
    button.addEventListener('click', async () => {
      await navigator.clipboard.writeText(button.dataset.copy);
      showToast('Command copied.');
    });
  });
}

wireEvents();
refresh().catch((error) => showToast(error.message));
setInterval(() => refresh().catch(() => {}), 5000);
