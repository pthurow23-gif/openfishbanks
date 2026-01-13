const db = require('./database');

// Get all ships
function getAllShips() {
  return db.prepare('SELECT * FROM ships ORDER BY display_order').all();
}

// Get all fishing areas (public - no stock info)
function getFishingAreas(includeStock = false) {
  if (includeStock) {
    return db.prepare('SELECT * FROM fishing_areas ORDER BY name').all();
  }
  // Return areas without stock info for regular users
  return db.prepare(`
    SELECT id, name, area_type, fish_type, fish_price
    FROM fishing_areas
    ORDER BY name
  `).all();
}

// Get user's ships
function getUserShips(userId) {
  return db.prepare(`
    SELECT us.id, us.user_id, us.ship_id, us.area_id,
           s.name as ship_name, s.cost as ship_cost, s.harvest_amount, s.operating_cost,
           fa.name as area_name, fa.fish_type, fa.fish_price
    FROM user_ships us
    JOIN ships s ON us.ship_id = s.id
    LEFT JOIN fishing_areas fa ON us.area_id = fa.id
    WHERE us.user_id = ?
    ORDER BY s.display_order
  `).all(userId);
}

// Buy a ship
function buyShip(userId, shipId) {
  // Check if user has enough money
  const balance = db.prepare('SELECT balance FROM user_balances WHERE user_id = ?').get(userId);
  if (!balance) {
    throw new Error('User balance not found');
  }

  const ship = db.prepare('SELECT * FROM ships WHERE id = ?').get(shipId);
  if (!ship) {
    throw new Error('Ship not found');
  }

  if (balance.balance < ship.cost) {
    throw new Error('Insufficient funds');
  }

  // Deduct money and add ship
  db.prepare('UPDATE user_balances SET balance = balance - ? WHERE user_id = ?').run(ship.cost, userId);
  db.prepare('INSERT INTO user_ships (user_id, ship_id) VALUES (?, ?)').run(userId, shipId);

  return { success: true, newBalance: balance.balance - ship.cost };
}

// Assign ship to area
function assignShipToArea(userId, shipId, areaId) {
  // Verify ship belongs to user
  const userShip = db.prepare('SELECT * FROM user_ships WHERE id = ? AND user_id = ?').get(shipId, userId);
  if (!userShip) {
    throw new Error('Ship not found or does not belong to user');
  }

  // Verify area exists
  if (areaId !== null) {
    const area = db.prepare('SELECT * FROM fishing_areas WHERE id = ?').get(areaId);
    if (!area) {
      throw new Error('Fishing area not found');
    }
  }

  // Update ship area
  db.prepare('UPDATE user_ships SET area_id = ? WHERE id = ? AND user_id = ?').run(areaId, shipId, userId);
  return { success: true };
}

// Process tick - process all ships in areas
function processTick() {
  // Get all ships assigned to areas
  const activeShips = db.prepare(`
    SELECT us.id as user_ship_id, us.user_id, us.area_id, us.ship_id,
           s.harvest_amount, s.operating_cost, fa.current_stock, fa.fish_price, fa.name as area_name
    FROM user_ships us
    JOIN ships s ON us.ship_id = s.id
    JOIN fishing_areas fa ON us.area_id = fa.id
    WHERE us.area_id IS NOT NULL
  `).all();

  // Group by area
  const areaHarvests = {};
  for (const ship of activeShips) {
    if (!areaHarvests[ship.area_id]) {
      areaHarvests[ship.area_id] = {
        area_id: ship.area_id,
        current_stock: ship.current_stock,
        fish_price: ship.fish_price,
        area_name: ship.area_name,
        ships: []
      };
    }
    areaHarvests[ship.area_id].ships.push(ship);
  }

  const insertTransaction = db.prepare(`
    INSERT INTO transactions (user_id, area_id, ship_id, harvest_amount, actual_harvest, profit, stock_before, stock_after)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `);
  const updateBalance = db.prepare('UPDATE user_balances SET balance = balance + ? WHERE user_id = ?');
  const updateAreaStock = db.prepare('UPDATE fishing_areas SET current_stock = ?, last_regeneration = CURRENT_TIMESTAMP WHERE id = ?');

  let totalProcessed = 0;

  // Process each area
  for (const areaId in areaHarvests) {
    const area = areaHarvests[areaId];
    let stockBefore = area.current_stock;
    let currentStock = stockBefore;

    // Calculate total harvest for this area
    const totalHarvest = area.ships.reduce((sum, s) => sum + s.harvest_amount, 0);

    // Scale if needed
    const scaleFactor = totalHarvest > currentStock && currentStock > 0 ? currentStock / totalHarvest : 1;

    // Process each ship in this area
    for (const ship of area.ships) {
      const actualHarvest = ship.harvest_amount * scaleFactor;
      const revenue = actualHarvest * area.fish_price;
      const operatingCost = ship.operating_cost || 0;
      const profit = revenue - operatingCost;

      // Record transaction
      insertTransaction.run(
        ship.user_id,
        area.area_id,
        ship.ship_id,
        ship.harvest_amount,
        actualHarvest,
        profit,
        stockBefore,
        currentStock
      );

      // Update balance (profit can be negative if operating costs exceed revenue)
      updateBalance.run(profit, ship.user_id);

      totalProcessed++;
    }

    // Reduce stock
    currentStock = Math.max(0, currentStock - (totalHarvest * scaleFactor));

    // Regenerate
    const areaInfo = db.prepare('SELECT regeneration_rate, max_stock FROM fishing_areas WHERE id = ?').get(area.area_id);
    currentStock = Math.min(currentStock * (1 + areaInfo.regeneration_rate), areaInfo.max_stock);

    // Update area stock
    updateAreaStock.run(currentStock, area.area_id);
  }

  return { processedCount: totalProcessed };
}

