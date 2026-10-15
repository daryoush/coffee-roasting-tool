# ☕ Roast Commander

A lightweight, browser-based coffee roasting temperature controller with voice control, real-time charting, and offline PWA support.

## 🎯 Features

- **Flexible Time-Step Profiles** — decimal minutes (e.g., `0.5`) or `MM:SS` format (e.g., `0:30`)
- **Editable Profile Table** with color-coded flame notes (high, medium-high, medium, medium-low, low, hold, charge)
- **Voice-Controlled Logging** — hands-free temperature and observation entry
- **Optional Mic Test** — 3-number validation before roast (default enabled, can be skipped)
- **Voice "Start" Command** — roast timer begins only when you say "Start"
- **Dual-Chart System**:
  - Main chart: full profile before start → 2-minute rolling zoom during roast
  - Overview minimap: entire roast with highlight box showing current zoom window
- **Dynamic Y-Axis Scaling** — main chart auto-zooms to visible temperature range
- **Color-Coded Profile Lines & Dots** — chart colors match flame note colors
- **Continuous Target Interpolation** — target temp updates every second
- **Bean Temperature Estimation** — thermal lag model for internal bean temp
- **Fullscreen Mode** — entire roast panel fills the screen
- **PWA Support** — installable, works offline
- **CSV Import/Export** — save/load profiles, export completed roasts
- **Version Display** — tracks version number, date, and build time

## 🚀 Installation & Running

### Desktop (macOS, Linux, Windows)

**Option 1: Python HTTP Server (Recommended)**
```bash
# In the project directory
python -m http.server 8000
```
Then open `http://localhost:8000` in Chrome, Edge, or Safari.

**Option 2: Node.js HTTP Server**
```bash
npx http-server -p 8000
```

**Option 3: VS Code Live Server**
Install the "Live Server" extension, right-click `index.html`, and select "Open with Live Server".

### Android (Mobile)

**Option 1: Termux (Recommended — Free, No Ads)**

1. Install **Termux** from **F-Droid** (not the Play Store — the Play Store version is broken/outdated).
2. Open Termux and run:
   ```bash
   pkg update
   pkg install python -y
   mkdir -p ~/roast && cd ~/roast
   ```
