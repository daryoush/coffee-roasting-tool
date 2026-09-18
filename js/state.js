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
let roastReady = false; // NEW: Tracks if profile is accepted but timer hasn't started
let chartDPR = 2;
let voiceRestartTimer = null;
let pauseTimer = null;
let clearingBuffer = false;
let lastProcessedMinute = -1;
const PAUSE_MS = 800;
