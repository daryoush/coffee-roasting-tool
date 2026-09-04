# coffee-roasting-tool
# coffee-roasting-tool

 The easiest way to run this on Android with full microphone access is to run a tiny local web server **on the phone itself**, then open `http://localhost:8000` in Chrome. Here are your options, from simplest to most robust:

---

### Option 1: Termux (Recommended — Free, No Ads)

**Termux** is a Linux terminal for Android. It lets you run Python's built-in server.

1. **Install Termux** from **F-Droid** (not the Play Store — the Play Store version is broken/outdated).
   - If you can't use F-Droid, search for "Termux" on GitHub and get the APK directly.

2. **Open Termux** and run:
   ```bash
   pkg update
   pkg install python -y
   ```

3. **Move your HTML file** into Termux's home folder:
   - In Termux: `mkdir -p ~/roast && cd ~/roast`
   - Transfer the file there. Easiest way: use Android's "Share" menu → send the file to Termux, or use a file manager that can write to `/data/data/com.termux/files/home/roast/`.

4. **Start the server**:
   ```bash
   cd ~/roast
   python -m http.server 8000
   ```
   You'll see: `Serving HTTP on 0.0.0.0 port 8000`.

5. **Open Chrome** on the same phone and go to:
   ```
   http://localhost:8000
   ```
   or
   ```
   http://127.0.0.1:8000
   ```

6. **Allow microphone** when Chrome asks.

> **Critical:** You must use `localhost` or `127.0.0.1`. If you use your Wi-Fi IP like `192.168.1.xxx`, Chrome will **block the microphone** because it treats that as insecure. `localhost` is treated as secure on Android Chrome.

---

### Option 2: Simple HTTP Server App (Easiest, No Commands)

If you don't want Termux, get a dedicated server app from the Play Store:

- **"Simple HTTP Server"** by Ice Cold Apps
- **"Web Server"** by Banana Studio
- **"KSWEB"** (has a free version)

Steps:
1. Install the app
2. Point it to the folder containing `roast_commander_v7.html`
3. Start the server (usually port 8080)
4. Open Chrome → `http://localhost:8080` or whatever port it gives you
5. Allow mic access

---

### Option 3: Acode Code Editor

**Acode** is a code editor for Android with a built-in preview server.

1. Install **Acode** from Play Store
2. Open the HTML file in Acode
3. Tap the **▶ Run** or **Preview** button — it opens an internal browser at `http://localhost`
4. This usually works for mic access too

---

### Why Not Just Open the File Directly?

If you open the HTML file directly from Downloads (`file:///storage/...`), **Chrome on Android will block the microphone**. The Web Speech API requires a "secure context," and `file://` URLs don't qualify on mobile. `http://localhost` does.

---

### Quick Test

Once your server is running, open Chrome and type exactly:
```
http://localhost:8000/roast_commander_v7.html
```

If you see the page load and the mic button turns red when tapped, you're good to go. The app will work exactly like on a desktop, including voice recognition and text-to-speech.

Want me to also make a version that works entirely offline without a server (using a Service Worker to fake a secure origin)? That would let you open it directly from Downloads, but it's more complex.
