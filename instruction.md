You are absolutely right. The previous `sed` and `tail` patching commands were too fragile and likely corrupted `js/roast.js` (e.g., by duplicating functions or breaking syntax), which causes the JavaScript to silently crash when you click the button.

Let's fix this cleanly by providing the **complete, corrected files** for the modules we need to change. This is 100% reliable.

### 📜 Reliable Bash Commands to Fix the Flow

Run these from your project root. This will safely overwrite the affected files with the correct logic.

```bash
# 1. Update js/state.js to add the roastReady flag
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
let roastReady = false; // NEW: Tracks if profile is accepted but timer hasn't started
let chartDPR = 2;
let voiceRestartTimer = null;
let pauseTimer = null;
let clearingBuffer = false;
let lastProcessedMinute = -1;
const PAUSE_MS = 800;
EOF

# 2. Update index.html (change button text and onclick handler)
sed -i.bak 's/onclick="startRoast()">▶ Start Roast/onclick="prepareRoast()">✅ Accept Profile/' index.html
rm index.html.bak

# 3. Provide the complete, corrected js/roast.js
cat > js/roast.js << 'EOF'
function prepareRoast(){
  if(profileSteps.length < 2){alert('Enter at least 2 target temperatures.'); return;}
  document.getElementById('setupPanel').style.display='none';
  document.getElementById('roastPanel').style.display='block';
  
  roastReady = true;
  roastActive = false;
  readings = []; minuteAvgs = []; observations = [];
  profileSteps.forEach(s => s.spoken = false);
  lastProcessedMinute = -1;
  
  resizeCanvas();
  drawChart();
  
  document.getElementById('timerDisplay').textContent = '00:00';
  document.getElementById('gasInstruction').textContent = '🎤 Say "Start" to begin roasting';
  document.getElementById('gasInstruction').className = 'instruction gas-ok';
}

function beginRoast(){
  if(!roastReady) return;
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
  let currentTarget = profileSteps.length > 0 ? profileSteps[0].target : 200;
  for(let i = profileSteps.length - 1; i >= 0; i--){
    if(elapsedMin >= profileSteps[i].time){
      currentTarget = profileSteps[i].target;
      break;
    }
  }
  
  document.getElementById('targetDisplay').textContent = 'Target: '+currentTarget+'°F';
  const beanEst = estimateBeanTemp(elapsedMin);
  document.getElementById('estimateDisplay').textContent = 'Bean Est: '+beanEst+'°F';
  const diff = currentTarget - beanEst;
  const inst = document.getElementById('gasInstruction');
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
  clearInterval(timerInterval);
  clearTimeout(voiceRestartTimer);
  clearTimeout(pauseTimer);
  if(recognition){try{recognition.stop();}catch(e){} isListening=false;}
  
  // Reset UI back to setup panel
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
EOF

# 4. Update js/speech.js to listen for the "Start" command
# We will recreate it cleanly to ensure the onresult handler is perfect
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
    showVoiceOk('Microphone active — say "Start" to begin, or speak temperatures/observations');
  };

  r.onresult = function(e){
    let transcript = '';
    for(let i=e.resultIndex;i<e.results.length;i++){
      transcript += e.results[i][0].transcript;
    }
    const clean = transcript.trim();
    console.log('[SPEECH] Raw transcript:', clean, '| isFinal:', e.results[e.results.length-1].isFinal);
    document.getElementById('lastHeard').textContent = clean;

    // NEW: Check for voice start command
    if(roastReady && !roastActive){
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
  if(!roastActive) return; // Ignore temps if roast hasn't officially started
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
  if(!roastActive) return; // Ignore obs if roast hasn't officially started
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

# 5. Verify the changes
echo "=== Verification ==="
grep "roastReady" js/state.js
grep "prepareRoast" index.html
grep "beginRoast" js/speech.js
```

---

### 📝 Git Commit Message

```bash
git add js/state.js js/roast.js js/speech.js index.html
git commit -m "fix: reliably decouple profile acceptance from roast timer start" \
  -m "- Replaced fragile patching with complete, corrected file contents." \
  -m "- 'Accept Profile' button now transitions to roast panel and waits." \
  -m "- Timer only begins when user says the voice command 'Start'." \
  - "- Added 'roastReady' state to gate voice commands and prevent accidental starts." \
  - "- 'End Roast' now cleanly resets the app back to the setup panel." \
  - "- Speech recognition now ignores temp/observation logging until roast officially begins."
```

### 🧪 How to Test
1. Run the commands above.
2. **Hard-refresh** your browser (`Ctrl+Shift+R` or `Cmd+Shift+R`) to clear any cached, broken JS.
3. Open the browser console (F12) to ensure there are **no red errors**.
4. Click **"✅ Accept Profile"**. The UI will switch to the roast panel. The timer will stay at `00:00` and the banner will say: *🎤 Say "Start" to begin roasting*.
5. Click **"🎤 Start Listening"** and say **"Start"**. 
6. The timer will immediately begin counting, and the banner will switch to the normal gas instructions. 
7. Click **"⏹ End Roast"**. The app will cleanly return to the setup panel.