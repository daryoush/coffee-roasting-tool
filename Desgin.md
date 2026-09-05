 # Roast Commander — App Documentation

## Overview

**Roast Commander** is a single-page, browser-based web application for coffee roasting over a gas flame. It helps roasters hit a precise temperature profile by combining voice recognition, real-time charting, thermal-lag estimation, and text-to-speech coaching. The entire app is one self-contained HTML file with no build step, no server, and no external dependencies.

---

## What It Does

### 1. Profile Management
- **Load/Save roast profiles** as CSV files containing per-minute target temperatures and optional coaching notes
- **Default profile** (`default.csv`) is pre-loaded with a sample 12-minute roast curve
- Notes attached to each minute are spoken aloud via text-to-speech when that minute begins, so the roaster never has to look at the screen

### 2. Temperature Logging
- **Voice input**: The roaster reads surface temperatures from a laser IR gun. The app uses the browser's Web Speech API to transcribe, extracts the number, and logs it instantly upon detecting a pause (800ms)
- **Manual input**: A quick-type number box allows keyboard entry as a fallback
- **Buffer clearing**: After each pause, the speech recognition restarts with a clean buffer so the next reading isn't concatenated with the previous one

### 3. Bean Temperature Estimation
- Surface readings lag the true internal bean temperature early in the roast
- The app applies a **thermal-lag correction** that starts at ~22°F and decays to near zero as the roast progresses
- At the end of each minute, it averages all readings from that minute, corrects for lag, smooths against the previous estimate, and produces a **bean temperature estimate**

### 4. Gas Coaching
- Every second, the app compares the current bean estimate to the target for that minute
- It instructs the roaster in plain text: **🔥 ADD GAS**, **❄ REDUCE GAS**, or **✓ HOLD GAS**

### 5. Real-Time Charting
- **Blue step line**: target profile
- **Orange dots**: every surface reading, plotted at its exact timestamp
- **Green dashed line + diamonds**: minute-by-minute bean temperature estimates, labeled with values
- **Purple flags**: observations (e.g., "first crack", "browning") logged by voice or typing, plotted at their timestamp
- **Vertical dashed line**: current time cursor

### 6. Observation Logging
- The roaster can speak or type observations ("first crack", "browning", "smoke")
- These appear in a dedicated log and as flags on the chart with exact timestamps

### 7. Data Export
- Exports the full roast as a CSV containing:
  - Per-minute targets, notes, raw readings, average readings, and bean estimates
  - All observations with timestamps

---

## How It's Organized

### File Structure
Since it's a single HTML file, everything is inline:

```
roast_commander_v7.html
├── <head>
│   ├── CSS (single <style> block)
│   └── No external scripts or CDNs
└── <body>
    ├── DOM structure (setup panel + roast panel)
    └── <script> (single JavaScript block)
```

### DOM Structure

| Section | ID | Purpose |
|---|---|---|
| Setup Panel | `setupPanel` | Profile editing, load/save CSV, start button |
| Target Inputs | `targetInputs` | Dynamic grid of temp + note fields per minute |
| Roast Panel | `roastPanel` | Hidden until roast starts; contains all active UI |
| Timer | `timerDisplay` | MM:SS roast clock |
| Speech Status | `lastHeard` / `statusText` | Live transcript and mic state |
| Big Temps | `targetDisplay` / `readingDisplay` / `estimateDisplay` | Large readouts |
| Gas Instruction | `gasInstruction` | Colored coaching banner |
| Minute Note | `minuteNote` | Purple banner showing the current minute's note |
| Quick Inputs | `quickTemp` / `quickObs` | Manual temp and observation entry |
| Chart | `chartCanvas` | Canvas element for real-time plotting |
| Logs | `readingLog` / `obsLog` / `minuteLog` | Scrollable history panels |

### JavaScript Architecture

The code is organized into functional blocks within one script:

