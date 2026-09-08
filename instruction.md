I found the exact bug! It's a **CSS specificity issue**. 

In your `styles.css`, you have a rule that sets the color for *all* inputs in the profile table:
```css
.profile-table input { color: #e8e0d8; }
```
This rule has higher CSS specificity than the simple `.note-high` classes, so it completely overrides your color coding, forcing all note inputs to be the default light gray color (`#e8e0d8`).

### 🔧 The Fix

We need to make the note color classes more specific so they override the default input color. We'll do this by targeting `.profile-table input.note-*` and adding `!important` to guarantee it wins.

Run these bash commands in your project root:

```bash
# 1. Backup the current styles.css
cp styles.css styles.css.bak

# 2. Apply the fix: increase CSS specificity for note color classes
sed -i.bak \
  -e 's/\.note-high{color:#ff6b5a;font-weight:700;}/.profile-table input.note-high{color:#ff6b5a !important;font-weight:700;}/' \
  -e 's/\.note-medium{color:#ffa94d;font-weight:600;}/.profile-table input.note-medium{color:#ffa94d !important;font-weight:600;}/' \
  -e 's/\.note-low{color:#8ecfff;font-weight:600;}/.profile-table input.note-low{color:#8ecfff !important;font-weight:600;}/' \
  -e 's/\.note-hold{color:#8fdf8f;font-weight:600;}/.profile-table input.note-hold{color:#8fdf8f !important;font-weight:600;}/' \
  -e 's/\.note-charge{color:#d9955a;font-weight:700;}/.profile-table input.note-charge{color:#d9955a !important;font-weight:700;}/' \
  -e 's/\.note-default{color:#a09080;}/.profile-table input.note-default{color:#a09080 !important;}/' \
  styles.css

# 3. Verify the changes
echo "=== Updated CSS rules ==="
grep "note-" styles.css

# 4. Show the diff
diff -u styles.css.bak styles.css || true

# 5. Clean up backup
rm styles.css.bak
```

---

### 📝 Git Commit Message

```bash
git add styles.css
git commit -m "fix(styles): resolve CSS specificity conflict blocking note color coding" \
  -m "The generic '.profile-table input { color: #e8e0d8 }' rule was overriding" \
  -m "the simpler '.note-high', '.note-medium', etc. classes, causing all profile" \
  -m "notes to appear in the default light gray color." \
  -m "" \
  -m "Fixed by increasing specificity to '.profile-table input.note-*' and adding" \
  -m "!important to the color property, ensuring flame instruction keywords are" \
  -m "properly color-coded in the editable profile table."
```

**One-liner version:**
```bash
git commit -m "fix(styles): increase CSS specificity for note color classes to override default input color"
```

### 🧪 How to Verify
1. Run the commands above.
2. Hard-refresh your browser (`Ctrl+Shift+R` or `Cmd+Shift+R`).
3. Click **"↺ Load Default"**.
4. You should now see:
   - "Charge — high flame" in **amber/red**
   - "medium flame" in **orange**
   - "reduce to low" in **blue**
   - "hold temperature" in **green**