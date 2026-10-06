using System.Net;
using System.Net.Http.Json;
using System.Text.Json;
using System.Text.Json.Serialization;

namespace Together.Tests.Endpoints;

public class AuthorizationTests : IClassFixture<TogetherTestFactory>
{
    private readonly HttpClient _client;

    public AuthorizationTests(TogetherTestFactory factory)
    {
        _client = factory.CreateClient();
    }

    [Fact]
    public async Task Login_ValidCredentials_ReturnsSessionToken()
    {
        var request = new { user_name = "admin", password = "admin" };

        var response = await _client.PostAsJsonAsync("/api/authorization/login", request);

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);

        var body = await response.Content.ReadFromJsonAsync<LoginResponseJson>();
        Assert.False(string.IsNullOrEmpty(body?.SessionToken));
    }

    [Fact]
    public async Task Login_InvalidUsername_ReturnsUnauthorized()
    {
        var request = new { user_name = "wrong", password = "admin" };

        var response = await _client.PostAsJsonAsync("/api/authorization/login", request);

        Assert.Equal(HttpStatusCode.Unauthorized, response.StatusCode);
    }

    [Fact]
    public async Task Login_InvalidPassword_ReturnsUnauthorized()
    {
        var request = new { user_name = "admin", password = "wrong" };

        var response = await _client.PostAsJsonAsync("/api/authorization/login", request);

        Assert.Equal(HttpStatusCode.Unauthorized, response.StatusCode);
    }

    [Fact]
    public async Task Login_EmptyCredentials_ReturnsUnauthorized()
    {
        var request = new { user_name = "", password = "" };

        var response = await _client.PostAsJsonAsync("/api/authorization/login", request);

        Assert.Equal(HttpStatusCode.Unauthorized, response.StatusCode);
    }

    // Вспомогательный метод для получения токена в других тестах
    public static async Task<string> GetTokenAsync(HttpClient client)
    {
        var request = new { user_name = "admin", password = "admin" };
        var response = await client.PostAsJsonAsync("/api/authorization/login", request);
        var body = await response.Content.ReadFromJsonAsync<LoginResponseJson>();
        return body!.SessionToken;
    }
}

// Используем class с JsonPropertyName — record positional constructor не работает
// корректно с snake_case десериализацией
public class LoginResponseJson
{
    [JsonPropertyName("session_token")]
    public string SessionToken { get; set; } = "";
}