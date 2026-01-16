import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

// --- State Management ---
const state = {
    connected: false,
    socket: null,
    points: [], // Array to store point data {x, y, z}
    maxPoints: 50000,
    autoRotate: false,
    sensorMode: 'polar' // 'polar' or 'cartesian'
};

// --- DOM Elements ---
const dom = {
    connectBtn: document.getElementById('btn-connect'),
    urlInput: document.getElementById('ws-url'),
    statusText: document.getElementById('connection-status'),
    statusLed: document.getElementById('connection-led'),
    console: document.getElementById('console-output'),
    pointCount: document.getElementById('point-count'),
    lastPacket: document.getElementById('last-packet'),
    clearBtn: document.getElementById('btn-clear'),
    saveBtn: document.getElementById('btn-save'),
    rotateBtn: document.getElementById('btn-toggle-auto-rotate'),
    sensorType: document.getElementById('sensor-type'),
    signalCanvas: document.getElementById('signal-canvas')
};

// --- Three.js Setup ---
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x050508);
scene.fog = new THREE.FogExp2(0x050508, 0.02);

const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
camera.position.set(20, 20, 20);
camera.lookAt(0, 0, 0);

const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
renderer.setSize(window.innerWidth - 320, window.innerHeight); // Adjusted for sidebar
renderer.setPixelRatio(window.devicePixelRatio);
document.getElementById('canvas-container').appendChild(renderer.domElement);

const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.dampingFactor = 0.05;

// -- Grid & Helpers --
const gridHelper = new THREE.GridHelper(50, 50, 0x333333, 0x111111);
scene.add(gridHelper);

const axesHelper = new THREE.AxesHelper(5);
scene.add(axesHelper);

// -- Point Cloud Geometry --
const geometry = new THREE.BufferGeometry();
// Initialize with max points, but drawRange 0
const positions = new Float32Array(state.maxPoints * 3);
const colors = new Float32Array(state.maxPoints * 3);
geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
geometry.setDrawRange(0, 0);

const material = new THREE.PointsMaterial({
    size: 0.5,
    vertexColors: true,
    toneMapped: false
});

const pointCloud = new THREE.Points(geometry, material);
scene.add(pointCloud);

// --- WebSocket Logic ---
function connect(url) {
    if (state.connected) {
        state.socket.close();
        return;
    }

    log(`Connecting to ${url}...`, 'system');

    try {
        state.socket = new WebSocket(url);

        state.socket.onopen = () => {
            state.connected = true;
            updateUIState();
            log('WebSocket Connected.', 'system');
        };

        state.socket.onclose = () => {
            state.connected = false;
            updateUIState();
            log('WebSocket Disconnected.', 'error');
        };

        state.socket.onmessage = (event) => {
            handleData(event.data);
        };

        state.socket.onerror = (error) => {
            log('WebSocket Error', 'error');
            console.error(error);
        };

    } catch (e) {
        log('Connection Failed: ' + e.message, 'error');
    }
}

function handleData(data) {
    // Attempt to parse JSON
    // Expected formats: 
    // 1. JSON: {"angle": 45, "distance": 120} or {"x": 10, "y": 5, "z": 0}
    // 2. CSV: "45,120" or "10,5,0"

    try {
        let x, y, z;
        const mode = dom.sensorType.value;
        const timestamp = new Date().toLocaleTimeString();
        dom.lastPacket.innerText = timestamp;

        // Simple visualization effect on signal canvas
        pulseSignal();

        let parsed = null;
        if (data.startsWith('{')) {
            parsed = JSON.parse(data);
        } else {
            // Assume CSV
            const parts = data.split(',').map(Number);
            if (mode === 'polar' && parts.length >= 2) {
                parsed = { angle: parts[0], distance: parts[1] };
            } else if (mode === 'cartesian' && parts.length >= 2) {
                parsed = { x: parts[0], y: parts[1], z: parts[2] || 0 };
            }
        }

        if (!parsed) return;

        if (mode === 'polar') {
            // Convert Polar to Cartesian (assuming standard 2D LIDAR for now, extending to 3D if elevation provided)
            const angleRad = (parsed.angle * Math.PI) / 180;
            const dist = parsed.distance / 10; // Scale down for view (e.g. cm to logical units)
            x = Math.cos(angleRad) * dist;
            z = Math.sin(angleRad) * dist;
            y = parsed.elevation ? parsed.elevation : 0; // Default flat
        } else {
            x = parsed.x / 10;
            y = parsed.y / 10;
            z = parsed.z / 10;
        }

        addPoint(x, y, z);

    } catch (e) {
        log('Data Parse Error: ' + e.message, 'error');
    }
}

