const canvas = document.getElementById('chartCanvas');
const ctx = canvas.getContext('2d');
const wrap = document.getElementById('chartWrap');

function resizeCanvas(){
  const rect = wrap.getBoundingClientRect();
  if(rect.width === 0 || rect.height === 0) return;
  chartDPR = Math.min(window.devicePixelRatio || 1, 2);
  canvas.width = rect.width * chartDPR;
  canvas.height = rect.height * chartDPR;
  canvas.style.width = rect.width + 'px';
  canvas.style.height = rect.height + 'px';
  ctx.setTransform(chartDPR, 0, 0, chartDPR, 0, 0);
  drawChart();
  drawOverview();
}
window.addEventListener('resize', resizeCanvas);

function getNoteColor(note){
  if(!note) return '#4a7fa8';
  const lower = note.toLowerCase();
  if(lower.includes('charge') || lower.includes('preheat')) return '#d9955a';
  if(lower.includes('high') || lower.includes('full') || lower.includes('max')) return '#ff6b5a';
  if(lower.includes('medium-high') || lower.includes('med-high')) return '#ff8c42';
  if(lower.includes('medium-low') || lower.includes('med-low')) return '#ffd43b';
  if(lower.includes('medium') || lower.includes('med')) return '#ffa94d';
  if(lower.includes('low') || lower.includes('reduce') || lower.includes('decrease')) return '#8ecfff';
  if(lower.includes('hold') || lower.includes('maintain')) return '#8fdf8f';
  return '#4a7fa8';
}

function toggleChartFullscreen(){
  console.log('[CHART] toggleChartFullscreen called');
  const body = document.body;
  const isFullscreen = body.classList.contains('fullscreen-mode');
  if(!isFullscreen){
    body.classList.add('fullscreen-mode');
    const roastPanel = document.getElementById('roastPanel');
    if(roastPanel && typeof roastPanel.requestFullscreen === 'function'){
      roastPanel.requestFullscreen().catch(function(err){
        console.log('[CHART] Native fullscreen not available, CSS fallback active:', err.message);
      });
    }
  } else {
    body.classList.remove('fullscreen-mode');
    if(document.fullscreenElement){
      document.exitFullscreen().catch(function(){});
    }
  }
  setTimeout(resizeCanvas, 50);
  setTimeout(resizeCanvas, 200);
}

document.addEventListener('keydown', function(e){
  if(e.key === 'Escape' && document.body.classList.contains('fullscreen-mode')){
    document.body.classList.remove('fullscreen-mode');
    if(document.fullscreenElement){
      document.exitFullscreen().catch(function(){});
    }
    setTimeout(resizeCanvas, 50);
  }
});

document.addEventListener('fullscreenchange', function(){
  if(!document.fullscreenElement && document.body.classList.contains('fullscreen-mode')){
    document.body.classList.remove('fullscreen-mode');
    setTimeout(resizeCanvas, 50);
  }
});

