const express = require('express');
const router = express.Router();
const { getDb } = require('../lib/db');

// List ODPs with optional filters
router.get('/', (req, res) => {
  const db = getDb();
  const { olt_id, status, q } = req.query;
  const where = [];
  const params = [];
  if (olt_id) { where.push('olt_id = ?'); params.push(Number(olt_id)); }
  if (status) { where.push('status = ?'); params.push(status); }
  if (q) { where.push('(name LIKE ? OR address LIKE ?)'); params.push(`%${q}%`, `%${q}%`); }
  const whereSql = where.length ? 'WHERE ' + where.join(' AND ') : '';
  const rows = db.prepare(`SELECT * FROM odps ${whereSql} ORDER BY id DESC`).all(...params);
  res.json(rows);
});

// Summary stats for map UI
router.get('/summary', (_req, res) => {
  const db = getDb();
  const total = db.prepare('SELECT COUNT(*) as c FROM odps').get().c;
  const online = db.prepare("SELECT COUNT(*) as c FROM odps WHERE status = 'Online'").get().c;
  const los = db.prepare("SELECT COUNT(*) as c FROM odps WHERE status = 'LOS'").get().c;
  const dg = db.prepare("SELECT COUNT(*) as c FROM odps WHERE status = 'Dying Gasp'").get().c;
  const offline = db.prepare("SELECT COUNT(*) as c FROM odps WHERE status = 'Offline'").get().c;
  res.json({ total, online, los, dg, offline });
});

// Create ODP
router.post('/', (req, res) => {
  const db = getDb();
  const { olt_id, name, address, lat, lng, capacity, used, status } = req.body || {};
  if (!name || lat === undefined || lng === undefined) {
    return res.status(400).json({ error: 'name, lat, lng are required' });
  }
  const stmt = db.prepare('INSERT INTO odps (olt_id, name, address, lat, lng, capacity, used, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?)');
  const info = stmt.run(olt_id || null, name, address || null, Number(lat), Number(lng), capacity || null, used || 0, status || 'Online');
  const created = db.prepare('SELECT * FROM odps WHERE id = ?').get(info.lastInsertRowid);
  res.json(created);
});

// Update ODP
router.put('/:id', (req, res) => {
  const db = getDb();
  const id = Number(req.params.id);
  const exists = db.prepare('SELECT * FROM odps WHERE id = ?').get(id);
  if (!exists) return res.status(404).json({ error: 'Not found' });
  const { olt_id, name, address, lat, lng, capacity, used, status } = req.body || {};
  const stmt = db.prepare('UPDATE odps SET olt_id = ?, name = ?, address = ?, lat = ?, lng = ?, capacity = ?, used = ?, status = ? WHERE id = ?');
  stmt.run(
    olt_id ?? exists.olt_id,
    name ?? exists.name,
    address ?? exists.address,
    lat !== undefined ? Number(lat) : exists.lat,
    lng !== undefined ? Number(lng) : exists.lng,
    capacity ?? exists.capacity,
    used ?? exists.used,
    status ?? exists.status,
    id
  );
  const updated = db.prepare('SELECT * FROM odps WHERE id = ?').get(id);
  res.json(updated);
});

// Delete ODP
router.delete('/:id', (req, res) => {
  const db = getDb();
  const id = Number(req.params.id);
  const info = db.prepare('DELETE FROM odps WHERE id = ?').run(id);
  res.json({ deleted: info.changes });
});

module.exports = router;