// Get user stats
function getUserStats(userId) {
  const user = db.prepare('SELECT id, username FROM users WHERE id = ?').get(userId);
  if (!user) {
    throw new Error('User not found');
  }

  const balance = db.prepare('SELECT balance FROM user_balances WHERE user_id = ?').get(userId);
  const ships = getUserShips(userId);
  
  // Get user's clan
  const clanInfo = db.prepare(`
    SELECT c.id, c.name, c.creator_id,
           CASE WHEN c.creator_id = ? THEN 1 ELSE 0 END as is_creator
    FROM clan_members cm
    JOIN clans c ON cm.clan_id = c.id
    WHERE cm.user_id = ?
  `).get(userId, userId);

  // Get transaction history grouped by tick (using processed_at rounded to nearest minute)
  const transactionHistory = db.prepare(`
    SELECT 
      t.id,
      t.profit,
      t.actual_harvest,
      t.processed_at,
      fa.name as area_name,
      fa.fish_type,
      s.name as ship_name,
      s.operating_cost,
      strftime('%Y-%m-%d %H:%M', t.processed_at) as tick_time
    FROM transactions t
    JOIN fishing_areas fa ON t.area_id = fa.id
    JOIN ships s ON t.ship_id = s.id
    WHERE t.user_id = ?
    ORDER BY t.processed_at DESC
  `).all(userId);

  // Group transactions by tick_time
  const groupedByTick = {};
  for (const tx of transactionHistory) {
    if (!groupedByTick[tx.tick_time]) {
      groupedByTick[tx.tick_time] = {
        tickTime: tx.tick_time,
        transactions: [],
        totalProfit: 0
      };
    }
    groupedByTick[tx.tick_time].transactions.push(tx);
    groupedByTick[tx.tick_time].totalProfit += tx.profit;
  }

  // Convert to array and sort by most recent first
  const tickGroups = Object.values(groupedByTick).sort((a, b) => 
    new Date(b.tickTime) - new Date(a.tickTime)
  );

  // Get last round earnings (most recent tick group)
  const lastRoundTotal = tickGroups.length > 0 ? tickGroups[0].totalProfit : 0;
  const lastTransaction = transactionHistory.length > 0 ? transactionHistory[0] : null;

  const stats = {
    userId: user.id,
    username: user.username,
    balance: balance ? balance.balance : 0,
    ships: ships,
    clan: clanInfo || null,
    lastTransaction: lastTransaction || null,
    lastRoundTotal: lastRoundTotal,
    transactionHistory: tickGroups
  };

  return stats;
}

// Get game stats (public - no area stock info)
function getGameStats() {
  const totalPlayers = db.prepare('SELECT COUNT(*) as count FROM users WHERE is_admin = 0').get().count;
  const activeShips = db.prepare('SELECT COUNT(*) as count FROM user_ships WHERE area_id IS NOT NULL').get().count;
  const areas = getFishingAreas(false);

  return {
    totalPlayers,
    activeShips,
    areas: areas
  };
}

// Clan functions
function createClan(userId, clanName) {
  // Check if user is already in a clan
  const existing = db.prepare('SELECT clan_id FROM clan_members WHERE user_id = ?').get(userId);
  if (existing) {
    throw new Error('You are already in a clan');
  }

  // Create clan
  const result = db.prepare('INSERT INTO clans (name, creator_id) VALUES (?, ?)').run(clanName, userId);
  const clanId = result.lastInsertRowid;

  // Add creator as member
  db.prepare('INSERT INTO clan_members (user_id, clan_id) VALUES (?, ?)').run(userId, clanId);

  return { clanId, name: clanName };
}

