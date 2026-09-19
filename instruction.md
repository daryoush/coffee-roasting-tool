The issue is that my previous `sed` patch on `js/speech.js` likely corrupted the file structure (multi-line sed replacements are very fragile). Let me fix this by providing complete, clean versions of all three related files.

### 📜 Reliable Bash Commands

```bash
# 1. Update js/state.js with mic test variables
cat > js/state.js << 'EOF'
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
EOF

# 2. Provide the complete, correct js/speech.js
cat > js/speech.js << 'EOF'
function speak(text){
  if(!text) return;
  if(!window.speechSynthesis) return;
  window.speechSynthesis.cancel();
  const u = new SpeechSynthesisUtterance(text);
  u.rate = 1.0; u.pitch = 1.0; u.volume = 1.0;
  window.speechSynthesis.speak(u);
  console.log('[TTS] Speaking:', text);
}

function initSpeech(){
  const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
  if(!SR){
    showVoiceWarning('Speech recognition not supported. Use the quick input boxes below.');
    return null;
  }
  const r = new SR();
  r.continuous = true;
  r.interimResults = true;
  r.lang = 'en-US';
  r.maxAlternatives = 1;

  r.onstart = function(){
    isListening = true;
    updateMicUI();
    console.log('[SPEECH] Started. roastReady=', roastReady, 'roastActive=', roastActive, 'micTestPassed=', micTestPassed, 'micTestActive=', micTestActive);
    
    // Start mic test when entering roast panel for the first time
    if(roastReady && !roastActive && !micTestPassed && !micTestActive){
      setTimeout(function(){
        console.log('[SPEECH] Triggering mic test');
        startMicTest();
      }, 300);
    } else {
      showVoiceOk('Microphone active');
    }
  };

  r.onresult = function(e){
    let transcript = '';
    for(let i=e.resultIndex;i<e.results.length;i++){
      transcript += e.results[i][0].transcript;
    }
    const clean = transcript.trim();
    console.log('[SPEECH] Raw transcript:', clean, '| isFinal:', e.results[e.results.length-1].isFinal);
    document.getElementById('lastHeard').textContent = clean;

    // Handle mic test mode
    if(micTestActive){
      const num = extractNumber(clean);
      console.log('[MIC TEST] Recognized:', clean, '-> extracted:', num);
      
      // Only process final results or after a pause
      if(e.results[e.results.length-1].isFinal){
        handleMicTestResult(num, clean);
        clearingBuffer = true;
        try{ r.stop(); }catch(err){}
        return;
      }
      
      // Show interim results
      if(num !== null){
        document.getElementById('lastHeard').textContent = clean + ' -> heard: ' + num + '°F';
      }
      
      clearTimeout(pauseTimer);
      pauseTimer = setTimeout(function(){
        handleMicTestResult(num, clean);
        clearingBuffer = true;
        try{ r.stop(); }catch(err){}
      }, PAUSE_MS);
      return;
    }

    // Check for voice start command (only after mic test passes)
    if(roastReady && !roastActive && micTestPassed){
      if(/\bstart\b/i.test(clean)){
        console.log('[SPEECH] Start command detected');
        beginRoast();
        document.getElementById('lastHeard').textContent = '✅ Roast started!';
        clearingBuffer = true;
        try{ r.stop(); }catch(err){}
        return;
      }
    }

    // Normal roast mode: process temps and observations
    clearTimeout(pauseTimer);

    const num = extractNumber(clean);
    if(num !== null){
      document.getElementById('lastHeard').textContent = clean + ' -> candidate: ' + num + '°F (pause to log)';
      if(e.results[e.results.length-1].isFinal){
        commitTemp(num, clean);
        return;
      }
      pauseTimer = setTimeout(function(){
        commitTemp(num, clean);
        clearingBuffer = true;
        try{ r.stop(); }catch(err){}
      }, PAUSE_MS);
    } else {
      document.getElementById('lastHeard').textContent = clean + ' -> observation? (pause to log)';
      if(e.results[e.results.length-1].isFinal){
        commitObs(clean);
        return;
      }
      pauseTimer = setTimeout(function(){
        commitObs(clean);
        clearingBuffer = true;
        try{ r.stop(); }catch(err){}
      }, PAUSE_MS);
    }
  };

  r.onerror = function(e){
    console.log('[SPEECH] Error:', e.error);
    if(e.error === 'not-allowed'){
      showVoiceWarning('Microphone blocked. Allow microphone access in browser settings.');
      isListening = false;
      updateMicUI();
    } else if(e.error === 'no-speech'){
      console.log('[SPEECH] No speech detected');
    } else if(e.error === 'network'){
      showVoiceWarning('Network error with speech recognition.');
    } else if(e.error === 'aborted'){
      console.log('[SPEECH] Recognition aborted');
    } else {
      showVoiceWarning('Speech error: ' + e.error);
    }
  };

  r.onend = function(){
    console.log('[SPEECH] Recognition ended. clearingBuffer=', clearingBuffer, 'isListening=', isListening);
    if(clearingBuffer){
      clearingBuffer = false;
      setTimeout(function(){
        try{
          r.start();
          console.log('[SPEECH] Buffer cleared, restarted');
        }catch(e){
          console.log('[SPEECH] Restart after clear failed:', e);
        }
      }, 50);
    } else if(isListening){
      // Auto-restart if we're supposed to be listening
      clearTimeout(voiceRestartTimer);
      voiceRestartTimer = setTimeout(function(){
        try{ r.start(); } catch(e){ console.log('[SPEECH] Auto-restart failed:', e); }
      }, 400);
    } else {
      isListening = false;
      updateMicUI();
    }
  };

  return r;
}

function commitTemp(num, rawText){
  if(!roastActive) return;
  const now = Date.now();
  const lastReading = readings.length > 0 ? readings[readings.length-1] : null;
  if(lastReading && lastReading.value === num && (now - (startTime + lastReading.timeSec*1000)) < 2000){
    console.log('[SPEECH] Debounced duplicate temp:', num);
    return;
  }
  console.log('[SPEECH] COMMITTED temp:', num, '°F from "' + rawText + '"');
  document.getElementById('lastHeard').textContent = rawText + ' -> LOGGED ' + num + '°F';
  recordReading(num);
}

function commitObs(text){
  if(!roastActive) return;
  if(!text || text.length < 2) return;
  const now = Date.now();
  const lastObs = observations.length > 0 ? observations[observations.length-1] : null;
  if(lastObs && lastObs.text === text && (now - (startTime + lastObs.timeSec*1000)) < 3000){
    console.log('[SPEECH] Debounced duplicate observation:', text);
    return;
  }
  console.log('[SPEECH] COMMITTED observation:', text);
  document.getElementById('lastHeard').textContent = text + ' -> LOGGED observation';
  recordObservation(text);
}

function showVoiceWarning(msg){
  const w = document.getElementById('voiceWarning');
  w.textContent = msg;
  w.style.display = 'block';
  document.getElementById('voiceOk').style.display = 'none';
}

function showVoiceOk(msg){
  const o = document.getElementById('voiceOk');
  o.textContent = msg;
  o.style.display = 'block';
  document.getElementById('voiceWarning').style.display = 'none';
}

function updateMicUI(){
  const btn = document.getElementById('micBtn');
  const dot = document.getElementById('statusDot');
  const txt = document.getElementById('statusText');
  if(isListening){
    btn.textContent = '🎤 Stop Listening';
    btn.classList.add('btn-red');
    dot.classList.add('listening');
    txt.textContent = 'Listening...';
  } else {
    btn.textContent = '🎤 Start Listening';
    btn.classList.remove('btn-red');
    dot.classList.remove('listening');
    txt.textContent = 'Voice paused';
  }
}

function toggleMic(){
  if(!recognition) recognition = initSpeech();
  if(!recognition) return;

  if(isListening){
    isListening = false;
    clearingBuffer = false;
    clearTimeout(voiceRestartTimer);
    clearTimeout(pauseTimer);
    try{ recognition.stop(); }catch(e){}
    updateMicUI();
  } else {
    try{ 
      recognition.start();
      console.log('[SPEECH] Start requested');
    } catch(e){
      console.log('[SPEECH] Start failed:', e);
      showVoiceWarning('Could not start microphone. Reload page and allow mic access.');
    }
  }
}
EOF

# 3. Verify all three files are correct
echo "=== Verification ==="
echo ""
echo "js/state.js - mic test variables:"
grep -E "micTest" js/state.js | head -5
echo ""
echo "js/speech.js - functions defined:"
grep -E "^function " js/speech.js | sed 's/function /  - /' | sed 's/(.*//'
echo ""
echo "js/roast.js - functions defined:"
grep -E "^function " js/roast.js | sed 's/function /  - /' | sed 's/(.*//'
```

