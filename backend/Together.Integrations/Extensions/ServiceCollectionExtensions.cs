using Microsoft.Extensions.DependencyInjection;
using Together.Integrations.Config;

namespace Together.Integrations.Extensions
{
    public static class ServiceCollectionExtensions
    {
        public static IServiceCollection AddLiveKit(this IServiceCollection services)
        {
            services.AddLiveKitConfig()
                .AddLiveKitService();

            return services;
        }

        private static IServiceCollection AddLiveKitConfig(this IServiceCollection services)
        {
            services
            .AddOptions<LiveKitConfig>()
            .BindConfiguration(nameof(LiveKitConfig))
            .ValidateDataAnnotations()
            .ValidateOnStart();

            return services;
        }

        private static IServiceCollection AddLiveKitService(this IServiceCollection services)
        {
            services.AddSingleton<LiveKitService>();

            return services;
        }
    }
}
