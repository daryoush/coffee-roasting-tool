You're absolutely right! I found the bug. The mic test generates random numbers from **100-499**, but `extractNumber()` only accepts numbers in the **100-450** range. So any number above 450 gets rejected and the test fails.

Here are the corrected bash commands:

```bash
# 1. Fix the mic test to generate numbers only in the valid 100-450 range
sed -i.bak 's/micTestNumbers.push(Math.floor(Math.random() \* 400) + 100);/micTestNumbers.push(Math.floor(Math.random() * 351) + 100);/' js/roast.js
rm js/roast.js.bak

# 2. Add better debugging to the mic test flow
sed -i.bak '/console.log.*SPEECH.*Raw transcript/a\
    if(micTestActive) console.log("[MIC TEST] Recognized:", clean, "-> extracted:", extractNumber(clean));' js/speech.js
rm js/speech.js.bak

# 3. Verify the fix
echo "=== Verification ==="
grep "micTestNumbers.push" js/roast.js
echo ""
echo "Range should be 100-450 (351 possible values: 100 to 450 inclusive)"
```

---

### 📝 Git Commit Message

```bash
git add js/roast.js js/speech.js
git commit -m "fix(mic-test): generate test numbers within valid 100-450°F range" \
  -m "- Mic test was generating numbers 100-499, but extractNumber() only accepts 100-450." \
  -m "- Numbers above 450 were rejected, causing the test to always fail." \
  -m "- Changed to generate numbers in 100-450 range (351 possible values)." \
  -m "- Added console logging to help debug mic test recognition."
```

**One-liner version:**
```bash
git commit -m "fix(mic-test): align test number range (100-450) with extractNumber() validation"
```

### 🧪 How to Test
1. Run the commands above.
2. Hard-refresh your browser (`Ctrl+Shift+R` or `Cmd+Shift+R`).
3. Open the browser console (F12) to see debug messages.
4. Accept a profile and click "Start Listening".
5. The system will ask you to say 3 numbers.
6. Say each number clearly. You should see in the console:
   ```
   [MIC TEST] Recognized: "two hundred thirty five" -> extracted: 235
   ```
7. After all 3 pass, you'll hear the success message and can say "Start" to begin the roast.

The fix ensures the test numbers are always within the range that `extractNumber()` will accept, so the test should now work reliably.