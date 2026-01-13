# Installation Troubleshooting

## Issue: `better-sqlite3` compilation error with Node.js v24

If you're getting C++20 compilation errors when installing `better-sqlite3`, you have a few options:

### Option 1: Use Node.js v20 LTS (Recommended)

Node.js v24 requires C++20, but `better-sqlite3` may not compile correctly. The easiest solution is to use Node.js v20 LTS instead.

**Using nvm (Node Version Manager):**

1. Install nvm if you don't have it:
   ```bash
   curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash
   ```

2. Install and use Node.js v20:
   ```bash
   nvm install 20
   nvm use 20
   ```

3. Verify your Node version:
   ```bash
   node -v  # Should show v20.x.x
   ```

4. Now try installing dependencies again:
   ```bash
   cd backend
   npm install
   ```

### Option 2: Configure C++20 Compilation

If you want to stick with Node.js v24, you can try setting environment variables:

```bash
export CXXFLAGS="-std=c++20"
export CPPFLAGS="-std=c++20"
cd backend
npm install
```

### Option 3: Install Xcode Command Line Tools Updates

Make sure your Command Line Tools are up to date:

```bash
sudo xcode-select --install
```

Then try installing again.

### Option 4: Use a Pre-built Binary (if available)

Sometimes npm will use a pre-built binary if one is available for your platform. Try:

```bash
cd backend
npm install --build-from-source=false
```

Note: This may not work if no pre-built binary exists for your platform.

---

## Recommended Solution

**Use Node.js v20 LTS** - it's the most compatible and stable option for this project.