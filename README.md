# Together

Group video calls with screen sharing, chat, and device settings.

## Architecture

![Architecture](./architecture.png)

## Components

### Frontend (React + Vite)

Client application. Runs in a browser or inside the desktop wrapper. Displays three screens: login, lobby, and video call.

When starting a video call:
- Requests a LiveKit Access Token from the backend (with JWT authorization)
- Connects to LiveKit Server via WebSocket using that token
- LiveKit delivers and receives media streams (video, audio, screen share)
- Text chat goes through Data Channel (built-in data channel in WebRTC)

### Backend (ASP.NET Core 9)

Server side. Handles authorization, manages rooms, generates tokens for connecting to LiveKit.

Interactions:
- Receives login/password from the frontend → issues a JWT session token
- Receives JWT + name + room → validates the room password (if private) → generates a LiveKit Access Token and returns it to the frontend
- Creates and deletes rooms in LiveKit via the server SDK
- Stores private room passwords in memory (ConcurrentDictionary)

### LiveKit Server (WebRTC SFU)

Media server. Receives and forwards audio/video streams between participants. Does not transcode — only forwards (Selective Forwarding Unit).

Interactions:
- Accepts WebSocket connections from the frontend (via Nginx proxy)
- Accepts API requests from the backend (room creation, participant listing, token generation, room deletion)
- Manages rooms and participants

### Nginx

Reverse proxy. Accepts all incoming requests and routes them to services:
- `/` → Frontend (static React files)
- `/api/` → Backend (.NET API)
- `/rtc` → LiveKit (proxies WebSocket)

Also handles SSL termination (HTTPS).

### Desktop (WPF + WebView2)

Desktop wrapper for Windows. Contains an embedded browser (Chromium via WebView2) that loads the frontend. Works as a regular .exe application without browser address bar.

## Stack

| Layer | Technologies |
|-------|-------------|
| Frontend | React, Vite, livekit-client |
| Backend | .NET 9, ASP.NET Core, JWT, Serilog |
| Media | LiveKit Server (WebRTC SFU) |
| Proxy | Nginx (SSL, reverse proxy) |
| Desktop | WPF + WebView2 (.NET 9) |
| Deployment | Docker, Docker Compose |

## API Endpoints

| Endpoint | Method | Description | Auth |
|----------|--------|-------------|------|
| `/api/authorization/login` | POST | Login, get JWT | No |
| `/api/livekit/token` | POST | Get LiveKit Access Token | JWT |
| `/api/rooms/all` | GET | List rooms with participants | JWT |
| `/api/rooms/{name}/participants` | GET | Room participants | JWT |
| `/api/rooms` | POST | Create room | JWT |
| `/api/rooms/{name}` | DELETE | Delete room | JWT |

## Deployment

### Requirements

- Docker and Docker Compose
- Domain with SSL certificate (e.g. Let's Encrypt)
- Ports: 443 (HTTPS), 7880 (LiveKit), 5163 (Backend)

### Steps

1. Clone the repository:
```bash
git clone https://github.com/Novikov551/Together.git
cd Together
```

2. Create configuration files:

**`backend/Together/appsettings.Development.json`** — copy from the example and fill in real values.

**`livekit/livekit.yaml`** — copy from `livekit/livekit.yaml.example` and fill in your keys.

**`docker-compose.server.yml`** — copy from `docker-compose.server.yml.example` and fill in:
- `LiveKitConfig__ApiKey` / `LiveKitConfig__ApiSecret` — keys from livekit.yaml
- `LiveKitConfig__HttpUrl` — LiveKit API address (e.g. `http://livekit:7880`)
- `LiveKit__WebSocketUrl` — LiveKit WebSocket address (e.g. `ws://localhost:7880`)
- `Jwt__Secret` — JWT secret (at least 32 characters)
- `AdminProfile__user_name` / `AdminProfile__password` — admin login/password
- SSL certificate paths in the frontend volumes section

3. Build and start:
```bash
docker compose -f docker-compose.server.yml up -d --build
```

4. The application will be available at `https://your-domain:8443`.