function joinClan(userId, clanId) {
  // Check if user is already in a clan
  const existing = db.prepare('SELECT clan_id FROM clan_members WHERE user_id = ?').get(userId);
  if (existing) {
    throw new Error('You are already in a clan');
  }

  // Verify clan exists
  const clan = db.prepare('SELECT * FROM clans WHERE id = ?').get(clanId);
  if (!clan) {
    throw new Error('Clan not found');
  }

  // Add user to clan
  db.prepare('INSERT INTO clan_members (user_id, clan_id) VALUES (?, ?)').run(userId, clanId);
  return { success: true };
}

function leaveClan(userId) {
  db.prepare('DELETE FROM clan_members WHERE user_id = ?').run(userId);
  return { success: true };
}

function renameClan(userId, newName) {
  // Verify user is clan creator
  const clan = db.prepare('SELECT * FROM clans WHERE creator_id = ?').get(userId);
  if (!clan) {
    throw new Error('You are not the creator of any clan');
  }

  db.prepare('UPDATE clans SET name = ? WHERE creator_id = ?').run(newName, userId);
  return { success: true, newName };
}

function getClanMembers(clanId) {
  return db.prepare(`
    SELECT u.id, u.username, c.creator_id,
           CASE WHEN u.id = c.creator_id THEN 1 ELSE 0 END as is_creator
    FROM clan_members cm
    JOIN users u ON cm.user_id = u.id
    JOIN clans c ON cm.clan_id = c.id
    WHERE cm.clan_id = ?
    ORDER BY is_creator DESC, u.username
  `).all(clanId);
}

function getAllClans() {
  return db.prepare(`
    SELECT c.*, COUNT(cm.user_id) as member_count
    FROM clans c
    LEFT JOIN clan_members cm ON c.id = cm.clan_id
    GROUP BY c.id
    ORDER BY member_count DESC, c.name
  `).all();
}

function adminDeleteClan(clanId) {
  // Delete clan (cascade will delete clan_members due to foreign key)
  db.prepare('DELETE FROM clans WHERE id = ?').run(clanId);
  return { success: true };
}

// Admin: Get all users with their ships
function adminGetAllUsers() {
  // First get all non-admin users
  const users = db.prepare(`
    SELECT u.id, u.username
    FROM users u
    WHERE u.is_admin = 0
    ORDER BY u.username
  `).all();
  
  // Then get balance and ship count for each user
  for (const user of users) {
    const balance = db.prepare('SELECT balance FROM user_balances WHERE user_id = ?').get(user.id);
    user.balance = balance ? balance.balance : 0;
    
    const shipCount = db.prepare('SELECT COUNT(*) as count FROM user_ships WHERE user_id = ?').get(user.id);
    user.ship_count = shipCount ? shipCount.count : 0;
    
    user.ships = getUserShips(user.id);
  }
  
  return users;
}

// Admin: Add/remove money from user
function adminModifyUserBalance(userId, amount) {
  const user = db.prepare('SELECT id FROM users WHERE id = ?').get(userId);
  if (!user) {
    throw new Error('User not found');
  }
  
  // Ensure balance exists
  const balance = db.prepare('SELECT balance FROM user_balances WHERE user_id = ?').get(userId);
  if (!balance) {
    db.prepare('INSERT INTO user_balances (user_id, balance) VALUES (?, ?)').run(userId, amount);
    return amount;
  }
  
  const newBalance = balance.balance + amount;
  db.prepare('UPDATE user_balances SET balance = balance + ? WHERE user_id = ?').run(amount, userId);
  return newBalance;
}

// Admin: Add ship to user
function adminAddShipToUser(userId, shipId) {
  const user = db.prepare('SELECT id FROM users WHERE id = ?').get(userId);
  if (!user) {
    throw new Error('User not found');
  }
  
  const ship = db.prepare('SELECT id FROM ships WHERE id = ?').get(shipId);
  if (!ship) {
    throw new Error('Ship not found');
  }
  
  db.prepare('INSERT INTO user_ships (user_id, ship_id) VALUES (?, ?)').run(userId, shipId);
  return { success: true };
}

// Admin: Remove ship from user
function adminRemoveShipFromUser(userShipId, userId) {
  // Verify ship belongs to user
  const userShip = db.prepare('SELECT * FROM user_ships WHERE id = ? AND user_id = ?').get(userShipId, userId);
  if (!userShip) {
    throw new Error('Ship not found or does not belong to user');
  }
  
  db.prepare('DELETE FROM user_ships WHERE id = ? AND user_id = ?').run(userShipId, userId);
  return { success: true };
}

