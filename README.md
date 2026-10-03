# Together

Групповые видеозвонки с демонстрацией экрана, чатом и настройками устройств.

## Архитектура

![Архитектура](./architecture.png)

## Компоненты

### Frontend (React + Vite)

Клиентское приложение. Работает в браузере или внутри десктопной обёртки. Отображает три экрана: логин, лобби, видеозвонок.

При запуске видеозвонка:
- Запрашивает у бэкенда LiveKit Access Token (с JWT авторизацией)
- Подключается к LiveKit Server через WebSocket с этим токеном
- LiveKit отдаёт и принимает медиапотоки (видео, аудио, демонстрация экрана)
- Текстовый чат идёт через Data Channel (встроенный канал данных в WebRTC)

### Backend (ASP.NET Core 9)

Серверная часть. Обрабатывает авторизацию, управляет комнатами, генерирует токены для подключения к LiveKit.

Взаимодействия:
- Получает от фронтенда логин/пароль → выдаёт JWT сессионный токен
- Получает JWT + имя + комнату → проверяет пароль комнаты (если приватная) → генерирует LiveKit Access Token и отдаёт фронтенду
- Создаёт и удаляет комнаты в LiveKit через серверный SDK
- Хранит пароли приватных комнат в памяти (ConcurrentDictionary)

### LiveKit Server (WebRTC SFU)

Медиасервер. Принимает и пересылает аудио/видео потоки между участниками. Не перекодирует — только пересылает (Selective Forwarding Unit).

Взаимодействия:
- Принимает WebSocket подключения от фронтенда (через прокси Nginx)
- Принимает API-запросы от бэкенда (создание комнат, получение участников, генерация токенов, удаление комнат)
- Управляет комнатами и участниками

### Nginx

Обратный прокси. Принимает все входящие запросы и распределяет по сервисам:
- `/` → Frontend (статические файлы React)
- `/api/` → Backend (.NET API)
- `/rtc` → LiveKit (проксирует WebSocket)

Также terminирует SSL (HTTPS).

### Desktop (WPF + WebView2)

Десктопная обёртка для Windows. Содержит встроенный браузер (Chromium через WebView2), который загружает фронтенд. Работает как обычное .exe приложение без адресной строки браузера.

## Стек

| Слой | Технологии |
|------|-----------|
| Frontend | React, Vite, livekit-client |
| Backend | .NET 9, ASP.NET Core, JWT, Serilog |
| Медиа | LiveKit Server (WebRTC SFU) |
| Прокси | Nginx (SSL, reverse proxy) |
| Десктоп | WPF + WebView2 (.NET 9) |
| Развёртывание | Docker, Docker Compose |

## API Endpoints

| Endpoint | Метод | Описание | Авторизация |
|----------|-------|----------|-------------|
| `/api/authorization/login` | POST | Логин, получение JWT | Нет |
| `/api/livekit/token` | POST | Получение LiveKit Access Token | JWT |
| `/api/rooms/all` | GET | Список комнат с участниками | JWT |
| `/api/rooms/{name}/participants` | GET | Участники комнаты | JWT |
| `/api/rooms` | POST | Создание комнаты | JWT |
| `/api/rooms/{name}` | DELETE | Удаление комнаты | JWT |
## Развёртывание на своём сервере

### Требования

- Docker и Docker Compose
- Домен с SSL-сертификатом (например Let's Encrypt)
- Порты: 443 (HTTPS), 7880 (LiveKit), 5163 (Backend)

### Шаги

1. Клонировать репозиторий:
```bash
git clone https://github.com/Novikov551/Together.git
cd Together
```

2. Создать конфигурационные файлы:

**`backend/Together/appsettings.Development.json`** — скопировать из примера и заполнить реальными значениями.

**`livekit/livekit.yaml`** — скопировать из `livekit/livekit.yaml.example` и заполнить ключами.

**`docker-compose.server.yml`** — скопировать из `docker-compose.server.yml.example` и заполнить:
- `LiveKitConfig__ApiKey` / `LiveKitConfig__ApiSecret` — ключи из livekit.yaml
- `LiveKitConfig__HttpUrl` — адрес LiveKit API (например `http://livekit:7880`)
- `LiveKit__WebSocketUrl` — WebSocket адрес LiveKit (например `ws://localhost:7880`)
- `Jwt__Secret` — секрет для JWT (минимум 32 символа)
- `AdminProfile__user_name` / `AdminProfile__password` — логин/пароль администратора
- Пути к SSL-сертификатам в секции frontend volumes

3. Собрать и запустить:
```bash
docker compose -f docker-compose.server.yml up -d --build
```

4. Приложение будет доступно по `https://ваш-домен:8443`.