```
STATE
  ├── targets[]        // per-minute target temps
  ├── notes[]          // per-minute coaching notes
  ├── readings[]       // {timeSec, value, minute}
  ├── minuteAvgs[]     // {minute, avgReading, beanEstimate}
  ├── observations[]   // {timeSec, text, minute}
  └── flags (roastActive, currentMinute, isListening, etc.)

SETUP
  ├── addMinute()      // dynamically adds temp+note rows
  ├── updateTargets()  // syncs DOM inputs to state arrays
  ├── setProfile()     // bulk-loads a profile
  ├── loadSample()     // loads the built-in default
  ├── profileToCSV()   // serializes state to CSV string
  ├── saveProfileCSV() // triggers browser download
  ├── loadProfileCSV() // reads FileReader, parses
  └── parseProfileCSV() // handles quoted CSV fields

SPEECH PIPELINE
  ├── initSpeech()     // creates SpeechRecognition instance
  ├── extractNumber()  // parses "325", "three twenty five", etc.
  ├── commitTemp()     // debounces and logs a temp reading
  ├── commitObs()      // debounces and logs an observation
  ├── toggleMic()      // start/stop listening
  └── onresult handler // pause-detection + buffer clearing

ROAST ENGINE
  ├── startRoast()     // hides setup, shows roast, starts timer
  ├── tick()           // 1-second interval; handles minute boundaries
  ├── handleMinuteStart() // speaks note, shows banner
  ├── recordReading()  // pushes to readings[], updates UI
  ├── recordObservation() // pushes to observations[], updates UI
  ├── estimateBeanTemp() // thermal-lag model + smoothing
  ├── processMinuteEnd() // computes and logs minute summary
  ├── updateDisplay()  // gas instruction logic
  ├── endRoast()       // stops everything, finalizes
  └── exportData()     // downloads full roast CSV

CHART
  ├── resizeCanvas()   // handles HiDPI scaling
  └── drawChart()      // full canvas redraw every second
      ├── grid + axes
      ├── target step line
      ├── bean estimate dashed line + diamonds + labels
      ├── reading scatter dots
      ├── observation flags + labels
      └── current-time cursor

TEXT TO SPEECH
  └── speak()          // wraps SpeechSynthesisUtterance
```

### Data Flow

```
Setup Phase:
  User edits temps/notes → updateTargets() → targets[], notes[]
  User clicks Save → profileToCSV() → browser download
  User clicks Load → FileReader → parseProfileCSV() → setProfile()

Roast Phase:
  timer tick (1s) → tick()
    minute boundary? → handleMinuteStart() → speak(note)
                     → processMinuteEnd() → estimateBeanTemp()
    → updateDisplay() → gas instruction
    → drawChart()

  Voice input → onresult → extractNumber()
    number? → commitTemp() → recordReading() → drawChart()
    text?   → commitObs()  → recordObservation() → drawChart()

  Manual input → submitQuick() / submitObs() → same as above
```

### Key Design Decisions

| Decision | Rationale |
|---|---|
| **Single HTML file** | Zero dependencies; works offline; easy to email or host |
| **No framework** | Vanilla JS keeps it lightweight and debuggable via browser console |
| **Canvas (not SVG/Chart.js)** | Full control over rendering; no external library to load |
| **Pause-detection over `isFinal`** | Browser speech `isFinal` is too slow; 800ms pause gives instant feedback |
| **Buffer restart** | Stopping and restarting `SpeechRecognition` wipes the transcript so the next utterance is fresh |
| **Thermal lag model** | `22 * (1 - progress)` approximates the known physics: surface reads cooler early, converges late |
| **Exponential smoothing** | `prev*0.25 + current*0.75` prevents estimate jumps without heavy filtering |

### CSV Formats

## 📊 Profile CSV Format

The tool now supports **flexible time intervals** (e.g., 30 seconds, 1.5 minutes) instead of being locked to strict 1-minute increments. 

When loading or saving a profile CSV, the tool expects the following columns:
- **Time**: Can be entered as decimal minutes (e.g., `0.5`, `1.25`) or `MM:SS` format (e.g., `0:30`, `1:15`).
- **Target**: Target surface temperature in °F.
- **Note**: Optional text that will be spoken aloud via Text-to-Speech when that time step is reached.

**Example CSV (`ethiopian_natural_roast_profile.csv`):**
```csv
Time,Target,Note
0:00,200,Charge
0:30,220,
1:00,245,Drying phase complete
1:30,270,
2:00,295,Start of Maillard

---

## Browser Requirements

- **Chrome or Edge** required for voice input (Web Speech API)
- **Any modern browser** works for manual entry, charting, and TTS
- Must be served over `http://localhost` or `https://` for microphone access (opening `file://` may block the mic in some browsers)
- For local server: `python -m http.server 8000` in the app directory

---

## Console Logging

The app logs extensively to the browser console for debugging:
- `[SPEECH] Raw transcript: ...`
- `[SPEECH] COMMITTED temp: ...`
- `[MINUTE N] Readings used for bean estimate: [...]`
- `[MINUTE N] Avg reading: ... | Bean estimate: ... | Target: ...`
- `[TTS] Speaking: ...`
- `[PROFILE] Saved/Loaded ...`