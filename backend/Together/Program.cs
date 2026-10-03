using Serilog;
using Together.Extensions;

public class Program
{
    public static async Task Main(string[] args)
    {
        var builder = WebApplication.CreateBuilder(args);

        builder.ConfigureAppConfiguration()
            .ConfigureLogging()
            .AddApplicationOptions()
            .ConfigureServices();

        Log.Logger = new LoggerConfiguration()
            .ReadFrom.Configuration(builder.Configuration)
            .CreateLogger();

        try
        {
            Log.Information("Application Starting");

            var app = builder.Build();

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
