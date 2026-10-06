# AI Agent Guidelines for Together

## Project Overview

Together — приложение для групповых видеозвонков с демонстрацией экрана, текстовым чатом и настройками устройств. Построено на LiveKit (WebRTC SFU) с ASP.NET Core бэкендом, React-фронтендом и WPF-обёрткой для Windows.

Репозиторий: https://github.com/Novikov551/Together.git
Домен продакшена: `together-friends.duckdns.org:8443`

## Build & Run

### Локальная разработка (Docker)

```bash
# Поднять всё (LiveKit + Backend + Frontend)
docker compose up -d --build

# Проверить健康
curl http://localhost:5163/swagger
# Фронтенд: http://localhost:3000
```

### Бэкенд без Docker

```bash
cd backend
dotnet restore Together.sln
dotnet run --project Together/Together.csproj
# Swagger: http://localhost:5163/swagger
```

### Фронтенд без Docker

```bash
cd frontend
npm install
npm run dev
# Vite dev server: http://localhost:5173
```

### Сборка и деплой на сервер

```bash
# Собрать и запушить образы в Docker Hub (novikov551)
./deploy.sh [tag]

# На сервере:
cd /opt/together && docker compose pull && docker compose up -d
```

### Сборка десктопа (Windows)

Проект `Together.Desktop/` — WPF + WebView2, .NET 9. Собирается через Visual Studio или `dotnet build`. Инсталлятор — `installer.iss` (Inno Setup). Хардкодит URL `https://together-friends.duckdns.org:8443`.

## Architecture

### Структура проекта

```
Together/
├── backend/
│   ├── Together/                     — API-слой (ASP.NET Core 9)
│   │   ├── Endpoints/
│   │   │   ├── Authorization/        — Login → JWT
│   │   │   ├── LiveKit/              — Генерация LiveKit-токенов
│   │   │   └── Rooms/                — CRUD комнат + участники
│   │   │       ├── Adapters/         — RoomsWebApiAdapter
│   │   │       ├── Converters/       — DTO → Response
│   │   │       └── Models/           — Requests + Responses
│   │   ├── Extensions/               — DI, pipeline, Swagger
│   │   ├── Logging/                  — RequestBody logging middleware
│   │   └── Program.cs
│   ├── Together.Logic/               — Бизнес-логика
│   │   ├── Rooms/                    — RoomService, IRoomService
│   │   └── Models/                   — RoomInfoDto, RoomShortInfoDto
│   ├── Together.Integrations/        — Внешние интеграции
│   │   ├── LiveKit/                  — LiveKitService (SDK wrapper)
│   │   └── Config/                   — LiveKitConfig
│   └── Together.sln
├── frontend/                         — React 19 + Vite + livekit-client
│   ├── src/
│   │   ├── components/
│   │   │   ├── Login/                — Экран входа
│   │   │   ├── Lobby/                — Список комнат, создание, подключение
│   │   │   ├── Call/                 — Основной экран звонка
│   │   │   ├── Controls/             — Панель управления (микрофон, камера, экран)
│   │   │   ├── VideoGrid/            — Сетка видео-карточек
│   │   │   ├── Chat/                 — Текстовый чат (data channel)
│   │   │   ├── MicTest/              — Тест микрофона
│   │   │   └── Toast/                — Уведомления
│   │   ├── hooks/
│   │   │   ├── useRoom.js            — LiveKit Room, треки, чат, quality
│   │   │   ├── useDevices.js         — Перечисление устройств
│   │   │   └── useSettings.js        — localStorage настройки
│   │   └── services/
│   │       ├── api.js                — HTTP-клиент к бэкенду
│   │       └── sounds.js             — Звуковые эффекты
│   └── vite.config.js
├── livekit/                          — Конфиг LiveKit-сервера
│   └── livekit.yaml.example
├── Together.Desktop/                 — WPF + WebView2 (Windows)
├── docker-compose.yml                — Локальная разработка
├── docker-compose.server.yml         — Прод (с SSL, secrets, Nginx)
├── docker-compose.server.yml.example — Шаблон для сервера
└── deploy.sh                         — Сборка + пуш в Docker Hub
```

### Слои (Clean Architecture)

| Слой | Проект | Ответственность |
|------|--------|-----------------|
| API / Presentation | `Together` | Controllers, JWT auth, Swagger, pipeline, middleware |
| Business Logic | `Together.Logic` | RoomService (CRUD комнат, валидация паролей), DTO |
| Integrations | `Together.Integrations` | ILiveKitService — обёртка над LiveKit Server SDK |

Нет слоя Infrastructure и БД. Пароли комнат хранятся в `ConcurrentDictionary<string, string>` (SHA256-хеши) в памяти процесса. При рестарте бэкенда приватные комнаты теряют пароли (комната становится публичной).

