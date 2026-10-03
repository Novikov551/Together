using Livekit.Server.Sdk.Dotnet;

namespace Together.Integrations.LiveKit
{
    public interface ILiveKitService
    {
        Task<List<(string Name, uint NumParticipants)>> GetRoomsAsync(CancellationToken ct = default);

        Task<List<string>> GetRoomParticipantsAsync(string roomName, CancellationToken ct = default);

        Task<string> CreateRoomAsync(string roomName, CancellationToken ct = default);

        Task DeleteRoomAsync(string roomName, CancellationToken ct = default);

        Task<string> GenerateTokenAsync(string displayName, string room, CancellationToken ct = default);

        Task<string> GetWebSocketUrlAsync(CancellationToken ct = default);
    }
}