function addPoint(x, y, z) {
    const currentPoints = geometry.drawRange.count;
    if (currentPoints >= state.maxPoints) {
        // Optional: shift buffer or stop (for now we simply stop or wrap? Lets clear oldest? No, just cap for safety)
        // For infinite streaming, a ring buffer is better, but simpler here:
        return;
    }

    const i = currentPoints * 3;
    positions[i] = x;
    positions[i + 1] = y;
    positions[i + 2] = z;

    // Color gradient based on height (Y) or distance from center
    const dist = Math.sqrt(x * x + z * z);
    const color = new THREE.Color().setHSL(0.6 - (dist / 100), 1, 0.5);

    colors[i] = color.r;
    colors[i + 1] = color.g;
    colors[i + 2] = color.b;

    geometry.attributes.position.needsUpdate = true;
    geometry.attributes.color.needsUpdate = true;
    geometry.setDrawRange(0, currentPoints + 1);

    dom.pointCount.innerText = currentPoints + 1;
}

// --- UI Logic ---
function updateUIState() {
    if (state.connected) {
        dom.connectBtn.innerText = 'Disconnect';
        dom.connectBtn.style.background = '#ff3333';
        dom.statusText.innerText = 'Connected';
        dom.statusText.style.color = '#00ff88';
        dom.statusLed.className = 'led green';
    } else {
        dom.connectBtn.innerText = 'Connect';
        dom.connectBtn.style.background = '';
        dom.statusText.innerText = 'Disconnected';
        dom.statusText.style.color = '#8b9bb4';
        dom.statusLed.className = 'led';
    }
}

function log(msg, type = 'in') {
    const div = document.createElement('div');
    div.className = `log-line ${type}`;
    div.innerText = `> ${msg}`;
    dom.console.appendChild(div);
    dom.console.scrollTop = dom.console.scrollHeight;
}

function clearMap() {
    geometry.setDrawRange(0, 0);
    dom.pointCount.innerText = '0';
    // Clear buffer arrays (optional but good practice)
    positions.fill(0);
    colors.fill(0);
    geometry.attributes.position.needsUpdate = true;
    geometry.attributes.color.needsUpdate = true;
    log('Map cleared.', 'system');
}

function downloadPLY() {
    const count = geometry.drawRange.count;
    let data = `ply\nformat ascii 1.0\nelement vertex ${count}\nproperty float x\nproperty float y\nproperty float z\nproperty uchar red\nproperty uchar green\nproperty uchar blue\nend_header\n`;

    for (let i = 0; i < count; i++) {
        const idx = i * 3;
        const x = positions[idx];
        const y = positions[idx + 1];
        const z = positions[idx + 2];
        const r = Math.floor(colors[idx] * 255);
        const g = Math.floor(colors[idx + 1] * 255);
        const b = Math.floor(colors[idx + 2] * 255);
        data += `${x} ${y} ${z} ${r} ${g} ${b}\n`;
    }

    const blob = new Blob([data], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    a.download = `scan_${timestamp}.ply`;
    a.click();
    URL.revokeObjectURL(url);
    log('Exported PLY.', 'system');
}

async function saveToServer() {
    const count = geometry.drawRange.count;
    if (count === 0) {
        log('No points to save.', 'error');
        return;
    }

    log('Saving to server...', 'system');

    // Create point array
    const points = [];
    for (let i = 0; i < count; i++) {
        points.push({
            x: positions[i * 3],
            y: positions[i * 3 + 1],
            z: positions[i * 3 + 2]
            // Skipping color for JSON compactness, or add it if needed
        });
    }

    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = `scan_${timestamp}.json`;

    try {
        const res = await fetch('/api/scans', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ filename, data: points })
        });

        if (res.ok) {
            log('Saved to server successfully.', 'in');
            loadGallery(); // Refresh list
        } else {
            log('Server Error: ' + res.statusText, 'error');
        }
    } catch (e) {
        log('Save Failed: ' + e.message, 'error');
    }
}