### Data Flow

```
┌──────────┐    JWT login     ┌───────────┐    SDK API     ┌──────────────┐
│ Frontend │ ───────────────→ │  Backend   │ ─────────────→ │ LiveKit Srv  │
│ (React)  │ ←─ sessionToken ─│ (.NET 9)  │ ←─ room/part ──│  (WebRTC)    │
│          │                  │            │                │              │
│          │   token request  │            │  create/delete │              │
│          │ ───────────────→ │            │ ─────────────→ │              │
│          │ ←─ LK token +─── │            │                │              │
│          │    wsUrl          │            │                │              │
│          │                  └───────────┘                │              │
│          │                                               │              │
│          │═══════ WebSocket + WebRTC (media) ════════════│══════════════│
│          │                                               │              │
└──────────┘                                               └──────────────┘
```

1. **Login**: `POST /api/authorization/login` → проверка `AdminProfile` из конфига (constant-time compare) → JWT на 1 час
2. **Список комнат**: `GET /api/rooms/all` → RoomService → LiveKit SDK `ListRooms` → фильтрация пустых → ответ с флагом `is_private`
3. **Создание комнаты**: `POST /api/rooms` → LiveKit SDK `CreateRoom` + SHA256-хеш пароля в `ConcurrentDictionary`
4. **Подключение к звонку**: `POST /api/livekit/token` → валидация пароля → генерация `AccessToken` (LiveKit JWT) → фронтенд подключается к LiveKit по WebSocket
5. **Медиа**: фронтенд ↔ LiveKit Server (WebRTC SFU) — видео, аудио, скриншеринг
6. **Чат**: через LiveKit Data Channel (`publishData` / `dataReceived`)
7. **Выход**: фронтенд disconnect → `DELETE /api/rooms/{name}` (если участников 0)

### Endpoints

| Endpoint | Method | Описание | Auth | Controller |
|----------|--------|----------|------|------------|
| `/api/authorization/login` | POST | Вход, получение JWT | Нет | `AuthorizationController` |
| `/api/livekit/token` | POST | Получение LiveKit Access Token | JWT | `LiveKitController` |
| `/api/rooms/all` | GET | Список комнат с участниками | JWT | `RoomsController` |
| `/api/rooms/{room}/participants` | GET | Участники комнаты | JWT | `RoomsController` |
| `/api/rooms` | POST | Создание комнаты | JWT | `RoomsController` |
| `/api/rooms/{room}` | DELETE | Удаление комнаты (если пустая) | JWT | `RoomsController` |

### Endpoint Pattern

Controllers наследуют `BaseController`, используют `[Authorize]`, `[SwaggerTag]`, `[SwaggerOperation]`. WebApiAdapter слой между Controller и RoomService. Converter — extension-методы `dto.ToResponse()`.

```
Endpoints/{DomainArea}/
  ├── {Entity}Controller.cs
  ├── Adapters/          — WebApiAdapter (вызывает сервис, конвертирует)
  ├── Converters/        — Extension-методы DTO → Response
  └── Models/
      ├── Requests/      — [JsonPropertyName("snake_case")]
      └── Responses/     — [JsonPropertyName("snake_case")]
```

### Nginx (reverse proxy)

Все запросы через один домен с SSL:

| Путь | Upstream | Протокол |
|------|----------|----------|
| `/` | Frontend (static React build) | HTTP |
| `/api/` | Backend (.NET, port 5163) | HTTP |
| `/rtc` | LiveKit Server (port 7880) | WebSocket upgrade |

SSL termination — Let's Encrypt сертификаты, монтируются в контейнер через volumes.

### Docker Compose (сервер)

Три сервиса:
- `livekit` — `livekit/livekit-server`, `network_mode: host`, конфиг монтируется
- `backend` — `novikov551/together-backend`, порт 5163, env vars для секретов
- `frontend` — `novikov551/together-frontend`, порт 8443→443, SSL volumes

Backend зависит от LiveKit, Frontend зависит от Backend.

## Configuration

Все секреты через environment variables в `docker-compose.server.yml`:

| Variable | Описание | Где берётся |
|----------|----------|-------------|
| `LiveKitConfig__ApiKey` | LiveKit API Key | `livekit.yaml` → `keys` |
| `LiveKitConfig__ApiSecret` | LiveKit API Secret | `livekit.yaml` → `keys` |
| `LiveKitConfig__HttpUrl` | LiveKit HTTP API | `http://livekit:7880` или `http://host.docker.internal:7880` |
| `LiveKit__WebSocketUrl` | LiveKit WS URL для фронтенда | `ws://localhost:7880` |
| `Jwt__Secret` | JWT secret (минимум 32 символа) | Произвольная строка |
| `AdminProfile__user_name` | Логин администратора | Произвольная строка |
| `AdminProfile__password` | Пароль администратора | Произвольная строка |
| `ASPNETCORE_ENVIRONMENT` | Окружение | `Development` / `Production` |

