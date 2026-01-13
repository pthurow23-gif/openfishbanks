const bcrypt = require('bcryptjs');
const db = require('./database');

// Authentication middleware
function requireAuth(req, res, next) {
  if (req.session && req.session.userId) {
    req.userId = req.session.userId;
    next();
  } else {
    res.status(401).json({ error: 'Authentication required' });
  }
}

// Admin middleware
function requireAdmin(req, res, next) {
  if (req.session && req.session.userId) {
    const user = db.prepare('SELECT is_admin FROM users WHERE id = ?').get(req.session.userId);
    if (user && user.is_admin === 1) {
      req.userId = req.session.userId;
      next();
    } else {
      res.status(403).json({ error: 'Admin access required' });
    }
  } else {
    res.status(401).json({ error: 'Authentication required' });
  }
}

// Register a new user
function register(username, password) {
  // Check if username exists
  const existing = db.prepare('SELECT id FROM users WHERE username = ?').get(username);
  if (existing) {
    throw new Error('Username already exists');
  }

  // Hash password
  const passwordHash = bcrypt.hashSync(password, 10);

  // Create user
  const result = db.prepare('INSERT INTO users (username, password_hash) VALUES (?, ?)').run(username, passwordHash);
  const userId = result.lastInsertRowid;

  // Initialize balance with $10,000 starting money
  db.prepare('INSERT INTO user_balances (user_id, balance) VALUES (?, 10000)').run(userId);

  // Give user a starter ship (Small Fishing Boat, ID 1)
  const starterShip = db.prepare('SELECT id FROM ships WHERE display_order = 1').get();
  if (starterShip) {
    db.prepare('INSERT INTO user_ships (user_id, ship_id) VALUES (?, ?)').run(userId, starterShip.id);
    // Deduct ship cost from balance
    db.prepare('UPDATE user_balances SET balance = balance - 7500 WHERE user_id = ?').run(userId);
  }

  return userId;
}

// Login user
function login(username, password) {
  const user = db.prepare('SELECT id, password_hash, is_admin FROM users WHERE username = ?').get(username);
  
  if (!user) {
    throw new Error('Invalid username or password');
  }

  if (!bcrypt.compareSync(password, user.password_hash)) {
    throw new Error('Invalid username or password');
  }

  return {
    id: user.id,
    isAdmin: user.is_admin === 1
  };
}

module.exports = {
  requireAuth,
  requireAdmin,
  register,
  login
};