async function loadGallery() {
    const list = document.getElementById('gallery-list');
    list.innerHTML = '<div class="gallery-item-empty">Loading...</div>';

    try {
        const res = await fetch('/api/scans');
        const files = await res.json();

        list.innerHTML = '';
        if (files.length === 0) {
            list.innerHTML = '<div class="gallery-item-empty">No scans found.</div>';
            return;
        }

        files.forEach(file => {
            const div = document.createElement('div');
            div.className = 'gallery-item';
            div.innerHTML = `
                <span class="name">${file.name}</span>
                <span class="date">${new Date(file.date).toLocaleTimeString()}</span>
            `;
            div.onclick = () => loadScan(file.name);
            list.appendChild(div);
        });
    } catch (e) {
        list.innerHTML = '<div class="gallery-item-empty">Error loading gallery</div>';
        log('Gallery Load Error: ' + e.message, 'error');
    }
}

async function loadScan(filename) {
    log(`Loading ${filename}...`, 'system');
    try {
        const res = await fetch(`/api/scans/${filename}`);
        const data = await res.json();

        // Clear current
        clearMap();

        // Populate
        let pointCount = 0;
        if (Array.isArray(data)) {
            // Assume JSON array of {x,y,z}
            data.forEach(p => {
                addPoint(p.x, p.y, p.z);
            });
            pointCount = data.length;
        }

        log(`Loaded ${pointCount} points.`, 'in');

    } catch (e) {
        log('Load Failed: ' + e.message, 'error');
    }
}

// --- Event Listeners ---
dom.connectBtn.addEventListener('click', () => {
    connect(dom.urlInput.value);
});

dom.clearBtn.addEventListener('click', clearMap);
dom.saveBtn.addEventListener('click', downloadPLY);

// New Listeners
document.getElementById('btn-snap-server').addEventListener('click', saveToServer);
document.getElementById('btn-refresh-gallery').addEventListener('click', loadGallery);

// Tab Switching
const tabLive = document.getElementById('tab-live');
const tabGallery = document.getElementById('tab-gallery');
const panelLive = document.getElementById('panel-live');
const panelGallery = document.getElementById('panel-gallery');

tabLive.addEventListener('click', () => {
    tabLive.classList.add('active');
    tabGallery.classList.remove('active');
    panelLive.style.display = 'block';
    panelGallery.style.display = 'none';
});

tabGallery.addEventListener('click', () => {
    tabGallery.classList.add('active');
    tabLive.classList.remove('active');
    panelGallery.style.display = 'block';
    panelLive.style.display = 'none';
    loadGallery();
});

dom.rotateBtn.addEventListener('click', () => {
    state.autoRotate = !state.autoRotate;
    controls.autoRotate = state.autoRotate;
    dom.rotateBtn.innerText = `Auto Rotate: ${state.autoRotate ? 'ON' : 'OFF'}`;
    dom.rotateBtn.style.color = state.autoRotate ? '#00f2ff' : '';
});

// Resize Handler
window.addEventListener('resize', () => {
    camera.aspect = (window.innerWidth - 320) / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth - 320, window.innerHeight);
});

// --- Animation Loop ---
function animate() {
    requestAnimationFrame(animate);
    controls.update();
    renderer.render(scene, camera);
}

// --- Signal Vis ---
const sigCtx = dom.signalCanvas.getContext('2d');
function pulseSignal() {
    sigCtx.fillStyle = 'rgba(0, 242, 255, 0.1)';
    sigCtx.fillRect(0, 0, 200, 40);
    sigCtx.fillStyle = '#00f2ff';
    const h = Math.random() * 20 + 5;
    sigCtx.fillRect(195, 20 - h / 2, 2, h);
    // Shift image left
    const imageData = sigCtx.getImageData(2, 0, 198, 40);
    sigCtx.putImageData(imageData, 0, 0);
}

// Start
animate();
log('Ready to connect.', 'system');