function drawChart(){
  const W = wrap.offsetWidth, H = wrap.offsetHeight;
  if(!W || !H) return;
  const pad = {t:36,r:44,b:40,l:56};
  const cw = W - pad.l - pad.r;
  const ch = H - pad.t - pad.b;

  // Determine current time for the rolling window
  let currentTime = 0;
  if(roastActive && startTime){
    currentTime = (Date.now() - startTime) / 60000;
  } else if(readings.length > 0){
    currentTime = readings[readings.length - 1].timeSec / 60;
  }

  // KEY CHANGE: Show full profile before roast starts, 2-min window during roast
  const useZoomedView = roastActive;
  const windowSize = 2.0;
  let minTime, maxTime;
  
  if(useZoomedView){
    // 2-minute rolling window centered on current time
    minTime = Math.max(0, currentTime - 1.0);
    maxTime = minTime + windowSize;
  } else {
    // Full profile view: show entire planned roast
    minTime = 0;
    maxTime = profileSteps.length > 0 
      ? profileSteps[profileSteps.length - 1].time 
      : 10;
    if(maxTime < 1) maxTime = 1;
  }

  // Collect temps for Y-axis scaling
  let visibleTemps = [];
  profileSteps.forEach(function(s){
    if(s.time >= minTime - 0.5 && s.time <= maxTime + 0.5) visibleTemps.push(s.target);
  });
  readings.forEach(function(r){
    let t = r.timeSec / 60;
    if(t >= minTime && t <= maxTime) visibleTemps.push(r.value);
  });
  minuteAvgs.forEach(function(m){
    if(m.minute + 0.5 >= minTime && m.minute + 0.5 <= maxTime) visibleTemps.push(m.beanEstimate);
  });

  let minT, maxT;
  if(visibleTemps.length > 0){
    minT = Math.min.apply(null, visibleTemps);
    maxT = Math.max.apply(null, visibleTemps);
  } else {
    const allTemps = [
      ...profileSteps.map(function(s){return s.target;}),
      ...readings.map(function(r){return r.value;}),
      ...minuteAvgs.map(function(m){return m.beanEstimate;})
    ];
    minT = allTemps.length ? Math.min.apply(null, allTemps) : 200;
    maxT = allTemps.length ? Math.max.apply(null, allTemps) : 500;
  }
  
  // Ensure minimum range to prevent extreme zooming
  if(maxT - minT < 40){
    const mid = (minT + maxT) / 2;
    minT = mid - 20;
    maxT = mid + 20;
  }
  
  minT = Math.floor((minT - 10)/20)*20;
  maxT = Math.ceil((maxT + 10)/20)*20;

  const tx = function(t){ return ((t - minTime) / (maxTime - minTime)) * cw + pad.l; };
  const ty = function(t){ return pad.t + ch - ((t - minT) / (maxT - minT)) * ch; };

  ctx.clearRect(0, 0, W, H);

  // Y-axis grid lines
  ctx.strokeStyle = '#3a3028';
  ctx.lineWidth = 1;
  for(let t=minT; t<=maxT; t+=20){
    ctx.beginPath(); ctx.moveTo(pad.l, ty(t)); ctx.lineTo(W - pad.r, ty(t)); ctx.stroke();
  }
  
  // X-axis grid lines
  let timeStep;
  if(useZoomedView){
    timeStep = 0.5; // 30 seconds in zoomed view
  } else {
    // Adaptive step for full view based on total duration
    const duration = maxTime - minTime;
    if(duration <= 5) timeStep = 0.5;
    else if(duration <= 10) timeStep = 1;
    else if(duration <= 20) timeStep = 2;
    else timeStep = Math.ceil(duration / 10);
  }
  const startStep = Math.ceil(minTime / timeStep) * timeStep;
  for(let t = startStep; t <= maxTime + 0.01; t += timeStep){
    ctx.beginPath(); ctx.moveTo(tx(t), pad.t); ctx.lineTo(tx(t), H - pad.b); ctx.stroke();
  }

  // Y-axis labels
  ctx.fillStyle = '#a09080';
  ctx.font = '12px system-ui';
  ctx.textAlign = 'right'; ctx.textBaseline = 'middle';
  for(let t=minT; t<=maxT; t+=40){ ctx.fillText(t + '°', pad.l - 8, ty(t)); }
  
  // X-axis labels
  ctx.textAlign = 'center'; ctx.textBaseline = 'top';
  for(let t = startStep; t <= maxTime + 0.01; t += timeStep){
    const m = Math.floor(t);
    const s = Math.round((t - m) * 60);
    const label = s > 0 ? m + ':' + String(s).padStart(2,'0') : m + 'm';
    ctx.fillText(label, tx(t), H - pad.b + 6);
  }

  // Color-coded target profile lines
  ctx.lineWidth = 3;
  ctx.lineJoin = 'round';
  for(let i=0; i<profileSteps.length - 1; i++){
    const step = profileSteps[i];
    const nextStep = profileSteps[i+1];
    ctx.strokeStyle = getNoteColor(step.note);
    ctx.beginPath();
    ctx.moveTo(tx(step.time), ty(step.target));
    ctx.lineTo(tx(nextStep.time), ty(nextStep.target));
    ctx.stroke();
  }

  // Color-coded target profile dots
  for(let i=0; i<profileSteps.length; i++){
    const step = profileSteps[i];
    ctx.fillStyle = getNoteColor(step.note);
    ctx.beginPath();
    ctx.arc(tx(step.time), ty(step.target), 6, 0, Math.PI*2);
    ctx.fill();
    ctx.strokeStyle = '#1a1512';
    ctx.lineWidth = 2;
    ctx.stroke();
  }

  // Bean estimate line and diamonds
  if(minuteAvgs.length > 0){
    ctx.strokeStyle = '#5a8f5a';
    ctx.lineWidth = 2.5;
    ctx.setLineDash([8, 5]);
    ctx.beginPath();
    let first = true;
    minuteAvgs.forEach(function(m){
      const x = tx(m.minute + 0.5);
      const y = ty(m.beanEstimate);
      if(first) { ctx.moveTo(x, y); first = false; }
      else { ctx.lineTo(x, y); }
    });
    ctx.stroke();
    ctx.setLineDash([]);

    ctx.fillStyle = '#5a8f5a';
    ctx.strokeStyle = '#1a1512';
    ctx.lineWidth = 2;
    ctx.font = 'bold 11px system-ui';
    ctx.textAlign = 'center'; ctx.textBaseline = 'bottom';
    minuteAvgs.forEach(function(m){
      const x = tx(m.minute + 0.5);
      const y = ty(m.beanEstimate);
      const s = 7;
      ctx.beginPath();
      ctx.moveTo(x, y-s); ctx.lineTo(x+s, y); ctx.lineTo(x, y+s); ctx.lineTo(x-s, y);
      ctx.closePath(); ctx.fill(); ctx.stroke();
      ctx.fillStyle = '#5a8f5a';
      ctx.fillText(m.beanEstimate + '°', x, y - 10);
      ctx.fillStyle = '#5a8f5a';
    });
  }

  // Reading dots
  ctx.fillStyle = '#c17f45';
  readings.forEach(function(r){
    const x = tx(r.timeSec / 60);
    const y = ty(r.value);
    ctx.beginPath(); ctx.arc(x, y, 4, 0, Math.PI*2); ctx.fill();
  });

  // Observation flags
  ctx.fillStyle = '#8a6fa8';
  ctx.strokeStyle = '#1a1512';
  ctx.lineWidth = 1.5;
  ctx.font = 'bold 10px system-ui';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'bottom';
  observations.forEach(function(obs, idx){
    const x = tx(obs.timeSec / 60);
    const y = pad.t + 10 + (idx % 3) * 14;
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(x+6, y-4);
    ctx.lineTo(x, y-8);
    ctx.closePath();
    ctx.fill(); ctx.stroke();
    ctx.fillStyle = '#d0c0e0';
    ctx.fillText(obs.text.substring(0,12), x, y - 10);
    ctx.fillStyle = '#8a6fa8';
  });

  // Current time cursor (only in zoomed view during roast)
  if(useZoomedView && roastActive && startTime){
    const elapsedMin = (Date.now() - startTime) / 60000;
    const cx = tx(elapsedMin);
    ctx.strokeStyle = '#c17f45';
    ctx.lineWidth = 1;
    ctx.setLineDash([3, 3]);
    ctx.beginPath();
    ctx.moveTo(cx, pad.t);
    ctx.lineTo(cx, H - pad.b);
    ctx.stroke();
    ctx.setLineDash([]);
  }
}

