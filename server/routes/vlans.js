const express = require('express');
const router = express.Router();
const { getDb } = require('../lib/db');

// List VLANs
router.get('/', (_req, res) => {
  const db = getDb();
  const rows = db.prepare('SELECT * FROM vlan_db ORDER BY vlan ASC').all();
  res.json(rows);
});

// Create VLAN
router.post('/', (req, res) => {
  const db = getDb();
  const { name, vlan } = req.body;
  if (!name || vlan == null) return res.status(400).json({ error: 'name and vlan required' });
  try {
    const info = db.prepare('INSERT INTO vlan_db (name, vlan) VALUES (?, ?)').run(name, Number(vlan));
    res.json({ id: info.lastInsertRowid });
  } catch (e) {
    res.status(400).json({ error: 'VLAN must be unique', detail: String(e.message || e) });
  }
});

// Update VLAN
router.put('/:id', (req, res) => {
  const db = getDb();
  const id = Number(req.params.id);
  const allowed = ['name','vlan'];
  const keys = Object.keys(req.body).filter(k => allowed.includes(k));
  if (keys.length === 0) return res.status(400).json({ error: 'No updatable fields' });
  const setSql = keys.map(k => `${k} = ?`).join(', ');
  const values = keys.map(k => k==='vlan' ? Number(req.body[k]) : req.body[k]);
  try {
    const info = db.prepare(`UPDATE vlan_db SET ${setSql} WHERE id = ?`).run(...values, id);
    res.json({ updated: info.changes });
  } catch (e) {
    res.status(400).json({ error: 'VLAN must be unique', detail: String(e.message || e) });
  }
});

// Delete VLAN
router.delete('/:id', (req, res) => {
  const db = getDb();
  const id = Number(req.params.id);
  const info = db.prepare('DELETE FROM vlan_db WHERE id = ?').run(id);
  res.json({ deleted: info.changes });
});

module.exports = router;