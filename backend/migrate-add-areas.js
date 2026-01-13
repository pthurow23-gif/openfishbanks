// Migration script to add 4 new fishing areas
// Run with: node migrate-add-areas.js

const Database = require('better-sqlite3');
const path = require('path');

const dbPath = path.join(__dirname, 'openfishbanks.db');
const db = new Database(dbPath);

console.log('Starting migration: Adding 4 new fishing areas...');

const newAreas = [
  { name: 'Harbor Bay', type: 'Bay', fish_type: 'Mackerel', stock: 11000, max: 38000, price: 11, regen: 0.11 },
  { name: 'Mangrove Lagoon', type: 'Lagoon', fish_type: 'Snapper', stock: 9000, max: 32000, price: 16, regen: 0.10 },
  { name: 'Coral Atoll', type: 'Ocean', fish_type: 'Grouper', stock: 13000, max: 42000, price: 20, regen: 0.09 },
  { name: 'Estuary Channel', type: 'Estuary', fish_type: 'Flounder', stock: 9500, max: 33000, price: 13, regen: 0.11 }
];

const insertArea = db.prepare(`
  INSERT INTO fishing_areas (name, area_type, fish_type, current_stock, max_stock, fish_price, regeneration_rate)
  VALUES (?, ?, ?, ?, ?, ?, ?)
`);

let added = 0;
let skipped = 0;

for (const area of newAreas) {
  // Check if area already exists
  const existing = db.prepare('SELECT id FROM fishing_areas WHERE name = ?').get(area.name);
  
  if (existing) {
    console.log(`Skipping ${area.name} - already exists`);
    skipped++;
  } else {
    try {
      insertArea.run(area.name, area.type, area.fish_type, area.stock, area.max, area.price, area.regen);
      console.log(`Added: ${area.name} (${area.type} - ${area.fish_type})`);
      added++;
    } catch (error) {
      console.error(`Error adding ${area.name}:`, error.message);
    }
  }
}

console.log(`\nMigration complete! Added ${added} areas, skipped ${skipped} areas.`);
db.close();
