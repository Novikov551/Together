# Together

Group video calls with screen sharing, chat, and device settings.

## Architecture

![Architecture](./architecture.png)

### How the connection works

```
User (Browser)
       │
       │  1. HTTPS: login/password
       ▼
    Nginx (SSL, reverse proxy)
       │
       ├──→ Frontend (React SPA) — serves static files
       │
       ├──→ Backend (.NET API)
       │       │
       │       │  2. Validates login/password
       │       │  3. Returns JWT session token
       │       │
       │       │  4. Accepts JWT + display name + room
       │       │  5. Generates LiveKit Access Token
       │       ▼
       │    LiveKit Server (WebRTC SFU)
       │       │
       │       │  6. WebSocket: join room
       │       │  7. WebRTC: video, audio, screen
       │       │  8. Data Channel: text chat
       │       ▼
       └──→ /rtc → LiveKit (proxies WebSocket)
```

### Components

**Frontend** — React + Vite SPA with three screens:
- **Login** — enter login and password, get JWT token
- **Lobby** — choose name, room, avatar, configure microphone/camera/speakers, test microphone
- **Call** — video call: participant grid, mic/camera/screen controls, chat, quality settings

**Backend** — ASP.NET Core 9:
- `POST /api/authorization/login` — authentication, returns JWT
- `POST /api/authorization/token` — generates LiveKit Access Token (requires JWT)
- JWT authentication, Swagger, Serilog, Health Checks

**LiveKit** — Open-source WebRTC SFU (Selective Forwarding Unit):
- Does not transcode media, forwards between participants
- Adaptive bitrate, simulcast (multiple quality layers)
- Rooms, participant management, Data Channel for chat

### Stack

| Layer | Technologies |
|-------|-------------|
| Frontend | React, Vite, livekit-client |
| Backend | .NET 9, ASP.NET Core, JWT, Serilog |
| Media | LiveKit Server (WebRTC SFU) |
| Proxy | Nginx (SSL termination, reverse proxy) |
| Deployment | Docker, Docker Compose |

## Secrets Configuration

Before running, create two files with secrets:

### 1. `backend/Together/appsettings.Development.json`

```json
{
  "LiveKit": {
    "ApiKey": "your-api-key",
    "ApiSecret": "your-api-secret"
  },
  "Jwt": {
    "Secret": "your-secret-at-least-32-chars"
  },
  "AdminProfile": {
    "user_name": "username",
    "password": "password"
  }
}
```

### 2. `livekit/livekit.yaml`

Copy `livekit/livekit.yaml.example` and fill in real values:

```yaml
keys:
  your-api-key: your-api-secret
```

## Server Deployment

```bash
# Build and push images
./deploy.sh

# On the server:
cd /opt/together
docker compose -f docker-compose.server.yml pull
docker compose -f docker-compose.server.yml up -d
```

For HTTPS you need SSL certificates (e.g. via Let's Encrypt) and set the paths in `docker-compose.server.yml`.