using System.Collections.Concurrent;
using System.Security.Cryptography;
using System.Text;
using Together.Integrations.LiveKit;
using Together.Logic.Models;

namespace Together.Logic.Rooms
{
    public class RoomService : IRoomService
    {
        private readonly ConcurrentDictionary<string, string> _rooms;
        private readonly SemaphoreSlim _deleteLock = new(1, 1);
        private readonly ILiveKitService _liveKitService;

        public RoomService(ILiveKitService liveKitService)
        {
            _rooms = new ConcurrentDictionary<string, string>();
            _liveKitService = liveKitService;
        }

        public async Task<List<RoomShortInfoDto>> GetAllRoomsAsync(CancellationToken ct = default)
        {
            var rooms = await _liveKitService.GetRoomsAsync(ct);
            return rooms
                .Where(e => e.NumParticipants > 0)
                .Select(e => new RoomShortInfoDto(e.Name, IsPrivateRoom(e.Name))).ToList();
        }

        public async Task CreateRoomAsync(string roomName, string? pass, CancellationToken ct = default)
        {
            var room = await _liveKitService.CreateRoomAsync(roomName, ct);
            await SetPasswordAsync(roomName, pass, ct);
        }

        public Task<bool> ValidatePasswordAsync(string roomName, string? pass, CancellationToken ct = default)
        {
            ct.ThrowIfCancellationRequested();

            if (_rooms.TryGetValue(roomName, out var hash))
            {
                if (string.IsNullOrWhiteSpace(pass))
                {
                    return Task.FromResult(false);
                }

                var passHash = Convert.ToHexString(SHA256.HashData(Encoding.UTF8.GetBytes(pass)));
                if (hash == passHash)
                {
                    return Task.FromResult(true);
                }

                return Task.FromResult(false);
            }
            else
            {
                return Task.FromResult(true);
            }
        }

        public async Task<RoomInfoDto> GetRoomInfoAsync(string room, CancellationToken ct = default)
        {
            var participants = await GetRoomParticipantsAsync(room, ct);

            var isPrivate = IsPrivateRoom(room);

            return new RoomInfoDto(room, participants, isPrivate);
        }

        public async Task DeleteRoomAsync(string roomName, CancellationToken ct = default)
        {
            var participants = await _liveKitService.GetRoomParticipantsAsync(roomName, ct);
            if (participants.Count > 0)
            {
                return;
            }

            await _liveKitService.DeleteRoomAsync(roomName, ct);
            _rooms.TryRemove(roomName, out _);
        }

        #region Private

        private bool IsPrivateRoom(string room)
        {
            return _rooms.ContainsKey(room);
        }

        private async Task<List<string>> GetRoomParticipantsAsync(string room, CancellationToken ct = default)
        {
            return await _liveKitService.GetRoomParticipantsAsync(room, ct);
        }

        private async Task SetPasswordAsync(string roomName, string? pass, CancellationToken ct = default)
        {
            ct.ThrowIfCancellationRequested();

            if (!string.IsNullOrEmpty(pass))
            {
                if (_rooms.ContainsKey(roomName))
                {
                    return;
                }

                var hash = Convert.ToHexString(SHA256.HashData(Encoding.UTF8.GetBytes(pass)));
                _rooms[roomName] = hash;
            }
        }

        #endregion
    }
}
