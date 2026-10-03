using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.Http.Json;
using Microsoft.AspNetCore.Mvc.Formatters;
using Microsoft.IdentityModel.Tokens;
using Serilog;
using System.Text;
using System.Text.Encodings.Web;
using System.Text.Json;
using System.Text.Json.Serialization;
using Together.Logic.Extensions;

namespace Together.Extensions
{
    public static class WebApplicationBuilderExtensions
    {
        public static WebApplicationBuilder ConfigureAppConfiguration(this WebApplicationBuilder builder)
        {
            builder.Configuration
                .AddJsonFile("appsettings.json", false, true)
                .AddJsonFile($"appsettings.{builder.Environment.EnvironmentName}.json", true, true);

            builder.Configuration.AddEnvironmentVariables();

            if (builder.Environment.IsDevelopment())
            {
                builder.Configuration.AddUserSecrets<Program>();
            }

            return builder;
        }

        public static WebApplicationBuilder ConfigureLogging(this WebApplicationBuilder builder)
        {
            builder.Logging.ClearProviders();
            builder.Host.UseSerilog((hostContext, loggerConfig) =>
            {
                loggerConfig
                    .ReadFrom.Configuration(hostContext.Configuration)
                    .Enrich.WithProperty("ApplicationName", hostContext.HostingEnvironment.ApplicationName);
            });

            return builder;
        }

        public static WebApplicationBuilder AddApplicationOptions(this WebApplicationBuilder builder)
        {
            builder.Services.AddConfigOptions();

            return builder;
        }

        public static WebApplicationBuilder ConfigureServices(this WebApplicationBuilder builder)
        {
            //TODO добавить обработчики ошибок
         /*  builder.Services.AddErrorHandlers(cfg =>
            {
                cfg.PrintErrorDetails = !builder.Environment.IsProduction()
                cfg.PrintErrorDetails = true;
                cfg.GlobalExceptionTraceFilters = [""];
            });*/
            builder.Services.AddHealthChecks();

            // Настройка JWT-аутентификации для сессионных токенов
            var jwtSecret = builder.Configuration["Jwt:Secret"];
            var key = Encoding.UTF8.GetBytes(jwtSecret);

            builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
                .AddJwtBearer(options =>
                {
                    options.TokenValidationParameters = new TokenValidationParameters
                    {
                        ValidateIssuerSigningKey = true,
                        IssuerSigningKey = new SymmetricSecurityKey(key),
                        ValidateIssuer = false,
                        ValidateAudience = false,
                        ClockSkew = TimeSpan.Zero
                    };
                });

            builder.Services.AddAuthorization();

            //TODO добавить слой инфраструктуры
            /*builder.Services.AddInfrastructureServices(builder.Configuration, builder.Environment);*/


            builder.Services.AddLogic();
            builder.Services.AddWebApiAdapters();

            /*builder.Services.AddMessaging(builder.Configuration);
            builder.Services.AddIntegrations();*/

            builder.Services.AddControllers(options =>
            {
                options.OutputFormatters.RemoveType<HttpNoContentOutputFormatter>();
            })
                .AddJsonOptions(options =>
                {
                    options.JsonSerializerOptions.PropertyNamingPolicy = JsonNamingPolicy.SnakeCaseLower;
                    options.JsonSerializerOptions.Encoder = JavaScriptEncoder.UnsafeRelaxedJsonEscaping;
                    options.JsonSerializerOptions.NumberHandling = JsonNumberHandling.AllowReadingFromString;
                    options.JsonSerializerOptions.AllowTrailingCommas = true;
                });
            builder.Services.AddResponseCaching();

            builder.Services.AddHttpContextAccessor();
            builder.Services.Configure<JsonOptions>(options =>
            {
                options.SerializerOptions.PropertyNamingPolicy = JsonNamingPolicy.SnakeCaseLower;
                options.SerializerOptions.Encoder = JavaScriptEncoder.UnsafeRelaxedJsonEscaping;
                options.SerializerOptions.NumberHandling = JsonNumberHandling.AllowReadingFromString;
                options.SerializerOptions.AllowTrailingCommas = true;
            });

            builder.Services.AddEndpointsApiExplorer();

            builder.Services.AddCors(options =>
            {
                options.AddPolicy("AllowAll",
                    policy =>
                    {
                        policy.AllowAnyOrigin()
                              .AllowAnyMethod()
                              .AllowAnyHeader();
                    });
            });

            builder.Services.AddSwagger();

            return builder;
        }
    }
}
