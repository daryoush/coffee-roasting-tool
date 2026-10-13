// Global application state
let profileSteps = [];
let readings = [];
let minuteAvgs = [];
let observations = [];
let startTime = null;
let timerInterval = null;
let recognition = null;
let isListening = false;
let roastActive = false;
let roastReady = false;
let chartDPR = 2;
let voiceRestartTimer = null;
let pauseTimer = null;
let clearingBuffer = false;
let lastProcessedMinute = -1;
const PAUSE_MS = 800;

// Mic test state
let micTestActive = false;
let micTestNumbers = [];
let micTestIndex = 0;
let micTestPassed = false;
let micTestEnabled = true;
// Version information - bump this with each change
const APP_VERSION = {
  number: '1.4.0',
  date: '2026-10-02',
  time: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
};
