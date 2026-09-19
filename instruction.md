I'll implement both changes with complete, reliable file updates. Here are the bash commands:

### 📜 Bash Commands to Implement Both Changes

```bash
# 1. Update js/state.js to add mic test state variables
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

# 2. Update js/roast.js with interpolated target and mic test functions
cat > js/roast.js << 'EOF'
function prepareRoast(){
  if(profileSteps.length < 2){alert('Enter at least 2 target temperatures.'); return;}
  document.getElementById('setupPanel').style.display='none';
  document.getElementById('roastPanel').style.display='block';
  
  roastReady = true;
  roastActive = false;
  micTestPassed = false;
  readings = []; minuteAvgs = []; observations = [];
  profileSteps.forEach(s => s.spoken = false);
  lastProcessedMinute = -1;
  
  resizeCanvas();
  drawChart();
  
  document.getElementById('timerDisplay').textContent = '00:00';
  document.getElementById('gasInstruction').textContent = '🎤 Click "Start Listening" to begin mic test';
  document.getElementById('gasInstruction').className = 'instruction gas-ok';
}

function beginRoast(){
  if(!roastReady || !micTestPassed) return;
  roastActive = true;
  startTime = Date.now();
  timerInterval = setInterval(tick, 1000);
  tick();
  document.getElementById('quickTemp').focus();
  console.log('[ROAST] Begun via voice command');
}

function tick(){
  const elapsedSec = Math.floor((Date.now()-startTime)/1000);
  const elapsedMin = elapsedSec / 60;
  const mins = Math.floor(elapsedMin);
  const secs = elapsedSec % 60;
  document.getElementById('timerDisplay').textContent = 
    String(mins).padStart(2,'0')+':'+String(secs).padStart(2,'0');

  if(mins !== lastProcessedMinute && mins > 0){
    processMinuteEnd(mins - 1);
    lastProcessedMinute = mins;
  }

  for(let step of profileSteps){
    if(!step.spoken && elapsedMin >= step.time){
      step.spoken = true;
      handleStepStart(step);
    }
  }
  
  updateDisplay(elapsedMin);
  drawChart();
}

function handleStepStart(step){
  const noteBox = document.getElementById('minuteNote');
  if(step.note){
    noteBox.textContent = '📢 ' + step.note;
    noteBox.style.display = 'block';
    speak(step.note);
  } else {
    noteBox.style.display = 'none';
  }
}

function recordReading(temp){
  if(!roastActive) return;
  const elapsed = (Date.now()-startTime)/1000;
  const minute = Math.floor(elapsed/60);
  readings.push({timeSec:elapsed, value:temp, minute:minute});
  document.getElementById('readingDisplay').textContent = 'Reading: '+temp+'°F';
  const log = document.getElementById('readingLog');
  const entry = document.createElement('div');
  entry.className='log-entry';
  const m = Math.floor(elapsed/60), s = Math.floor(elapsed%60);
  entry.innerHTML = '<span style="color:#a09080">'+m+':'+String(s).padStart(2,'0')+'</span> <b style="color:#c17f45">'+temp+'°F</b>';
  log.prepend(entry);
  updateDisplay(elapsed/60);
  drawChart();
}

function recordObservation(text){
  if(!roastActive) return;
  const elapsed = (Date.now()-startTime)/1000;
  const minute = Math.floor(elapsed/60);
  observations.push({timeSec:elapsed, text:text, minute:minute});
  const log = document.getElementById('obsLog');
  const entry = document.createElement('div');
  entry.className='log-entry';
  const m = Math.floor(elapsed/60), s = Math.floor(elapsed%60);
  entry.innerHTML = '<span style="color:#a09080">'+m+':'+String(s).padStart(2,'0')+'</span> <b style="color:#8a6fa8">'+text+'</b>';
  log.prepend(entry);
  drawChart();
}

function estimateBeanTemp(elapsedMin){
  const currentMinute = Math.floor(elapsedMin);
  const minuteReadings = readings.filter(function(r){ return Math.floor(r.timeSec/60) === currentMinute; }).map(function(r){ return r.value; });
  if(minuteReadings.length === 0){
    if(minuteAvgs.length > 0) return minuteAvgs[minuteAvgs.length-1].beanEstimate;
    return profileSteps.length > 0 ? profileSteps[0].target : 200;
  }
  const avgReading = minuteReadings.reduce(function(a,b){return a+b;},0) / minuteReadings.length;
  const maxTime = profileSteps.length > 0 ? profileSteps[profileSteps.length-1].time : 10;
  const progress = Math.min(1, elapsedMin / Math.max(1, maxTime));
  const thermalLag = 22 * (1 - progress);
  let beanEstimate = avgReading + thermalLag;
  if(minuteAvgs.length > 0){
    const prev = minuteAvgs[minuteAvgs.length-1].beanEstimate;
    beanEstimate = prev * 0.25 + beanEstimate * 0.75;
  }
  return Math.round(beanEstimate);
}

function processMinuteEnd(minute){
  if(minute<0) return;
  const beanEst = estimateBeanTemp(minute + 0.99);
  const minuteReadings = readings.filter(function(r){ return Math.floor(r.timeSec/60) === minute; });
  const avgReading = minuteReadings.length ? Math.round(minuteReadings.reduce(function(a,b){return a+b.value;},0)/minuteReadings.length) : null;

  minuteAvgs.push({minute:minute, avgReading:avgReading, beanEstimate:beanEst});
  const log = document.getElementById('minuteLog');
  const entry = document.createElement('div');
  entry.className='log-entry';
  entry.innerHTML = '<b>Min '+(minute+1)+'</b> <span style="color:#c17f45">Surf:'+(avgReading||'—')+'°F</span> <span style="color:#5a8f5a;font-weight:700">Bean:'+beanEst+'°F</span>';
  log.prepend(entry);
}

function updateDisplay(elapsedMin){
  // NEW: Interpolate target temperature continuously
  let currentTarget;
  
  if(elapsedMin <= profileSteps[0].time){
    currentTarget = profileSteps[0].target;
  } else if(elapsedMin >= profileSteps[profileSteps.length - 1].time){
    currentTarget = profileSteps[profileSteps.length - 1].target;
  } else {
    // Find surrounding steps and interpolate
    for(let i = 0; i < profileSteps.length - 1; i++){
      if(elapsedMin >= profileSteps[i].time && elapsedMin < profileSteps[i + 1].time){
        const progress = (elapsedMin - profileSteps[i].time) / (profileSteps[i + 1].time - profileSteps[i].time);
        currentTarget = profileSteps[i].target + (profileSteps[i + 1].target - profileSteps[i].target) * progress;
        break;
      }
    }
  }
  
  document.getElementById('targetDisplay').textContent = 'Target: '+Math.round(currentTarget)+'°F';
  const beanEst = estimateBeanTemp(elapsedMin);
  document.getElementById('estimateDisplay').textContent = 'Bean Est: '+beanEst+'°F';
  const diff = currentTarget - beanEst;
  const inst = document.getElementById('gasInstruction');
  
  // Don't override mic test or pre-start messages
  if(micTestActive || (roastReady && !roastActive && !micTestPassed)){
    return;
  }
  
  if(Math.abs(diff)<=4){
    inst.textContent = '✓ HOLD GAS — On target ('+beanEst+'°F)';
    inst.className = 'instruction gas-ok';
  }else if(diff>0){
    inst.textContent = '🔥 ADD GAS — Bean is '+Math.round(diff)+'°F below target';
    inst.className = 'instruction gas-up';
  }else{
    inst.textContent = '❄ REDUCE GAS — Bean is '+Math.round(-diff)+'°F above target';
    inst.className = 'instruction gas-down';
  }
}

function endRoast(){
  roastActive = false;
  roastReady = false;
  micTestActive = false;
  micTestPassed = false;
  clearInterval(timerInterval);
  clearTimeout(voiceRestartTimer);
  clearTimeout(pauseTimer);
  if(recognition){try{recognition.stop();}catch(e){} isListening=false;}
  
  document.getElementById('roastPanel').style.display='none';
  document.getElementById('setupPanel').style.display='block';
  document.getElementById('micBtn').disabled = false;
  updateMicUI();
}

function exportData(){
  let csv = 'Time(min),Target,Note,Readings,AvgReading\n';
  for(let i=0; i<profileSteps.length; i++){
    const step = profileSteps[i];
    const nextTime = (i < profileSteps.length - 1) ? profileSteps[i+1].time : step.time + 1;
    const rs = readings.filter(function(r){ return (r.timeSec/60) >= step.time && (r.timeSec/60) < nextTime; }).map(function(r){ return r.value; });
    const avg = rs.length ? Math.round(rs.reduce((a,b)=>a+parseFloat(b),0)/rs.length) : '';
    csv += step.time+','+step.target+',"'+(step.note||'').replace(/"/g, '""')+'","'+rs.join(';')+'",'+avg+'\n';
  }
  csv += '\nTime,Observation\n';
  observations.forEach(function(o){
    const m = Math.floor(o.timeSec/60), s = Math.floor(o.timeSec%60);
    csv += m+':'+String(s).padStart(2,'0')+',"'+o.text.replace(/"/g, '""')+'"\n';
  });
  const blob = new Blob([csv],{type:'text/csv'});
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = 'roast_'+new Date().toISOString().slice(0,19).replace(/:/g,'-')+'.csv';
  a.click();
}

function submitQuick(){
  const input = document.getElementById('quickTemp');
  const val = parseFloat(input.value);
  if(!isNaN(val) && val > 0){
    console.log('[MANUAL] Temp entered:', val, '°F');
    recordReading(val);
    input.value = '';
    input.focus();
  }
}

function submitObs(){
  const input = document.getElementById('quickObs');
  const text = input.value.trim();
  if(text){
    console.log('[MANUAL] Observation entered:', text);
    recordObservation(text);
    input.value = '';
    input.focus();
  }
}

// Mic test functions
function startMicTest(){
  micTestActive = true;
  micTestIndex = 0;
  micTestNumbers = [];
  for(let i = 0; i < 3; i++){
    micTestNumbers.push(Math.floor(Math.random() * 400) + 100); // 100-499
  }
  document.getElementById('gasInstruction').textContent = '🎤 Mic Test: Say ' + micTestNumbers[0];
  document.getElementById('gasInstruction').className = 'instruction gas-ok';
  speak('Microphone test. Please say ' + micTestNumbers[0]);
}

function handleMicTestResult(recognizedNum){
  const targetNum = micTestNumbers[micTestIndex];
  const tolerance = 5;
  
  if(Math.abs(recognizedNum - targetNum) <= tolerance){
    micTestIndex++;
    if(micTestIndex >= 3){
      micTestActive = false;
      micTestPassed = true;
      document.getElementById('gasInstruction').textContent = '✅ Mic test passed! Preheat pan and say "Start" when beans are dumped';
      speak('Microphone test passed. Preheat the pan and say start when the beans are dumped to the preheated pan');
    } else {
      document.getElementById('gasInstruction').textContent = '🎤 Mic Test: Say ' + micTestNumbers[micTestIndex];
      speak('Good. Now say ' + micTestNumbers[micTestIndex]);
    }
  } else {
    document.getElementById('gasInstruction').textContent = '❌ Try again. Say ' + targetNum;
    speak('Didn\'t catch that. Please say ' + targetNum + ' again');
  }
}
EOF

# 3. Update js/speech.js to handle mic test flow
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
    
    // NEW: Start mic test when listening begins in pre-roast state
    if(roastReady && !roastActive && !micTestPassed && !micTestActive){
      setTimeout(startMicTest, 500); // Small delay to let UI settle
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

    // NEW: Handle mic test
    if(micTestActive){
      const num = extractNumber(clean);
      if(num !== null){
        document.getElementById('lastHeard').textContent = clean + ' -> heard: ' + num + '°F';
        if(e.results[e.results.length-1].isFinal){
          handleMicTestResult(num);
          clearingBuffer = true;
          try{ r.stop(); }catch(err){}
          return;
        }
        pauseTimer = setTimeout(function(){
          handleMicTestResult(num);
          clearingBuffer = true;
          try{ r.stop(); }catch(err){}
        }, PAUSE_MS);
      }
      return; // Don't process as temp/obs during mic test
    }

    // Check for voice start command
    if(roastReady && !roastActive && micTestPassed){
      if(/\bstart\b/i.test(clean)){
        beginRoast();
        document.getElementById('lastHeard').textContent = '✅ Roast started!';
        clearingBuffer = true;
        try{ r.stop(); }catch(err){}
        return;
      }
    }

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
    console.log('[SPEECH] Recognition ended. clearingBuffer=', clearingBuffer);
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
    } else {
      isListening = false;
      updateMicUI();
      if(roastActive && document.getElementById('micBtn').textContent.indexOf('Stop') !== -1){
        clearTimeout(voiceRestartTimer);
        voiceRestartTimer = setTimeout(function(){
          try{ r.start(); } catch(e){ console.log('[SPEECH] Auto-restart failed:', e); }
        }, 400);
      }
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
    try{ recognition.start(); } catch(e){
      showVoiceWarning('Could not start microphone. Reload page and allow mic access.');
    }
  }
}
EOF

# 4. Verify the changes
echo "=== Verification ==="
grep "micTestActive" js/state.js
grep "interpolate" js/roast.js
grep "startMicTest" js/speech.js
```