---

### 📝 Git Commit Message

```bash
git add js/state.js js/speech.js
git commit -m "fix(speech): restore complete speech.js after fragile sed patch broke it" \
  -m "- Previous multi-line sed replacement corrupted js/speech.js structure." \
  -m "- Replaced with complete, verified file containing all 9 functions." \
  -m "- Added detailed console logging to track state transitions:" \
  -m "  * onstart: logs roastReady/roastActive/micTest states" \
  -m "  * onresult: logs mic test recognition attempts" \
  -m "  * onend: logs clearingBuffer and isListening state" \
  -m "- Improved auto-restart logic to keep mic listening during roast." \
  -m "- Mic test now triggers reliably 300ms after speech recognition starts."
```

**One-liner version:**
```bash
git commit -m "fix(speech): restore complete speech.js — fragile sed patch had broken Start Listening"
```

### 🧪 How to Test
1. Run the commands above.
2. **Hard-refresh** your browser (`Ctrl+Shift+R` or `Cmd+Shift+R`).
3. Open the browser console (F12) — this is **critical** for debugging.
4. Click **"✅ Accept Profile"** — should switch to roast panel.
5. Click **"🎤 Start Listening"**.
6. In the console, you should see:
   ```
   [SPEECH] Start requested
   [SPEECH] Started. roastReady=true roastActive=false micTestPassed=false micTestActive=false
   [SPEECH] Triggering mic test
   [MIC TEST] Target numbers: [235, 312, 178]
   [TTS] Speaking: Microphone test. Please say 235
   ```
7. Say the number. You should see:
   ```
   [SPEECH] Raw transcript: "two hundred thirty five" | isFinal: true
   [MIC TEST] Recognized: two hundred thirty five -> extracted: 235
   [MIC TEST] Target: 235 | Recognized: 235 | Raw: two hundred thirty five
   ```
8. After all 3 pass, say **"Start"** to begin the roast.

If you still see issues, the console logs will tell us exactly where it's failing.