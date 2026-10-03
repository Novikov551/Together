# TODO / Заметки

## Security

- [ ] `FixedTimeEquals` не constant-time при разной длине строк — нужно хешировать перед сравнением или паддить
- [ ] CORS `AllowAnyOrigin()` — заменить на `WithOrigins(...)` когда будет известен фронтенд-домен
- [ ] `AdminProfile` — мутабельный POCO без валидации (пока не критично, используется только в login)

## Improvements

- [ ] Кастомные exception типы вместо `throw new Exception("...")` в LiveKitService
- [ ] `ILogger` вместо `Console.WriteLine` в `GetRoomParticipantsAsync`
- [ ] Rate limiting на login endpoint
- [ ] JWT refresh token mechanism