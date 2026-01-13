require('dotenv').config();
const express = require('express');
const session = require('express-session');
const cors = require('cors');
const http = require('http');
const WebSocket = require('ws');
const db = require('./database');
const { requireAuth, requireAdmin, register, login } = require('./auth');
const {
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
} = require('./gameLogic');

const app = express();
const PORT = process.env.PORT || 3001;
const TICK_INTERVAL_MS = (parseInt(process.env.TICK_INTERVAL_MINUTES) || 15) * 60 * 1000;
const path = require('path');

// Track last tick time for countdown
let lastTickTime = Date.now();

// Middleware
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true
}));
app.use(express.json());

// Session configuration
app.use(session({
  secret: process.env.SESSION_SECRET || 'openfishbanks-secret-key-change-in-production',
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: false, // Set to true in production with HTTPS
    httpOnly: true,
    maxAge: 30 * 24 * 60 * 60 * 1000 // 30 days
  }
}));

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Authentication routes
app.post('/api/register', (req, res) => {
  try {
    const { username, password } = req.body;
    if (!username || !password) {
      return res.status(400).json({ error: 'Username and password required' });
    }

    const userId = register(username, password);
    req.session.userId = userId;
    res.json({ success: true, userId });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

app.post('/api/login', (req, res) => {
  try {
    const { username, password } = req.body;
    if (!username || !password) {
      return res.status(400).json({ error: 'Username and password required' });
    }

    const user = login(username, password);
    req.session.userId = user.id;
    res.json({ success: true, user: { id: user.id, isAdmin: user.isAdmin } });
  } catch (error) {
    res.status(401).json({ error: error.message });
  }
});

app.post('/api/logout', (req, res) => {
  req.session.destroy();
  res.json({ success: true });
});

app.get('/api/me', requireAuth, (req, res) => {
  const user = db.prepare('SELECT id, username, is_admin FROM users WHERE id = ?').get(req.userId);
  res.json({
    id: user.id,
    username: user.username,
    isAdmin: user.is_admin === 1
  });
});

// Game routes
app.get('/api/game/stats', (req, res) => {
  try {
    const stats = getGameStats();
    res.json(stats);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/user/stats', requireAuth, (req, res) => {
  try {
    const stats = getUserStats(req.userId);
    res.json(stats);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Ships
app.get('/api/ships', (req, res) => {
  try {
    const ships = getAllShips();
    res.json(ships);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/ships/buy', requireAuth, (req, res) => {
  try {
    const { shipId } = req.body;
    if (!shipId) {
      return res.status(400).json({ error: 'Ship ID required' });
    }
    const result = buyShip(req.userId, shipId);
    broadcastUpdate();
    res.json(result);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

app.post('/api/ships/assign', requireAuth, (req, res) => {
  try {
    const { shipId, areaId } = req.body;
    if (shipId === undefined) {
      return res.status(400).json({ error: 'Ship ID required' });
    }
    const result = assignShipToArea(req.userId, shipId, areaId || null);
    broadcastUpdate();
    res.json(result);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Fishing areas (user view - includes stock info)
app.get('/api/areas', (req, res) => {
  try {
    const areas = getFishingAreas(true); // Include stock for user view
    res.json(areas);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Clans
app.post('/api/clans/create', requireAuth, (req, res) => {
  try {
    const { name } = req.body;
    if (!name || name.trim() === '') {
      return res.status(400).json({ error: 'Clan name required' });
    }
    const result = createClan(req.userId, name.trim());
    res.json(result);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

app.post('/api/clans/join', requireAuth, (req, res) => {
  try {
    const { clanId } = req.body;
    if (!clanId) {
      return res.status(400).json({ error: 'Clan ID required' });
    }
    const result = joinClan(req.userId, clanId);
    res.json(result);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

app.post('/api/clans/leave', requireAuth, (req, res) => {
  try {
    const result = leaveClan(req.userId);
    res.json(result);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

app.post('/api/clans/rename', requireAuth, (req, res) => {
  try {
    const { newName } = req.body;
    if (!newName || newName.trim() === '') {
      return res.status(400).json({ error: 'New clan name required' });
    }
    const result = renameClan(req.userId, newName.trim());
    res.json(result);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

app.get('/api/clans', (req, res) => {
  try {
    const clans = getAllClans();
    res.json(clans);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/clans/:clanId/members', (req, res) => {
  try {
    const members = getClanMembers(parseInt(req.params.clanId));
    res.json(members);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/leaderboard', (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 10;
    const leaders = getLeaderboard(limit);
    res.json(leaders);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/players/ships', (req, res) => {
  try {
    const players = getAllPlayersWithShips();
    res.json(players);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Admin routes
app.post('/api/admin/tick', requireAdmin, (req, res) => {
  try {
    lastTickTime = Date.now();
    const result = processTick();
    broadcastUpdate();
    broadcastTick();
    res.json({ success: true, result });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/admin/areas', requireAdmin, (req, res) => {
  try {
    const areas = adminGetAreaStocks();
    res.json(areas);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/admin/areas/create', requireAdmin, (req, res) => {
  try {
    const { name, areaType, fishType, currentStock, maxStock, fishPrice, regenerationRate } = req.body;
    if (!name || !areaType || !fishType || maxStock === undefined || fishPrice === undefined) {
      return res.status(400).json({ error: 'Name, areaType, fishType, maxStock, and fishPrice are required' });
    }
    const newArea = adminCreateArea(
      name,
      areaType,
      fishType,
      currentStock || maxStock,
      maxStock,
      fishPrice,
      regenerationRate || 0.1
    );
    broadcastUpdate();
    res.json({ success: true, area: newArea });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/admin/areas/:areaId/reset-stock', requireAdmin, (req, res) => {
  try {
    const { amount } = req.body;
    const areaId = parseInt(req.params.areaId);
    const newStock = adminResetAreaStock(areaId, amount || 10000);
    broadcastUpdate();
    res.json({ success: true, stock: newStock });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/admin/areas/:areaId/add-fish', requireAdmin, (req, res) => {
  try {
    const { amount } = req.body;
    const areaId = parseInt(req.params.areaId);
    if (!amount) {
      return res.status(400).json({ error: 'Amount required' });
    }
    const newStock = adminAddFishToArea(areaId, amount);
    broadcastUpdate();
    res.json({ success: true, stock: newStock });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/admin/areas/:areaId/set-regeneration-rate', requireAdmin, (req, res) => {
  try {
    const { rate } = req.body;
    const areaId = parseInt(req.params.areaId);
    if (rate === undefined) {
      return res.status(400).json({ error: 'Rate required' });
    }
    const newRate = adminSetAreaRegenerationRate(areaId, rate);
    broadcastUpdate();
    res.json({ success: true, regenerationRate: newRate });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/admin/areas/:areaId/set-fish-price', requireAdmin, (req, res) => {
  try {
    const { price } = req.body;
    const areaId = parseInt(req.params.areaId);
    if (price === undefined) {
      return res.status(400).json({ error: 'Price required' });
    }
    const newPrice = adminSetAreaFishPrice(areaId, price);
    broadcastUpdate();
    res.json({ success: true, fishPrice: newPrice });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.delete('/api/admin/clans/:clanId', requireAdmin, (req, res) => {
  try {
    const clanId = parseInt(req.params.clanId);
    adminDeleteClan(clanId);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/admin/users', requireAdmin, (req, res) => {
  try {
    const users = adminGetAllUsers();
    res.json(users);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/admin/users/:userId/balance', requireAdmin, (req, res) => {
  try {
    const userId = parseInt(req.params.userId);
    const { amount } = req.body;
    if (amount === undefined) {
      return res.status(400).json({ error: 'Amount required' });
    }
    const newBalance = adminModifyUserBalance(userId, amount);
    broadcastUpdate();
    res.json({ success: true, newBalance });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/admin/users/:userId/ships', requireAdmin, (req, res) => {
  try {
    const userId = parseInt(req.params.userId);
    const { shipId } = req.body;
    if (!shipId) {
      return res.status(400).json({ error: 'Ship ID required' });
    }
    adminAddShipToUser(userId, shipId);
    broadcastUpdate();
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.delete('/api/admin/users/:userId/ships/:userShipId', requireAdmin, (req, res) => {
  try {
    const userId = parseInt(req.params.userId);
    const userShipId = parseInt(req.params.userShipId);
    adminRemoveShipFromUser(userShipId, userId);
    broadcastUpdate();
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// WebSocket server for real-time updates
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

function broadcastUpdate() {
  const stats = getGameStats();
  const message = JSON.stringify({ type: 'update', data: stats });
  wss.clients.forEach(client => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(message);
    }
  });
}

function broadcastTick() {
  // Broadcast tick event to refresh all clients
  const message = JSON.stringify({ type: 'tick', lastTickTime: lastTickTime });
  wss.clients.forEach(client => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(message);
    }
  });
}

wss.on('connection', (ws) => {
  // Send initial game stats and tick info
  const stats = getGameStats();
  ws.send(JSON.stringify({ type: 'update', data: stats }));
  ws.send(JSON.stringify({ 
    type: 'tickInfo', 
    lastTickTime: lastTickTime, 
    tickInterval: TICK_INTERVAL_MS 
  }));

  ws.on('close', () => {
    // Connection closed
  });
});

// Scheduled tick processing
let tickInterval = setInterval(() => {
  try {
    console.log(`[${new Date().toISOString()}] Processing tick...`);
    lastTickTime = Date.now();
    const result = processTick();
    console.log(`Tick processed: ${result.processedCount} ships processed`);
    broadcastUpdate();
    broadcastTick();
  } catch (error) {
    console.error('Error processing tick:', error);
  }
}, TICK_INTERVAL_MS);

// Serve static files from frontend dist directory in production (AFTER all API routes)
if (process.env.NODE_ENV === 'production') {
  const frontendDistPath = path.join(__dirname, '../frontend/dist');
  app.use(express.static(frontendDistPath));
  
  // Serve index.html for all non-API routes
  app.get('*', (req, res) => {
    // Don't serve index.html for API routes or WebSocket upgrade requests
    if (req.path.startsWith('/api') || req.headers.upgrade === 'websocket') {
      return res.status(404).json({ error: 'Not found' });
    }
    res.sendFile(path.join(__dirname, '../frontend/dist/index.html'));
  });
}

// Start server (listen on all network interfaces for local network access)
server.listen(PORT, '0.0.0.0', () => {
  console.log(`OpenFishBanks server running on port ${PORT}`);
  console.log(`Tick interval: ${TICK_INTERVAL_MS / 1000} seconds`);
  if (process.env.NODE_ENV === 'production') {
    console.log(`Production mode: Serving frontend from backend`);
  } else {
    console.log(`Server accessible on local network at http://YOUR_IP:${PORT}`);
  }
});

// Graceful shutdown
process.on('SIGINT', () => {
  clearInterval(tickInterval);
  db.close();
  server.close(() => {
    console.log('Server closed');
    process.exit(0);
  });
});