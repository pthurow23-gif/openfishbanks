# OpenFishBanks - Multiplayer Fishing Simulation

A multiplayer OpenFishBanks-style simulation game where players manage fleets, harvest fish from a shared global stock, and compete for profits. The game features persistent accounts, timed updates every 15 minutes, and developer/admin commands.

## Features

### Core Gameplay
- **Shared Fishery**: One global fish stock shared by all active players
- **Timed Updates**: Fish stock regenerates and harvests are processed every 15 minutes automatically
- **Proportional Harvesting**: If total harvest exceeds available fish, all harvests are scaled proportionally
- **Persistent Accounts**: User accounts with persistent data across sessions
- **Profit Tracking**: Cumulative profit balance for each user

### Authentication
- User registration and login with username/password
- Session-based authentication
- Admin account with special privileges

### Developer Commands (Admin Only)
- Force process a tick (update all harvests)
- Reset fish stock to a specific amount
- Add/remove fish from the stock
- Adjust regeneration rate
- Adjust fish price per unit

### Statistics & Leaderboard
- Real-time fish stock display
- User balance and pending harvest tracking
- Leaderboard showing top players by balance
- Game statistics (total players, active fleets, etc.)

### Real-time Updates
- WebSocket connection for real-time stock and game state updates
- Automatic refresh of leaderboard and statistics

## Tech Stack

### Backend
- **Node.js** with **Express** framework
- **SQLite** database (using better-sqlite3)
- **WebSocket** (ws) for real-time updates
- **bcryptjs** for password hashing
- **express-session** for session management

### Frontend
- **React** with functional components and hooks
- **Vite** for build tooling
- **Axios** for API calls
- **Recharts** for data visualization (optional)

## Setup & Installation

### Prerequisites
- Node.js (v16 or higher)
- npm or yarn

### Backend Setup

1. Navigate to the backend directory:
```bash
cd backend
```

2. Install dependencies:
```bash
npm install
```

3. Create a `.env` file (optional, defaults are provided):
```bash
PORT=3001
SESSION_SECRET=your-secret-key-change-this-in-production
FISH_PRICE=10
REGENERATION_RATE=0.1
INITIAL_FISH_STOCK=10000
TICK_INTERVAL_MINUTES=15
ADMIN_USERNAME=admin
ADMIN_PASSWORD=admin123
```

4. Start the backend server:
```bash
npm start
```

For development with auto-reload:
```bash
npm run dev
```

The backend will run on `http://localhost:3001`

### Frontend Setup

1. Navigate to the frontend directory:
```bash
cd frontend
```

2. Install dependencies:
```bash
npm install
```

3. Start the development server:
```bash
npm run dev
```

The frontend will run on `http://localhost:3000`

### Production Build

To build the frontend for production:
```bash
cd frontend
npm run build
```

The built files will be in the `dist` directory.

## Default Credentials

- **Admin Username**: `admin`
- **Admin Password**: `admin123`

**Note**: Change the admin password in production!

## Game Mechanics

### How It Works

1. **Harvest Submission**: Players submit harvest amounts at any time. These are queued as "pending harvests."

2. **Tick Processing**: Every 15 minutes (configurable), the game processes all pending harvests:
   - If total harvest ≤ available fish: All harvests are fulfilled
   - If total harvest > available fish: All harvests are scaled proportionally
   - Fish stock is reduced by the actual total harvest
   - Players receive profit based on their actual harvest × fish price
   - Fish stock regenerates (multiplies by 1 + regeneration_rate)

3. **Stock Regeneration**: After each tick, the fish stock regenerates:
   - New stock = current stock × (1 + regeneration_rate)
   - Maximum stock is capped at 50,000

4. **Profit Calculation**: Profit = actual_harvest × fish_price

### API Endpoints

#### Authentication
- `POST /api/register` - Register a new user
- `POST /api/login` - Login
- `POST /api/logout` - Logout
- `GET /api/me` - Get current user info

#### Game
- `GET /api/game/stats` - Get global game statistics
- `GET /api/user/stats` - Get current user's statistics
- `POST /api/harvest` - Submit a harvest
- `GET /api/leaderboard` - Get leaderboard (optional limit query param)

#### Admin (requires admin authentication)
- `POST /api/admin/tick` - Force process a tick
- `POST /api/admin/reset-stock` - Reset fish stock (body: `{ amount: number }`)
- `POST /api/admin/add-fish` - Add fish to stock (body: `{ amount: number }`)
- `POST /api/admin/set-regeneration-rate` - Set regeneration rate (body: `{ rate: number }`)
- `POST /api/admin/set-fish-price` - Set fish price (body: `{ price: number }`)

## Database Schema

The SQLite database includes the following tables:
- `users` - User accounts
- `fleets` - User fleets
- `current_fish_stock` - Current fish stock state
- `fish_stock` - Historical fish stock records
- `harvests` - Pending harvests
- `transactions` - Processed harvest transactions
- `user_balances` - User profit balances

## Development

### File Structure

```
openfishbanks/
├── backend/
│   ├── server.js          # Main server file
│   ├── database.js        # Database initialization and setup
│   ├── auth.js            # Authentication middleware and functions
│   ├── gameLogic.js       # Core game logic
│   ├── package.json
│   └── .env               # Environment variables (create this)
│
└── frontend/
    ├── src/
    │   ├── components/    # React components
    │   ├── App.jsx        # Main app component
    │   ├── api.js         # API client
    │   └── main.jsx       # Entry point
    ├── package.json
    └── vite.config.js
```

## Future Enhancements (Optional)

- OAuth authentication (Google, GitHub, etc.)
- Graphs of fish stock over time
- Notifications when stock is low or collapsed
- Chat / alliance / negotiation features
- Multiple fleets per user
- Fleet upgrades and customization
- Market fluctuations (dynamic pricing)
- Historical transaction logs

## License

MIT

## Contributing

Feel free to submit issues and pull requests!