using System.Text;

using Serilog;

namespace Together.Logging;

public class RequestBodyLoggingMiddleware
{
    private const int MaxBodyLength = 8192;

    private readonly RequestDelegate _next;
    private readonly IDiagnosticContext _diagnosticContext;

    public RequestBodyLoggingMiddleware(RequestDelegate next, IDiagnosticContext diagnosticContext)
    {
        _next = next;
        _diagnosticContext = diagnosticContext;
    }

    public async Task InvokeAsync(HttpContext context)
    {
        var endpoint = context.GetEndpoint();
        var hasAttribute = endpoint?.Metadata.GetMetadata<LogRequestBodyAttribute>() is not null;

        if (hasAttribute && (HttpMethods.IsPost(context.Request.Method) || HttpMethods.IsPut(context.Request.Method)))
        {
            context.Request.EnableBuffering();

            var body = await ReadBodyAsync(context.Request);
            if (!string.IsNullOrEmpty(body))
                _diagnosticContext.Set("RequestBody", body);
        }

        await _next(context);
    }

    private static async Task<string> ReadBodyAsync(HttpRequest request)
    {
        if (request.ContentLength is null or 0)
            return string.Empty;

        request.Body.Position = 0;
        using var reader = new StreamReader(
            request.Body,
            encoding: Encoding.UTF8,
            detectEncodingFromByteOrderMarks: false,
            bufferSize: 4096,
            leaveOpen: true);

        var body = await reader.ReadToEndAsync();
        request.Body.Position = 0;

        if (body.Length > MaxBodyLength)
            return body[..MaxBodyLength] + $"...[truncated, total {body.Length} chars]";

        return body;
    }
}