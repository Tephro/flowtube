// app.js - YouTube Stream Deck Plugin (standalone, no SDK dependency)
const { WebSocketServer, WebSocket } = require('ws');

const WS_PORT = 8765;

// Parse Stream Deck connection args
const args = process.argv.slice(2);
const getArg = (name) => {
  const i = args.indexOf(name);
  return i !== -1 ? args[i + 1] : null;
};

const sdPort = getArg('-port');
const pluginUUID = getArg('-pluginUUID');
const registerEvent = getArg('-registerEvent');

// --- State ---
const actionContexts = {}; // uuid -> Set of contexts
let youtubeState = null;
let extensionSocket = null;
let sdSocket = null;

// --- WebSocket Server for Firefox Extension ---
const wss = new WebSocketServer({ port: WS_PORT });
console.log(`[Plugin] WebSocket server listening on port ${WS_PORT}`);

wss.on('connection', (socket) => {
  console.log('[Plugin] Firefox extension connected');
  extensionSocket = socket;

  socket.on('message', (raw) => {
    try {
      const msg = JSON.parse(raw);
      if (msg.type === 'STATE_UPDATE' && msg.state) {
        youtubeState = msg.state;
        updateAllKeys();
      } else if (msg.type === 'EXTENSION_READY') {
        sendToExtension({ type: 'GET_STATE' });
      }
    } catch (e) {
      console.error('[Plugin] Parse error:', e.message);
    }
  });

  socket.on('close', () => {
    console.log('[Plugin] Extension disconnected');
    extensionSocket = null;
  });
});

function sendToExtension(data) {
  if (extensionSocket && extensionSocket.readyState === WebSocket.OPEN) {
    extensionSocket.send(JSON.stringify(data));
  }
}

// --- Stream Deck WebSocket Connection ---
function connectToStreamDeck() {
  if (!sdPort) {
    console.log('[Plugin] No Stream Deck port provided, running in standalone mode');
    return;
  }

  sdSocket = new WebSocket(`ws://127.0.0.1:${sdPort}`);

  sdSocket.onopen = () => {
    console.log('[Plugin] Connected to Stream Deck');
    sdSocket.send(JSON.stringify({ event: registerEvent, uuid: pluginUUID }));
  };

  sdSocket.onmessage = (event) => {
    try {
      const msg = JSON.parse(event.data);
      handleStreamDeckEvent(msg);
    } catch (e) {
      console.error('[Plugin] SD parse error:', e.message);
    }
  };

  sdSocket.onclose = () => {
    console.log('[Plugin] Stream Deck disconnected');
    setTimeout(connectToStreamDeck, 3000);
  };
}

function sendToSD(data) {
  if (sdSocket && sdSocket.readyState === WebSocket.OPEN) {
    sdSocket.send(JSON.stringify(data));
  }
}

function setTitle(context, title) {
  sendToSD({ event: 'setTitle', context, payload: { title, target: 0 } });
}

function setState(context, state) {
  sendToSD({ event: 'setState', context, payload: { state } });
}

// --- Handle Stream Deck events ---
function handleStreamDeckEvent(msg) {
  const { event, action, context, payload } = msg;

  // Track contexts
  if (event === 'willAppear') {
    if (!actionContexts[action]) actionContexts[action] = new Set();
    actionContexts[action].add(context);
    sendToExtension({ type: 'GET_STATE' });
  } else if (event === 'willDisappear') {
    actionContexts[action]?.delete(context);
  }

  // Handle key presses
  if (event === 'keyUp') {
    const settings = payload?.settings || {};
    switch (action) {
      case 'com.youtube.controller.playpause':
        sendToExtension({ type: 'COMMAND', command: { action: 'playpause' } });
        break;
      case 'com.youtube.controller.skipforward':
        sendToExtension({ type: 'COMMAND', command: { action: 'skipforward', seconds: settings.seconds || 10 } });
        break;
      case 'com.youtube.controller.skipback':
        sendToExtension({ type: 'COMMAND', command: { action: 'skipback', seconds: settings.seconds || 10 } });
        break;
      case 'com.youtube.controller.volumeup':
        sendToExtension({ type: 'COMMAND', command: { action: 'volumeup', step: settings.step || 0.1 } });
        break;
      case 'com.youtube.controller.volumedown':
        sendToExtension({ type: 'COMMAND', command: { action: 'volumedown', step: settings.step || 0.1 } });
        break;
    }
  }
}

// --- Update all Stream Deck key displays ---
function updateAllKeys() {
  if (!youtubeState) return;
  const { title, paused, volume } = youtubeState;

  for (const ctx of actionContexts['com.youtube.controller.playpause'] || []) {
    setState(ctx, paused ? 0 : 1);
    setTitle(ctx, paused ? '▶' : '⏸');
  }

  const shortTitle = title ? title.substring(0, 12) + (title.length > 12 ? '…' : '') : '';
  for (const ctx of actionContexts['com.youtube.controller.skipforward'] || []) {
    setTitle(ctx, shortTitle);
  }

  for (const ctx of actionContexts['com.youtube.controller.volumeup'] || []) {
    setTitle(ctx, `▲ ${volume}%`);
  }
  for (const ctx of actionContexts['com.youtube.controller.volumedown'] || []) {
    setTitle(ctx, `▼ ${volume}%`);
  }
}

connectToStreamDeck();
