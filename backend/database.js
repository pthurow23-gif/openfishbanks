const Database = require('better-sqlite3');
const path = require('path');
const bcrypt = require('bcryptjs');

const dbPath = path.join(__dirname, 'openfishbanks.db');
const db = new Database(dbPath);

// Enable foreign keys
db.pragma('foreign_keys = ON');

// Initialize database schema
function initDatabase() {
  // Users table
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      is_admin INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Ships table (ship types)
  db.exec(`
    CREATE TABLE IF NOT EXISTS ships (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      cost REAL NOT NULL,
      harvest_amount REAL NOT NULL,
      operating_cost REAL DEFAULT 0,
      display_order INTEGER DEFAULT 0
    )
  `);

  // Fishing areas table
  db.exec(`
    CREATE TABLE IF NOT EXISTS fishing_areas (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      area_type TEXT NOT NULL,
      fish_type TEXT NOT NULL,
      current_stock REAL NOT NULL DEFAULT 10000,
      max_stock REAL NOT NULL DEFAULT 50000,
      fish_price REAL NOT NULL,
      regeneration_rate REAL NOT NULL DEFAULT 0.1,
      last_regeneration DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // User ships (ships owned by users, assigned to areas)
  db.exec(`
    CREATE TABLE IF NOT EXISTS user_ships (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      ship_id INTEGER NOT NULL,
      area_id INTEGER,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY (ship_id) REFERENCES ships(id),
      FOREIGN KEY (area_id) REFERENCES fishing_areas(id)
    )
  `);

  // Clans table
  db.exec(`
    CREATE TABLE IF NOT EXISTS clans (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      creator_id INTEGER NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (creator_id) REFERENCES users(id)
    )
  `);

  // Clan members table
  db.exec(`
    CREATE TABLE IF NOT EXISTS clan_members (
      user_id INTEGER NOT NULL,
      clan_id INTEGER NOT NULL,
      joined_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      PRIMARY KEY (user_id, clan_id),
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY (clan_id) REFERENCES clans(id) ON DELETE CASCADE
    )
  `);

  // Transactions table (processed harvests and profits)
  db.exec(`
    CREATE TABLE IF NOT EXISTS transactions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      area_id INTEGER NOT NULL,
      ship_id INTEGER NOT NULL,
      harvest_amount REAL NOT NULL,
      actual_harvest REAL NOT NULL,
      profit REAL NOT NULL,
      stock_before REAL,
      stock_after REAL,
      processed_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY (area_id) REFERENCES fishing_areas(id),
      FOREIGN KEY (ship_id) REFERENCES ships(id)
    )
  `);

  // User balances
  db.exec(`
    CREATE TABLE IF NOT EXISTS user_balances (
      user_id INTEGER PRIMARY KEY,
      balance REAL DEFAULT 0,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    )
  `);

  // Initialize ships (10 ship types)
  const shipCount = db.prepare('SELECT COUNT(*) as count FROM ships').get().count;
  
  // Add operating_cost column if it doesn't exist (migration)
  try {
    db.exec('ALTER TABLE ships ADD COLUMN operating_cost REAL DEFAULT 0');
  } catch (e) {
    // Column already exists, skip
  }
  
  if (shipCount === 0) {
    const ships = [
      { name: 'Small Fishing Boat', cost: 7500, harvest: 50, operating: 25, order: 1 },
      { name: 'Medium Trawler', cost: 15000, harvest: 120, operating: 60, order: 2 },
      { name: 'Large Trawler', cost: 30000, harvest: 250, operating: 125, order: 3 },
      { name: 'Commercial Fishing Vessel', cost: 60000, harvest: 500, operating: 250, order: 4 },
      { name: 'Factory Ship', cost: 120000, harvest: 1000, operating: 500, order: 5 },
      { name: 'Super Trawler', cost: 250000, harvest: 2100, operating: 1050, order: 6 },
      { name: 'Ocean Factory', cost: 500000, harvest: 4500, operating: 2250, order: 7 },
      { name: 'Fleet Command Ship', cost: 1000000, harvest: 9500, operating: 4750, order: 8 },
      { name: 'Mega Trawler', cost: 2000000, harvest: 20000, operating: 10000, order: 9 },
      { name: 'Titan Class Vessel', cost: 5000000, harvest: 50000, operating: 25000, order: 10 }
    ];
    
    const insertShip = db.prepare('INSERT INTO ships (name, cost, harvest_amount, operating_cost, display_order) VALUES (?, ?, ?, ?, ?)');
    for (const ship of ships) {
      insertShip.run(ship.name, ship.cost, ship.harvest, ship.operating, ship.order);
    }
  } else {
    // Update existing ships with operating costs if they don't have them (5% of cost)
    db.exec('UPDATE ships SET operating_cost = cost * 0.05 WHERE operating_cost = 0 OR operating_cost IS NULL');
  }

  // Initialize fishing areas
  const areaCount = db.prepare('SELECT COUNT(*) as count FROM fishing_areas').get().count;
  if (areaCount === 0) {
    const areas = [
      { name: 'Crystal Lake', type: 'Lake', fish_type: 'Bass', stock: 8000, max: 30000, price: 8, regen: 0.12 },
      { name: 'Emerald Bay', type: 'Bay', fish_type: 'Salmon', stock: 12000, max: 40000, price: 12, regen: 0.10 },
      { name: 'Deep Ocean', type: 'Ocean', fish_type: 'Tuna', stock: 20000, max: 60000, price: 15, regen: 0.08 },
      { name: 'Coastal Waters', type: 'Ocean', fish_type: 'Cod', stock: 15000, max: 45000, price: 10, regen: 0.11 },
      { name: 'Tropical Reef', type: 'Ocean', fish_type: 'Mahi-Mahi', stock: 10000, max: 35000, price: 18, regen: 0.09 },
      { name: 'Arctic Waters', type: 'Ocean', fish_type: 'Halibut', stock: 18000, max: 50000, price: 14, regen: 0.10 },
      { name: 'Freshwater River', type: 'River', fish_type: 'Trout', stock: 7000, max: 25000, price: 9, regen: 0.13 },
      { name: 'Pacific Deep', type: 'Ocean', fish_type: 'Swordfish', stock: 25000, max: 70000, price: 22, regen: 0.07 },
      { name: 'Harbor Bay', type: 'Bay', fish_type: 'Mackerel', stock: 11000, max: 38000, price: 11, regen: 0.11 },
      { name: 'Mangrove Lagoon', type: 'Lagoon', fish_type: 'Snapper', stock: 9000, max: 32000, price: 16, regen: 0.10 },
      { name: 'Coral Atoll', type: 'Ocean', fish_type: 'Grouper', stock: 13000, max: 42000, price: 20, regen: 0.09 },
      { name: 'Estuary Channel', type: 'Estuary', fish_type: 'Flounder', stock: 9500, max: 33000, price: 13, regen: 0.11 }
    ];
    
    const insertArea = db.prepare(`
      INSERT INTO fishing_areas (name, area_type, fish_type, current_stock, max_stock, fish_price, regeneration_rate)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `);
    for (const area of areas) {
      insertArea.run(area.name, area.type, area.fish_type, area.stock, area.max, area.price, area.regen);
    }
  }

  // Create admin user if it doesn't exist
  const admin = db.prepare('SELECT * FROM users WHERE username = ?').get('admin');
  if (!admin) {
    const adminPassword = process.env.ADMIN_PASSWORD || 'admin123';
    const hash = bcrypt.hashSync(adminPassword, 10);
    const adminId = db.prepare('INSERT INTO users (username, password_hash, is_admin) VALUES (?, ?, 1)').run('admin', hash).lastInsertRowid;
    
    // Initialize admin balance
    db.prepare('INSERT INTO user_balances (user_id, balance) VALUES (?, 0)').run(adminId);
  }
}

initDatabase();

module.exports = db;