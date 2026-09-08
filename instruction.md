Perfect! I found the old `Desgin.md`. It has excellent, detailed documentation about the DOM structure, JavaScript architecture, and data flow. 

I will merge that valuable detail with the new modular architecture, flexible time steps, color-coded notes, and speech validation into a single, comprehensive, and correctly spelled `Design.md`. Then I'll provide the bash commands to rename/replace it and commit the changes.

### 📜 Bash Commands to Update and Fix the Design Document

Run these from your project root:

```bash
# 1. Create the new, merged, and correctly spelled Design.md
cat > Design.md << 'EOF'
# ☕ Roast Commander — Design Document

## 1. Project Overview
**Roast Commander** is a lightweight, browser-based coffee roasting temperature controller. It allows roasters to define target temperature profiles, log real-time temperature readings via voice or manual input, and receive audio cues for roast milestones. It runs entirely in the browser, requiring no backend, and is optimized for mobile use (e.g., via local Termux server on Android).

## 2. Core Features
- **Flexible Time-Step Profiles**: Supports profiles in decimal minutes (e.g., `0.5`) or `MM:SS` format (e.g., `0:30`), replacing rigid 1-minute intervals.
- **Editable Profile Table**: A clean, inline-editable HTML table for managing time, target temperature, and roast notes.
- **Color-Coded Flame Notes**: Profile notes are automatically color-coded based on flame instructions (e.g., "high" = red, "medium" = orange, "low" = blue, "hold" = green, "charge" = amber).
- **Voice-Controlled Logging**: Uses the Web Speech API to listen for temperature readings and roast observations hands-free.
- **Strict Temperature Validation**: Speech transcriptions are validated to ensure only plausible bean temperatures (**100°F – 450°F**) are logged as readings; out-of-range numbers are safely routed as text observations.
- **Real-Time Canvas Charting**: Plots target profile, actual readings, and estimated bean temperature with a moving "current time" indicator.
- **Bean Temperature Estimation**: Applies a decaying thermal lag model to surface temperature readings to estimate internal bean temperature.
- **CSV Import/Export**: Full round-trip support for saving and loading roast profiles and exporting completed roast data.

## 3. Architecture & Module Breakdown
The application was refactored from a monolithic single-file app into dedicated, single-responsibility modules for maintainability, easier debugging, and future extensibility.

| File | Responsibility |
|------|----------------|
| `index.html` | Semantic HTML structure. Loads CSS and JS modules in strict dependency order. |
| `styles.css` | All visual styling, including responsive layout, dark theme, and **color-coded note classes** with high CSS specificity. |
| `js/state.js` | Centralized global state variables (profile steps, readings, timers, speech recognition instance). |
| `js/utils.js` | Pure utility functions: `parseTimeToMinutes()`, `formatTime()`, `parseCSVLine()`, and `extractNumber()` (with **100–450°F range validation**). |
| `js/profile.js` | Profile table rendering, inline editing, sorting, and CSV load/save logic. |
| `js/chart.js` | HTML5 Canvas initialization, responsive resizing, and drawing logic for targets, readings, bean estimates, and observation flags. |
| `js/speech.js` | Web Speech API wrappers: `initSpeech()`, Text-to-Speech (`speak`), and pause-detection logic for committing voice inputs. |
| `js/roast.js` | Roast lifecycle management: `startRoast()`, `tick()` timer, temperature logging, bean estimation math, and data export. |
| `js/app.js` | Application entry point. Calls `loadSample()` and `resizeCanvas()` on DOM ready. |

## 4. Detailed System Design

### 4.1 DOM Structure
| Section | ID | Purpose |
|---|---|---|
| Setup Panel | `setupPanel` | Profile editing, load/save CSV, start button |
| Profile Table | `profileTable` / `profileTableBody` | Dynamic table of time, target, and note fields per step |
| Roast Panel | `roastPanel` | Hidden until roast starts; contains all active UI |
| Timer | `timerDisplay` | MM:SS roast clock |
| Speech Status | `lastHeard` / `statusText` | Live transcript and mic state |
| Big Temps | `targetDisplay` / `readingDisplay` / `estimateDisplay` | Large readouts |
| Gas Instruction | `gasInstruction` | Colored coaching banner |
| Minute Note | `minuteNote` | Purple banner showing the current step's note |
| Quick Inputs | `quickTemp` / `quickObs` | Manual temp and observation entry |
| Chart | `chartCanvas` | Canvas element for real-time plotting |
| Logs | `readingLog` / `obsLog` / `minuteLog` | Scrollable history panels |

### 4.2 Data Flow
```text
Setup Phase:
  User edits table → updateStepFromTable() → profileSteps[] (sorted by time)
  User clicks Save → profileToCSV() → browser download
  User clicks Load → FileReader → parseProfileCSV() → setProfile()

