const express = require('express');
const router = express.Router();
const { getDb } = require('../lib/db');

router.get('/onus.csv', (req, res) => {
  const db = getDb();
  const rows = db.prepare('SELECT id, olt_id, card, port, sn, name, description, rx_power, status, vlan, speed_down, speed_up, wan_mode, pppoe_username, ip_address FROM onus').all();
  const header = ['id','olt_id','card','port','sn','name','description','rx_power','status','vlan','speed_down','speed_up','wan_mode','pppoe_username','ip_address'];
  const csv = [header.join(',')].concat(rows.map(r => header.map(h => (r[h] ?? '').toString().replace(/,/g,';')).join(','))).join('\n');
  res.setHeader('Content-Type', 'text/csv');
  res.setHeader('Content-Disposition', 'attachment; filename="onus.csv"');
  res.send(csv);
});

module.exports = router;