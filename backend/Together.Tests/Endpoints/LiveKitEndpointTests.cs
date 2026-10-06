using System.Net;
using System.Net.Http.Headers;
using System.Net.Http.Json;
using System.Text.Json;
using System.Text.Json.Serialization;
using Together.Tests.Fakes;

namespace Together.Tests.Endpoints;

public class LiveKitEndpointTests : IClassFixture<TogetherTestFactory>, IDisposable
{
    private readonly HttpClient _client;
    private readonly TogetherTestFactory _factory;
    private readonly FakeLiveKitService _fakeLiveKit;

    public LiveKitEndpointTests(TogetherTestFactory factory)
    {
        _factory = factory;
        _client = factory.CreateClient();
        _fakeLiveKit = factory.FakeLiveKit;
        _fakeLiveKit.Reset();
    }

    public void Dispose() { }

    private async Task<string> LoginAsync()
    {
        var request = new { user_name = "admin", password = "admin" };
        var response = await _client.PostAsJsonAsync("/api/authorization/login", request);
        var body = await response.Content.ReadFromJsonAsync<LoginResponseJson>();
        return body!.SessionToken;
    }

    private void SetAuth(string token)
    {
        _client.DefaultRequestHeaders.Authorization =
            new AuthenticationHeaderValue("Bearer", token);
    }

    // ============================================================
    // POST /api/livekit/token
    // ============================================================

    [Fact]
    public async Task GetToken_NoAuth_ReturnsUnauthorized()
    {
        _client.DefaultRequestHeaders.Authorization = null;

        var request = new { display_name = "User", room_name = "room" };
        var response = await _client.PostAsJsonAsync("/api/livekit/token", request);

        Assert.Equal(HttpStatusCode.Unauthorized, response.StatusCode);
    }

    [Fact]
    public async Task GetToken_PublicRoom_ReturnsToken()
    {
        var token = await LoginAsync();
        SetAuth(token);

        _fakeLiveKit.AddParticipant("public-room", "Someone");

        var request = new { display_name = "TestUser", room_name = "public-room" };
        var response = await _client.PostAsJsonAsync("/api/livekit/token", request);

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);

        var body = await response.Content.ReadFromJsonAsync<LiveKitTokenJson>();
        Assert.False(string.IsNullOrEmpty(body!.LiveKitToken));
        Assert.False(string.IsNullOrEmpty(body.LiveKitUrl));
    }

    [Fact]
    public async Task GetToken_PrivateRoom_CorrectPassword_ReturnsToken()
    {
        var token = await LoginAsync();
        SetAuth(token);

        await _client.PostAsJsonAsync("/api/rooms",
            new { name = "private", password = "secret" });
        _fakeLiveKit.AddParticipant("private", "Someone");

        var request = new
        {
            display_name = "TestUser",
            room_name = "private",
            password = "secret"
        };
        var response = await _client.PostAsJsonAsync("/api/livekit/token", request);

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
    }

    [Fact]
    public async Task GetToken_PrivateRoom_WrongPassword_ReturnsUnauthorized()
    {
        var token = await LoginAsync();
        SetAuth(token);

        await _client.PostAsJsonAsync("/api/rooms",
            new { name = "private", password = "secret" });
        _fakeLiveKit.AddParticipant("private", "Someone");

        var request = new
        {
            display_name = "TestUser",
            room_name = "private",
            password = "wrong"
        };
        var response = await _client.PostAsJsonAsync("/api/livekit/token", request);

        Assert.Equal(HttpStatusCode.Unauthorized, response.StatusCode);
    }

    [Fact]
    public async Task GetToken_PrivateRoom_NoPassword_ReturnsUnauthorized()
    {
        var token = await LoginAsync();
        SetAuth(token);

        await _client.PostAsJsonAsync("/api/rooms",
            new { name = "private", password = "secret" });
        _fakeLiveKit.AddParticipant("private", "Someone");

        var request = new
        {
            display_name = "TestUser",
            room_name = "private"
        };
        var response = await _client.PostAsJsonAsync("/api/livekit/token", request);

        Assert.Equal(HttpStatusCode.Unauthorized, response.StatusCode);
    }

    private class LoginResponseJson
    {
        [JsonPropertyName("session_token")]
        public string SessionToken { get; set; } = "";
    }

    private class LiveKitTokenJson
    {
        [JsonPropertyName("live_kit_token")]
        public string LiveKitToken { get; set; } = "";

        [JsonPropertyName("live_kit_url")]
        public string LiveKitUrl { get; set; } = "";
    }
}