# Аудит проекта Together

## БАГИ

### 1. CreateRoomAsync падает при повторном вызове
SetPasswordAsync бросает Exception("Пароль уже задан") если комната уже существует. Фронтенд вызывает createRoom при каждом входе через форму. Если комната уже есть — 500.
**Фикс:** сделать CreateRoomAsync идемпотентным — если комната уже существует с паролем, молча пропускать установку пароля.

### 2. GetAllRoomsAsync возвращает мёртвые комнаты
LiveKit не удаляет комнаты когда все выходят. Без фильтрации пустых комнат список будет расти бесконечно.
**Фикс:** фильтровать по NumParticipants > 0 в RoomService.GetAllRoomsAsync (сделано). Настроить empty_timeout в livekit.yaml.

### 3. DeleteRoomAsync возвращает 200 даже если комната не удалена
Если в комнате есть участники — метод молча выходит, но контроллер возвращает Ok(). Фронтенд не может отличить "удалено" от "не удалено".
**Фикс:** возвращать NoContent (204) при удалении, Conflict (409) если есть участники.

### 4. GetRoomParticipantsAsync падает при несуществующей комнате
Если комната удалена из LiveKit но осталась в ответе GetAllRoomsAsync, вызов GetRoomInfoAsync бросит исключение → 500.
**Фикс:** обернуть в try-catch, возвращать пустой список участников.

### 5. LoginResponse.SessonToken — опечатка
SessonToken вместо SessionToken. JSON-имя правильное (session_token), но при использовании модели на бэкенде будет путаница.
**Фикс:** переименовать в SessionToken.

---

## УЯЗВИМОСТИ

### 6. UnsafeRelaxedJsonEscaping — XSS
JavaScriptEncoder.UnsafeRelaxedJsonEscaping позволяет внедрять <script> в JSON-ответы.
**Фикс:** удалить обе строки с UnsafeRelaxedJsonEscaping. Default encoder безопасен, кириллицу не ломает.

### 7. CORS AllowAll
policy.AllowAnyOrigin().AllowAnyMethod().AllowAnyHeader() — любой сайт может делать запросы от имени залогиненного пользователя.
**Фикс:** заменить на WithOrigins("https://together-friends.duckdns.org:8443") + AllowCredentials().

### 8. AdminProfile — пароль в plain text
Пароль администратора хранится в конфиге без хеширования.
**Фикс:** хранить хеш пароля, сравнивать через CryptographicOperations.FixedTimeEquals.

### 9. LoginAsync — timing attack
Прямое сравнение строк != вместо CryptographicOperations.FixedTimeEquals.
**Фикс:** использовать CryptographicOperations.FixedTimeEquals(Encoding.UTF8.GetBytes(request.Password), Encoding.UTF8.GetBytes(adminProfile["password"])).

### 10. Нет rate limiting на login
Брутфорс пароля без ограничений.
**Фикс:** добавить AspNetCoreRateLimit или простой in-memory throttler.

### 11. JWT токен живёт 1 час, нет refresh mechanism
После истечения пользователь должен логиниться заново.
**Фикс:** добавить refresh token endpoint.

---

## SOLID — НАРУШЕНИЯ

### 12. S — RoomService делает слишком много
Хранит пароли, управляет комнатами через LiveKit, валидирует пароли, удаляет комнаты с проверкой участников.
**Фикс:** разделить на RoomRepository (хранение), RoomManager (orchestration), PasswordService (валидация).

### 13. S — AuthorizationController смешивает два контекста
Логин/выдача JWT (аутентификация) и выдача LiveKit токена с проверкой пароля комнаты (авторизация).
**Фикс:** разнести по разным контроллерам.

### 14. O — LiveKitService не расширяем
Все методы конкретные, нет интерфейса. Нельзя подменить на мок для тестов.
**Фикс:** добавить ILiveKitService интерфейс.

