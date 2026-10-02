using Serilog;
using Together.Extensions;

public class Program
{
    public static async Task Main(string[] args)
    {
        var config = new ConfigurationBuilder()
            .AddJsonFile("appsettings.json")
            .Build();

        Log.Logger = new LoggerConfiguration()
            .ReadFrom.Configuration(config)
            .CreateLogger();

        try
        {
            Log.Information("Application Starting");

            var builder = WebApplication.CreateBuilder(args);

            builder.ConfigureAppConfiguration()
                .ConfigureLogging()
                .AddApplicationOptions()
                .ConfigureServices();

            var app = builder.Build();

            using (var scope = app.Services.CreateScope())
            {
                var sp = scope.ServiceProvider;

                /*await Task.WhenAll(sp.GetRequiredService<DbContext>().MigrateAsync());*/
            }

            app.ConfigurePipeline();

            await app.RunAsync();
        }
        catch (Exception ex)
        {
            Log.Fatal(ex, "The Application failed to start");
        }
        finally
        {
            await Log.CloseAndFlushAsync();
        }
    }
}