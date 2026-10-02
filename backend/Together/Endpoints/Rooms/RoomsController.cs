using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Swashbuckle.AspNetCore.Annotations;
using Together.Endpoints.Rooms.Adapters;
using Together.Endpoints.Rooms.Models.Requests;
using Together.Endpoints.Rooms.Models.Responses;

namespace Together.Endpoints.Rooms
{
    [Authorize]
    [SwaggerTag("Комнаты LiveKit")]
    [Route("api/rooms")]
    public class RoomsController : BaseController
    {
        private readonly RoomsWebApiAdapter _adapter;

        public RoomsController(RoomsWebApiAdapter adapter)
        {
            _adapter = adapter;
        }

        [SwaggerOperation(Summary = "Получение всех комнат")]
        [HttpGet("all")]
        [ProducesResponseType(typeof(List<RoomShortInfoResponse>), 200)]
        public async Task<IActionResult> GetAllAsync(CancellationToken ct = default)
        {
            var rooms = await _adapter.GetAllAsync(ct);
            return Ok(rooms);
        }

        [SwaggerOperation(Summary = "Получение участников комнаты")]
        [HttpGet("{room}/participants")]
        [ProducesResponseType(typeof(RoomInfoResponse), 200)]
        public async Task<IActionResult> GetRoomParticipantsAsync(
            [FromRoute, SwaggerParameter("Название комнаты", Required = true)] string room,
            CancellationToken ct = default)
        {
            var roomInfo = await _adapter.GetRoomParticipantsAsync(room, ct);

            return Ok(roomInfo);
        }

        [SwaggerOperation(Summary = "Удаление комнаты")]
        [HttpDelete("{room}")]
        [ProducesResponseType(200)]
        public async Task<IActionResult> DeleteRoomAsync(
            [FromRoute] string room,
            CancellationToken ct = default)
        {
            await _adapter.DeleteRoomAsync(room, ct);
            return Ok();
        }

        [SwaggerOperation(Summary = "Создание комнаты")]
        [HttpPost]
        [ProducesResponseType(200)]
        public async Task<IActionResult> CreateRoomAsync(
           [FromBody] CreateRoomRequest request,
           CancellationToken ct = default)
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }
            
            await _adapter.CreateRoomAsync(request, ct);

            return Ok();
        }
    }
}

