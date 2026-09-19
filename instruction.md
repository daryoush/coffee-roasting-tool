Here are the bash commands to improve the contrast between `medium-low` and `medium` by shifting `medium-low` to a more distinct yellow tone:

```bash
# 1. Backup current styles.css
cp styles.css styles.css.bak

# 2. Update the medium-low color to a more distinct yellow
#    - medium stays orange (#ffa94d)
#    - medium-low becomes bright yellow (#ffd43b) for clear contrast
sed -i.bak \
  -e 's/\.profile-table input\.note-medium-low{color:#ffc078 !important;font-weight:600;}/.profile-table input.note-medium-low{color:#ffd43b !important;font-weight:600;}/' \
  styles.css

# 3. Verify the change
echo "=== Updated color scheme ==="
grep "note-medium\|note-high\|note-low" styles.css | grep "profile-table"

# 4. Show the diff
diff -u styles.css.bak styles.css || true

# 5. Clean up backup
rm styles.css.bak
```

---

### 🎨 New Color Gradient

The updated visual spectrum now has much clearer separation:

| Flame Level | Color | Hex Code | Visual |
|-------------|-------|----------|--------|
| 🔴 High | Red | `#ff6b5a` | Hottest |
| 🟠 Medium-high | Orange-red | `#ff8c42` | ↓ |
| 🟡 Medium | Orange | `#ffa94d` | ↓ |
| 🟨 **Medium-low** | **Bright Yellow** | **`#ffd43b`** | **↓ (now clearly distinct!)** |
| 🔵 Low | Blue | `#8ecfff` | Coolest |

The key change: `medium-low` moved from a pale orange (`#ffc078`) that blended with `medium` to a bright yellow (`#ffd43b`) that creates a clear visual step in the gradient.

---

### 📝 Git Commit Message

```bash
git add styles.css
git commit -m "fix(styles): improve contrast between medium and medium-low flame notes" \
  -m "- Changed note-medium-low from pale orange (#ffc078) to bright yellow (#ffd43b)." \
  -m "- Previously, medium-low blended too closely with medium (both orange tones)." \
  -m "- New color creates a clearer visual step in the flame intensity gradient:" \
  -m "  🔴 high (#ff6b5a) → 🟠 med-high (#ff8c42) → 🟡 medium (#ffa94d)" \
  -m "  → 🟨 med-low (#ffd43b) → 🔵 low (#8ecfff)" \
  -m "- Makes it much easier to visually distinguish flame settings at a glance."
```

**One-liner version:**
```bash
git commit -m "fix(styles): shift medium-low from pale orange to bright yellow for better contrast with medium"
```

### 🧪 How to Test
1. Run the commands above.
2. Hard-refresh your browser (`Ctrl+Shift+R` or `Cmd+Shift+R`).
3. Edit the profile table and add these notes to see the gradient:
   - "high flame" (red)
   - "medium-high flame" (orange-red)
   - "medium flame" (orange)
   - "medium-low flame" (bright yellow)
   - "low flame" (blue)
4. You should now see a clear, distinct color step between medium (orange) and medium-low (yellow).