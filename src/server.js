const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');
const { URL } = require('node:url');

const relay = require('./core/relay');

const ROOT = path.resolve(__dirname, '..');
const PUBLIC_DIR = path.join(ROOT, 'public');
const DEFAULT_PORT = Number(process.env.PORT || 5177);

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon'
};

function sendJson(res, statusCode, body) {
  const payload = JSON.stringify(body, null, 2);
  res.writeHead(statusCode, {
    'content-type': 'application/json; charset=utf-8',
    'cache-control': 'no-store'
  });
  res.end(payload);
}

function sendText(res, statusCode, text, contentType = 'text/plain; charset=utf-8') {
  res.writeHead(statusCode, {
    'content-type': contentType,
    'cache-control': 'no-store'
  });
  res.end(text);
}

function readBody(req) {
  return new Promise((resolve, reject) => {
    let raw = '';
    req.on('data', (chunk) => {
      raw += chunk;
      if (raw.length > 1024 * 1024) {
        reject(new Error('Request body is too large.'));
        req.destroy();
      }
    });
    req.on('end', () => {
      if (!raw.trim()) return resolve({});
      try {
        resolve(JSON.parse(raw));
      } catch (error) {
        reject(new Error(`Invalid JSON body: ${error.message}`));
      }
    });
    req.on('error', reject);
  });
}

function serveStatic(req, res, url) {
  const pathname = url.pathname === '/' ? '/index.html' : url.pathname;
  const decoded = decodeURIComponent(pathname);
  const target = path.resolve(PUBLIC_DIR, `.${decoded}`);
  if (target !== PUBLIC_DIR && !target.startsWith(PUBLIC_DIR + path.sep)) {
    return sendText(res, 403, 'Forbidden');
  }
  if (!fs.existsSync(target) || fs.statSync(target).isDirectory()) {
    return sendText(res, 404, 'Not found');
  }
  const ext = path.extname(target).toLowerCase();
  res.writeHead(200, {
    'content-type': MIME[ext] || 'application/octet-stream',
    'cache-control': 'no-store'
  });
  fs.createReadStream(target).pipe(res);
}

async function handleApi(req, res, url) {
  try {
    if (req.method === 'GET' && url.pathname === '/api/state') {
      return sendJson(res, 200, relay.readWorkspaceState(ROOT));
    }

    if (req.method === 'GET' && url.pathname === '/api/file') {
      const file = url.searchParams.get('path');
      if (!file) return sendJson(res, 400, { error: 'Missing path.' });
      return sendJson(res, 200, { path: file, content: relay.readText(ROOT, file, '') });
    }

    if (req.method !== 'POST') {
      return sendJson(res, 405, { error: 'Method not allowed.' });
    }

    const body = await readBody(req);

    if (url.pathname === '/api/tasks') {
      return sendJson(res, 201, relay.createTask(ROOT, body));
    }

    if (url.pathname === '/api/start-codex') {
      return sendJson(res, 200, relay.startCodexTask(ROOT, body.task_id));
    }

    if (url.pathname === '/api/start-claude') {
      return sendJson(res, 200, relay.startClaudeReview(ROOT, body.task_id));
    }

    if (url.pathname === '/api/handoff') {
      return sendJson(res, 201, relay.createHandoff(ROOT, body));
    }

    if (url.pathname === '/api/shared-brief') {
      return sendJson(res, 200, { content: relay.updateSharedBrief(ROOT, body.content || '') });
    }

    if (url.pathname === '/api/validate') {
      return sendJson(res, 200, relay.validateAgentState(ROOT));
    }

    if (url.pathname === '/api/route') {
      return sendJson(res, 200, relay.routeLatestHandoff(ROOT));
    }

    if (url.pathname === '/api/close-task') {
      return sendJson(res, 200, relay.closeTask(ROOT, body.task_id));
    }

    return sendJson(res, 404, { error: 'API route not found.' });
  } catch (error) {
    return sendJson(res, 400, { error: error.message });
  }
}

function createServer() {
  relay.ensureBaseStructure(ROOT);
  return http.createServer((req, res) => {
    const url = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
    if (url.pathname.startsWith('/api/')) {
      handleApi(req, res, url);
      return;
    }
    serveStatic(req, res, url);
  });
}

function listenWithFallback(server, port, attempts = 20) {
  return new Promise((resolve, reject) => {
    function tryPort(nextPort, remaining) {
      server.once('error', (error) => {
        if (error.code === 'EADDRINUSE' && remaining > 0) {
          server.removeAllListeners('error');
          tryPort(nextPort + 1, remaining - 1);
        } else {
          reject(error);
        }
      });
      server.listen(nextPort, '127.0.0.1', () => resolve(nextPort));
    }
    tryPort(port, attempts);
  });
}

if (require.main === module) {
  const server = createServer();
  listenWithFallback(server, DEFAULT_PORT)
    .then((port) => {
      const infoPath = path.join(ROOT, '.relayrepo-server.json');
      fs.writeFileSync(infoPath, JSON.stringify({
        url: `http://127.0.0.1:${port}`,
        pid: process.pid,
        started_at: new Date().toISOString()
      }, null, 2));
      console.log(`RelayRepo dashboard running at http://127.0.0.1:${port}`);
    })
    .catch((error) => {
      console.error(error.message);
      process.exit(1);
    });
}

module.exports = { createServer };