function drawOverview(){
  const oCanvas = document.getElementById('overviewCanvas');
  if(!oCanvas) return;
  const oCtx = oCanvas.getContext('2d');
  const oWrap = document.getElementById('overviewWrap');
  const W = oWrap.offsetWidth, H = oWrap.offsetHeight;
  if(!W || !H) return;

  const oDPR = Math.min(window.devicePixelRatio || 1, 2);
  oCanvas.width = W * oDPR;
  oCanvas.height = H * oDPR;
  oCanvas.style.width = W + 'px';
  oCanvas.style.height = H + 'px';
  oCtx.setTransform(oDPR, 0, 0, oDPR, 0, 0);

  const pad = {t:10, r:44, b:20, l:56};
  const cw = W - pad.l - pad.r;
  const ch = H - pad.t - pad.b;

  const allTemps = [
    ...profileSteps.map(function(s){return s.target;}),
    ...readings.map(function(r){return r.value;}),
    ...minuteAvgs.map(function(m){return m.beanEstimate;})
  ];
  let minT = allTemps.length ? Math.min.apply(null, allTemps) : 200;
  let maxT = allTemps.length ? Math.max.apply(null, allTemps) : 500;
  minT = Math.floor((minT - 20)/20)*20;
  maxT = Math.ceil((maxT + 20)/20)*20;

  const maxTime = Math.max(
    profileSteps.length > 0 ? profileSteps[profileSteps.length-1].time : 5,
    roastActive && startTime ? (Date.now() - startTime) / 60000 + 1 : 5,
    5
  );

  const tx = function(t){ return (t / maxTime) * cw + pad.l; };
  const ty = function(t){ return pad.t + ch - ((t - minT) / (maxT - minT)) * ch; };

  oCtx.clearRect(0, 0, W, H);

  // Faint grid
  oCtx.strokeStyle = '#2a2018';
  oCtx.lineWidth = 1;
  for(let t=minT; t<=maxT; t+=40){
    oCtx.beginPath(); oCtx.moveTo(pad.l, ty(t)); oCtx.lineTo(W - pad.r, ty(t)); oCtx.stroke();
  }

  // Full profile line
  oCtx.strokeStyle = '#4a7fa8';
  oCtx.lineWidth = 2;
  oCtx.lineJoin = 'round';
  oCtx.beginPath();
  let started = false;
  for(let i=0; i<profileSteps.length; i++){
    const step = profileSteps[i];
    const x = tx(step.time);
    const y = ty(step.target);
    if(!started){ oCtx.moveTo(x, y); started = true; }
    else { oCtx.lineTo(x, y); }
  }
  oCtx.stroke();

  // Faint readings
  oCtx.fillStyle = 'rgba(193, 127, 69, 0.5)';
  readings.forEach(function(r){
    const x = tx(r.timeSec / 60);
    const y = ty(r.value);
    oCtx.beginPath(); oCtx.arc(x, y, 2, 0, Math.PI*2); oCtx.fill();
  });

  // Highlight rectangle for visible window (only meaningful during roast)
  if(roastActive && startTime){
    let currentTime = (Date.now() - startTime) / 60000;
    const windowSize = 2.0;
    const minTime = Math.max(0, currentTime - 1.0);
    const maxTimeWin = minTime + windowSize;

    const x1 = tx(minTime);
    const x2 = tx(maxTimeWin);
    oCtx.fillStyle = 'rgba(193, 127, 69, 0.2)';
    oCtx.fillRect(x1, pad.t, x2 - x1, ch);
    oCtx.strokeStyle = '#c17f45';
    oCtx.lineWidth = 1;
    oCtx.strokeRect(x1, pad.t, x2 - x1, ch);

    // Current time cursor
    const elapsedMin = (Date.now() - startTime) / 60000;
    const cx = tx(elapsedMin);
    oCtx.strokeStyle = '#c17f45';
    oCtx.lineWidth = 1;
    oCtx.setLineDash([2, 2]);
    oCtx.beginPath();
    oCtx.moveTo(cx, pad.t);
    oCtx.lineTo(cx, H - pad.b);
    oCtx.stroke();
    oCtx.setLineDash([]);
  }
}
