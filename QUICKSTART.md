# Quick Start Guide

## Installation

1. **Install backend dependencies:**
```bash
cd backend
npm install
```

2. **Install frontend dependencies:**
```bash
cd ../frontend
npm install
```

## Running the Application

### Development Mode

**Terminal 1 - Start the backend:**
```bash
cd backend
npm run dev
```
Backend will run on http://localhost:3001

**Terminal 2 - Start the frontend:**
```bash
cd frontend
npm run dev
```
Frontend will run on http://localhost:3000

### Production Mode

**Backend:**
```bash
cd backend
npm start
```

**Frontend:**
```bash
cd frontend
npm run build
npm run preview
```

## Default Login

- **Username:** admin
- **Password:** admin123

## First Steps

1. Open http://localhost:3000 in your browser
2. Login with admin credentials or create a new account
3. Submit a harvest amount
4. Wait for the next tick (every 15 minutes) or use admin panel to force a tick
5. Watch your balance increase!

## Environment Variables (Optional)

Create a `.env` file in the `backend` directory:

```
PORT=3001
SESSION_SECRET=your-secret-key-change-this-in-production
FISH_PRICE=10
REGENERATION_RATE=0.1
INITIAL_FISH_STOCK=10000
TICK_INTERVAL_MINUTES=15
ADMIN_USERNAME=admin
ADMIN_PASSWORD=admin123
```

If you don't create a `.env` file, the defaults above will be used.