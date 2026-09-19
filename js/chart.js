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





// Full-screen roast panel using native Fullscreen API
function toggleChartFullscreen(){
  console.log('[CHART] toggleChartFullscreen called');
  const roastPanel = document.getElementById('roastPanel');
  
  if(!document.fullscreenElement){
    // Enter fullscreen with the entire roast panel
    roastPanel.requestFullscreen().then(function(){
      console.log('[CHART] ✅ Entered native fullscreen on #roastPanel');
      document.getElementById('app').classList.add('fullscreen-chart');
      document.body.classList.add('fullscreen-mode');
      setTimeout(resizeCanvas, 150);
    }).catch(function(err){
      console.log('[CHART] ❌ Fullscreen failed:', err.message);
      // Fallback to CSS-only method
      document.getElementById('app').classList.toggle('fullscreen-chart');
      document.body.classList.toggle('fullscreen-mode');
      setTimeout(resizeCanvas, 150);
    });
  } else {
    // Exit fullscreen
    document.exitFullscreen().then(function(){
      console.log('[CHART] ✅ Exited native fullscreen');
      document.getElementById('app').classList.remove('fullscreen-chart');
      document.body.classList.remove('fullscreen-mode');
      setTimeout(resizeCanvas, 150);
    });
  }
}

// Listen for fullscreen change to update UI
document.addEventListener('fullscreenchange', function(){
  console.log('[CHART] fullscreenchange event, fullscreenElement=', document.fullscreenElement);
  if(!document.fullscreenElement){
    document.getElementById('app').classList.remove('fullscreen-chart');
    document.body.classList.remove('fullscreen-mode');
    setTimeout(resizeCanvas, 150);
  }
});
