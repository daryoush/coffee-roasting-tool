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
