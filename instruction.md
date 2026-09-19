I see the issue now. When `extractNumber()` returns `null` (even though the number was recognized), the mic test just hangs without giving feedback. Also, the ±5°F tolerance is too strict for speech recognition. Let me fix this:

```bash
# 1. Update js/roast.js with better mic test handling
cat > /tmp/mic_test_fix.js << 'EOF'
// Mic test functions
function startMicTest(){
  micTestActive = true;
  micTestIndex = 0;
  micTestNumbers = [];
  for(let i = 0; i < 3; i++){
    micTestNumbers.push(Math.floor(Math.random() * 351) + 100); // 100-450
  }
  console.log('[MIC TEST] Target numbers:', micTestNumbers);
  document.getElementById('gasInstruction').textContent = '🎤 Mic Test: Say ' + micTestNumbers[0];
  document.getElementById('gasInstruction').className = 'instruction gas-ok';
  speak('Microphone test. Please say ' + micTestNumbers[0]);
}

function handleMicTestResult(recognizedNum, rawText){
  const targetNum = micTestNumbers[micTestIndex];
  const tolerance = 10; // Increased from 5 to 10 for better speech recognition tolerance
  
  console.log('[MIC TEST] Target:', targetNum, '| Recognized:', recognizedNum, '| Raw:', rawText);
  
  if(recognizedNum === null){
    // Number wasn't parsed - ask user to try again
    document.getElementById('gasInstruction').textContent = '❌ Could not parse. Say ' + targetNum + ' clearly';
    speak('Could not understand. Please say ' + targetNum + ' clearly');
    return;
  }
  
  if(Math.abs(recognizedNum - targetNum) <= tolerance){
    document.getElementById('lastHeard').textContent = '✅ ' + recognizedNum + '°F - Correct!';
    micTestIndex++;
    if(micTestIndex >= 3){
      micTestActive = false;
      micTestPassed = true;
      document.getElementById('gasInstruction').textContent = '✅ Mic test passed! Preheat pan and say "Start" when beans are dumped';
      speak('Microphone test passed. Preheat the pan and say start when the beans are dumped to the preheated pan');
    } else {
      document.getElementById('gasInstruction').textContent = '🎤 Mic Test: Say ' + micTestNumbers[micTestIndex];
      speak('Good. Now say ' + micTestNumbers[micTestIndex]);
    }
  } else {
    document.getElementById('lastHeard').textContent = '❌ Heard ' + recognizedNum + '°F but expected ' + targetNum + '°F';
    document.getElementById('gasInstruction').textContent = '❌ Try again. Say ' + targetNum;
    speak('That was ' + recognizedNum + '. Please say ' + targetNum + ' instead');
  }
}
EOF

# Extract everything before the mic test functions and append the fixed version
head -n 180 js/roast.js > /tmp/roast_before.js
cat /tmp/roast_before.js /tmp/mic_test_fix.js > js/roast.js
rm /tmp/roast_before.js /tmp/mic_test_fix.js

# 2. Update js/speech.js to handle null results better
sed -i.bak '/if(micTestActive){/,/return; \/\/ Don.t process as temp\/obs during mic test/c\
    // Handle mic test\
    if(micTestActive){\
      const num = extractNumber(clean);\
      console.log("[MIC TEST] Recognized:", clean, "-> extracted:", num);\
      \
      if(e.results[e.results.length-1].isFinal || clean.length > 0){\
        handleMicTestResult(num, clean);\
        clearingBuffer = true;\
        try{ r.stop(); }catch(err){}\
        return;\
      }\
      \
      // For interim results, show what was heard\
      if(num !== null){\
        document.getElementById("lastHeard").textContent = clean + " -> heard: " + num + "°F";\
      }\
      return;\
    }' js/speech.js
rm js/speech.js.bak

# 3. Verify the changes
echo "=== Verification ==="
grep "tolerance = 10" js/roast.js
grep "handleMicTestResult" js/speech.js
```

---

### 📝 Git Commit Message

```bash
git add js/roast.js js/speech.js
git commit -m "fix(mic-test): improve number parsing and increase tolerance to ±10°F" \
  -m "- Increased tolerance from ±5°F to ±10°F for better speech recognition accuracy." \
  -m "- Added proper handling when extractNumber() returns null (unparseable input)." \
  -m "- Improved feedback: now tells user what was heard vs what was expected." \
  -m "- Added detailed console logging for debugging mic test issues." \
  -m "- Mic test now continues even if one attempt fails, asking user to retry."
```

**One-liner version:**
```bash
git commit -m "fix(mic-test): better error handling and ±10°F tolerance for speech recognition"
```

### 🧪 How to Test
1. Run the commands above.
2. Hard-refresh your browser (`Ctrl+Shift+R` or `Cmd+Shift+R`).
3. Open the browser console (F12) to see detailed debug messages.
4. Accept a profile and click "Start Listening".
5. The system will ask you to say 3 numbers.
6. Say each number clearly. You should see in the console:
   ```
   [MIC TEST] Target numbers: [235, 312, 178]
   [MIC TEST] Recognized: "two hundred thirty five" -> extracted: 235
   [MIC TEST] Target: 235 | Recognized: 235 | Raw: two hundred thirty five
   ```
7. If it still fails, the console will show exactly what was recognized and what was expected, making it easy to debug.

The key improvements:
- **±10°F tolerance** instead of ±5°F (speech recognition isn't perfect)
- **Better error messages** when numbers can't be parsed
- **Detailed logging** so you can see exactly what's happening
- **Continues on failure** instead of hanging