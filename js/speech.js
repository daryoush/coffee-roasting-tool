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
    showVoiceOk('Microphone active — speak temperatures or observations');
  };

  r.onresult = function(e){
    let transcript = '';
    for(let i=e.resultIndex;i<e.results.length;i++){
      transcript += e.results[i][0].transcript;
    }
    const clean = transcript.trim();
    console.log('[SPEECH] Raw transcript:', clean, '| isFinal:', e.results[e.results.length-1].isFinal);
    document.getElementById('lastHeard').textContent = clean;

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
