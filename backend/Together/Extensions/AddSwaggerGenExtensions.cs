using Microsoft.OpenApi;
using Microsoft.OpenApi.Models;
using System.Reflection;
using Unchase.Swashbuckle.AspNetCore.Extensions.Extensions;
using Unchase.Swashbuckle.AspNetCore.Extensions.Options;

namespace Together.Extensions
{
    public static class AddSwaggerGenExtensions
    {
        public static IServiceCollection AddSwagger(this IServiceCollection services)
        {
            return services.AddSwaggerGen(options =>
            {
                options.EnableAnnotations();
                options.SwaggerDoc("v1", new OpenApiInfo { Title = "Together", Version = "v1" });

                options.CustomSchemaIds(x => x.FullName);

                var xmlFile = $"{Assembly.GetExecutingAssembly().GetName().Name}.xml";
                var xmlPath = Path.Combine(AppContext.BaseDirectory, xmlFile);

                // Проверяем существование XML-файла
                if (File.Exists(xmlPath))
                {
                    options.IncludeXmlComments(xmlPath, true);
                }

                options.AddEnumsWithValuesFixFilters(o =>
                {
                    o.ApplySchemaFilter = true;
                    o.XEnumNamesAlias = "x-enum-varnames";
                    o.XEnumDescriptionsAlias = "x-enum-descriptions";
                    o.ApplyParameterFilter = true;
                    o.ApplyDocumentFilter = true;
                    o.IncludeDescriptions = true;
                    o.IncludeXEnumRemarks = true;
                    o.DescriptionSource = DescriptionSources.DescriptionAttributesThenXmlComments;
                    o.NewLine = "\n";

                    // Также проверяем существование файла
                    if (File.Exists(xmlPath))
                    {
                        o.IncludeXmlCommentsFrom(xmlPath);
                    }
                });
            });
        }
    }
}