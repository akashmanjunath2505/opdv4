# Building Aivana Doc as a Standalone .exe Application

## Quick Start - Build the .exe NOW

### Step 1: Install Dependencies
```bash
npm install
```

This will install Electron and electron-builder needed to package the app.

---

### Step 2: Build the Executable
```bash
npm run package:exe
```

**This will:**
1. Build the React app (production optimized)
2. Package everything with Electron
3. Create a Windows installer (.exe) in the `release/` folder

---

### Step 3: Find Your .exe File

After building, you'll find TWO options in the `release/` folder:

1. **Installer Version:**
   - File: `Aivana Doc-1.0.0-Setup.exe` 
   - Size: ~150-200 MB
   - **Best for: End users** (installs to Program Files, creates shortcuts)
   - Double-click to install, then run from Start Menu

2. **Portable Version:**
   - File: `Aivana Doc-1.0.0-Portable.exe`
   - Size: ~150-200 MB
   - **Best for: You/testing** (no installation needed)
   - Double-click to run immediately from any location

---

## Option: Build ONLY Portable .exe (Fastest)

If you just want the portable version (no installer):

```bash
npm run electron:build:portable
```

This creates ONLY the portable .exe (faster build).

---

## What Gets Packaged

The .exe includes:
- ✅ Your entire React app (frontend)
- ✅ Electron runtime (to display the app)
- ✅ All dependencies (React, Tailwind, etc.)
- ✅ Application icon and branding

**What's NOT included (requires internet):**
- ❌ Backend server (still needs to run separately OR deploy to cloud)
- ❌ Gemini API calls (requires internet + API key)
- ❌ Supabase database (requires internet connection)

---

## Requirements for the App to Work

### 1. Internet Connection Required
Your app needs internet for:
- Gemini API calls (speech-to-text, SOAP generation)
- Supabase database (storing transcripts, prescriptions)
- Stripe payments

### 2. Backend Server Required
You have two options:

#### Option A: Use Cloud Backend (Recommended)
- Deploy backend to Vercel/Railway
- Update `.env` file with production API URL
- Users don't need to run anything locally

#### Option B: Include Backend in .exe (Advanced)
- Package Node.js server with Electron
- App runs both frontend + backend locally
- See "Advanced: Package Backend" section below

---

## Testing the .exe

### Test the Portable Version:
1. Navigate to `release/` folder
2. Double-click `Aivana Doc-1.0.0-Portable.exe`
3. App should open in a window like a native desktop app
4. Test all features (transcription, SOAP generation, etc.)

### Test the Installer Version:
1. Navigate to `release/` folder
2. Double-click `Aivana Doc-1.0.0-Setup.exe`
3. Follow installation wizard
4. Launch from Start Menu or Desktop shortcut

---

## Environment Variables in .exe

The .exe needs API keys to work. You have two options:

### Option 1: Include Keys in Build (Testing Only)
Create `.env.production` file:
```env
VITE_API_URL=https://api.aivanahealth.com
GEMINI_API_KEY=your_key_here
SUPABASE_URL=your_supabase_url
SUPABASE_ANON_KEY=your_key
```

Then build:
```bash
npm run package:exe
```

**⚠️ Warning:** Keys will be visible in the bundled code. Only for testing!

### Option 2: User Provides Keys (Production)
Add a settings screen where users enter their own API keys.
Keys are stored securely in user's local storage.

---

## Advanced: Package Backend with Electron

To make the .exe truly standalone with backend:

### Step 1: Modify `electron/main.js`
Add this code to start the Express server:

```javascript
const { spawn } = require('child_process');
const path = require('path');

let serverProcess;

function startBackendServer() {
  const serverPath = path.join(__dirname, '../server/index.js');
  serverProcess = spawn('node', [serverPath], {
    cwd: path.join(__dirname, '..'),
    env: { ...process.env, PORT: 3001 }
  });

  serverProcess.stdout.on('data', (data) => {
    console.log(`Server: ${data}`);
  });

  serverProcess.stderr.on('data', (data) => {
    console.error(`Server Error: ${data}`);
  });
}

// Call this in app.whenReady()
app.whenReady().then(() => {
  startBackendServer();
  setTimeout(createWindow, 2000); // Wait for server to start
});

// Kill server on app quit
app.on('will-quit', () => {
  if (serverProcess) {
    serverProcess.kill();
  }
});
```

### Step 2: Update `electron-builder.json`
Add server files to the package:

```json
{
  "files": [
    "dist/**/*",
    "electron/**/*",
    "server/**/*",
    "node_modules/**/*",
    "package.json"
  ]
}
```

### Step 3: Rebuild
```bash
npm run package:exe
```

Now the .exe includes the backend server!

---

## File Sizes

**Expected .exe sizes:**
- Portable .exe: ~150-200 MB (includes Electron runtime)
- Installer .exe: ~150-200 MB (same content, different format)

**With backend included:** +50-100 MB (adds Node.js modules)

---

## Troubleshooting

### "npm run package:exe" fails
**Error:** `electron-builder not found`
**Fix:** Run `npm install` first

### .exe doesn't start
**Possible causes:**
1. Missing `.env` file (API keys not configured)
2. Antivirus blocking (Windows Defender may flag unsigned .exe)
3. Backend server not running (if not packaged)

**Fix:** 
- Check Windows Event Viewer for error details
- Right-click .exe → Run as Administrator

### App opens but features don't work
**Cause:** No internet or API keys missing
**Fix:** 
- Check internet connection
- Verify API keys in `.env.production`

### "White screen" on launch
**Cause:** Vite build path incorrect
**Fix:** Check `dist/index.html` exists after build

---

## Development Mode

Test the Electron app before building:

```bash
# Terminal 1: Start Vite dev server
npm run dev

# Terminal 2: Start Electron (points to localhost:3000)
npm run electron:dev
```

This opens the app in Electron using your dev server (with hot reload).

---

## Signing the .exe (Optional - For Distribution)

Unsigned .exe files trigger Windows SmartScreen warnings.

### To sign your .exe:
1. Purchase a code signing certificate ($100-300/year)
2. Add to `electron-builder.json`:
```json
{
  "win": {
    "certificateFile": "path/to/certificate.pfx",
    "certificatePassword": "your_password"
  }
}
```
3. Rebuild with `npm run package:exe`

Signed .exes are trusted by Windows and don't show warnings.

---

## Distribution

### Give Users ONE File:
**Recommended:** Upload `Aivana Doc-1.0.0-Portable.exe` to cloud storage
- Google Drive, Dropbox, or your website
- Users download and double-click to run
- No installation needed

### OR: Installer for Professional Distribution:
**Use:** `Aivana Doc-1.0.0-Setup.exe`
- Better for enterprise users
- Creates Start Menu shortcuts
- Uninstaller included

---

## Auto-Updates (Advanced)

To add auto-update feature (app checks for new versions):

1. Use `electron-updater` package
2. Host updates on GitHub Releases or S3
3. App automatically downloads and installs updates

See: https://www.electron.build/auto-update

---

## Summary

✅ **To build .exe NOW:**
```bash
npm install
npm run package:exe
```

✅ **Find your .exe in:**
`release/Aivana Doc-1.0.0-Portable.exe`

✅ **Test it:**
Double-click the .exe → App opens → Test features

✅ **Distribute it:**
Share the .exe file with users (150-200 MB)

✅ **Requirements:**
- Users need internet connection
- Backend API must be deployed (Vercel/Railway)
- Or package backend with Electron (see Advanced section)

---

**Need help?** Check the console logs or Windows Event Viewer for errors.
