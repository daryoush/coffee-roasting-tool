The diagnostic shows the fullscreen mode **isn't activating at all**! The classes aren't being applied:

- `fullscreen-mode on body? false`
- `fullscreen-chart on #app? false`
- `#chartWrap` is `0 x 0` (collapsed)

This means the button click isn't triggering the function. Let me fix this:

```bash
# 1. Verify the toggleChartFullscreen function exists in chart.js
echo "=== Checking if function exists ==="
grep -n "function toggleChartFullscreen" js/chart.js

# 2. If it doesn't exist or is broken, add it properly
if ! grep -q "function toggleChartFullscreen" js/chart.js; then
  echo "Function missing! Adding it..."
  cat >> js/chart.js << 'EOF'

// Full-screen chart toggle
function toggleChartFullscreen(){
  console.log('[CHART] toggleChartFullscreen called');
  const app = document.getElementById('app');
  const body = document.body;
  
  body.classList.toggle('fullscreen-mode');
  app.classList.toggle('fullscreen-chart');
  
  console.log('[CHART] After toggle:');
  console.log('  body.classList:', body.className);
  console.log('  #app.classList:', app.className);
  
  // Force resize after a short delay to let CSS apply
  setTimeout(function(){
    console.log('[CHART] Triggering resizeCanvas');
    resizeCanvas();
  }, 100);
}
EOF
fi

# 3. Verify the button exists in index.html and has correct onclick
echo ""
echo "=== Checking button in index.html ==="
grep -n "toggleChartFullscreen\|Full Screen" index.html

# 4. If button is missing, add it
if ! grep -q "toggleChartFullscreen" index.html; then
  echo "Button missing! Adding it..."
  sed -i.bak 's|<button class="btn btn-red" onclick="endRoast()">⏹ End Roast</button>|<button class="btn btn-red" onclick="endRoast()">⏹ End Roast</button>\n      <button class="btn btn-gray" onclick="toggleChartFullscreen()">⛶ Full Screen</button>|' index.html
  rm index.html.bak
fi

# 5. Test the function manually from console
cat > /tmp/test_fullscreen.js << 'EOF'
// Paste this in console to test if the function works:
console.log('Testing toggleChartFullscreen...');
if(typeof toggleChartFullscreen === 'function'){
  console.log('✅ Function exists');
  toggleChartFullscreen();
  setTimeout(function(){
    const app = document.getElementById('app');
    console.log('After calling function:');
    console.log('  #app.classList:', app.className);
    console.log('  Has fullscreen-chart?', app.classList.contains('fullscreen-chart'));
  }, 200);
} else {
  console.log('❌ Function does NOT exist! Check js/chart.js');
}
EOF

echo ""
echo "=== Manual Test Command ==="
echo "Paste this in the browser console to test:"
cat /tmp/test_fullscreen.js
rm /tmp/test_fullscreen.js

# 6. Verify CSS classes exist
echo ""
echo "=== Checking CSS classes ==="
grep -n "\.fullscreen-chart{" styles.css | head -3
grep -n "\.fullscreen-chart #chartWrap{" styles.css | head -3
```

---

### 🧪 Immediate Test

**Paste this in the browser console right now:**

```javascript
// Quick test - does the function exist?
console.log('toggleChartFullscreen exists?', typeof toggleChartFullscreen);

// Try calling it manually
if(typeof toggleChartFullscreen === 'function'){
  toggleChartFullscreen();
  setTimeout(function(){
    const app = document.getElementById('app');
    console.log('After manual call:');
    console.log('  #app class:', app.className);
    console.log('  Has fullscreen-chart?', app.classList.contains('fullscreen-chart'));
    
    const chartWrap = document.getElementById('chartWrap');
    const rect = chartWrap.getBoundingClientRect();
    console.log('  #chartWrap size:', Math.round(rect.width), 'x', Math.round(rect.height));
  }, 200);
} else {
  console.log('❌ Function does not exist! The button cannot work.');
}
```

---

### 📝 Git Commit Message (after fixing)

```bash
git add js/chart.js index.html
git commit -m "fix(chart): ensure fullscreen toggle function exists and button works" \
  -m "- Added console logging to toggleChartFullscreen() for debugging." \
  -m "- Function now toggles both body.fullscreen-mode and #app.fullscreen-chart." \
  -m "- Added setTimeout to ensure CSS applies before resizing canvas." \
  -m "- If function was missing, it's now properly defined in chart.js."
```

**One-liner version:**
```bash
git commit -m "fix(chart): ensure toggleChartFullscreen function exists and properly toggles CSS classes"
```

Run the diagnostic test above and tell me what it says. If the function doesn't exist, we'll know exactly what's wrong.