### 15. D — RoomService зависит от конкретного LiveKitService
public RoomService(LiveKitService liveKitService) вместо зависимости от интерфейса.
**Фикс:** инжектить ILiveKitService.

### 16. D — AuthorizationController зависит от конкретного LiveKitService
Та же проблема.
**Фикс:** инжектить ILiveKitService.

### 17. L — наследование моделей ответов
RoomInfoResponse : RoomShortInfoResponse. Наследование для моделей данных — антипаттерн.
**Фикс:** использовать композицию вместо наследования.

---

## DRY — НАРУШЕНИЯ

### 18. Дублирование конфигурации сериализатора
AddJsonOptions и Configure<JsonOptions> оба задают одни и те же настройки.
**Фикс:** оставить одно место конфигурации.

### 19. Дублирование ct.ThrowIfCancellationRequested()
В каждом методе LiveKitService и RoomService вручную вызывается.
**Фикс:** вынести в middleware или interceptor.

### 20. Дублирование паттерна "вызов LiveKit → проверка null → throw Exception"
В GetRoomsAsync, GetRoomParticipantsAsync, CreateRoomAsync один и тот же код.
**Фикс:** вынести в общий метод-обёртку.

---

## KISS — НАРУШЕНИЯ

### 21. SemaphoreSlim в DeleteRoomAsync — избыточно
Для маленького приложения глобальный лок на удаление — overkill.
**Фикс:** убрать SemaphoreSlim, использовать простой try-catch.

### 22. Adapter-слой (RoomsWebApiAdapter) — лишний
Controller → Adapter → Service. Adapter просто делегирует вызовы без логики.
**Фикс:** убрать adapter, контроллер вызывает service напрямую.

### 23. Конвертеры (RoomsConverter) — лишние для простых маппингов
RoomShortInfoDto → RoomShortInfoResponse — два поля копируются.
**Фикс:** маппинг в сервисе или контроллере.

### 24. record с [SetsRequiredMembers] — сложность ради сложности
RoomShortInfoDto и RoomInfoDto используют record с [SetsRequiredMembers].
**Фикс:** заменить на простой class с конструктором.

---

## ООП — НАРУШЕНИЯ

### 25. Наследование DTO/Response моделей
RoomInfoDto : RoomShortInfoDto и RoomInfoResponse : RoomShortInfoResponse.
**Фикс:** использовать композицию.

### 26. AdminProfile — мутабельный POCO без валидации
public string UserName { get; set; } — нет инкапсуляции, нет валидации.
**Фикс:** добавить валидацию через DataAnnotations или FluentValidation.

### 27. LiveKitService — God object
Один сервис делает всё: комнаты, участники, токены, URL.
**Фикс:** разделить на RoomApiClient и TokenService.

---

## ИТОГО — ПРИОРИТЕТ

| # | Что | Серьёзность |
|---|-----|-------------|
| 1 | CreateRoomAsync падает при повторном вызове | Критично |
| 2 | Пустые комнаты в списке | Средне |
| 3 | DeleteRoom молча не удаляет | Средне |
| 4 | GetRoomParticipantsAsync падает при несуществующей комнате | Средне |
| 6 | XSS через UnsafeRelaxedJsonEscaping | Высокая |
| 7 | CORS AllowAll | Высокая |
| 8 | Пароль в plain text | Средне |
| 9 | Timing attack на login | Низкая |
| 10 | Нет rate limiting | Низкая |
| 12 | RoomService — нарушение SRP | Средне |
| 14 | Нет интерфейса у LiveKitService | Средне |
| 15 | RoomService зависит от конкретного класса | Средне |
| 18 | Дублирование конфигурации сериализатора | Низкая |
| 20 | Дублирование null-check в LiveKitService | Низкая |
| 22 | Adapter-слой без логики | Низкая |
| 25 | Наследование DTO | Низкая |
| 27 | LiveKitService — God object | Средне |