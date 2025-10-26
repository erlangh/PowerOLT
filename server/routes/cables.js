const express = require('express');
const router = express.Router();
const { getDb } = require('../lib/db');

// List cable routes; filter by type
router.get('/', (req, res) => {
  const db = getDb();
  const { type } = req.query; // 'backbone'|'distribution'|'drop'
  const where = [];
  const params = [];
  if (type) { where.push('type = ?'); params.push(type); }
  const whereSql = where.length ? 'WHERE ' + where.join(' AND ') : '';
  const rows = db.prepare(`SELECT * FROM cable_routes ${whereSql} ORDER BY id`).all(...params)
    .map(r => ({ ...r, coords: JSON.parse(r.coords) }));
  res.json(rows);
});

// Create new cable route
router.post('/', (req, res) => {
  const db = getDb();
  const { name, type, coords, source_type, source_id, target_type, target_id } = req.body || {};
  if (!name || !type || !coords || !Array.isArray(coords) || coords.length < 2) {
    return res.status(400).json({ error: 'name, type, coords[>=2] required' });
  }
  const stmt = db.prepare('INSERT INTO cable_routes (name, type, coords, source_type, source_id, target_type, target_id) VALUES (?, ?, ?, ?, ?, ?, ?)');
  const info = stmt.run(name, type, JSON.stringify(coords), source_type || null, source_id || null, target_type || null, target_id || null);
  const created = db.prepare('SELECT * FROM cable_routes WHERE id = ?').get(info.lastInsertRowid);
  res.json({ ...created, coords: JSON.parse(created.coords) });
});

// Update cable route
router.put('/:id', (req, res) => {
  const db = getDb();
  const id = Number(req.params.id);
  const exists = db.prepare('SELECT * FROM cable_routes WHERE id = ?').get(id);
  if (!exists) return res.status(404).json({ error: 'Not found' });
  const { name, type, coords, source_type, source_id, target_type, target_id } = req.body || {};
  const stmt = db.prepare('UPDATE cable_routes SET name = ?, type = ?, coords = ?, source_type = ?, source_id = ?, target_type = ?, target_id = ? WHERE id = ?');
  stmt.run(
    name ?? exists.name,
    type ?? exists.type,
    coords ? JSON.stringify(coords) : exists.coords,
    source_type ?? exists.source_type,
    source_id ?? exists.source_id,
    target_type ?? exists.target_type,
    target_id ?? exists.target_id,
    id
  );
  const updated = db.prepare('SELECT * FROM cable_routes WHERE id = ?').get(id);
  res.json({ ...updated, coords: JSON.parse(updated.coords) });
});

// Delete cable route
router.delete('/:id', (req, res) => {
  const db = getDb();
  const id = Number(req.params.id);
  const info = db.prepare('DELETE FROM cable_routes WHERE id = ?').run(id);
  res.json({ deleted: info.changes });
});

module.exports = router;