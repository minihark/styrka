import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { DatabaseSync } from 'node:sqlite';
import sirv from 'sirv';

const PORT = Number(process.env.PORT) || 80;

// Ensure data directory exists for SQLite database
const DATA_DIR = path.resolve('data');
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

const DB_PATH = path.join(DATA_DIR, 'styrka.db');
const db = new DatabaseSync(DB_PATH);

// Initialize SQLite tables
db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    username TEXT UNIQUE NOT NULL,
    pin TEXT NOT NULL,
    created_at TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS workouts (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    program_id TEXT NOT NULL,
    data_json TEXT NOT NULL,
    created_at TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS custom_programs (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    data_json TEXT NOT NULL,
    updated_at TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS profiles (
    user_id TEXT PRIMARY KEY,
    data_json TEXT NOT NULL,
    updated_at TEXT NOT NULL
  );
`);

// Prepared statements
const stmtFindUser = db.prepare('SELECT * FROM users WHERE username = ?');
const stmtInsertUser = db.prepare('INSERT INTO users (id, username, pin, created_at) VALUES (?, ?, ?, ?)');

const stmtGetWorkouts = db.prepare('SELECT data_json FROM workouts WHERE user_id = ? ORDER BY created_at DESC');
const stmtUpsertWorkout = db.prepare(`
  INSERT INTO workouts (id, user_id, program_id, data_json, created_at)
  VALUES (?, ?, ?, ?, ?)
  ON CONFLICT(id) DO UPDATE SET data_json = excluded.data_json
`);

const stmtGetPrograms = db.prepare('SELECT data_json FROM custom_programs WHERE user_id = ?');
const stmtUpsertProgram = db.prepare(`
  INSERT INTO custom_programs (id, user_id, data_json, updated_at)
  VALUES (?, ?, ?, ?)
  ON CONFLICT(id) DO UPDATE SET data_json = excluded.data_json, updated_at = excluded.updated_at
`);

const stmtGetProfile = db.prepare('SELECT data_json FROM profiles WHERE user_id = ?');
const stmtUpsertProfile = db.prepare(`
  INSERT INTO profiles (user_id, data_json, updated_at)
  VALUES (?, ?, ?)
  ON CONFLICT(user_id) DO UPDATE SET data_json = excluded.data_json, updated_at = excluded.updated_at
`);

// Serve static frontend from dist
const serve = sirv('dist', {
  single: true,
  dev: true,
  etag: true,
  dotfiles: false,
});

function readJsonBody(req) {
  return new Promise((resolve, reject) => {
    let data = '';
    req.on('data', (chunk) => {
      data += chunk;
      if (data.length > 5 * 1024 * 1024) {
        req.destroy();
        reject(new Error('Payload too large'));
      }
    });
    req.on('end', () => {
      try {
        resolve(data ? JSON.parse(data) : {});
      } catch (e) {
        reject(e);
      }
    });
    req.on('error', reject);
  });
}

function sendJson(res, statusCode, payload) {
  res.writeHead(statusCode, {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  });
  res.end(JSON.stringify(payload));
}

const server = http.createServer(async (req, res) => {
  if (req.method === 'OPTIONS') {
    res.writeHead(204, {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Headers': 'Content-Type',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    });
    res.end();
    return;
  }

  const url = new URL(req.url, `http://${req.headers.host || 'localhost'}`);

  // Health check
  if (url.pathname === '/health' || url.pathname === '/api/health') {
    sendJson(res, 200, {
      status: 'ok',
      service: 'styrka',
      uptime: process.uptime(),
      db: 'sqlite',
    });
    return;
  }

  // Auth / Login API
  if (url.pathname === '/api/auth/login' && req.method === 'POST') {
    try {
      const body = await readJsonBody(req);
      const username = (body.username || '').trim().toLowerCase();
      const pin = (body.pin || '').trim();

      if (!username || !pin) {
        sendJson(res, 400, { error: 'Username and pin required' });
        return;
      }

      const existing = stmtFindUser.all(username)[0];
      if (existing) {
        if (existing.pin !== pin) {
          sendJson(res, 401, { error: 'Incorrect PIN' });
          return;
        }
        sendJson(res, 200, {
          status: 'ok',
          user: { id: existing.id, username: existing.username },
        });
      } else {
        const id = 'usr_' + Math.random().toString(36).substring(2, 10);
        const now = new Date().toISOString();
        stmtInsertUser.run(id, username, pin, now);
        sendJson(res, 200, {
          status: 'ok',
          user: { id, username },
          registered: true,
        });
      }
    } catch (err) {
      console.error('Login error:', err);
      sendJson(res, 500, { error: 'Server error' });
    }
    return;
  }

  // Sync API - Pull
  if (url.pathname === '/api/sync' && req.method === 'GET') {
    try {
      const username = (url.searchParams.get('username') || '').trim().toLowerCase();
      if (!username) {
        sendJson(res, 400, { error: 'Username required' });
        return;
      }

      const user = stmtFindUser.all(username)[0];
      if (!user) {
        sendJson(res, 200, { logs: [], customPrograms: [], profile: null });
        return;
      }

      const rawLogs = stmtGetWorkouts.all(user.id);
      const logs = rawLogs.map((r) => JSON.parse(r.data_json));

      const rawPrograms = stmtGetPrograms.all(user.id);
      const customPrograms = rawPrograms.map((r) => JSON.parse(r.data_json));

      const rawProfile = stmtGetProfile.all(user.id)[0];
      const profile = rawProfile ? JSON.parse(rawProfile.data_json) : null;

      sendJson(res, 200, { logs, customPrograms, profile });
    } catch (err) {
      console.error('Sync GET error:', err);
      sendJson(res, 500, { error: 'Sync failed' });
    }
    return;
  }

  // Sync API - Push
  if (url.pathname === '/api/sync' && req.method === 'POST') {
    try {
      const body = await readJsonBody(req);
      const username = (body.username || '').trim().toLowerCase();
      if (!username) {
        sendJson(res, 400, { error: 'Username required' });
        return;
      }

      const user = stmtFindUser.all(username)[0];
      if (!user) {
        sendJson(res, 404, { error: 'User not found' });
        return;
      }

      // Upsert logs
      if (Array.isArray(body.logs)) {
        for (const log of body.logs) {
          if (log.id) {
            stmtUpsertWorkout.run(
              log.id,
              user.id,
              log.programId || 'unknown',
              JSON.stringify(log),
              log.completedAt || new Date().toISOString()
            );
          }
        }
      }

      // Upsert custom programs
      if (Array.isArray(body.customPrograms)) {
        for (const prog of body.customPrograms) {
          if (prog.id) {
            stmtUpsertProgram.run(
              prog.id,
              user.id,
              JSON.stringify(prog),
              new Date().toISOString()
            );
          }
        }
      }

      // Upsert profile
      if (body.profile) {
        stmtUpsertProfile.run(
          user.id,
          JSON.stringify(body.profile),
          new Date().toISOString()
        );
      }

      sendJson(res, 200, { status: 'ok', synced: true });
    } catch (err) {
      console.error('Sync POST error:', err);
      sendJson(res, 500, { error: 'Sync failed' });
    }
    return;
  }

  // Fallback to static SPA frontend
  serve(req, res);
});

server.listen(PORT, '0.0.0.0', () => {
  console.log(`🏋️ Styrka server running at http://0.0.0.0:${PORT}`);
  console.log(`📁 SQLite database at ${DB_PATH}`);
});
