const express = require('express');
const router = express.Router();
const { getDb } = require('../lib/db');

// List speed profiles
router.get('/', (_req, res) => {
  const db = getDb();
  const rows = db.prepare('SELECT * FROM speed_profiles ORDER BY id DESC').all();
  res.json(rows);
});

// Create speed profile
router.post('/', (req, res) => {
  const db = getDb();
  const { name, down, up } = req.body;
  if (!name || down == null || up == null) return res.status(400).json({ error: 'name, down, up required' });
  const info = db.prepare('INSERT INTO speed_profiles (name, down, up) VALUES (?, ?, ?)').run(name, Number(down), Number(up));
  res.json({ id: info.lastInsertRowid });
});

// Update speed profile
router.put('/:id', (req, res) => {
  const db = getDb();
  const id = Number(req.params.id);
  const allowed = ['name','down','up'];
  const keys = Object.keys(req.body).filter(k => allowed.includes(k));
  if (keys.length === 0) return res.status(400).json({ error: 'No updatable fields' });
  const setSql = keys.map(k => `${k} = ?`).join(', ');
  const values = keys.map(k => k==='down'||k==='up' ? Number(req.body[k]) : req.body[k]);
  const info = db.prepare(`UPDATE speed_profiles SET ${setSql} WHERE id = ?`).run(...values, id);
  res.json({ updated: info.changes });
});

// Delete speed profile
router.delete('/:id', (req, res) => {
  const db = getDb();
  const id = Number(req.params.id);
  const info = db.prepare('DELETE FROM speed_profiles WHERE id = ?').run(id);
  res.json({ deleted: info.changes });
});

module.exports = router;