---

### 📝 Git Commit Message

```bash
git add js/state.js js/roast.js js/speech.js
git commit -m "feat: continuous target interpolation and mandatory mic test before roast" \
  -m "- Target temperature now updates every second via linear interpolation between profile steps." \
  -m "- Added mandatory microphone test before roast can begin:" \
  -m "  * System generates 3 random numbers (100-499°F) and asks user to say them." \
  -m "  * Validates each number within ±5°F tolerance." \
  -m "  * Retries if recognition fails, proceeds only after all 3 pass." \
  -m "  * On success, speaks: 'Preheat the pan and say start when beans are dumped'." \
  -m "- 'Start' voice command now only works after mic test passes." \
  -m "- Gas instruction banner no longer overrides mic test messages."
```

**One-liner version:**
```bash
git commit -m "feat: smooth target interpolation and 3-number mic validation test before roast start"
```

### 🧪 How to Test

**Test 1: Continuous Target Interpolation**
1. Load a profile with steps at different times (e.g., 0min=200°F, 2min=300°F).
2. Accept profile and start the roast.
3. Watch the "Target" display at 1 minute — it should show ~250°F (interpolated), not jump from 200 to 300.

**Test 2: Microphone Test**
1. Accept a profile.
2. Click "Start Listening".
3. The system will speak: "Microphone test. Please say [number]".
4. Say the number shown in the banner.
5. Repeat for all 3 numbers.
6. After passing, you'll hear: "Microphone test passed. Preheat the pan and say start when the beans are dumped to the preheated pan".
7. Now say "Start" to begin the actual roast.