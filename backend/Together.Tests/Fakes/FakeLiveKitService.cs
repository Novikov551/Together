using Together.Integrations.LiveKit;

namespace Together.Tests.Fakes;

/// <summary>
/// Фейковая реализация ILiveKitService для тестов.
/// Эмулирует поведение LiveKit Server в памяти.
/// </summary>
public class FakeLiveKitService : ILiveKitService
{
    private readonly Dictionary<string, List<string>> _rooms = new();
    private readonly Dictionary<string, List<string>> _participants = new();

    public string GeneratedToken { get; private set; } = string.Empty;
    public string LastCreatedRoom { get; private set; } = string.Empty;
    public string LastDeletedRoom { get; private set; } = string.Empty;

    public Task<List<(string Name, uint NumParticipants)>> GetRoomsAsync(CancellationToken ct = default)
    {
        ct.ThrowIfCancellationRequested();

        var result = _rooms.Select(r => (r.Key, (uint)r.Value.Count)).ToList();
        return Task.FromResult(result);
    }

    public Task<List<string>> GetRoomParticipantsAsync(string roomName, CancellationToken ct = default)
    {
        ct.ThrowIfCancellationRequested();

        if (_participants.TryGetValue(roomName, out var participants))
        {
            return Task.FromResult(participants.ToList());
        }

        return Task.FromResult(new List<string>());
    }

    public Task<string> CreateRoomAsync(string roomName, CancellationToken ct = default)
    {
        ct.ThrowIfCancellationRequested();

        if (!_rooms.ContainsKey(roomName))
        {
            _rooms[roomName] = new List<string>();
            _participants[roomName] = new List<string>();
        }

        LastCreatedRoom = roomName;
        return Task.FromResult(roomName);
    }

    public Task DeleteRoomAsync(string roomName, CancellationToken ct = default)
    {
        ct.ThrowIfCancellationRequested();

        _rooms.Remove(roomName);
        _participants.Remove(roomName);
        LastDeletedRoom = roomName;
        return Task.CompletedTask;
    }

    public Task<string> GenerateTokenAsync(string displayName, string room, CancellationToken ct = default)
    {
        ct.ThrowIfCancellationRequested();

        GeneratedToken = $"fake-token-{displayName}-{room}";
        return Task.FromResult(GeneratedToken);
    }

    public Task<string> GetWebSocketUrlAsync(CancellationToken ct = default)
    {
        ct.ThrowIfCancellationRequested();
        return Task.FromResult("ws://localhost:7880");
    }

    // === Вспомогательные методы для тестов ===

    /// <summary>
    /// Добавить участника в комнату (для настройки тестовых данных)
    /// </summary>
    public void AddParticipant(string roomName, string participantName)
    {
        if (!_rooms.ContainsKey(roomName))
        {
            _rooms[roomName] = new List<string>();
            _participants[roomName] = new List<string>();
        }

        _rooms[roomName].Add(participantName);
        _participants[roomName].Add(participantName);
    }

    /// <summary>
    /// Очистить все данные
    /// </summary>
    public void Reset()
    {
        _rooms.Clear();
        _participants.Clear();
        GeneratedToken = string.Empty;
        LastCreatedRoom = string.Empty;
        LastDeletedRoom = string.Empty;
    }
}