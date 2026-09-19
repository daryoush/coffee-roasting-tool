Here are the bash commands to implement both changes:

```bash
# 1. Update styles.css to add full-screen chart styles
cat >> styles.css << 'EOF'

/* Full-screen chart mode */
.fullscreen-chart #chartWrap{
  position:fixed !important;
  top:0 !important;
  left:0 !important;
  width:100vw !important;
  height:100vh !important;
  z-index:9999 !important;
  border-radius:0 !important;
  border:none !important;
}
.fullscreen-chart .row,
.fullscreen-chart .log,
.fullscreen-chart #minuteNote,
.fullscreen-chart .quick-input,
.fullscreen-chart .obs-input,
.fullscreen-chart div[style*="text-align:center;margin-top:8px"]{
  display:none !important;
}
.fullscreen-chart .col{
  position:fixed;
  top:10px;
  left:10px;
  z-index:10000;
  background:rgba(26,21,18,0.85);
  padding:10px 16px;
  border-radius:10px;
  border:1px solid #3a3028;
  min-width:auto;
}
.fullscreen-chart .col .big-temp{
  font-size:24px;
  margin:2px 0;
}
.fullscreen-chart .col .instruction{
  font-size:14px;
  padding:8px;
  margin:4px 0;
}
.fullscreen-chart .col:nth-child(2){
  left:auto;
  right:10px;
}
.fullscreen-chart .timer{
  position:fixed;
  top:10px;
  left:50%;
  transform:translateX(-50%);
  z-index:10000;
  background:rgba(26,21,18,0.85);
  padding:6px 20px;
  border-radius:10px;
  border:1px solid #3a3028;
  font-size:36px;
}
.fullscreen-exit-btn{
  position:fixed;
  bottom:20px;
  left:50%;
  transform:translateX(-50%);
  z-index:10000;
  display:none;
}
.fullscreen-chart .fullscreen-exit-btn{
  display:block;
}
EOF

# 2. Add full-screen toggle button to index.html
sed -i.bak 's|<button class="btn btn-red" onclick="endRoast()">⏹ End Roast</button>|<button class="btn btn-red" onclick="endRoast()">⏹ End Roast</button>\n      <button class="btn btn-gray" onclick="toggleChartFullscreen()">⛶ Full Screen</button>|' index.html

# Add the exit button inside chartWrap
sed -i.bak 's|<div id="chartWrap"><canvas id="chartCanvas"></canvas></div>|<div id="chartWrap"><canvas id="chartCanvas"></canvas><button class="btn btn-red fullscreen-exit-btn" onclick="toggleChartFullscreen()">✕ Exit Full Screen</button></div>|' index.html
rm index.html.bak

# 3. Provide the complete updated js/chart.js with color-coded profile and fullscreen support
cat > js/chart.js << 'EOF'
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

// Map note keywords to canvas colors (mirrors CSS classes)
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

// Full-screen chart toggle
function toggleChartFullscreen(){
  const app = document.getElementById('app');
  app.classList.toggle('fullscreen-chart');
  setTimeout(resizeCanvas, 50);
}

// Listen for Escape key to exit fullscreen
document.addEventListener('keydown', function(e){
  if(e.key === 'Escape'){
    const app = document.getElementById('app');
    if(app.classList.contains('fullscreen-chart')){
      app.classList.remove('fullscreen-chart');
      setTimeout(resizeCanvas, 50);
    }
  }
});

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

  // Grid
  ctx.strokeStyle = '#3a3028';
  ctx.lineWidth = 1;
  for(let t=minT; t<=maxT; t+=20){
    ctx.beginPath(); ctx.moveTo(pad.l, ty(t)); ctx.lineTo(W - pad.r, ty(t)); ctx.stroke();
  }
  const timeStep = maxTime <= 5 ? 0.5 : 1;
  for(let t=0; t<=maxTime; t+=timeStep){
    ctx.beginPath(); ctx.moveTo(tx(t), pad.t); ctx.lineTo(tx(t), H - pad.b); ctx.stroke();
  }

  // Y-axis labels
  ctx.fillStyle = '#a09080';
  ctx.font = '12px system-ui';
  ctx.textAlign = 'right'; ctx.textBaseline = 'middle';
  for(let t=minT; t<=maxT; t+=40){ ctx.fillText(t + '°', pad.l - 8, ty(t)); }
  
  // X-axis labels
  ctx.textAlign = 'center'; ctx.textBaseline = 'top';
  for(let t=0; t<=maxTime; t+=timeStep){
    const m = Math.floor(t);
    const s = Math.round((t - m) * 60);
    const label = s > 0 ? m + ':' + String(s).padStart(2,'0') : m + 'm';
    ctx.fillText(label, tx(t), H - pad.b + 6);
  }

  // COLOR-CODED target profile line segments
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

  // COLOR-CODED target profile dots
  for(let i=0; i<profileSteps.length; i++){
    const step = profileSteps[i];
    ctx.fillStyle = getNoteColor(step.note);
    ctx.beginPath();
    ctx.arc(tx(step.time), ty(step.target), 6, 0, Math.PI*2);
    ctx.fill();
    // White border for visibility
    ctx.strokeStyle = '#1a1512';
    ctx.lineWidth = 2;
    ctx.stroke();
  }

  // Bean estimate line
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

    // Bean estimate diamonds
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

  // Current time cursor
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
EOF

# 4. Verify the changes
echo "=== Verification ==="
echo "chart.js functions:"
grep -E "^function " js/chart.js | sed 's/function /  - /' | sed 's/(.*//'
echo ""
echo "Fullscreen CSS rules:"
grep -c "fullscreen" styles.css
echo "fullscreen-related rules in styles.css"
echo ""
echo "Fullscreen button in index.html:"
grep "toggleChartFullscreen" index.html
```

---

### 📝 Git Commit Message

```bash
git add js/chart.js styles.css index.html
git commit -m "feat(chart): color-coded profile line/dots and full-screen chart mode" \
  -m "- Target profile line segments and dots now use the same flame colors" \
  -m "  as the profile table notes (red=high, orange=medium, yellow=med-low, etc.)." \
  -m "- Added getNoteColor() to map note keywords to canvas hex colors." \
  -m "- Dots are slightly larger (6px) with dark borders for visibility." \
  -m "- Added Full Screen button to expand chart to entire viewport." \
  -m "- In full-screen mode, timer and key readouts overlay the chart." \
  -m "- Press Escape or click Exit button to return to normal view." \
  -m "- Chart auto-resizes on toggle and window resize."
```

**One-liner version:**
```bash
git commit -m "feat(chart): color-coded profile dots/lines matching flame notes + full-screen chart mode"
```

### 🧪 How to Test

**Test 1: Color-Coded Chart**
1. Run the commands and hard-refresh.
2. Load the default profile.
3. Accept the profile and start the roast.
4. Look at the chart — the target line and dots should now show:
   - 🔴 Red dots/line for "high flame" steps
   - 🟠 Orange for "medium flame" steps
   - 🔵 Blue for "low flame" steps
   - 🟢 Green for "hold" steps

**Test 2: Full-Screen Chart**
1. While roasting, click **"⛶ Full Screen"**.
2. The chart should expand to fill the entire browser window.
3. The timer and temperature readouts overlay the chart in corners.
4. Press **Escape** or click **"✕ Exit Full Screen"** to return to normal view.