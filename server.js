const express = require('express');
const http = require('http');
const WebSocket = require('ws');
const path = require('path');
const fs = require('fs');
const cors = require('cors');

const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

const PORT = process.env.PORT || 3000;
const SCANS_DIR = path.join(__dirname, 'scans');

// Middleware
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.static(path.join(__dirname, 'public')));

// Ensure scans directory exists
if (!fs.existsSync(SCANS_DIR)) {
    fs.mkdirSync(SCANS_DIR);
}

// --- WebSocket Logic (Relay) ---
// We can have two types of clients:
// 1. Sources (ESP32) - Sending data
// 2. Viewers (Browsers) - Receiving data
// For simplicity, we broadcast everything received to all other connected clients.

wss.on('connection', (ws, req) => {
    console.log(`[WS] Client connected from ${req.socket.remoteAddress}`);

    ws.on('message', (message) => {
        // Broadcast incoming data (from ESP32 or simulated source) to all other clients
        wss.clients.forEach((client) => {
            if (client !== ws && client.readyState === WebSocket.OPEN) {
                client.send(message);
            }
        });
    });

    ws.on('close', () => {
        console.log('[WS] Client disconnected');
    });
});

// --- API Routes ---

// Get list of saved scans
app.get('/api/scans', (req, res) => {
    fs.readdir(SCANS_DIR, (err, files) => {
        if (err) {
            return res.status(500).json({ error: 'Failed to retrieve scans' });
        }
        const scans = files
            .filter(file => file.endsWith('.json') || file.endsWith('.ply'))
            .map(file => {
                const stats = fs.statSync(path.join(SCANS_DIR, file));
                return {
                    name: file,
                    size: stats.size,
                    date: stats.mtime
                };
            })
            .sort((a, b) => b.date - a.date); // Newest first
        res.json(scans);
    });
});

// Save a new scan
app.post('/api/scans', (req, res) => {
    const { filename, data } = req.body;

    if (!filename || !data) {
        return res.status(400).json({ error: 'Missing filename or data' });
    }

    // Sanitize filename
    const safeName = filename.replace(/[^a-z0-9\-_.]/gi, '_');
    const filePath = path.join(SCANS_DIR, safeName);

    fs.writeFile(filePath, JSON.stringify(data), (err) => {
        if (err) {
            console.error(err);
            return res.status(500).json({ error: 'Failed to save scan' });
        }
        console.log(`[Storage] Saved scan: ${safeName}`);
        res.json({ success: true, filename: safeName });
    });
});

// Load a specific scan
app.get('/api/scans/:filename', (req, res) => {
    const filePath = path.join(SCANS_DIR, req.params.filename);

    if (!fs.existsSync(filePath)) {
        return res.status(404).json({ error: 'Scan not found' });
    }

    res.sendFile(filePath);
});

// Start Server
server.listen(PORT, () => {
    console.log(`\n>>> EchoMap Server running on http://localhost:${PORT}`);
    console.log(`>>> WebSocket endpoint: ws://localhost:${PORT}`);
    console.log(`>>> Public URL (if using ngrok): Share the ngrok URL to publish!\n`);
});
