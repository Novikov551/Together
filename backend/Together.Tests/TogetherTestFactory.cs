using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.Extensions.DependencyInjection;
using Together.Integrations.LiveKit;
using Together.Logic.Rooms;
using Together.Tests.Fakes;

namespace Together.Tests;

/// <summary>
/// Тестовая фабрика приложения. Подменяет реальные зависимости на фейковые.
/// </summary>
public class TogetherTestFactory : WebApplicationFactory<Program>
{
    public FakeLiveKitService FakeLiveKit { get; } = new();

    protected override void ConfigureWebHost(IWebHostBuilder builder)
    {
        // Устанавливаем тестовые значения через environment variables
        // Они имеют наивысший приоритет в конфигурации
        Environment.SetEnvironmentVariable("AdminProfile__user_name", "admin");
        Environment.SetEnvironmentVariable("AdminProfile__password", "admin");
        Environment.SetEnvironmentVariable("Jwt__Secret", "test-jwt-secret-key-at-least-32-chars-long");
        Environment.SetEnvironmentVariable("LiveKitConfig__ApiKey", "test-api-key");
        Environment.SetEnvironmentVariable("LiveKitConfig__ApiSecret", "test-api-secret");
        Environment.SetEnvironmentVariable("LiveKitConfig__HttpUrl", "http://localhost:7880");
        Environment.SetEnvironmentVariable("LiveKitConfig__WebSocketUrl", "ws://localhost:7880");

        builder.ConfigureServices(services =>
        {
            // Убираем реальный LiveKitService
            var descriptor = services.SingleOrDefault(
                d => d.ServiceType == typeof(ILiveKitService));
            if (descriptor != null)
                services.Remove(descriptor);

            // Убираем реальный RoomService
            var roomDescriptor = services.SingleOrDefault(
                d => d.ServiceType == typeof(IRoomService));
            if (roomDescriptor != null)
                services.Remove(roomDescriptor);

            // Подменяем на фейки
            services.AddSingleton<ILiveKitService>(FakeLiveKit);
            services.AddSingleton<IRoomService>(sp =>
                new RoomService(FakeLiveKit));
        });
    }
}