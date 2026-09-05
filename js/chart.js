const canvas = document.getElementById('chartCanvas');
const ctx = canvas.getContext('2d');
const wrap = document.getElementById('chartWrap');

function resizeCanvas(){
  const rect = wrap.getBoundingClientRect();
  chartDPR = Math.min(window.devicePixelRatio || 1, 2);
  canvas.width = rect.width * chartDPR;
  canvas.height = rect.height * chartDPR;
  canvas.style.width = rect.width + 'px';
  canvas.style.height = rect.height + 'px';
  ctx.setTransform(chartDPR, 0, 0, chartDPR, 0, 0);
  drawChart();
}
window.addEventListener('resize', resizeCanvas);

function drawChart(){
  const W = wrap.offsetWidth, H = wrap.offsetHeight;
  if(!W || !H) return;
  const pad = {t:36,r:44,b:40,l:56};
  const cw = W - pad.l - pad.r;
  const ch = H - pad.t - pad.b;

  const allTemps = [
    ...profileSteps.map(function(s){return s.target;}),
    ...readings.map(function(r){return r.value;}),
    ...minuteAvgs.map(function(m){return m.beanEstimate;})
  ];
  let minT = allTemps.length ? Math.min.apply(null,allTemps) : 200;
  let maxT = allTemps.length ? Math.max.apply(null,allTemps) : 500;
  minT = Math.floor((minT - 20)/20)*20;
  maxT = Math.ceil((maxT + 20)/20)*20;
  
  const maxTime = Math.max(
    profileSteps.length > 0 ? profileSteps[profileSteps.length-1].time : 5,
    roastActive && startTime ? (Date.now() - startTime) / 60000 + 1 : 5,
    5
  );

  const tx = function(t){ return (t / maxTime) * cw + pad.l; };
  const ty = function(t){ return pad.t + ch - ((t - minT) / (maxT - minT)) * ch; };

  ctx.clearRect(0, 0, W, H);

  ctx.strokeStyle = '#3a3028';
  ctx.lineWidth = 1;
  for(let t=minT; t<=maxT; t+=20){
    ctx.beginPath(); ctx.moveTo(pad.l, ty(t)); ctx.lineTo(W - pad.r, ty(t)); ctx.stroke();
  }
  const timeStep = maxTime <= 5 ? 0.5 : 1;
  for(let t=0; t<=maxTime; t+=timeStep){
    ctx.beginPath(); ctx.moveTo(tx(t), pad.t); ctx.lineTo(tx(t), H - pad.b); ctx.stroke();
  }

  ctx.fillStyle = '#a09080';
  ctx.font = '12px system-ui';
  ctx.textAlign = 'right'; ctx.textBaseline = 'middle';
  for(let t=minT; t<=maxT; t+=40){ ctx.fillText(t + '°', pad.l - 8, ty(t)); }
  
  ctx.textAlign = 'center'; ctx.textBaseline = 'top';
  for(let t=0; t<=maxTime; t+=timeStep){
    const m = Math.floor(t);
    const s = Math.round((t - m) * 60);
    const label = s > 0 ? m + ':' + String(s).padStart(2,'0') : m + 'm';
    ctx.fillText(label, tx(t), H - pad.b + 6);
  }

  ctx.strokeStyle = '#4a7fa8';
  ctx.lineWidth = 3;
  ctx.lineJoin = 'round';
  ctx.beginPath();
  let started = false;
  for(let i=0; i<profileSteps.length; i++){
    const step = profileSteps[i];
    const x = tx(step.time);
    const y = ty(step.target);
    if(!started){ ctx.moveTo(x, y); started = true; }
    else { ctx.lineTo(x, y); }
  }
  ctx.stroke();

  ctx.fillStyle = '#4a7fa8';
  for(let i=0; i<profileSteps.length; i++){
    const step = profileSteps[i];
    ctx.beginPath(); ctx.arc(tx(step.time), ty(step.target), 5, 0, Math.PI*2); ctx.fill();
  }

  if(minuteAvgs.length > 0){
    ctx.strokeStyle = '#5a8f5a';
    ctx.lineWidth = 2.5;
    ctx.setLineDash([8, 5]);
    ctx.beginPath();
    minuteAvgs.forEach(function(m, i){
      const x = tx(m.minute + 0.5);
      const y = ty(m.beanEstimate);
      if(i===0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
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

  ctx.fillStyle = '#c17f45';
  readings.forEach(function(r){
    const x = tx(r.timeSec / 60);
    const y = ty(r.value);
    ctx.beginPath(); ctx.arc(x, y, 4, 0, Math.PI*2); ctx.fill();
  });

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

  if(roastActive && startTime){
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
