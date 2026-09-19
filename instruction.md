You're right — the user wants the **entire roast panel** (chart + temperatures + timer + instructions) in fullscreen, not just the chart. Let me fix this by fullscreening `#roastPanel` instead of `#chartWrap`.

### 📜 Bash Commands to Fix

```bash
# 1. Update cache-bust version
sed -i.bak 's|styles.css?v=2|styles.css?v=3|' index.html
rm index.html.bak

# 2. Replace the fullscreen toggle function to target #roastPanel instead of #chartWrap
# First remove the old function and listeners
sed -i.bak '/^\/\/ Full-screen chart toggle using native Fullscreen API$/,/^}$/d' js/chart.js
sed -i.bak '/^\/\/ Listen for fullscreen change/,/^}$/d' js/chart.js
sed -i.bak '/^\/\/ Listen for Escape key/,/^}$/d' js/chart.js

# Add the new version that fullscreens the entire roast panel
cat >> js/chart.js << 'EOF'

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
EOF
rm js/chart.js.bak

# 3. Update the fullscreen CSS to properly layout #roastPanel in fullscreen mode
# First remove old fullscreen CSS
sed -i.bak '/\/\* Full-screen chart mode/,/^}$/d' styles.css
sed -i.bak '/^body\.fullscreen-mode/,/^}$/d' styles.css
sed -i.bak '/^\.fullscreen-chart{/,/^}$/d' styles.css
sed -i.bak '/^\.fullscreen-chart #chartWrap{/,/^}$/d' styles.css
sed -i.bak '/^\.fullscreen-chart #chartWrap canvas{/,/^}$/d' styles.css
sed -i.bak '/^\.fullscreen-chart \.row,/,/^}$/d' styles.css
sed -i.bak '/^\.fullscreen-chart \.col{/,/^}$/d' styles.css
sed -i.bak '/^\.fullscreen-chart \.col:nth-child(2){/,/^}$/d' styles.css
sed -i.bak '/^\.fullscreen-chart \.timer{/,/^}$/d' styles.css
sed -i.bak '/^\.fullscreen-exit-btn{/,/^}$/d' styles.css
sed -i.bak '/^\.fullscreen-chart \.fullscreen-exit-btn{/,/^}$/d' styles.css
sed -i.bak '/^\.fullscreen-chart \.col \.big-temp{/,/^}$/d' styles.css
sed -i.bak '/^\.fullscreen-chart \.col \.instruction{/,/^}$/d' styles.css

# Add the new, comprehensive fullscreen CSS
cat >> styles.css << 'EOF'

/* Full-screen roast panel mode */
body.fullscreen-mode{
  overflow:hidden !important;
  background:#1a1512 !important;
}
.fullscreen-chart #roastPanel{
  position:fixed !important;
  top:0 !important;
  left:0 !important;
  width:100vw !important;
  height:100vh !important;
  max-width:100vw !important;
  max-height:100vh !important;
  margin:0 !important;
  padding:12px !important;
  border-radius:0 !important;
  border:none !important;
  background:#1a1512 !important;
  z-index:9999 !important;
  display:flex !important;
  flex-direction:column !important;
  overflow:auto !important;
}
.fullscreen-chart #app{
  max-width:100% !important;
  width:100% !important;
  padding:0 !important;
  margin:0 !important;
}
.fullscreen-chart #chartWrap{
  flex:1 !important;
  width:100% !important;
  min-height:300px !important;
  height:auto !important;
  margin:10px 0 !important;
  border-radius:10px !important;
}
.fullscreen-chart .row{
  flex-wrap:nowrap !important;
  gap:12px !important;
}
.fullscreen-chart .col{
  min-width:0 !important;
}
.fullscreen-chart .big-temp{
  font-size:28px !important;
  margin:4px 0 !important;
}
.fullscreen-chart .timer{
  font-size:42px !important;
}
.fullscreen-chart .instruction{
  font-size:16px !important;
  padding:10px !important;
}
.fullscreen-chart .log{
  max-height:120px !important;
}
.fullscreen-chart .quick-input,
.fullscreen-chart .obs-input{
  margin-top:6px !important;
}
.fullscreen-chart #setupPanel{
  display:none !important;
}
.fullscreen-chart .fullscreen-exit-btn{
  display:inline-block !important;
  position:fixed !important;
  bottom:16px !important;
  right:16px !important;
  z-index:10000 !important;
}
.fullscreen-exit-btn{
  display:none;
}
EOF
rm styles.css.bak

# 4. Update the fullscreen button to be inside roastPanel and show only in fullscreen
# Find the button area and add the exit button
if ! grep -q "fullscreen-exit-btn" index.html; then
  sed -i.bak 's|<button class="btn btn-gray" onclick="toggleChartFullscreen()">⛶ Full Screen</button>|<button class="btn btn-gray" onclick="toggleChartFullscreen()" id="fullscreenBtn">⛶ Full Screen</button>\n      <button class="btn btn-red fullscreen-exit-btn" onclick="toggleChartFullscreen()">✕ Exit Full Screen</button>|' index.html
  rm index.html.bak
fi

# 5. Verify the changes
echo "=== Verification ==="
echo ""
echo "Fullscreen target in chart.js:"
grep -A2 "requestFullscreen" js/chart.js | head -5
echo ""
echo "Fullscreen CSS rules:"
grep -c "fullscreen" styles.css
echo "fullscreen-related rules"
echo ""
echo "Buttons in index.html:"
grep -E "fullscreen|Full Screen" index.html
```

---

### 📝 Git Commit Message

```bash
git add js/chart.js styles.css index.html
git commit -m "feat(chart): fullscreen entire roast panel with chart, temps, and timer" \
  -m "- Changed fullscreen target from #chartWrap to #roastPanel." \
  -m "- Now the entire roast view (chart + temperatures + timer + instructions)" \
  -m "  fills the screen, not just the chart alone." \
  -m "- Used native Fullscreen API for true full-viewport coverage." \
  -m "- Added flexbox layout so chart expands to fill available space while" \
  -m "  keeping temperature readouts, timer, and instructions visible." \
  -m "- Added 'Exit Full Screen' button that appears only in fullscreen mode." \
  -m "- Cache-busted styles.css to v=3 to force browser reload."
```

**One-liner version:**
```bash
git commit -m "feat(chart): fullscreen entire roast panel — chart, temps, timer, and instructions all visible"
```

---

### 🧪 How to Test

1. **Hard-refresh** your browser (`Ctrl+Shift+R` or `Cmd+Shift+R`).
2. Accept a profile and start the roast.
3. Click **"⛶ Full Screen"**.
4. You should now see:
   - **Timer** at the top
   - **Temperature readouts** (Target, Reading, Bean Est) on the left
   - **Gas instruction** banner
   - **Expanded chart** filling most of the screen
   - **Readings/Observations logs** at the bottom
   - **"✕ Exit Full Screen"** button in the bottom-right corner
5. Press **Escape** or click the exit button to return to normal view.

The entire roast dashboard is now visible in fullscreen, giving you maximum visibility of all the critical information during the roast.