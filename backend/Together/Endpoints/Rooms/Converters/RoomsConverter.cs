using Together.Endpoints.Rooms.Models.Responses;
using Together.Logic.Models;

namespace Together.Endpoints.Rooms.Converters
{
    public static class RoomsConverter
    {
        public static RoomShortInfoResponse? ToResponse(this RoomShortInfoDto? dto)
        {
            if(dto == null)
            {
                return null;
            }

            return new RoomShortInfoResponse
            {
                IsPrivate = dto.IsPrivate,
                Name = dto.Name,
            };
        }

        public static RoomInfoResponse? ToResponse(this RoomInfoDto? dto)
        {
            if (dto == null)
            {
                return null;
            }

            return new RoomInfoResponse
            {
                IsPrivate = dto.IsPrivate,
                Name = dto.Name,
                Participants = dto.Participants,
            };
        }
    }
}