## Stack

| Слой | Технологии |
|------|-----------|
| Frontend | React 19, Vite 7, livekit-client 2, CSS |
| Backend | .NET 9, ASP.NET Core, JWT (HMAC-SHA256), Serilog, Swagger |
| Media | LiveKit Server (WebRTC SFU) |
| Proxy | Nginx (SSL, reverse proxy, WebSocket) |
| Desktop | WPF + WebView2 (.NET 9), Inno Setup |
| Deploy | Docker, Docker Compose, Docker Hub (`novikov551/*`) |

## Key NuGet Packages

| Пакет | Назначение |
|-------|-----------|
| `Livekit.Server.Sdk.Dotnet` 1.2.3 | LiveKit Server SDK (rooms, participants, tokens) |
| `Microsoft.AspNetCore.Authentication.JwtBearer` | JWT bearer auth |
| `System.IdentityModel.Tokens.Jwt` | JWT генерация/валидация |
| `Serilog.*` | Структурированное логирование |
| `Swashbuckle.AspNetCore` | Swagger/OpenAPI |

## Key NPM Packages

| Пакет | Назначение |
|-------|-----------|
| `livekit-client` | WebRTC клиент для подключения к LiveKit |
| `react` 19 | UI-фреймворк |
| `vite` 7 | Сборщик |

## Known Limitations & Pitfalls

- **Пароли in-memory** — `ConcurrentDictionary` в `RoomService`. Рестарт бэкенда = потеря паролей. Комнаты из LiveKit сохраняются (empty_timeout: 60), но становятся публичными.
- **Один админ** — один профиль из конфига, нет регистрации, нет ролей.
- **Нет БД** — нет миграций, нет персистентности.
- **Generic exceptions** — `LiveKitService` кидает `new Exception("Ошибка LiveKit")` вместо кастомных (TODO в коде).
- **Console.WriteLine** — `LiveKitService.GetRoomParticipantsAsync` ловит все Exception и пишет в Console (TODO в коде).
- **Hardcoded URL** — десктопный клиент хардкодит `https://together-friends.duckdns.org:8443`.
- **DeleteRoom** — удаление комнаты происходит при выходе последнего участника (Call.jsx → `handleLeave`). Если сеть упала — комната остаётся (empty_timeout: 60 в livekit.yaml).
- **No rate limiting** — нет rate limiting на login endpoint.
- **CORS AllowAll** — в продакшене `AllowAnyOrigin()`.

## Testing

### Backend (xUnit)

```bash
cd backend
dotnet test Together.Tests/Together.Tests.csproj
```

Тестовый проект: `Together.Tests/`. 41 тест.

| Файл | Тип | Кол-во | Что покрывает |
|------|-----|--------|---------------|
| `Logic/RoomServiceTests.cs` | Unit | 21 | CRUD комнат, валидация паролей, edge cases |
| `Endpoints/AuthorizationTests.cs` | Integration | 4 | Login success/fail, JWT |
| `Endpoints/RoomsEndpointTests.cs` | Integration | 8 | Rooms CRUD через HTTP, auth |
| `Endpoints/LiveKitEndpointTests.cs` | Integration | 5 | Token generation, password validation |

**Архитектура тестов:**
- `TogetherTestFactory` — `WebApplicationFactory<Program>` с подменёнными зависимостями
- `FakeLiveKitService` — in-memory эмуляция LiveKit Server (rooms, participants)
- Тестовые credentials: `admin`/`admin` (через environment variables в фабрике)

### Frontend (Vitest)

```bash
cd frontend
npm test        # один прогон
npm run test:watch  # watch mode
```

4 файла, 25 тестов.

| Файл | Кол-во | Что покрывает |
|------|--------|---------------|
| `__tests__/api.test.js` | 12 | HTTP-клиент: login, rooms, livekit token, ошибки |
| `__tests__/Login.test.jsx` | 6 | Компонент Login: рендер, submit, ошибки, loading, localStorage |
| `__tests__/useSettings.test.js` | 6 | Хук useSettings: дефолты, update, localStorage, corrupted |
| `__tests__/sounds.test.js` | 1 | Звуковые функции не падают |

**Настройка:** Vitest + jsdom, `setupTests.js` с моками localStorage, AudioContext, React.

## Documentation

Подробная документация в `docs/`:

- `docs/Database/` — in-memory модель данных и LiveKit data model
- `docs/Process/` — бизнес-процессы: авторизация, создание комнаты, подключение к звонку
- `docs/Deployment/` — развёртывание: Docker, Nginx, SSL, сервер
- `docs/Problems_and_bugs.md` — реестр известных проблем
- `docs/Roadmap.md` — план развития