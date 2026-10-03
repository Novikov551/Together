# Together

Групповые видеозвонки с демонстрацией экрана, чатом и настройками устройств. Работает в браузере и как десктопное приложение (Windows).

## Архитектура

![Архитектура](./architecture.png)

### Как работает приложение

```
Пользователь (браузер / десктопное приложение)
       │
       │  1. Вводит логин и пароль
       ▼
    Nginx (SSL, reverse proxy)
       │
       ├──→ Frontend (React SPA)
       │       • Отдаёт HTML/CSS/JS
       │
       ├──→ Backend (.NET API)
       │       │
       │       │  2. POST /api/authorization/login
       │       │     Проверяет логин/пароль (constant-time)
       │       │     Возвращает JWT сессионный токен (1 час)
       │       │
       │       │  3. GET /api/rooms/all
       │       │     Возвращает список активных комнат с участниками
       │       │     (требует JWT)
       │       │
       │       │  4. POST /api/livekit/token
       │       │     Проверяет пароль комнаты (если приватная)
       │       │     Генерирует LiveKit Access Token
       │       │     Возвращает токен + WebSocket URL
       │       │
       │       │  5. POST /api/rooms
       │       │     Создаёт комнату в LiveKit
       │       │     Устанавливает пароль (если приватная)
       │       │
       │       │  6. DELETE /api/rooms/{name}
       │       │     Удаляет комнату если нет участников
       │       ▼
       │    LiveKit Server (WebRTC SFU)
       │       │
       │       │  7. WebSocket: подключение к комнате
       │       │  8. WebRTC: видео, аудио, демонстрация экрана
       │       │  9. Data Channel: текстовый чат
       │       ▼
       └──→ /rtc → LiveKit (проксирует WebSocket)
```

### Сценарий использования

1. **Логин** — пользователь вводит логин/пароль, получает JWT токен. Можно включить "Запомнить меня" (хранится в localStorage).

2. **Лобби** — после логина:
   - Слева — форма входа: имя, комната, аватар, переключатель приватная/публичная
   - Справа — список активных комнат с участниками, поиск, пагинация
   - Можно создать комнату через форму (с паролем или без)
   - Можно подключиться к существующей комнате из списка

3. **Подключение** — при нажатии "Подключиться":
   - Если комната приватная → модалка с вводом пароля
   - Фронтенд отправляет `POST /api/livekit/token` с JWT + имя + комната + пароль
   - Бэкенд проверяет пароль, генерирует LiveKit Access Token
   - Фронтенд подключается к LiveKit через WebSocket с этим токеном

4. **Видеозвонок** — после подключения:
   - Видеосетка (Discord-стиль: клик на тайл → фокус, остальные в sidebar)
   - Управление: микрофон, камера, демонстрация экрана
   - Качество камеры/демонстрации настраивается отдельно
   - Чат через Data Channel
   - ПКМ на участнике → настройки громкости
   - При выходе → комната удаляется если участников нет

### API Endpoints

| Endpoint | Метод | Описание | Авторизация |
|----------|-------|----------|-------------|
| `/api/authorization/login` | POST | Логин, получение JWT | Нет |
| `/api/livekit/token` | POST | Получение LiveKit Access Token | JWT |
| `/api/rooms/all` | GET | Список комнат с участниками | JWT |
| `/api/rooms/{name}/participants` | GET | Участники комнаты | JWT |
| `/api/rooms` | POST | Создание комнаты | JWT |
| `/api/rooms/{name}` | DELETE | Удаление комнаты | JWT |

## Стек

| Слой | Технологии |
|------|-----------|
| Frontend | React, Vite, livekit-client |
| Backend | .NET 9, ASP.NET Core, JWT, Serilog |
| Медиа | LiveKit Server (WebRTC SFU) |
| Прокси | Nginx (SSL, reverse proxy) |
| Десктоп | WPF + WebView2 (.NET 9) |
| Развёртывание | Docker, Docker Compose |

## Десктопное приложение

Обёртка на WPF + WebView2. Загружает фронтенд из WebView2 (тот же Chromium, что в Edge).

**Особенности:**
- Кастомный тайтлбар без стандартной рамки Windows
- Кнопки: свернуть, развернуть, закрыть
- Системный трей (иконка, контекстное меню "Открыть" / "Выход")
- Внешние ссылки открываются в браузере
- Recovery при краше Chromium-процесса
- Портативный .exe (~170 MB, включает .NET Runtime)

**Сборка:**
```powershell
cd Together.Desktop/Together.Desktop
dotnet publish -c Release -r win-x64 --self-contained true /p:PublishSingleFile=true /p:IncludeNativeLibrariesForSelfExtract=true
```

**Установщик (Inno Setup):**
```
Together.Desktop/installer.iss → Build → Compile
```
Результат: `Together.Desktop/installer/TogetherSetup.exe`

## Настройка секретов

### `backend/Together/appsettings.Development.json`

```json
{
  "LiveKitConfig": {
    "ApiKey": "your-api-key",
    "ApiSecret": "your-api-secret",
    "WebSocketUrl": "ws://localhost:7880",
    "HttpUrl": "http://livekit:7880"
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

### `livekit/livekit.yaml`

Скопировать `livekit/livekit.yaml.example` и заполнить реальными ключами.

## Развёртывание

```bash
# Собрать и запушить образы
./deploy.sh

# На сервере:
cd /opt/together
docker compose -f docker-compose.server.yml pull
docker compose -f docker-compose.server.yml up -d
```

Для HTTPS нужны SSL-сертификаты (например Let's Encrypt) и пути в `docker-compose.server.yml`.

## Структура проекта

```
Together/
├── backend/
│   ├── Together/                    # API слой (контроллеры, middleware)
│   │   ├── Endpoints/
│   │   │   ├── Authorization/       # Логин, JWT
│   │   │   ├── LiveKit/             # Выдача токенов LiveKit
│   │   │   └── Rooms/               # CRUD комнат
│   │   ├── Extensions/              # DI, pipeline, Swagger
│   │   └── Logging/                 # Request body logging
│   ├── Together.Logic/              # Бизнес-логика
│   │   ├── Rooms/                   # RoomService, IRoomService
│   │   └── Models/                  # DTO
│   └── Together.Integrations/       # Внешние сервисы
│       └── LiveKit/                 # ILiveKitService, LiveKitService
├── frontend/
│   └── src/
│       ├── components/
│       │   ├── Login/               # Экран логина
│       │   ├── Lobby/               # Лобби, список комнат, модалка
│       │   ├── Call/                # Видеозвонок
│       │   ├── VideoGrid/           # Сетка участников
│       │   ├── Controls/            # Панель управления
│       │   └── Chat/                # Чат
│       ├── hooks/                   # useRoom, useDevices, useSettings
│       └── services/                # api.js, sounds.js
├── Together.Desktop/                # WPF + WebView2 обёртка
│   └── Together.Desktop/
│       ├── MainWindow.xaml           # UI (кастомный тайтлбар)
│       ├── MainWindow.xaml.cs        # WebView2, трей, lifecycle
│       └── installer.iss             # Inno Setup скрипт
├── livekit/
│   └── livekit.yaml.example         # Конфиг LiveKit
├── docker-compose.yml               # Локальная разработка
├── docker-compose.server.yml        # Продакшен
└── deploy.sh                        # Сборка и пуш образов
```