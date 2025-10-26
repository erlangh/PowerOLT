const Database = require('better-sqlite3');
let db;

function init() {
  if (db) return db;
  const dbPath = process.env.DB_PATH || 'powerolt.db';
  db = new Database(dbPath);
  db.pragma('journal_mode = WAL');

  // Tables
  db.exec(`
    CREATE TABLE IF NOT EXISTS olts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      type TEXT NOT NULL,
      ip TEXT,
      username TEXT,
      password TEXT
    );

    CREATE TABLE IF NOT EXISTS onus (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      olt_id INTEGER NOT NULL,
      card INTEGER,
      port INTEGER,
      sn TEXT,
      name TEXT,
      description TEXT,
      rx_power REAL,
      status TEXT,
      online_since INTEGER,
      vlan INTEGER,
      speed_down INTEGER,
      speed_up INTEGER,
      wan_mode TEXT,
      pppoe_username TEXT,
      pppoe_password TEXT,
      ip_address TEXT,
      lan_status TEXT,
      last_log TEXT,
      traffic_up REAL,
      traffic_down REAL,
      FOREIGN KEY (olt_id) REFERENCES olts(id)
    );

    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT,
      username TEXT UNIQUE,
      password_hash TEXT,
      role TEXT
    );

    CREATE TABLE IF NOT EXISTS speed_profiles (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT,
      down INTEGER,
      up INTEGER
    );

    CREATE TABLE IF NOT EXISTS vlan_db (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT,
      vlan INTEGER UNIQUE
    );

    CREATE TABLE IF NOT EXISTS onu_types (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      vendor TEXT,
      model TEXT,
      description TEXT
    );

    -- New: ODP locations
    CREATE TABLE IF NOT EXISTS odps (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      olt_id INTEGER,
      name TEXT NOT NULL,
      address TEXT,
      lat REAL NOT NULL,
      lng REAL NOT NULL,
      capacity INTEGER,
      used INTEGER,
      status TEXT,
      FOREIGN KEY (olt_id) REFERENCES olts(id)
    );

    -- New: Cable routes geometry
    CREATE TABLE IF NOT EXISTS cable_routes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      type TEXT NOT NULL, -- 'backbone' | 'distribution' | 'drop'
      coords TEXT NOT NULL, -- JSON array of [lat,lng]
      source_type TEXT,
      source_id INTEGER,
      target_type TEXT,
      target_id INTEGER
    );
  `);

  // Migration: add onu_type_id to onus if missing
  try {
    const cols = db.prepare(`PRAGMA table_info(onus)`).all();
    const hasCol = cols.some(c => c.name === 'onu_type_id');
    if (!hasCol) {
      db.prepare(`ALTER TABLE onus ADD COLUMN onu_type_id INTEGER`).run();
    }
  } catch (e) {
    console.warn('Migration onus.onu_type_id failed:', e?.message || e);
  }

  // Seed minimal data
  const countOlts = db.prepare('SELECT COUNT(*) as c FROM olts').get().c;
  if (countOlts === 0) {
    const insertOLT = db.prepare('INSERT INTO olts (name, type, ip, username, password) VALUES (?, ?, ?, ?, ?)');
    insertOLT.run('ZTE C300 HQ', 'C300', '192.168.1.100', 'admin', 'admin');
    insertOLT.run('ZTE C320 Branch', 'C320', '192.168.1.101', 'admin', 'admin');
    insertOLT.run('ZTE C300 Mini POP', 'C300Mini', '192.168.1.102', 'admin', 'admin');
  }

  const countOnus = db.prepare('SELECT COUNT(*) as c FROM onus').get().c;
  if (countOnus === 0) {
    const olts = db.prepare('SELECT id FROM olts').all();
    const insertONU = db.prepare(`INSERT INTO onus (
      olt_id, card, port, sn, name, description, rx_power, status, online_since, vlan,
      speed_down, speed_up, wan_mode, pppoe_username, pppoe_password, ip_address, lan_status, last_log,
      traffic_up, traffic_down
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`);
    for (let i = 0; i < 25; i++) {
      const olt = olts[i % olts.length];
      insertONU.run(
        olt.id,
        1 + (i % 2),
        1 + (i % 8),
        `ZTE-ONT-${10000 + i}`,
        `Client ${i+1}`,
        'Initial seed',
        -18 + Math.random() * 6,
        i % 4 === 0 ? 'LOS' : i % 3 === 0 ? 'Dying Gasp' : 'Online',
        Date.now() - Math.floor(Math.random() * 86400000),
        100 + (i % 4),
        50000,
        10000,
        'PPPoE',
        `user${i+1}`,
        'pass',
        `10.10.${i%255}.${(i*3)%255}`,
        'LAN1:Up,LAN2:Down',
        'No issues',
        Math.random() * 10,
        Math.random() * 10
      );
    }
  }

  // Seed ODPs and routes
  const countOdps = db.prepare('SELECT COUNT(*) as c FROM odps').get().c;
  if (countOdps === 0) {
    const olts = db.prepare('SELECT id FROM olts').all();
    const insertODP = db.prepare('INSERT INTO odps (olt_id, name, address, lat, lng, capacity, used, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?)');
    // Jakarta area demo coordinates
    const demo = [
      { name: 'ODP-Pasar 01', address: 'Jl. Pasar Raya', lat: -6.2088, lng: 106.8456, capacity: 16, used: 12, status: 'Online' },
      { name: 'ODP-Bojong 02', address: 'Jl. Bojong Indah', lat: -6.1830, lng: 106.7583, capacity: 8, used: 7, status: 'Online' },
      { name: 'ODP-Kali 03', address: 'Jl. Kali Besar', lat: -6.1333, lng: 106.8130, capacity: 12, used: 9, status: 'LOS' },
      { name: 'ODP-City 04', address: 'Jl. Kota Tua', lat: -6.1364, lng: 106.8106, capacity: 24, used: 20, status: 'Dying Gasp' },
    ];
    demo.forEach((d, i) => insertODP.run(olts[i % olts.length].id, d.name, d.address, d.lat, d.lng, d.capacity, d.used, d.status));
  }

  const countRoutes = db.prepare('SELECT COUNT(*) as c FROM cable_routes').get().c;
  if (countRoutes === 0) {
    const insertRoute = db.prepare('INSERT INTO cable_routes (name, type, coords, source_type, source_id, target_type, target_id) VALUES (?, ?, ?, ?, ?, ?, ?)');
    // Backbone route
    insertRoute.run(
      'Backbone North',
      'backbone',
      JSON.stringify([[-6.2100,106.8200],[-6.2050,106.8300],[-6.2000,106.8400],[-6.1950,106.8500]]),
      'OLT','1','ODP','1'
    );
    // Distribution to ODPs
    insertRoute.run(
      'Distribution West',
      'distribution',
      JSON.stringify([[-6.2000,106.8400],[-6.1900,106.8200],[-6.1830,106.7583]]),
      'ODP','1','ODP','2'
    );
    // Drop cables samples
    insertRoute.run(
      'Drop Pasar Block A',
      'drop',
      JSON.stringify([[-6.2088,106.8456],[-6.2082,106.8460],[-6.2079,106.8465]]),
      'ODP','1','ONU','101'
    );
    insertRoute.run(
      'Drop Bojong Cluster 3',
      'drop',
      JSON.stringify([[-6.1830,106.7583],[-6.1825,106.7588],[-6.1820,106.7592]]),
      'ODP','2','ONU','102'
    );
  }

  return db;
}

function getDb() { if (!db) init(); return db; }

module.exports = { init, getDb };