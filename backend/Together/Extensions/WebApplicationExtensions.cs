using Microsoft.AspNetCore.Builder;
using Microsoft.OpenApi;
using Swashbuckle.AspNetCore.SwaggerUI;
using Together.Logging;

namespace Together.Extensions
{
    public static class WebApplicationExtensions
    {
        /// <summary>
        /// Настройка pipeline обработки запроса
        /// </summary>
        public static WebApplication ConfigurePipeline(this WebApplication app)
        {
            if (app.Environment.IsDevelopment())
            {
                app.UseDeveloperExceptionPage();
            }
            else
            {
                /*app.UseExceptionHandler("/error");*/
            }

            app.UseSwagger();
            app.UseSwaggerUI(opt =>
            {
                opt.DefaultModelsExpandDepth(-1);
                opt.DocExpansion(DocExpansion.None);
                opt.SwaggerEndpoint("/swagger/v1/swagger.json", "Together v1");
            });

            app.UseRouting();
            app.UseCors("AllowAll");
            app.UseResponseCaching();
            app.UseAuthentication();
            app.UseAuthorization();

            app.UseMiddleware<RequestBodyLoggingMiddleware>();

            app.UseEndpoints(endpoints =>
                {
                    endpoints.MapControllers();
                    endpoints.MapDefaultControllerRoute();
                });

            return app;
        }
    }
}