// Admin functions
function adminGetAreaStocks() {
  return db.prepare('SELECT * FROM fishing_areas ORDER BY name').all();
}

function adminCreateArea(name, areaType, fishType, currentStock, maxStock, fishPrice, regenerationRate) {
  // Check if area with same name already exists
  const existing = db.prepare('SELECT id FROM fishing_areas WHERE name = ?').get(name);
  if (existing) {
    throw new Error('Area with this name already exists');
  }
  
  const result = db.prepare(`
    INSERT INTO fishing_areas (name, area_type, fish_type, current_stock, max_stock, fish_price, regeneration_rate)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `).run(name, areaType, fishType, currentStock, maxStock, fishPrice, regenerationRate);
  
  return {
    id: result.lastInsertRowid,
    name,
    area_type: areaType,
    fish_type: fishType,
    current_stock: currentStock,
    max_stock: maxStock,
    fish_price: fishPrice,
    regeneration_rate: regenerationRate
  };
}

function adminResetAreaStock(areaId, amount) {
  db.prepare('UPDATE fishing_areas SET current_stock = ? WHERE id = ?').run(amount, areaId);
  return amount;
}

function adminAddFishToArea(areaId, amount) {
  const area = db.prepare('SELECT current_stock FROM fishing_areas WHERE id = ?').get(areaId);
  if (!area) {
    throw new Error('Area not found');
  }
  const newStock = area.current_stock + amount;
  db.prepare('UPDATE fishing_areas SET current_stock = ? WHERE id = ?').run(newStock, areaId);
  return newStock;
}

function adminSetAreaRegenerationRate(areaId, rate) {
  db.prepare('UPDATE fishing_areas SET regeneration_rate = ? WHERE id = ?').run(rate, areaId);
  return rate;
}

function adminSetAreaFishPrice(areaId, price) {
  db.prepare('UPDATE fishing_areas SET fish_price = ? WHERE id = ?').run(price, areaId);
  return price;
}

// Admin: Update ship operating cost
function adminSetShipOperatingCost(shipId, operatingCost) {
  const ship = db.prepare('SELECT id FROM ships WHERE id = ?').get(shipId);
  if (!ship) {
    throw new Error('Ship not found');
  }
  db.prepare('UPDATE ships SET operating_cost = ? WHERE id = ?').run(operatingCost, shipId);
  return operatingCost;
}

// Get leaderboard with detailed stats
function getLeaderboard(limit = 10) {
  const leaders = db.prepare(`
    SELECT u.id, u.username, COALESCE(ub.balance, 0) as balance, 
           COUNT(DISTINCT us.id) as ship_count,
           COALESCE(SUM(t.profit), 0) as total_profit
    FROM users u
    LEFT JOIN user_balances ub ON u.id = ub.user_id
    LEFT JOIN user_ships us ON u.id = us.user_id
    LEFT JOIN transactions t ON u.id = t.user_id
    WHERE u.is_admin = 0
    GROUP BY u.id, u.username, ub.balance
    ORDER BY ub.balance DESC
    LIMIT ?
  `).all(limit);
  
  // Get last round earnings for each player
  for (const leader of leaders) {
    const lastRound = db.prepare(`
      SELECT COALESCE(SUM(profit), 0) as last_round_earnings
      FROM transactions
      WHERE user_id = ? AND processed_at >= datetime('now', '-16 minutes')
    `).get(leader.id);
    leader.last_round_earnings = lastRound ? lastRound.last_round_earnings : 0;
  }

  return leaders;
}

// Get all players with their ships (for Active Ships view)
function getAllPlayersWithShips() {
  const players = db.prepare(`
    SELECT u.id, u.username
    FROM users u
    WHERE u.is_admin = 0
    ORDER BY u.username
  `).all();
  
  for (const player of players) {
    const ships = getUserShips(player.id);
    player.ships = ships;
  }
  
  return players;
}

module.exports = {
  getAllShips,
  getFishingAreas,
  getUserShips,
  buyShip,
  assignShipToArea,
  processTick,
  getUserStats,
  getGameStats,
  createClan,
  joinClan,
  leaveClan,
  renameClan,
  getClanMembers,
  getAllClans,
  adminGetAreaStocks,
  adminCreateArea,
  adminResetAreaStock,
  adminAddFishToArea,
  adminSetAreaRegenerationRate,
  adminSetAreaFishPrice,
  adminDeleteClan,
  adminGetAllUsers,
  adminModifyUserBalance,
  adminAddShipToUser,
  adminRemoveShipFromUser,
  adminSetShipOperatingCost,
  getLeaderboard,
  getAllPlayersWithShips
};