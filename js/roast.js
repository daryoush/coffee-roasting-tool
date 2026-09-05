function startRoast(){
  if(profileSteps.length < 2){alert('Enter at least 2 target temperatures.'); return;}
  document.getElementById('setupPanel').style.display='none';
  document.getElementById('roastPanel').style.display='block';
  startTime = Date.now();
  roastActive = true;
  readings = []; minuteAvgs = []; observations = [];
  profileSteps.forEach(s => s.spoken = false);
  lastProcessedMinute = -1;
  resizeCanvas();
  timerInterval = setInterval(tick, 1000);
  tick();
  document.getElementById('quickTemp').focus();
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
  clearInterval(timerInterval);
  clearTimeout(voiceRestartTimer);
  clearTimeout(pauseTimer);
  if(recognition){try{recognition.stop();}catch(e){} isListening=false;}
  document.getElementById('gasInstruction').textContent = 'ROAST COMPLETE — Great job!';
  document.getElementById('gasInstruction').className = 'instruction gas-ok';
  document.getElementById('micBtn').disabled = true;
  document.getElementById('minuteNote').style.display = 'none';
  
  const elapsedSec = Math.floor((Date.now()-startTime)/1000);
  const mins = Math.floor(elapsedSec/60);
  if(mins > lastProcessedMinute) {
     for(let m = lastProcessedMinute + 1; m <= mins; m++) {
         processMinuteEnd(m);
     }
  }
  drawChart();
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
