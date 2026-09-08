I'll add distinct colors for Medium-high, Medium, and Medium-low by updating the keyword detection logic and adding new CSS classes with a gradient color scheme.

### 🔧 Bash Commands

```bash
# 1. Update js/utils.js to detect medium-high and medium-low BEFORE medium
sed -i.bak \
  -e "/if(lower.includes('medium') || lower.includes('med'))/i\\
  if(lower.includes('medium-high') || lower.includes('med-high')) return 'note-medium-high';\\
  if(lower.includes('medium-low') || lower.includes('med-low')) return 'note-medium-low';" \
  js/utils.js

# 2. Verify the change
echo "=== Updated detection logic ==="
grep -A2 "medium-high" js/utils.js

# 3. Add new CSS classes to styles.css (insert after .note-high)
sed -i.bak \
  -e '/\.note-high{color:#ff6b5a !important;font-weight:700;}/a\
.profile-table input.note-medium-high{color:#ff8c42 !important;font-weight:600;}\
.profile-table input.note-medium-low{color:#ffc078 !important;font-weight:600;}' \
  styles.css

# 4. Verify the CSS changes
echo "=== New CSS classes ==="
grep "note-medium" styles.css

# 5. Show diffs
echo "=== js/utils.js diff ==="
diff -u js/utils.js.bak js/utils.js || true

echo "=== styles.css diff ==="
diff -u styles.css.bak styles.css || true

# 6. Clean up backups
rm js/utils.js.bak styles.css.bak
```

---

### 🎨 Color Scheme

The new gradient creates a visual spectrum from hot to cool:
- 🔴 **High**: `#ff6b5a` (red)
- 🟠 **Medium-high**: `#ff8c42` (orange-red)
- 🟡 **Medium**: `#ffa94d` (orange)
- 🟨 **Medium-low**: `#ffc078` (light orange/yellow)
- 🔵 **Low**: `#8ecfff` (blue)

---

### 📝 Git Commit Message

```bash
git add js/utils.js styles.css
git commit -m "feat(styles): add distinct colors for medium-high and medium-low flame notes" \
  -m "Previously, all 'medium' variants (medium-high, medium, medium-low)" \
  -m "were detected as the same 'note-medium' class and displayed in orange." \
  -m "" \
  -m "Now detects 'medium-high' and 'medium-low' keywords first, before" \
  -m "falling back to generic 'medium', creating a visual gradient:" \
  -m "  🔴 high (#ff6b5a)" \
  -m "  🟠 medium-high (#ff8c42)" \
  -m "  🟡 medium (#ffa94d)" \
  -m "  🟨 medium-low (#ffc078)" \
  -m "  🔵 low (#8ecfff)" \
  -m "" \
  -m "Updated both keyword detection logic in utils.js and added new CSS" \
  -m "classes with high specificity to override default input color."
```

**One-liner version:**
```bash
git commit -m "feat(styles): distinct colors for medium-high/medium/medium-low flame notes with visual gradient"
```

### 🧪 Test It
1. Run the commands above.
2. Hard-refresh your browser (`Ctrl+Shift+R` or `Cmd+Shift+R`).
3. Edit the profile table and add these notes:
   - "medium-high flame"
   - "medium flame"
   - "medium-low flame"
4. You should see three distinct shades of orange, creating a smooth visual gradient that intuitively represents decreasing heat intensity.