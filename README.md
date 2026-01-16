# 📡 EchoMap - Realtime Point Cloud Visualizer

> **A premium, web-based dashboard for visualizing environmental scans from ESP32, LiDAR, and Ultrasonic sensors.**


EchoMap is a full-stack tool aimed at makers and roboticists. It receives distance data wirelessly via WebSockets and renders a live, interactive 3D point cloud of your environment.

## ✨ Features
- **Real-Time Visualization**: Instant 3D rendering of incoming sensor data using **Three.js**.
- **Dual Sensor Modes**:
  - **Polar**: Perfect for spinning LIDARs or Servo + Ultrasonic setups (Angle + Distance).
  - **Cartesian**: For advanced setups sending raw X, Y, Z coordinates.
- **Save & Replay**:
  - **Cloud Save**: Persist scans to the server (`.json`).
  - **Export**: Download point clouds as `.PLY` files for MeshLab/Blender.
  - **Gallery**: Browse and reload past scans instantly.
- **WebSocket Relay**: Broadcasts sensor data to multiple connected clients simultaneously.
- **Glassmorphism UI**: A sleek, dark-themed interface designed for optimal readability.

---

## 🚀 Getting Started

### Prerequisites
- [Node.js](https://nodejs.org/) (v14 or higher)
- An ESP32 or similar microcontroller with a distance sensor.

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/yourusername/echomap.git
   cd echomap
   ```

2. **Install Dependencies**
   ```bash
   npm install
   ```

3. **Start the Server**
   ```bash
   npm start
   ```

4. **Open the Dashboard**
   Navigate to `http://localhost:3000` in your browser.

---

## 🔌 Hardware Setup (ESP32)

Your ESP32 should act as a WebSocket Client connecting to this server, OR as a WebSocket Server that this dashboard connects to. The dashboard supports **both** (Use "Relay Mode" if connecting ESP32 to this server).

### Data Format
Send your data as a JSON string over the WebSocket connection.

**Option A: Polar (Servo + Ultrasonic/Lidar)**
```json
{
  "angle": 45.5,   // Degrees
  "distance": 120  // Centimeters/Millimeters
}
```

**Option B: Cartesian (XYZ)**
```json
{
  "x": 10.5,
  "y": 5.0,
  "z": -2.0
}
```

---

## 🌍 Public Hosting (Optional)
Want to share your scanner with friends? You can expose your local server using **Ngrok**:

1. Install [Ngrok](https://ngrok.com/).
2. Run: `ngrok http 3000`
3. Share the generated HTTPS URL!

---

## 🛠️ Tech Stack
- **Frontend**: HTML5, Vanilla CSS (Glassmorphism), JavaScript (ES Modules).
- **3D Engine**: [Three.js](https://threejs.org/).
- **Backend**: Node.js, Express.
- **Communication**: Native WebSockets (`ws` library).



