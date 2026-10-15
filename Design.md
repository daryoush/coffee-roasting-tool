# ☕ Roast Commander — Design Document

## 1. Project Overview
**Roast Commander** is a lightweight, browser-based coffee roasting temperature controller. It allows roasters to define target temperature profiles, log real-time temperature readings via voice or manual input, and receive audio cues for roast milestones. It runs entirely in the browser, requires no backend, and is optimized for mobile use (e.g., via local Termux server on Android). It is also installable as a **Progressive Web App (PWA)** for offline use.

## 2. Core Features

### Profile Management
- **Flexible Time-Step Profiles**: Supports profiles in decimal minutes (e.g., `0.5`) or `MM:SS` format (e.g., `0:30`), replacing rigid 1-minute intervals.
- **Editable Profile Table**: A clean, inline-editable HTML table for managing time, target temperature, and roast notes.
- **Color-Coded Flame Notes**: Profile notes are automatically color-coded based on flame instructions:
  - 🔴 `high` / `full` / `max` → red (`#ff6b5a`)
  - 🟠 `medium-high` → orange-red (`#ff8c42`)
  - 🟡 `medium` → orange (`#ffa94d`)
  - 🟨 `medium-low` → bright yellow (`#ffd43b`)
  - 🔵 `low` / `reduce` → blue (`#8ecfff`)
  - 🟢 `hold` / `maintain` → green (`#8fdf8f`)
  - 🟤 `charge` / `preheat` → amber (`#d9955a`)
- **CSV Import/Export**: Full round-trip support for saving and loading roast profiles and exporting completed roast data.

### Voice & Roast Control
- **Optional Mic Test**: A default-enabled checkbox lets users skip the 3-number mic validation test if desired.
- **Voice-Controlled Logging**: Uses the Web Speech API to listen for temperature readings and roast observations hands-free.
- **Voice "Start" Command**: The roast timer only begins when the user says "Start" — the "Accept Profile" button just transitions to the roast screen.
- **Strict Temperature Validation**: Speech transcriptions are validated to ensure only plausible bean temperatures (**100°F – 450°F**) are logged as readings; out-of-range numbers are safely routed as text observations.

### Visualization
- **Dual-Chart System**:
  - **Main Chart**: Shows the **full profile** before the roast starts, then automatically switches to a **2-minute rolling window** once "Start" is called.
  - **Overview Minimap**: A 100px-tall strip below the main chart shows the entire roast profile with a semi-transparent highlight box indicating the currently zoomed-in time slot.
- **Dynamic Y-Axis Scaling**: The main chart's Y-axis automatically scales to the temperature range of the visible 2-minute window, with a minimum 40°F span to prevent extreme zoom on flat lines.
- **Color-Coded Profile Lines & Dots**: The target profile line segments and dots in the chart use the same flame colors as the profile table notes.
- **Real-Time Canvas Charting**: Plots target profile, actual readings, and estimated bean temperature with a moving "current time" cursor.
- **Bean Temperature Estimation**: Applies a decaying thermal lag model to surface temperature readings to estimate internal bean temperature.
- **Continuous Target Interpolation**: The target temperature display updates every second via linear interpolation between profile steps.

### UI & Deployment
- **Fullscreen Mode**: CSS-based fullscreen (with native Fullscreen API as enhancement) that fills the entire browser window with the roast panel.
- **Version Display**: Shows version number, date, and build time on the setup screen for easy tracking.
- **PWA Support**: Installable on desktop and mobile, works offline via service worker caching.
- **No-Cache Meta Tags**: Prevents browser caching of `index.html` so updates are always visible without hard-refresh.

## 3. Architecture & Module Breakdown

| File | Responsibility |
|------|----------------|
| `index.html` | Semantic HTML structure. Loads CSS and JS modules in strict dependency order. Contains inline fullscreen script for reliability. |
| `styles.css` | All visual styling, including responsive layout, dark theme, color-coded note classes with high CSS specificity, and fullscreen mode rules. |
| `manifest.json` | PWA manifest with app metadata and icons for installability. |
| `service-worker.js` | Caches static assets (CSS, JS) for offline use; always fetches HTML fresh. |
| `js/state.js` | Centralized global state variables (profile steps, readings, timers, speech recognition, mic test state, version info). |
| `js/utils.js` | Pure utility functions: `parseTimeToMinutes()`, `formatTime()`, `parseCSVLine()`, `extractNumber()` (with **100–450°F range validation**), `getNoteClass()`. |
| `js/profile.js` | Profile table rendering, inline editing, sorting, and CSV load/save logic. |
| `js/chart.js` | HTML5 Canvas initialization, responsive resizing, dual-chart drawing (main + overview), fullscreen toggle, color mapping. |
| `js/speech.js` | Web Speech API wrappers: `initSpeech()`, Text-to-Speech (`speak`), pause-detection logic for committing voice inputs, mic test handling. |
| `js/roast.js` | Roast lifecycle management: `prepareRoast()`, `beginRoast()`, `tick()` timer, temperature logging, bean estimation math, data export, mic test functions. |
| `js/app.js` | Application entry point. Calls `loadSample()`, `resizeCanvas()`, and displays version info on DOM ready. |

## 4. Detailed System Design

### 4.1 DOM Structure

