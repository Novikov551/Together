using Microsoft.Extensions.DependencyInjection;
using Together.Integrations.Extensions;
using Together.Logic.Rooms;

namespace Together.Logic.Extensions
{
    public static class ServiceCollectionExtensions
    {
        public static IServiceCollection AddLogic(this IServiceCollection services)
        {
            services
                .AddLiveKit()
                .AddRoomService();

            return services;
        }

        private static IServiceCollection AddRoomService(this IServiceCollection services)
        {
            services.AddSingleton<IRoomService, RoomService>();

            return services;
        }
    }
}
