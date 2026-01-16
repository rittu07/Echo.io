# EchoMap - Cloud & Backend
**v2.0 - Full Stack Edition**

A persistent, real-time backend for the EchoMap scanner. This version enables multi-user viewing, cloud saving, and public sharing.

## 🚀 Setup & Installation

### 1. Install Node.js
You must have Node.js installed to run the backend.
[Download Node.js](https://nodejs.org/) (LTS version recommended).

### 2. Install Dependencies
Open a terminal in the `d:\point cloud` directory and run:

```bash
npm install
```

### 3. Run the Server
Start the backend server:
```bash
npm start
```

- The server will run at `http://localhost:3000`.
- The WebSocket stream is available at `ws://localhost:3000`.

## 🌐 How to "Publish to All People"
To share your local server with the world (without complex router port forwarding), use **Ngrok** or **Cloudflare Tunnel**.

### Option A: Using Ngrok (Easiest)
1.  [Download ngrok](https://ngrok.com/download) and sign up.
2.  Run this command in a new terminal:
    ```bash
    ngrok http 3000
    ```
3.  Ngrok will give you a public URL (e.g., `https://abcd-123.ngrok-free.app`). Send this link to anyone!
4.  **Important**: On the public site, users should connect to `wss://abcd-123.ngrok-free.app` (wss for secure WebSocket).

### Option B: Deploy to Render / Glitch
You can upload this code to a service like Render.com (Web Service mode) or Glitch.com.
- **Render**: Connect your GitHub repo. Set Build Command: `npm install`, Start Command: `npm start`.

## 📡 Updated Connection Guide
1.  **ESP32**:
    - If using **Relay Mode** (recommended), program your ESP32 to Connect as a Client to your computer's IP: `ws://YOUR_COMPUTER_IP:3000`.
    - If using **Direct Mode**, the ESP32 hosts the server, and you connect the web app to `ws://ESP32_IP/ws`.

2.  **Web Dashboard**:
    - By default, it connects to `ws://localhost:3000`.
    - Click "Save to Server" to persist your scans to the `scans/` folder.
    - Click "Gallery" to view past saved scans.

## 📂 Project Structure
- `server.js`: The backend (Express + WebSocket relay).
- `public/`: The frontend website (HTML/CSS/JS).
- `scans/`: Folder where JSON scans are saved.
