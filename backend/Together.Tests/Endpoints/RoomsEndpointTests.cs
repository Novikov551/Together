using System.Net;
using System.Net.Http.Headers;
using System.Net.Http.Json;
using System.Text.Json;
using System.Text.Json.Serialization;
using Together.Tests.Fakes;

namespace Together.Tests.Endpoints;

public class RoomsEndpointTests : IClassFixture<TogetherTestFactory>, IDisposable
{
    private readonly HttpClient _client;
    private readonly TogetherTestFactory _factory;
    private readonly FakeLiveKitService _fakeLiveKit;

    public RoomsEndpointTests(TogetherTestFactory factory)
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
    // GET /api/rooms/all
    // ============================================================

    [Fact]
    public async Task GetAllRooms_NoAuth_ReturnsUnauthorized()
    {
        _client.DefaultRequestHeaders.Authorization = null;

        var response = await _client.GetAsync("/api/rooms/all");

        Assert.Equal(HttpStatusCode.Unauthorized, response.StatusCode);
    }

    [Fact]
    public async Task GetAllRooms_Empty_ReturnsEmptyArray()
    {
        var token = await LoginAsync();
        SetAuth(token);

        var response = await _client.GetAsync("/api/rooms/all");

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);

        var rooms = await response.Content.ReadFromJsonAsync<List<RoomShortInfoJson>>();
        Assert.NotNull(rooms);
        Assert.Empty(rooms);
    }

    [Fact]
    public async Task GetAllRooms_WithParticipants_ReturnsRooms()
    {
        var token = await LoginAsync();
        SetAuth(token);

        _fakeLiveKit.AddParticipant("test-room", "Alice");

        var response = await _client.GetAsync("/api/rooms/all");

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);

        var rooms = await response.Content.ReadFromJsonAsync<List<RoomShortInfoJson>>();
        Assert.Single(rooms!);
        Assert.Equal("test-room", rooms[0].Name);
    }

    // ============================================================
    // POST /api/rooms
    // ============================================================

    [Fact]
    public async Task CreateRoom_NoAuth_ReturnsUnauthorized()
    {
        _client.DefaultRequestHeaders.Authorization = null;

        var request = new { name = "test" };
        var response = await _client.PostAsJsonAsync("/api/rooms", request);

        Assert.Equal(HttpStatusCode.Unauthorized, response.StatusCode);
    }

    [Fact]
    public async Task CreateRoom_ValidRequest_ReturnsOk()
    {
        var token = await LoginAsync();
        SetAuth(token);

        var request = new { name = "new-room" };
        var response = await _client.PostAsJsonAsync("/api/rooms", request);

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        Assert.Equal("new-room", _fakeLiveKit.LastCreatedRoom);
    }

    [Fact]
    public async Task CreateRoom_WithPassword_RoomBecomesPrivate()
    {
        var token = await LoginAsync();
        SetAuth(token);

        var request = new { name = "private-room", password = "secret123" };
        var response = await _client.PostAsJsonAsync("/api/rooms", request);

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);

        _fakeLiveKit.AddParticipant("private-room", "Alice");
        var roomsResponse = await _client.GetAsync("/api/rooms/all");
        var rooms = await roomsResponse.Content.ReadFromJsonAsync<List<RoomShortInfoJson>>();
        Assert.True(rooms![0].IsPrivate);
    }

    // ============================================================
    // DELETE /api/rooms/{room}
    // ============================================================

    [Fact]
    public async Task DeleteRoom_NoAuth_ReturnsUnauthorized()
    {
        _client.DefaultRequestHeaders.Authorization = null;

        var response = await _client.DeleteAsync("/api/rooms/some-room");

        Assert.Equal(HttpStatusCode.Unauthorized, response.StatusCode);
    }

    [Fact]
    public async Task DeleteRoom_EmptyRoom_DeletesSuccessfully()
    {
        var token = await LoginAsync();
        SetAuth(token);

        await _client.PostAsJsonAsync("/api/rooms", new { name = "to-delete" });

        var response = await _client.DeleteAsync("/api/rooms/to-delete");

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        Assert.Equal("to-delete", _fakeLiveKit.LastDeletedRoom);
    }

    [Fact]
    public async Task DeleteRoom_WithParticipants_DoesNotDelete()
    {
        var token = await LoginAsync();
        SetAuth(token);

        await _client.PostAsJsonAsync("/api/rooms", new { name = "busy-room" });
        _fakeLiveKit.AddParticipant("busy-room", "Alice");

        var response = await _client.DeleteAsync("/api/rooms/busy-room");

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        Assert.NotEqual("busy-room", _fakeLiveKit.LastDeletedRoom);
    }

    // ============================================================
    // GET /api/rooms/{room}/participants
    // ============================================================

    [Fact]
    public async Task GetParticipants_NoAuth_ReturnsUnauthorized()
    {
        _client.DefaultRequestHeaders.Authorization = null;

        var response = await _client.GetAsync("/api/rooms/any/participants");

        Assert.Equal(HttpStatusCode.Unauthorized, response.StatusCode);
    }

    [Fact]
    public async Task GetParticipants_ExistingRoom_ReturnsParticipants()
    {
        var token = await LoginAsync();
        SetAuth(token);

        _fakeLiveKit.AddParticipant("room-with-people", "Alice");
        _fakeLiveKit.AddParticipant("room-with-people", "Bob");

        var response = await _client.GetAsync("/api/rooms/room-with-people/participants");

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);

        var body = await response.Content.ReadFromJsonAsync<RoomInfoJson>();
        Assert.Equal("room-with-people", body!.Name);
        Assert.Equal(2, body.Participants.Count);
        Assert.Contains("Alice", body.Participants);
        Assert.Contains("Bob", body.Participants);
    }

    // ============================================================
    // JSON models
    // ============================================================

    private class LoginResponseJson
    {
        [JsonPropertyName("session_token")]
        public string SessionToken { get; set; } = "";
    }

    private class RoomShortInfoJson
    {
        [JsonPropertyName("name")]
        public string Name { get; set; } = "";

        [JsonPropertyName("is_private")]
        public bool IsPrivate { get; set; }
    }

    private class RoomInfoJson
    {
        [JsonPropertyName("name")]
        public string Name { get; set; } = "";

        [JsonPropertyName("participants")]
        public List<string> Participants { get; set; } = [];

        [JsonPropertyName("is_private")]
        public bool IsPrivate { get; set; }
    }
}