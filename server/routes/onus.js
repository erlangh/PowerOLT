const express = require('express');
const router = express.Router();
const { getDb } = require('../lib/db');

// List ONUs with filters and pagination
router.get('/', (req, res) => {
  const db = getDb();
  const { olt_id, card, port, status, rx_min, rx_max, q, onu_type_id, page = 1, pageSize = 50 } = req.query;
  let where = [];
  let params = [];
  if (olt_id) { where.push('onus.olt_id = ?'); params.push(Number(olt_id)); }
  if (card) { where.push('onus.card = ?'); params.push(Number(card)); }
  if (port) { where.push('onus.port = ?'); params.push(Number(port)); }
  if (status) { where.push('onus.status = ?'); params.push(status); }
  if (rx_min) { where.push('onus.rx_power >= ?'); params.push(Number(rx_min)); }
  if (rx_max) { where.push('onus.rx_power <= ?'); params.push(Number(rx_max)); }
  if (q) { where.push('(onus.name LIKE ? OR onus.sn LIKE ? OR onus.description LIKE ?)'); params.push(`%${q}%`, `%${q}%`, `%${q}%`); }
  if (onu_type_id) { where.push('onus.onu_type_id = ?'); params.push(Number(onu_type_id)); }
  const whereSql = where.length ? 'WHERE ' + where.join(' AND ') : '';
  const offset = (Number(page) - 1) * Number(pageSize);

  const total = db.prepare(`SELECT COUNT(*) as c FROM onus ${whereSql}`).get(...params).c;
  const rows = db.prepare(`SELECT onus.*, t.name AS onu_type_name FROM onus LEFT JOIN onu_types t ON t.id = onus.onu_type_id ${whereSql} ORDER BY onus.id DESC LIMIT ? OFFSET ?`).all(...params, Number(pageSize), offset);
  res.json({ total, rows });
});

// Add new ONU
router.post('/', (req, res) => {
  const db = getDb();
  const {
    olt_id, card, port, sn, name, description, vlan,
    speed_down, speed_up, wan_mode, pppoe_username, pppoe_password, onu_type_id
  } = req.body;
  const stmt = db.prepare(`INSERT INTO onus (
    olt_id, card, port, sn, name, description, rx_power, status, online_since, vlan,
    speed_down, speed_up, wan_mode, pppoe_username, pppoe_password, ip_address, lan_status, last_log,
    traffic_up, traffic_down, onu_type_id
  ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`);
  const info = stmt.run(
    olt_id, card, port, sn, name, description || '', -20, 'Offline', null, vlan || null,
    speed_down || null, speed_up || null, wan_mode || 'PPPoE', pppoe_username || null, pppoe_password || null,
    null, null, null, 0, 0, onu_type_id || null
  );
  res.json({ id: info.lastInsertRowid });
});

// Update ONU (generic fields)
router.put('/:id', (req, res) => {
  const db = getDb();
  const id = Number(req.params.id);
  const allowed = ['name','description','vlan','speed_down','speed_up','wan_mode','pppoe_username','pppoe_password','sn','onu_type_id'];
  const keys = Object.keys(req.body).filter(k => allowed.includes(k));
  if (keys.length === 0) return res.status(400).json({ error: 'No updatable fields' });
  const setSql = keys.map(k => `${k} = ?`).join(', ');
  const values = keys.map(k => req.body[k]);
  const info = db.prepare(`UPDATE onus SET ${setSql} WHERE id = ?`).run(...values, id);
  res.json({ updated: info.changes });
});

// Delete ONU
router.delete('/:id', (req, res) => {
  const db = getDb();
  const id = Number(req.params.id);
  const info = db.prepare('DELETE FROM onus WHERE id = ?').run(id);
  res.json({ deleted: info.changes });
});

// Actions: reboot, disable, clear-config, reset
router.post('/:id/action', (req, res) => {
  const db = getDb();
  const id = Number(req.params.id);
  const { type } = req.body; // 'reboot'|'disable'|'clear'|'reset'
  const onu = db.prepare('SELECT * FROM onus WHERE id = ?').get(id);
  if (!onu) return res.status(404).json({ error: 'ONU not found' });
  let status = onu.status;
  if (type === 'reboot') status = 'Offline';
  if (type === 'disable') status = 'Disabled';
  if (type === 'clear') status = 'Offline';
  if (type === 'reset') status = 'Offline';
  db.prepare('UPDATE onus SET status = ? WHERE id = ?').run(status, id);
  res.json({ ok: true, status });
});

module.exports = router;