| Section | ID | Purpose |
|---|---|---|
| Setup Panel | `setupPanel` | Profile editing, load/save CSV, Accept Profile button, mic test checkbox, version display |
| Profile Table | `profileTable` / `profileTableBody` | Dynamic table of time, target, and note fields per step |
| Roast Panel | `roastPanel` | Hidden until roast starts; contains all active UI |
| Timer | `timerDisplay` | MM:SS roast clock |
| Speech Status | `lastHeard` / `statusText` | Live transcript and mic state |
| Big Temps | `targetDisplay` / `readingDisplay` / `estimateDisplay` | Large readouts |
| Gas Instruction | `gasInstruction` | Colored coaching banner |
| Minute Note | `minuteNote` | Purple banner showing the current step's note |
| Quick Inputs | `quickTemp` / `quickObs` | Manual temp and observation entry |
| Main Chart | `chartCanvas` | Canvas element for real-time plotting (550px default) |
| Overview Chart | `overviewCanvas` | Canvas element for minimap (100px default) |
| Logs | `readingLog` / `obsLog` / `minuteLog` | Scrollable history panels |

### 4.2 Data Flow

```
Setup Phase:
  User edits table → updateStepFromTable() → profileSteps[] (sorted by time)
  User clicks Save → profileToCSV() → browser download
  User clicks Load → FileReader → parseProfileCSV() → setProfile()
  User clicks Accept Profile → prepareRoast() → shows roast panel

Mic Test Phase (if enabled):
  User clicks Start Listening → initSpeech() → startMicTest()
  System speaks 3 random numbers (100-450°F)
  User says each number → extractNumber() → handleMicTestResult()
  If all 3 pass → micTestPassed = true → system says "Preheat pan, say Start"

Roast Phase:
  User says "Start" → beginRoast() → roastActive = true, startTime = now
  timer tick (1s) → tick()
    step boundary reached? → handleStepStart() → speak(note)
    minute boundary? → processMinuteEnd() → estimateBeanTemp()
    → updateDisplay() → gas instruction (interpolated target)
    → drawChart() + drawOverview()

  Voice input → onresult → extractNumber()
    valid number (100-450°F)? → commitTemp() → recordReading() → drawChart()
    invalid/out-of-range? → commitObs() → recordObservation() → drawChart()

  Manual input → submitQuick() / submitObs() → same as above

End Phase:
  User clicks End Roast → endRoast() → returns to setup panel
  User clicks Export → exportData() → downloads roast CSV
```

### 4.3 Chart System Design

**Main Chart Behavior:**
- **Before Start**: Shows the entire planned profile from minute 0 to the last step, with adaptive X-axis grid step (0.5m, 1m, 2m, etc. based on total duration).
- **After Start**: Automatically switches to a 2-minute rolling window centered on current time: `[currentTime - 1.0min, currentTime + 1.0min]`.
- **Y-Axis**: Dynamically scales to the temperature range of data within the visible window, with a minimum 40°F span.
- **Current Time Cursor**: Dashed vertical line appears only during active roast.

**Overview Minimap:**
- Always shows the full profile from 0 to max time.
- Draws a semi-transparent coffee-colored highlight box indicating the 2-minute window currently visible in the main chart.
- Highlight box slides smoothly as the roast progresses.
- Current time cursor also appears here for visual correlation.

## 5. Key Design Decisions

### 5.1. Modularization over Monolith
The project was refactored from a single ~800-line `index.html` file into dedicated modules. This prevents merge conflicts, makes debugging isolated features trivial, and allows for future feature additions (e.g., WebSocket hardware integration) without touching unrelated code.

### 5.2. Speech Validation (100°F – 450°F)
Early versions accepted any recognized number as a temperature, leading to false positives (e.g., "five hundred" or room temperature "70"). The `extractNumber()` function in `utils.js` now strictly validates both regex-digit and word-parser paths against the **100–450°F** range. Anything outside this window returns `null` and is gracefully handled as a text observation.

### 5.3. CSS Specificity for Color Coding
To ensure flame instruction keywords are visibly distinct in the editable table, color classes (e.g., `.note-high`) are scoped with high specificity (`.profile-table input.note-high { color: #ff6b5a !important; }`) to override the default input text color.

### 5.4. CSS-Only Fullscreen with Native Enhancement
The native Fullscreen API requires a user gesture, which was unreliable on some button click contexts. The solution uses CSS class toggling (`body.fullscreen-mode`) as the primary method, with the native API attempted as an optional enhancement. This ensures fullscreen works every time.

### 5.5. PWA for Offline & Permission Reliability
The Web Speech API requires a "secure context" (HTTPS or localhost). By making the app a PWA with a service worker, it can be installed and run offline after the first load, and microphone permissions work reliably without repeated prompts.

### 5.6. No-Cache Meta Tags
To prevent the browser from serving stale `index.html` after updates, the page includes `Cache-Control: no-cache, no-store, must-revalidate` meta tags. The service worker also explicitly fetches HTML from the network rather than cache.

## 6. Local Development & Testing

### Option 1: Python HTTP Server (Recommended for Desktop)
```bash
python -m http.server 8000
```
Then open `http://localhost:8000` in a modern browser (Chrome/Edge/Safari).

### Option 2: Termux on Android (Recommended for Mobile)
See the README for detailed instructions on running via Termux, Simple HTTP Server apps, or Acode.

### Option 3: PWA Installation
1. Serve via localhost (any method above).
2. Open in Chrome/Edge.
3. Click the install icon (⊕) in the address bar, or use the browser menu → "Install Roast Commander".
4. The app opens in its own window and works offline.

## 7. Future Enhancements (Backlog)
- [ ] Bluetooth integration for direct probe thermometer reading (e.g., Inkbird, Thermoworks).
- [ ] Rate of Rise (RoR) calculation and charting.
- [ ] Dark/Light theme toggle.
- [ ] Profile comparison (overlay multiple roasts on the same chart).
- [ ] Automatic first-crack detection based on temperature rate of change.
```