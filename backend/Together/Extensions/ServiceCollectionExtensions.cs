using Together.Endpoints.Rooms.Adapters;

namespace Together.Extensions
{
    public static class ServiceCollectionExtensions
    {
        public static IServiceCollection AddWebApiAdapters(this IServiceCollection services)
        {
            services.AddScoped<RoomsWebApiAdapter>();

            return services;
        }

        public static IServiceCollection AddConfigOptions(this IServiceCollection services)
        {
            services
                .AddOptions<AdminProfile>()
                .BindConfiguration(nameof(AdminProfile))
                .ValidateDataAnnotations()
                .ValidateOnStart();

            return services;
        }
    }
}
