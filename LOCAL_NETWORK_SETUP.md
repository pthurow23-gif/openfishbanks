# Local Network Setup Guide

This guide will help you set up the game so your family can access it on your local WiFi network.

## Step 1: Find Your Computer's IP Address

**On Mac:**
```bash
ifconfig | grep "inet " | grep -v 127.0.0.1
```

Look for an IP address that starts with:
- `192.168.x.x` (most common)
- `10.0.x.x`
- `172.16.x.x` to `172.31.x.x`

**Example output:**
```
inet 192.168.1.100 netmask 0xffffff00 broadcast 192.168.1.255
```

Your IP address is: **192.168.1.100** (in this example)

---

## Step 2: Start the Backend Server

Open a terminal and run:

```bash
cd /Users/piercethurow/openfishbanks/backend
npm start
```

You should see:
```
OpenFishBanks server running on port 3001
Tick interval: 900 seconds
```

**Keep this terminal open!**

---

## Step 3: Start the Frontend Server

Open a **new terminal window** and run:

```bash
cd /Users/piercethurow/openfishbanks/frontend
npm run dev
```

You should see something like:
```
VITE v5.x.x  ready in xxx ms

➜  Local:   http://localhost:3000/
➜  Network: http://192.168.1.100:3000/
```

**Keep this terminal open too!**

---

## Step 4: Access from Other Devices

### On Your Computer:
- Open browser: `http://localhost:3000`

### On Family Members' Devices (phones, tablets, other computers):
- Make sure they're connected to the **same WiFi network**
- Open browser: `http://YOUR_IP:3000`
- Example: `http://192.168.1.100:3000`

---

## Step 5: Share the URL

Share this URL with your family:
```
http://YOUR_IP:3000
```

Replace `YOUR_IP` with the IP address you found in Step 1.

---

## Troubleshooting

### "Can't connect" or "Connection refused"

1. **Check firewall**: Your Mac's firewall might be blocking connections
   - Go to System Settings → Network → Firewall
   - Make sure it's not blocking Node.js

2. **Check IP address**: Make sure you're using the correct IP
   - Run `ifconfig` again to verify
   - Make sure the IP starts with `192.168.` or `10.0.`

3. **Check WiFi**: Make sure all devices are on the same WiFi network

4. **Check servers are running**: 
   - Backend should show: "OpenFishBanks server running on port 3001"
   - Frontend should show: "Network: http://YOUR_IP:3000/"

### WebSocket connection errors

- The WebSocket will connect to the same IP address as the frontend
- If you see WebSocket errors, make sure the backend is running and accessible

### Port already in use

If you get "port already in use" errors:

```bash
# Kill process on port 3001 (backend)
lsof -ti:3001 | xargs kill -9

# Kill process on port 3000 (frontend)
lsof -ti:3000 | xargs kill -9
```

---

## Important Notes

1. **Your computer must stay on**: The servers run on your computer, so it needs to stay powered on and connected to WiFi

2. **Same network only**: This only works when devices are on the same WiFi network

3. **IP might change**: If you disconnect/reconnect to WiFi, your IP might change. Just run `ifconfig` again to get the new IP

4. **Admin access**: You can still log in as admin:
   - Username: `admin`
   - Password: `admin123`

---

## Quick Reference

**Your IP Address:** `192.168.x.x` (find it with `ifconfig`)

**Backend URL:** `http://YOUR_IP:3001` (not needed directly, but good to know)

**Frontend URL (for family):** `http://YOUR_IP:3000`

**Start servers:**
- Backend: `cd backend && npm start`
- Frontend: `cd frontend && npm run dev`