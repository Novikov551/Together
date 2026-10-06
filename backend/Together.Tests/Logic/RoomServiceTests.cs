using Together.Logic.Rooms;
using Together.Tests.Fakes;

namespace Together.Tests.Logic;

public class RoomServiceTests : IDisposable
{
    private readonly FakeLiveKitService _fakeLiveKit;
    private readonly RoomService _sut;

    public RoomServiceTests()
    {
        _fakeLiveKit = new FakeLiveKitService();
        _sut = new RoomService(_fakeLiveKit);
    }

    public void Dispose() { }

    // ============================================================
    // GetAllRoomsAsync
    // ============================================================

    [Fact]
    public async Task GetAllRoomsAsync_Empty_ReturnsEmptyList()
    {
        var result = await _sut.GetAllRoomsAsync();

        Assert.Empty(result);
    }

    [Fact]
    public async Task GetAllRoomsAsync_WithParticipants_ReturnsRooms()
    {
        _fakeLiveKit.AddParticipant("room1", "Alice");
        _fakeLiveKit.AddParticipant("room1", "Bob");

        var result = await _sut.GetAllRoomsAsync();

        Assert.Single(result);
        Assert.Equal("room1", result[0].Name);
    }

    [Fact]
    public async Task GetAllRoomsAsync_FiltersOutEmptyRooms()
    {
        _fakeLiveKit.AddParticipant("room1", "Alice");
        // room2 created but 0 participants
        await _fakeLiveKit.CreateRoomAsync("room2");

        var result = await _sut.GetAllRoomsAsync();

        Assert.Single(result);
        Assert.Equal("room1", result[0].Name);
    }

    [Fact]
    public async Task GetAllRoomsAsync_PublicRoom_IsPrivateFalse()
    {
        _fakeLiveKit.AddParticipant("room1", "Alice");

        var result = await _sut.GetAllRoomsAsync();

        Assert.False(result[0].IsPrivate);
    }

    [Fact]
    public async Task GetAllRoomsAsync_PrivateRoom_IsPrivateTrue()
    {
        await _sut.CreateRoomAsync("secret", "pass123");
        _fakeLiveKit.AddParticipant("secret", "Alice");

        var result = await _sut.GetAllRoomsAsync();

        Assert.True(result[0].IsPrivate);
    }

    // ============================================================
    // CreateRoomAsync
    // ============================================================

    [Fact]
    public async Task CreateRoomAsync_PublicRoom_NoPassword()
    {
        await _sut.CreateRoomAsync("public-room", null);

        Assert.Equal("public-room", _fakeLiveKit.LastCreatedRoom);
    }

    [Fact]
    public async Task CreateRoomAsync_PrivateRoom_StoresPasswordHash()
    {
        await _sut.CreateRoomAsync("private-room", "secret");

        // Проверяем что комната теперь приватная
        var rooms = await _sut.GetAllRoomsAsync();
        // Нужен участник чтобы комната попала в список
        _fakeLiveKit.AddParticipant("private-room", "Alice");
        rooms = await _sut.GetAllRoomsAsync();
        Assert.True(rooms[0].IsPrivate);
    }

    [Fact]
    public async Task CreateRoomAsync_EmptyPassword_TreatedAsPublic()
    {
        await _sut.CreateRoomAsync("room", "");

        _fakeLiveKit.AddParticipant("room", "Alice");
        var rooms = await _sut.GetAllRoomsAsync();
        Assert.False(rooms[0].IsPrivate);
    }

    [Fact]
    public async Task CreateRoomAsync_WhitespacePassword_TreatedAsPrivate()
    {
        // whitespace не null и не empty → SetPasswordAsync сохраняет хеш
        await _sut.CreateRoomAsync("room", "   ");

        _fakeLiveKit.AddParticipant("room", "Alice");
        var rooms = await _sut.GetAllRoomsAsync();
        Assert.True(rooms[0].IsPrivate);
    }

    // ============================================================
    // ValidatePasswordAsync
    // ============================================================

    [Fact]
    public async Task ValidatePasswordAsync_PublicRoom_ReturnsTrue()
    {
        await _sut.CreateRoomAsync("public", null);

        var result = await _sut.ValidatePasswordAsync("public", null);

        Assert.True(result);
    }

