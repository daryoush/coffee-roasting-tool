You're absolutely right — I missed a critical bug in the fix. The issue is that `extractNumber()` has **two code paths**, and I only fixed one:

### 🐛 The Real Bug

```javascript
// PATH 1: Digit regex — returns IMMEDIATELY without range check! ❌
const m = t.match(/(\d{2,4})(?:\s*(?:degrees|degree|fahrenheit|f\b))?/);
if(m) return parseInt(m[1]);  // ← "500" returns 500 here, never validated

// PATH 2: Word parser — this is where I put the range check ✅
// ... (the 100-450 check I added)
```

So when speech recognition outputs **"500"** (as digits), it gets returned immediately by the regex path — completely bypassing the range validation. Only word-based inputs like "five hundred" go through the validated path.

---

### 🔧 The Correct Fix

Here are the corrected bash commands:

```bash
# 1. Show the problematic regex line
echo "=== Current regex path (no range check) ==="
grep -n "if(m) return parseInt" js/utils.js

# 2. Apply the fix: add range validation to the regex path
sed -i.bak \
  -e 's|if(m) return parseInt(m\[1\]);|if(m) { const n = parseInt(m[1]); if(n >= 100 \&\& n <= 450) return n; }|g' \
  js/utils.js

# 3. Verify the fix
echo "=== After fix ==="
grep -n "if(m) {" js/utils.js

# 4. Show the diff
diff -u js/utils.js.bak js/utils.js || true

# 5. Clean up
rm js/utils.js.bak
```

---

### 📝 Git Commit Message

```bash
git add js/utils.js
git commit -m "fix(speech): add range validation to digit regex path in extractNumber()" \
  -m "Previous fix only validated the word-number parser path (100-450 °F)," \
  -m "but the digit regex path returned immediately without validation." \
  -m "" \
  -m "This caused transcriptions like '500' to bypass range checks and be" \
  -m "logged as temperatures, while 'five hundred' correctly became observations." \
  -m "" \
  -m "Now both paths validate against the 100-450 °F range before returning."
```

**One-liner version:**
```bash
git commit -m "fix(speech): validate digit regex path against 100-450 °F range — both code paths now consistent"
```

---

### 🧪 Test Cases After This Fix

| Speech input | Regex path? | Word path? | Result |
|--------------|-------------|------------|--------|
| "500" | ✅ matched | — | ❌ **Now rejected** → observation |
| "five hundred" | — | ✅ matched | ❌ Rejected → observation |
| "450" | ✅ matched | — | ✅ Accepted → temperature |
| "four fifty" | — | ✅ matched | ✅ Accepted → temperature |
| "100" | ✅ matched | — | ✅ Accepted → temperature |
| "99" | ✅ matched | — | ❌ Rejected → observation |

Both paths now behave identically.