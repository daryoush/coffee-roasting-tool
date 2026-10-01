// Application initialization
loadSample();
resizeCanvas();

// Display version information
const versionEl = document.getElementById('versionDisplay');
if(versionEl){
  versionEl.textContent = `v${APP_VERSION.number} | ${APP_VERSION.date} ${APP_VERSION.time}`;
  console.log('[APP] Version:', APP_VERSION.number, '|', APP_VERSION.date, APP_VERSION.time);
}
