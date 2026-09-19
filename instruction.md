The issue is that `#app` has `max-width:1000px` and `padding:16px`, which constrain the chart even in fullscreen mode. We need to override these when fullscreen is active.

### 📜 Bash Commands to Fix

```bash
# 1. Backup current styles.css
cp styles.css styles.css.bak

# 2. Add CSS rules to override #app constraints in fullscreen mode
cat >> styles.css << 'EOF'

/* Override app container constraints in fullscreen */
.fullscreen-chart{
  max-width:100% !important;
  width:100% !important;
  padding:0 !important;
  margin:0 !important;
}
.fullscreen-chart #chartWrap{
  margin:0 !important;
  border-radius:0 !important;
}
EOF

# 3. Fix the existing fullscreen-chart #chartWrap rule to ensure it truly fills viewport
# Replace the existing #chartWrap fullscreen rule with a more aggressive one
sed -i.bak2 's|\.fullscreen-chart #chartWrap{|.fullscreen-chart #chartWrap{\n  margin:0 !important;\n  padding:0 !important;|' styles.css

# 4. Verify the changes
echo "=== Verification ==="
echo "Fullscreen-related rules:"
grep -A2 "fullscreen-chart{" styles.css | head -10
echo ""
echo "#chartWrap fullscreen rule:"
grep -A6 "\.fullscreen-chart #chartWrap{" styles.css | head -10

# 5. Clean up backup
rm styles.css.bak styles.css.bak2
```

---

### 📝 Git Commit Message

```bash
git add styles.css
git commit -m "fix(chart): make full-screen chart truly fill browser viewport" \
  -m "- Override #app container's max-width:1000px and padding:16px in fullscreen mode." \
  -m "- Previously, the parent container constraints prevented the chart from" \
  -m "  reaching the browser edges even with position:fixed and 100vw/100vh." \
  -m "- Now #app gets max-width:100%, padding:0, margin:0 when fullscreen is active." \
  -m "- Chart now extends edge-to-edge as expected."
```

**One-liner version:**
```bash
git commit -m "fix(chart): override #app max-width/padding constraints so fullscreen chart fills entire viewport"
```

### 🧪 How to Test
1. Run the commands above.
2. Hard-refresh your browser (`Ctrl+Shift+R` or `Cmd+Shift+R`).
3. Start a roast and click **"⛶ Full Screen"**.
4. The chart should now extend to all four edges of the browser window with no gaps.
5. Press **Escape** to return to normal view.

The key fix was adding rules to override `#app`'s `max-width:1000px` and `padding:16px` when the `fullscreen-chart` class is active, allowing the fixed-position chart to truly fill the viewport.