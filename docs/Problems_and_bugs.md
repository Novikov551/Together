# Проблемы и баги: реестр

Документ фиксирует известные баги и архитектурные проблемы. Для каждого пункта: суть, где в коде, статус, предлагаемое решение.

Легенда статуса: 🔴 открыт · 🟡 митигирован · ✅ исправлен · ⚪ низкий приоритет

---

## BUG-1 — Пароли комнат теряются при рестарте бэкенда ⚪

**Суть.** Пароли приватных комнат хранятся в `ConcurrentDictionary` в памяти процесса. При рестарте бэкенда все пароли теряются, приватные комнаты становятся публичными.

**Где.** `Together.Logic/Rooms/RoomService.cs` — поле `_rooms`.

**Воспроизведение.** Создать приватную комнату → перезапустить бэкенд → комната без пароля.

**Решение.** Варианты:
1. Redis для хранения паролей (adds dependency)
2. SQLite/BerkeleyDB embedded
3. Оставить как есть (документировать ограничение)

**Статус:** ⚪ низкий приоритет — для текущего использования (несколько друзей) рестарты редки.

---

## BUG-2 — Generic exceptions в LiveKitService 🔴

**Суть.** `LiveKitService` кидает `new Exception("Ошибка LiveKit")` вместо кастомных исключений. Ловит все `Exception` в `GetRoomParticipantsAsync` с `Console.WriteLine`.

**Где.** `Together.Integrations/LiveKit/LiveKitService.cs`:
- `GetRoomsAsync` — `throw new Exception("Ошибка LiveKit")`
- `GetRoomParticipantsAsync` — `catch(Exception ex) { Console.WriteLine(...) }`
- `CreateRoomAsync` — `throw new Exception("Ошибка LiveKit")`

**Воспроизведение.** Отключить LiveKit → вызвать любой endpoint комнат → generic exception в логах.

**Решение.**
1. Создать `LiveKitException` (наследуется от `Exception`)
2. Заменить `Console.WriteLine` на `ILogger`
3. Обрабатывать конкретные типы ошибок SDK

**Статус:** 🔴 открыт.

---

## BUG-3 — Утечка хешей в _rooms при сетевых сбоях ⚪

**Суть.** Если сеть упала у последнего участника, фронтенд не вызывает `DELETE /api/rooms/{name}`. LiveKit удалит комнату через `empty_timeout: 60`, но хеш в `_rooms` останется навсегда (до рестарта).

**Где.** `Together.Logic/Rooms/RoomService.cs` — `_rooms` не очищается автоматически.

**Воспроизведение.** Создать приватную комнату → подключиться → убить сеть → подождать 60 секунд → хеш остался.

**Решение.**
1. Периодическая очистка: сравнивать `_rooms` с LiveKit `ListRooms`
2. TTL на записи в `_rooms`
3. Оставить как есть (утечка мизерная)

**Статус:** ⚪ низкий приоритет.

---

## BUG-4 — Нет rate limiting на login 🔴

**Суть.** Endpoint `/api/authorization/login` не имеет rate limiting. Возможен brute-force пароля.

**Где.** `Together/Endpoints/Authorization/AuthorizationController.cs`.

**Решение.**
1. ASP.NET Core rate limiting middleware
2. Или Nginx `limit_req`

**Статус:** 🔴 открыт.

---

## BUG-5 — CORS AllowAll в продакшене 🟡

**Суть.** Политика CORS `AllowAnyOrigin()` + `AllowAnyMethod()` + `AllowAnyHeader()`.

**Где.** `Together/Extensions/WebApplicationBuilderExtensions.cs`.

**Решение.** Ограничить origins конкретным доменом в продакшене.

**Статус:** 🟡 митигирован — приложение работает, но не следуем best practice.

---

## BUG-6 — Hardcoded URL в десктопном клиенте ⚪

**Суть.** `MainWindow.xaml.cs` хардкодит `https://together-friends.duckdns.org:8443`.

**Где.** `Together.Desktop/Together.Desktop/MainWindow.xaml.cs`, строка `AppUrl`.

**Решение.** Вынести в конфиг (app.config, аргументы запуска, registry).

**Статус:** ⚪ низкий приоритет — проект для друзей, URL не меняется.

---

## BUG-7 — Жёсткая привязка к домену в nginx.conf 🟡

**Суть.** `nginx.conf` содержит `server_name together-friends.duckdns.org` — не портируем на другой домен без правки.

**Где.** `frontend/nginx.conf`.

**Решение.** Вынести `server_name` в environment variable (через `envsubst` в entrypoint).

**Статус:** 🟡 митигирован — редко деплоится на другой домен.