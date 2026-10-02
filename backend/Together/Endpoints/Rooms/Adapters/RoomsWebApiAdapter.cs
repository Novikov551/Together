using Together.Endpoints.Rooms.Converters;
using Together.Endpoints.Rooms.Models.Requests;
using Together.Endpoints.Rooms.Models.Responses;
using Together.Logic.Rooms;

namespace Together.Endpoints.Rooms.Adapters
{
    public class RoomsWebApiAdapter
    {
        private readonly IRoomService _roomsService;

        public RoomsWebApiAdapter(IRoomService roomStoreService)
        {
            _roomsService = roomStoreService;
        }

        public async Task<List<RoomShortInfoResponse>> GetAllAsync(CancellationToken ct = default)
        {
            var rooms = await _roomsService.GetAllRoomsAsync(ct);

            return rooms.ConvertAll(e => e.ToResponse());
        }

        internal async Task CreateRoomAsync(CreateRoomRequest request, CancellationToken ct = default)
        {
            await _roomsService.CreateRoomAsync(request.Name, request.Password, ct);
        }

        internal async Task DeleteRoomAsync(string room, CancellationToken ct = default)
        {
            await _roomsService.DeleteRoomAsync(room, ct);
        }

        internal async Task<RoomInfoResponse?> GetRoomParticipantsAsync(string room, CancellationToken ct = default)
        {
            var roomInfo = await _roomsService.GetRoomInfoAsync(room, ct);

            return roomInfo.ToResponse();
        }
    }
}
