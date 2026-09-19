The diagnostic shows the **classes are being applied correctly** ✅, but `#chartWrap` stays 0x0. This means either:

1. **Browser cached an old `styles.css`** (most likely)
2. **CSS specificity conflict** with the existing `#chartWrap` rule

Let me fix this with a bulletproof approach using the **native Fullscreen API** (which truly fills the screen) plus cache-busting:

### 📜 Bash Commands to Fix

```bash
# 1. Add cache-busting to the CSS link in index.html
sed -i.bak 's|<link rel="stylesheet" href="styles.css">|<link rel="stylesheet" href="styles.css?v=2">|' index.html
rm index.html.bak

# 2. Replace the fullscreen toggle function in chart.js with native Fullscreen API
# First, find and remove the old toggleChartFullscreen function
sed -i.bak '/^\/\/ Full-screen chart toggle$/,/^}$/d' js/chart.js

# Add the new robust version
cat >> js/chart.js << 'EOF'

// Full-screen chart toggle using native Fullscreen API
function toggleChartFullscreen(){
  console.log('[CHART] toggleChartFullscreen called');
  const chartWrap = document.getElementById('chartWrap');
  
  if(!document.fullscreenElement){
    // Enter fullscreen
    chartWrap.requestFullscreen().then(function(){
      console.log('[CHART] ✅ Entered native fullscreen');
      // Add class for styling overrides
      document.getElementById('app').classList.add('fullscreen-chart');
      document.body.classList.add('fullscreen-mode');
      setTimeout(resizeCanvas, 100);
    }).catch(function(err){
      console.log('[CHART] ❌ Fullscreen failed:', err.message);
      // Fallback to CSS-only method
      document.getElementById('app').classList.toggle('fullscreen-chart');
      document.body.classList.toggle('fullscreen-mode');
      setTimeout(resizeCanvas, 100);
    });
  } else {
    // Exit fullscreen
    document.exitFullscreen().then(function(){
      console.log('[CHART] ✅ Exited native fullscreen');
      document.getElementById('app').classList.remove('fullscreen-chart');
      document.body.classList.remove('fullscreen-mode');
      setTimeout(resizeCanvas, 100);
    });
  }
}

// Listen for fullscreen change to update UI
document.addEventListener('fullscreenchange', function(){
  console.log('[CHART] fullscreenchange event');
  if(!document.fullscreenElement){
    document.getElementById('app').classList.remove('fullscreen-chart');
    document.body.classList.remove('fullscreen-mode');
    setTimeout(resizeCanvas, 100);
  }
});

// Listen for Escape key (native fullscreen handles this automatically)
EOF
rm js/chart.js.bak

# 3. Add inline styles to #chartWrap as a fallback guarantee
# Find the chartWrap div and add inline style
sed -i.bak 's|<div id="chartWrap">|<div id="chartWrap" style="position:relative;width:100%;height:380px;">|' index.html
rm index.html.bak

# 4. Verify the changes
echo "=== Verification ==="
echo ""
echo "Cache-busting in index.html:"
grep "styles.css" index.html
echo ""
echo "toggleChartFullscreen in chart.js:"
grep -A5 "function toggleChartFullscreen" js/chart.js | head -8
echo ""
echo "Fullscreen API usage:"
grep -c "requestFullscreen" js/chart.js
echo "occurrences of requestFullscreen"
```

---

### 📝 Git Commit Message

```bash
git add js/chart.js index.html
git commit -m "fix(chart): use native Fullscreen API for reliable full-viewport chart" \
  -m "- Replaced CSS-only fullscreen with native Fullscreen API (requestFullscreen)." \
  -m "- Native API guarantees true viewport coverage, bypassing CSS specificity issues." \
  -m "- Added cache-busting (?v=2) to styles.css to force browser reload." \
  -m "- Added fullscreenchange listener to clean up classes on exit." \
  -m "- Fallback to CSS method if native API fails (e.g., unsupported browser)." \
  -m "- Added inline styles to #chartWrap as additional safeguard."
```

**One-liner version:**
```bash
git commit -m "fix(chart): use native Fullscreen API + cache-busting for reliable full-viewport chart"
```

---

### 🧪 How to Test

1. **Hard-refresh** your browser (`Ctrl+Shift+R` or `Cmd+Shift+R`) to clear cache.
2. Start a roast.
3. Click **"⛶ Full Screen"**.
4. The chart should now expand to fill the **entire screen** (not just the browser window).
5. Press **Escape** or **F11** to exit fullscreen.

### 🔍 If It Still Doesn't Work

Paste this in the console to verify the native API is working:

```javascript
console.log('Testing native Fullscreen API...');
const chartWrap = document.getElementById('chartWrap');
console.log('chartWrap element:', chartWrap);
console.log('requestFullscreen method:', typeof chartWrap.requestFullscreen);

if(typeof chartWrap.requestFullscreen === 'function'){
  console.log('✅ Native Fullscreen API is available');
  chartWrap.requestFullscreen().then(function(){
    console.log('✅ Successfully entered fullscreen');
    setTimeout(function(){
      const rect = chartWrap.getBoundingClientRect();
      console.log('chartWrap size in fullscreen:', Math.round(rect.width), 'x', Math.round(rect.height));
    }, 500);
  }).catch(function(err){
    console.log('❌ Fullscreen failed:', err.message);
  });
} else {
  console.log('❌ Native Fullscreen API not available');
}
```

The native Fullscreen API is the most reliable way to achieve true full-screen in modern browsers, bypassing all CSS layout constraints.