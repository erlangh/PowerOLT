const { getDb } = require('./db');

let timer;
const subscribers = new Set();

function subscribeSimulator(cb) { subscribers.add(cb); }
function unsubscribeSimulator(cb) { subscribers.delete(cb); }

function startSimulator() {
  const db = getDb();
  if (timer) return;
  timer = setInterval(() => {
    const onus = db.prepare('SELECT id, rx_power, status, traffic_up, traffic_down FROM onus ORDER BY RANDOM() LIMIT 5').all();
    const updates = onus.map(o => {
      // Randomize values
      const rx = o.rx_power + (Math.random() * 2 - 1);
      const statusPick = Math.random();
      const status = statusPick < 0.8 ? 'Online' : statusPick < 0.9 ? 'LOS' : 'Dying Gasp';
      const up = Math.max(0, (o.traffic_up || 0) + (Math.random() * 1 - 0.5));
      const down = Math.max(0, (o.traffic_down || 0) + (Math.random() * 1 - 0.5));

      db.prepare('UPDATE onus SET rx_power = ?, status = ?, traffic_up = ?, traffic_down = ? WHERE id = ?')
        .run(rx, status, up, down, o.id);

      return { id: o.id, rx_power: rx, status, traffic_up: up, traffic_down: down };
    });

    // Notify all listeners
    for (const cb of subscribers) {
      updates.forEach(u => cb(u));
    }
  }, 1500);
}

module.exports = { startSimulator, subscribeSimulator, unsubscribeSimulator };