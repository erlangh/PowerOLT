const express = require('express');
const router = express.Router();
const { getDb } = require('../lib/db');

router.get('/', (_req, res) => {
  const db = getDb();
  const rows = db.prepare('SELECT * FROM olts').all();
  res.json(rows);
});

// Simulate background sync with progress
const syncState = { running: false, progress: 0 };

router.post('/sync', (_req, res) => {
  if (syncState.running) return res.json(syncState);
  syncState.running = true;
  syncState.progress = 0;
  const interval = setInterval(() => {
    syncState.progress += Math.floor(Math.random() * 15);
    if (syncState.progress >= 100) {
      syncState.progress = 100;
      syncState.running = false;
      clearInterval(interval);
    }
  }, 800);
  res.json(syncState);
});

router.get('/sync/status', (_req, res) => {
  res.json(syncState);
});

router.put('/:id', (req, res) => {
  const db = getDb();
  const id = Number(req.params.id);
  const allowed = ['ip', 'username', 'password', 'name', 'type'];
  const keys = Object.keys(req.body).filter(k => allowed.includes(k));
  if (keys.length === 0) return res.status(400).json({ error: 'No updatable fields' });
  const setSql = keys.map(k => `${k} = ?`).join(', ');
  const values = keys.map(k => req.body[k]);
  const info = db.prepare(`UPDATE olts SET ${setSql} WHERE id = ?`).run(...values, id);
  res.json({ updated: info.changes });
});

module.exports = router;