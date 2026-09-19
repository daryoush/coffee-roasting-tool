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
  
// Mic test functions
function startMicTest(){
  micTestActive = true;
  micTestIndex = 0;
  micTestNumbers = [];
  for(let i = 0; i < 3; i++){
    micTestNumbers.push(Math.floor(Math.random() * 351) + 100); // 100-450
  }
  console.log('[MIC TEST] Target numbers:', micTestNumbers);
  document.getElementById('gasInstruction').textContent = '🎤 Mic Test: Say ' + micTestNumbers[0];
  document.getElementById('gasInstruction').className = 'instruction gas-ok';
  speak('Microphone test. Please say ' + micTestNumbers[0]);
}

function handleMicTestResult(recognizedNum, rawText){
  const targetNum = micTestNumbers[micTestIndex];
  const tolerance = 10; // Increased from 5 to 10 for better speech recognition tolerance
  
  console.log('[MIC TEST] Target:', targetNum, '| Recognized:', recognizedNum, '| Raw:', rawText);
  
  if(recognizedNum === null){
    // Number wasn't parsed - ask user to try again
    document.getElementById('gasInstruction').textContent = '❌ Could not parse. Say ' + targetNum + ' clearly';
    speak('Could not understand. Please say ' + targetNum + ' clearly');
    return;
  }
  
  if(Math.abs(recognizedNum - targetNum) <= tolerance){
    document.getElementById('lastHeard').textContent = '✅ ' + recognizedNum + '°F - Correct!';
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
    document.getElementById('lastHeard').textContent = '❌ Heard ' + recognizedNum + '°F but expected ' + targetNum + '°F';
    document.getElementById('gasInstruction').textContent = '❌ Try again. Say ' + targetNum;
    speak('That was ' + recognizedNum + '. Please say ' + targetNum + ' instead');
  }
}
