const express = require('express');
const router = express.Router();
const { getDb } = require('../lib/db');

// GET all ONU types
router.get('/', (req, res) => {
  const db = getDb();
  const items = db.prepare('SELECT * FROM onu_types ORDER BY id DESC').all();
  res.json(items);
});

// POST create new ONU type
router.post('/', (req, res) => {
  const db = getDb();
  const { name, vendor, model, description } = req.body || {};
  if (!name || typeof name !== 'string') {
    return res.status(400).json({ error: 'name is required' });
  }
  const stmt = db.prepare('INSERT INTO onu_types (name, vendor, model, description) VALUES (?, ?, ?, ?)');
  const info = stmt.run(name, vendor || null, model || null, description || null);
  const created = db.prepare('SELECT * FROM onu_types WHERE id = ?').get(info.lastInsertRowid);
  res.json(created);
});

// PUT update ONU type
router.put('/:id', (req, res) => {
  const db = getDb();
  const id = Number(req.params.id);
  const { name, vendor, model, description } = req.body || {};
  const exists = db.prepare('SELECT * FROM onu_types WHERE id = ?').get(id);
  if (!exists) return res.status(404).json({ error: 'Not found' });

  const stmt = db.prepare('UPDATE onu_types SET name = ?, vendor = ?, model = ?, description = ? WHERE id = ?');
  stmt.run(
    name ?? exists.name,
    vendor ?? exists.vendor,
    model ?? exists.model,
    description ?? exists.description,
    id
  );
  const updated = db.prepare('SELECT * FROM onu_types WHERE id = ?').get(id);
  res.json(updated);
});

// DELETE remove ONU type
router.delete('/:id', (req, res) => {
  const db = getDb();
  const id = Number(req.params.id);
  const exists = db.prepare('SELECT * FROM onu_types WHERE id = ?').get(id);
  if (!exists) return res.status(404).json({ error: 'Not found' });
  db.prepare('DELETE FROM onu_types WHERE id = ?').run(id);
  res.json({ success: true });
});

module.exports = router;