Roast Phase:
  timer tick (1s) → tick()
    step boundary reached? → handleStepStart() → speak(note)
    minute boundary? → processMinuteEnd() → estimateBeanTemp()
    → updateDisplay() → gas instruction
    → drawChart()

  Voice input → onresult → extractNumber()
    valid number (100-450°F)? → commitTemp() → recordReading() → drawChart()
    invalid/out-of-range? → commitObs() → recordObservation() → drawChart()

  Manual input → submitQuick() / submitObs() → same as above
```

## 5. Key Design Decisions

### 5.1. Modularization over Monolith
The project was refactored from a single ~800-line `index.html` file into dedicated modules. This prevents merge conflicts, makes debugging isolated features trivial, and allows for future feature additions (e.g., WebSocket hardware integration) without touching unrelated code.

### 5.2. Speech Validation (100°F – 450°F)
Early versions accepted any recognized number as a temperature, leading to false positives (e.g., "five hundred" or room temperature "70"). The `extractNumber()` function in `utils.js` now strictly validates both regex-digit and word-parser paths against the **100–450°F** range. Anything outside this window returns `null` and is gracefully handled as a text observation instead of a temperature spike.

### 5.3. CSS Specificity for Color Coding
To ensure flame instruction keywords are visibly distinct in the editable table, color classes (e.g., `.note-high`) are scoped with high specificity (`.profile-table input.note-high { color: #ff6b5a !important; }`) to override the default input text color.

### 5.4. Context-Free Inference
In line with modern edge-computing principles, the app relies on baked-in rules (like the thermal lag estimation and strict regex parsing) rather than runtime context injection, ensuring predictable, low-latency, and reliable performance on low-end mobile devices.

## 6. Local Development & Testing
1. Clone the repository.
2. Serve the files locally (required for Web Speech API microphone permissions on mobile):
   ```bash
   python -m http.server 8000
   ```
3. Open `http://localhost:8000` in a modern browser (Chrome/Edge/Safari).
4. Allow microphone access when prompted to enable voice logging.

## 7. Future Enhancements (Backlog)
- [ ] Bluetooth integration for direct probe thermometer reading (e.g., Inkbird, Thermoworks).
- [ ] Rate of Rise (RoR) calculation and charting.
- [ ] PWA (Progressive Web App) manifest for offline installation.
- [ ] Dark/Light theme toggle.
EOF

# 2. Remove the old misspelled file
rm Desgin.md

# 3. Verify the changes
echo "=== Files changed ==="
git status
```

---

### 📝 Git Commit Message

```bash
git add Design.md Desgin.md
git commit -m "docs: rename Desgin.md to Design.md and modernize architecture docs" \
  -m "- Fixed filename spelling (Desgin.md → Design.md)." \
  -m "- Preserved valuable DOM structure and data flow details from the original." \
  -m "- Updated architecture section to reflect the new modular JS/CSS breakdown." \
  -m "- Documented new features: flexible time-steps, color-coded flame notes," \
  -m "  and strict 100-450°F speech validation to prevent false temperature logging." \
  -m "- Added 'Key Design Decisions' section explaining the rationale behind" \
  -m "  modularization, CSS specificity fixes, and context-free inference."
```

**One-liner version:**
```bash
git commit -m "docs: rename Desgin.md to Design.md, modernize for modular architecture, and document new features (color-coding, 100-450°F validation)"
```

### 💡 Why this is the best approach
This gives you a single, authoritative `Design.md` that honors the detailed structural documentation you originally wrote, while accurately reflecting the much cleaner, modular, and robust state of the app today. Future you (or any contributor) will have a perfect blueprint of both *how* it's built and *why* certain decisions were made.