    [Fact]
    public async Task ValidatePasswordAsync_PrivateRoom_CorrectPassword_ReturnsTrue()
    {
        await _sut.CreateRoomAsync("private", "mypassword");

        var result = await _sut.ValidatePasswordAsync("private", "mypassword");

        Assert.True(result);
    }

    [Fact]
    public async Task ValidatePasswordAsync_PrivateRoom_WrongPassword_ReturnsFalse()
    {
        await _sut.CreateRoomAsync("private", "mypassword");

        var result = await _sut.ValidatePasswordAsync("private", "wrongpassword");

        Assert.False(result);
    }

    [Fact]
    public async Task ValidatePasswordAsync_PrivateRoom_NullPassword_ReturnsFalse()
    {
        await _sut.CreateRoomAsync("private", "mypassword");

        var result = await _sut.ValidatePasswordAsync("private", null);

        Assert.False(result);
    }

    [Fact]
    public async Task ValidatePasswordAsync_PrivateRoom_EmptyPassword_ReturnsFalse()
    {
        await _sut.CreateRoomAsync("private", "mypassword");

        var result = await _sut.ValidatePasswordAsync("private", "");

        Assert.False(result);
    }

    [Fact]
    public async Task ValidatePasswordAsync_NonExistentRoom_ReturnsTrue()
    {
        // Комната не в _rooms = публичная = любой пароль ок
        var result = await _sut.ValidatePasswordAsync("nonexistent", "anything");

        Assert.True(result);
    }

    // ============================================================
    // DeleteRoomAsync
    // ============================================================

    [Fact]
    public async Task DeleteRoomAsync_EmptyRoom_DeletesFromLiveKit()
    {
        await _sut.CreateRoomAsync("to-delete", null);

        await _sut.DeleteRoomAsync("to-delete");

        Assert.Equal("to-delete", _fakeLiveKit.LastDeletedRoom);
    }

    [Fact]
    public async Task DeleteRoomAsync_WithParticipants_DoesNotDelete()
    {
        await _sut.CreateRoomAsync("busy-room", null);
        _fakeLiveKit.AddParticipant("busy-room", "Alice");

        await _sut.DeleteRoomAsync("busy-room");

        // Не должен был удалиться
        Assert.NotEqual("busy-room", _fakeLiveKit.LastDeletedRoom);
    }

    [Fact]
    public async Task DeleteRoomAsync_RemovesPasswordHash()
    {
        await _sut.CreateRoomAsync("private-to-delete", "pass");
        await _sut.DeleteRoomAsync("private-to-delete");

        // После удаления комната не должна быть приватной
        // Пересоздаём с тем же именем — должна быть публичной
        _fakeLiveKit.AddParticipant("private-to-delete", "Alice");
        var rooms = await _sut.GetAllRoomsAsync();
        Assert.False(rooms[0].IsPrivate);
    }

    // ============================================================
    // GetRoomInfoAsync
    // ============================================================

    [Fact]
    public async Task GetRoomInfoAsync_ReturnsParticipantsAndPrivacy()
    {
        await _sut.CreateRoomAsync("info-room", "secret");
        _fakeLiveKit.AddParticipant("info-room", "Alice");
        _fakeLiveKit.AddParticipant("info-room", "Bob");

        var info = await _sut.GetRoomInfoAsync("info-room");

        Assert.Equal("info-room", info.Name);
        Assert.True(info.IsPrivate);
        Assert.Equal(2, info.Participants.Count);
        Assert.Contains("Alice", info.Participants);
        Assert.Contains("Bob", info.Participants);
    }

    [Fact]
    public async Task GetRoomInfoAsync_PublicRoom_IsPrivateFalse()
    {
        _fakeLiveKit.AddParticipant("public-info", "Alice");

        var info = await _sut.GetRoomInfoAsync("public-info");

        Assert.False(info.IsPrivate);
    }

    // ============================================================
    // Повторное создание комнаты
    // ============================================================

    [Fact]
    public async Task CreateRoomAsync_DuplicateName_DoesNotOverwritePassword()
    {
        await _sut.CreateRoomAsync("room", "first-pass");
        await _sut.CreateRoomAsync("room", "second-pass");

        // Оригинальный пароль должен работать
        var result = await _sut.ValidatePasswordAsync("room", "first-pass");
        Assert.True(result);
    }
}