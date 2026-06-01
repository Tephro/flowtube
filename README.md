# DeckTube 🎬

> Control YouTube in Firefox directly from your Stream Deck.

![Version](https://img.shields.io/badge/version-1.0.0-7c3aed) ![Platform](https://img.shields.io/badge/platform-Windows-blue) ![License](https://img.shields.io/badge/license-MIT-green)

---

## What is DeckTube?

DeckTube is a Stream Deck plugin that lets you control YouTube playback in Firefox without touching your keyboard or mouse. Press a physical key to play, pause, skip, or adjust volume — and see the video title and volume level displayed right on your deck.

---

## Features

| Action | Key Display |
|--------|-------------|
| ▶ Play / Pause | Shows ▶ or ⏸ in real time |
| ⏩ Skip Forward | Shows current video title |
| ⏪ Skip Back | Configurable skip duration |
| 🔊 Volume Up | Shows live volume % |
| 🔉 Volume Down | Shows live volume % |

---

## Requirements

Before installing, make sure you have:

- **Windows 10 or later**
- **[Node.js](https://nodejs.org) v18+** — required to run the Stream Deck plugin
- **[Elgato Stream Deck software](https://www.elgato.com/downloads)** — v5.0 or later
- **Firefox** — any recent version

---

## Installation

### 1. Run the installer

Download and run `DeckTube-Setup-1.0.0.exe`. The wizard will:

- Copy the Stream Deck plugin to the correct folder
- Install all dependencies automatically
- Prepare the Firefox extension
- Register an uninstaller in Windows

### 2. Restart Stream Deck

Fully quit Stream Deck (right-click tray icon → Quit) and reopen it. The **YouTube Controller** category will appear in the action list.

### 3. Load the Firefox extension

1. Open Firefox and go to `about:debugging`
2. Click **This Firefox** → **Load Temporary Add-on...**
3. Navigate to `%APPDATA%\DeckTube\extension\` and select `manifest.json`

> For a permanent install that survives Firefox restarts, use the signed `.xpi` file from [addons.mozilla.org](https://addons.mozilla.org).

### 4. Add actions to your Stream Deck

Drag any of the **YouTube Controller** actions onto your keys and open a YouTube video in Firefox. Your keys will update automatically.

---

## How it works

```
Stream Deck Hardware
       │
Stream Deck Software
       │  launches
  app.js (Node.js)          ← Stream Deck Plugin
       │  WebSocket :8765
background.js               ← Firefox Extension
       │  browser.tabs API
content.js                  ← Injected into YouTube tab
       │  DOM API
   YouTube tab
```

The Stream Deck plugin hosts a WebSocket server on port `8765`. The Firefox extension connects to it and relays commands to whichever YouTube tab is active. State updates (title, volume, play/pause) are pushed back every 2 seconds and displayed on your keys.

---

## Troubleshooting

**Keys do nothing**
Make sure a YouTube video is open and playing in Firefox (not just the homepage), and that the extension is loaded in `about:debugging`.

**Extension keeps disconnecting**
The extension auto-reconnects every 3 seconds. If it never connects, check that Stream Deck software is running and the plugin loaded correctly.

**"No YouTube tab found"**
The plugin looks for tabs at `youtube.com/watch*`. Open a video — not just the YouTube homepage.

**Stream Deck doesn't show the YouTube category**
Make sure you fully quit and restarted Stream Deck after installation. Check that Node.js is installed with `node --version` in PowerShell.

---

## Uninstalling

Go to **Windows Settings → Apps** and search for **DeckTube**, or run:

```
%APPDATA%\DeckTube\uninstall.bat
```

This removes the Stream Deck plugin, extension files, and Windows registry entry.

---

## Building from source

```bash
# Install dependencies
cd decktube-installer
npm install

# Run in development
npm start

# Build installer .exe
npm run build
```

The built installer will appear at `dist/DeckTube-Setup-1.0.0.exe`.

---

## Project structure

```
decktube/
├── decktube-installer/     # Electron installer wizard
│   ├── src/
│   │   ├── main.js         # Install/uninstall logic
│   │   └── index.html      # Wizard UI
│   ├── assets/
│   │   └── icon.ico        # App icon
│   └── package.json
├── streamdeck-plugin/
│   └── com.youtube.controller.sdPlugin/
│       ├── app.js          # Plugin main process
│       ├── manifest.json   # Action definitions
│       └── package.json
└── firefox-extension/
    ├── manifest.json       # Extension manifest
    ├── background.js       # WebSocket bridge
    └── content.js          # YouTube tab controller
```

---

## License

MIT — do whatever you like with it.
