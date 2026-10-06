---
name: together
description: Работа над проектом Together — групповые видеозвонки на LiveKit. Загружай при работе над Together, при запросах «продолжаем Together», «что по Together», при изменении файлов в backend/, frontend/, livekit/, Together.Desktop/. Определяет архитектуру, конвенции, known pitfalls и deployment workflow.
---

# Together — рабочий цикл

## Архитектура

- **Backend**: ASP.NET Core 9, Clean Architecture (Together / Together.Logic / Together.Integrations)
- **Frontend**: React 19 + Vite + livekit-client
- **LiveKit**: WebRTC SFU, media server
- **Desktop**: WPF + WebView2
- **Deploy**: Docker Compose + Nginx + Let's Encrypt

## Конвенции

### Backend (.NET)
- Minimal API controllers с `[SwaggerTag]`, `[SwaggerOperation]`
- WebApiAdapter между Controller и Service
- Converter — extension-методы `dto.ToResponse()`
- Request models — `[JsonPropertyName("snake_case")]`
- JSON serialization — `snake_case_lower`
- `CancellationToken ct = default` везде
- Комментарии и логи на русском

### Frontend (React)
- Hooks: `useRoom`, `useDevices`, `useSettings`
- API клиент: `services/api.js` (fetch, Bearer token)
- Sounds: `services/sounds.js`
- Screens: login → lobby → call (state machine в App.jsx)
- Settings в localStorage через `useSettings`

### Конфигурация
- Секреты через environment variables (НЕ в коде)
- `appsettings.json` — только шаблоны с placeholder
- `livekit.yaml.example` — шаблон
- `docker-compose.server.yml.example` — шаблон

## Known Pitfalls

- **Пароли in-memory** — рестарт бэкенда = потеря паролей (см. `docs/Problems_and_bugs.md` BUG-1)
- **Generic exceptions** — `LiveKitService` кидает `new Exception` (BUG-2)
- **No rate limiting** — login endpoint (BUG-4)
- **CORS AllowAll** — в продакшене (BUG-5)
- **Hardcoded URL** — в десктопном клиенте (BUG-6)

## Развёртывание

```bash
# Сборка + пуш
./deploy.sh [tag]

# На сервере
docker compose -f docker-compose.server.yml pull
docker compose -f docker-compose.server.yml up -d
```

LiveKit: `network_mode: host` обязателен для WebRTC UDP портов.

## Тестирование

### Backend (xUnit, 41 тест)
```bash
cd backend && dotnet test Together.Tests/Together.Tests.csproj
```
- `TogetherTestFactory` — WebApplicationFactory с FakeLiveKitService
- Unit: RoomService (CRUD, пароли, edge cases)
- Integration: Authorization, Rooms, LiveKit endpoints

### Frontend (Vitest, 25 тестов)
```bash
cd frontend && npm test
```
- api.js (HTTP клиент), Login (компонент), useSettings (хук), sounds

## Проверки перед коммитом

```bash
# Backend: проверка сборки + тесты
cd backend && dotnet build Together.sln && dotnet test Together.Tests/Together.Tests.csproj

# Frontend: проверка сборки + тесты
cd frontend && npm run build && npm test
```