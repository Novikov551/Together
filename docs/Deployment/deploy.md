# Развёртывание

## Архитектура деплоя

```
                    Internet
                       │
                       ▼
              ┌────────────────┐
              │   Nginx (:8443)│  SSL termination
              │   (frontend)   │  Let's Encrypt
              └───┬────┬────┬──┘
                  │    │    │
          /       │    │    \  /rtc (WebSocket)
         ▼        │    │     ▼
  ┌──────────┐    │    │  ┌──────────────┐
  │ Frontend │    │    │  │  LiveKit Srv │  port 7880
  │ (static) │    │    │  │  (WebRTC SFU)│  network_mode: host
  └──────────┘    │    │  └──────────────┘
                  │    │
            /api/ │    │
                  ▼    │
           ┌──────────┐│
           │ Backend  ││  port 5163
           │ (.NET 9) ││
           └──────────┘│
                       │
              ┌────────┘
              │  /api/livekit/*
              ▼
        LiveKit Server
```

## Требования

- Docker и Docker Compose
- Домен с SSL-сертификатом (Let's Encrypt)
- Порты: 443 (HTTPS), 7880 (LiveKit), 5163 (Backend)
- Минимальные ресурсы: 1 vCPU, 512 MB RAM (для 5-10 участников)

## Шаги развёртывания

### 1. Клонировать репозиторий

```bash
git clone https://github.com/Novikov551/Together.git
cd Together
```

### 2. Создать конфигурационные файлы

**`livekit/livekit.yaml`** — скопировать из `livekit.yaml.example`:

```yaml
port: 7880
bind_addresses: ["0.0.0.0"]
rtc:
  tcp_port: 7881
  port_range_start: 50000
  port_range_end: 51000
  use_external_ip: false
keys:
  your_api_key: your_api_secret
logging:
  level: info
room:
  empty_timeout: 60
turn:
  enabled: false
```

**`docker-compose.server.yml`** — скопировать из `.example` и заполнить:

| Variable | Пример | Откуда берётся |
|----------|--------|----------------|
| `LiveKitConfig__ApiKey` | `your_api_key` | `livekit.yaml` → `keys` |
| `LiveKitConfig__ApiSecret` | `your_api_secret` | `livekit.yaml` → `keys` |
| `LiveKitConfig__HttpUrl` | `http://host.docker.internal:7880` | Depends on network setup |
| `LiveKit__WebSocketUrl` | `ws://localhost:7880` | External URL for frontend |
| `Jwt__Secret` | `your-super-secret-jwt-key-min-32-chars` | Сгенерировать случайно |
| `AdminProfile__user_name` | `admin` | Произвольно |
| `AdminProfile__password` | `your-password` | Произвольно |
| SSL paths | `/etc/letsencrypt/live/domain/...` | Let's Encrypt |

### 3. Получить SSL-сертификат

```bash
# Установить certbot
sudo apt install certbot

# Получить сертификат
sudo certbot certonly --standalone -d your-domain.com

# Сертификаты будут в:
# /etc/letsencrypt/live/your-domain.com/fullchain.pem
# /etc/letsencrypt/live/your-domain.com/privkey.pem
```

### 4. Собрать и запустить

```bash
# Собрать образы локально и запушить в Docker Hub
./deploy.sh

# На сервере:
docker compose -f docker-compose.server.yml pull
docker compose -f docker-compose.server.yml up -d
```

### 5. Проверить

```bash
# Проверить контейнеры
docker compose -f docker-compose.server.yml ps

# Логи
docker compose -f docker-compose.server.yml logs -f backend
docker compose -f docker-compose.server.yml logs -f frontend

# Проверить API
curl -k https://your-domain:8443/swagger

# Проверить фронтенд
curl -k https://your-domain:8443/
```

## Docker Compose (сервер)

Три сервиса:

### livekit
- Образ: `livekit/livekit-server`
- `network_mode: host` (для WebRTC портов)
- Конфиг монтируется из `livekit/livekit.yaml`

### backend
- Образ: `novikov551/together-backend:latest`
- Порт: 5163
- Environment variables для всех секретов
- `extra_hosts: host.docker.internal:host-gateway`

### frontend
- Образ: `novikov551/together-frontend:latest`
- Порт: 8443 → 443 (Nginx с SSL)
- SSL-сертификаты монтируются из Let's Encrypt
- `extra_hosts: host.docker.internal:host-gateway`

## Dockerfiles

### Backend (multi-stage)

```
mcr.microsoft.com/dotnet/sdk:9.0     → build + publish
mcr.microsoft.com/dotnet/aspnet:9.0  → runtime
Exposes port 5163
```

### Frontend (multi-stage)

```
node:20-alpine  → npm ci + npm run build
nginx:alpine    → serve static from /usr/share/nginx/html
Exposes port 80
```

## Nginx (встроенный во frontend-контейнер)

```
server {
    listen 80 → redirect to HTTPS
    listen 443 ssl
    /api/ → proxy to backend:5163
    /rtc  → proxy to host.docker.internal:7880 (WebSocket upgrade)
    /     → static React files
}
```

## Обновление

```bash
# Локально: сборка + пуш
./deploy.sh

# На сервере: подтянуть и перезапустить
docker compose -f docker-compose.server.yml pull
docker compose -f docker-compose.server.yml up -d
```

## LiveKit Configuration

| Параметр | Значение | Описание |
|----------|---------|----------|
| `port` | 7880 | HTTP/WS API port |
| `tcp_port` | 7881 | TCP для WebRTC |
| `port_range_start/end` | 50000-51000 | UDP порты для media |
| `use_external_ip` | false | Использовать external IP (true если за NAT) |
| `empty_timeout` | 60 | Секунд до удаления пустой комнаты |
| `turn.enabled` | false | TURN-сервер (включить если за NAT) |

## Известные проблемы деплоя

- `network_mode: host` для LiveKit — обязательно для WebRTC UDP портов
- `host.docker.internal` — нужен `extra_hosts` на Linux (macOS работает из коробки)
- TURN сервер — нужен если клиенты за строгим NAT. Сейчас отключён.
- `use_external_ip: false` — поменять на `true` если сервер за NAT