3. Transfer your project files to `~/roast/` (use Android's "Share" menu or a file manager).
4. Start the server:
   ```bash
   cd ~/roast
   python -m http.server 8000
   ```
5. Open Chrome on the same phone and go to:
   ```
   http://localhost:8000
   ```
6. Allow microphone access when prompted.

> **Critical:** You must use `localhost` or `127.0.0.1`. If you use your Wi-Fi IP like `192.168.1.xxx`, Chrome will **block the microphone** because it treats that as insecure. `localhost` is treated as secure on Android Chrome.

**Option 2: Simple HTTP Server App (Easiest, No Commands)**

Install one of these from the Play Store:
- **"Simple HTTP Server"** by Ice Cold Apps
- **"Web Server"** by Banana Studio
- **"KSWEB"** (has a free version)

Steps:
1. Install the app
2. Point it to the folder containing the project
3. Start the server (usually port 8080)
4. Open Chrome → `http://localhost:8080` (or whatever port it gives you)
5. Allow mic access

**Option 3: Acode Code Editor**

1. Install **Acode** from Play Store
2. Open the project folder in Acode
3. Tap the **▶ Run** or **Preview** button — it opens an internal browser at `http://localhost`
4. This usually works for mic access too

### Installing as a PWA (Desktop or Mobile)

Once the app is running on localhost:

**Desktop (Chrome/Edge):**
- Look for the install icon (⊕) in the address bar
- Or click the three-dot menu → "Install Roast Commander..."
- The app opens in its own window without browser UI

**Mobile (Android Chrome):**
- Tap the three-dot menu
- Tap "Install app" or "Add to Home screen"
- The app icon appears on your home screen

**Benefits of PWA:**
- ✅ Works offline after first load
- ✅ No repeated microphone permission prompts
- ✅ Full-screen experience without browser UI
- ✅ Auto-updates when you update the files

## 📖 How to Use

### Step 1: Set Up Your Profile
1. Open the app in your browser.
2. Edit the profile table:
   - **Time**: Enter time in decimal minutes (e.g., `0.5`, `1.25`) or `MM:SS` format (e.g., `0:30`, `1:15`)
   - **Target**: Target surface temperature in °F
   - **Note**: Optional text that will be spoken aloud (e.g., "high flame", "medium-low", "first crack expected")
3. Notes are automatically color-coded based on flame keywords.
4. You can load a CSV profile or save the current one.

### Step 2: Accept Profile
1. Click **"✅ Accept Profile"**.
2. The app switches to the roast panel.
3. The main chart shows the **full profile** so you can see the entire planned roast.
4. The overview minimap shows the same profile below.

### Step 3: Mic Test (Optional)
1. If the "Enable mic test before roast" checkbox is checked (default), click **"🎤 Start Listening"**.
2. The system will ask you to say 3 random numbers between 100-450°F.
3. Say each number clearly. The system validates each one.
4. If all 3 pass, the system says: *"Microphone test passed. Preheat the pan and say start when the beans are dumped to the preheated pan"*.
5. If the mic test fails, adjust your mic position and try again.

### Step 4: Start the Roast
1. Preheat your pan/drum.
2. When you dump the beans in, say **"Start"**.
3. The timer begins, and the main chart automatically switches to the **2-minute rolling zoom**.
4. The overview minimap shows a highlight box indicating your current position in the overall roast.

### Step 5: Log Temperatures & Observations
- **Voice**: Just speak the temperature (e.g., "two hundred fifty") or observation (e.g., "first crack").
- **Manual**: Type in the quick input boxes and press Enter.
- The system validates temperatures (100-450°F range) and routes out-of-range numbers as observations.

### Step 6: Monitor & Adjust
- Watch the **gas instruction banner** for real-time coaching (ADD GAS / HOLD GAS / REDUCE GAS).
- The **target temperature** updates every second via interpolation.
- The **bean estimate** shows the estimated internal bean temperature.
- Use **Fullscreen** (⛶ button) to expand the roast panel to fill the screen.

### Step 7: End & Export
1. Click **"⏹ End Roast"** when done.
2. Click **"⬇ Export Roast CSV"** to download the complete roast data.
3. The app returns to the setup panel for the next roast.

## 📊 Profile CSV Format

The tool supports **flexible time intervals** (e.g., 30 seconds, 1.5 minutes) instead of being locked to strict 1-minute increments.

When loading or saving a profile CSV, the tool expects the following columns:
- **Time**: Can be entered as decimal minutes (e.g., `0.5`, `1.25`) or `MM:SS` format (e.g., `0:30`, `1:15`).
- **Target**: Target surface temperature in °F.
- **Note**: Optional text that will be spoken aloud via Text-to-Speech when that time step is reached.

**Example CSV (`ethiopian_natural_roast_profile.csv`):**
```csv
Time,Target,Note
0:00,200,Charge — high flame
0:30,220,high flame
1:00,245,medium flame — Maillard
1:30,270,medium flame
2:00,295,medium flame
2:30,320,reduce to low
3:00,345,low flame
3:30,370,low flame
4:00,395,first crack expected
4:30,420,hold temperature
5:00,440,reduce gas
5:30,455,second crack zone
```

## 🛠️ Development

### Project Structure
```
coffee-roasting-tool/
├── index.html              # Main HTML structure
├── styles.css              # All styling (dark theme, fullscreen, color-coded notes)
├── manifest.json           # PWA manifest
├── service-worker.js       # Offline caching
├── Design.md               # Detailed design documentation
├── README.md               # This file
└── js/
    ├── state.js            # Global state variables
    ├── utils.js            # Utility functions (time parsing, number extraction)
    ├── profile.js          # Profile table management
    ├── chart.js            # Dual-chart rendering (main + overview)
    ├── speech.js           # Speech recognition & TTS
    ├── roast.js            # Roast lifecycle & data logging
    └── app.js              # Application entry point
```

### Making Changes
1. Edit the relevant file(s).
2. Bump the version in `js/state.js`:
   ```javascript
   const APP_VERSION = {
     number: '1.7.0',  // Bump this
     date: '2026-10-03',  // Update this
     time: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
   };
   ```
3. Update `CACHE_NAME` in `service-worker.js` to match (e.g., `roast-commander-v1.7.0`).
4. Commit and push.
5. Users will automatically get the new version on next load (no hard-refresh needed thanks to no-cache meta tags).

### Testing
1. Start a local server: `python -m http.server 8000`
2. Open `http://localhost:8000` in Chrome.
3. Open DevTools (F12) → Console tab to see debug logs.
4. Test the full workflow: Accept Profile → Mic Test → Start → Log temps → End Roast → Export.

## 🐛 Troubleshooting

### Microphone Not Working
- **Must use `localhost` or `127.0.0.1`** — Wi-Fi IPs like `192.168.1.xxx` are treated as insecure and block the mic.
- **Allow microphone access** when Chrome prompts.
- **Check browser settings** → Site settings → Microphone → Allow.
- **Try the mic test** — it validates that the mic is working before the roast starts.

### Changes Not Showing Up
- The app uses no-cache meta tags, so a normal reload (Cmd+R or F5) should work.
- If changes still don't appear, do a hard-refresh: **Cmd+Shift+R** (Mac) or **Ctrl+Shift+R** (Windows/Linux).
- Clear browser cache: DevTools → Application → Storage → Clear site data.

### Fullscreen Not Working
- Click the **"⛶ Full Screen"** button in the roast panel.
- Press **Escape** to exit fullscreen.
- If the button doesn't work, open DevTools console and check for JavaScript errors.

### Chart Not Rendering
- Ensure the browser supports HTML5 Canvas (all modern browsers do).
- Check the console for errors.
- Try a hard-refresh.

### PWA Not Installing
- Must be served from `localhost` or HTTPS (not `file://` or HTTP on a non-localhost IP).
- Clear browser cache and reload.
- Check that `manifest.json` and `service-worker.js` are accessible (no 404 errors in DevTools → Network tab).

## 📝 License

This project is open source and available for personal and commercial use.

## 🙏 Acknowledgments

Built for coffee roasters who want precise temperature control without complicated software.