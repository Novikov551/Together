using Together.Logic.Models;
namespace Together.Logic.Rooms
{
    public interface IRoomService
    {
        Task<List<RoomShortInfoDto>> GetAllRoomsAsync(CancellationToken ct = default);
        Task<RoomInfoDto> GetRoomInfoAsync(string room, CancellationToken ct = default);
        Task CreateRoomAsync(string roomName, string? pass, CancellationToken ct = default);
        Task<bool> ValidatePasswordAsync(string roomName, string? pass, CancellationToken ct = default);
        Task DeleteRoomAsync(string roomName, CancellationToken ct = default);
    }
}
