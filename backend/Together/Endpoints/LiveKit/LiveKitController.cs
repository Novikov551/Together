using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Swashbuckle.AspNetCore.Annotations;
using Together.Endpoints.Authorization.Models.Requests;
using Together.Endpoints.Authorization.Models.Responses;
using Together.Integrations.LiveKit;
using Together.Logic.Rooms;

namespace Together.Endpoints.LiveKit
{
    [SwaggerTag("livekit")]
    [Route("api/livekit")]
    public class LiveKitController : BaseController
    {
        private readonly IRoomService _roomService;
        private readonly ILiveKitService _liveKitService;

        public LiveKitController(IRoomService roomStoreService,
            ILiveKitService liveKitService)
        {
            _roomService = roomStoreService;
            _liveKitService = liveKitService;
        }

        [Authorize]
        [SwaggerOperation(Summary = "Получение токена LiveKit")]
        [HttpPost("token")]
        [ProducesResponseType(200)]
        public async Task<IActionResult> GetLiveKitToken([FromBody] GetLiveKitTokenRequest request,
            CancellationToken ct = default)
        {
            var result = await _roomService.ValidatePasswordAsync(request.RoomName, request.Password, ct);
            if (!result)
            {
                return Unauthorized("Неверный пароль от комнаты");
            }

            var token = await _liveKitService.GenerateTokenAsync(request.DisplayName, request.RoomName, ct);
            var url = await _liveKitService.GetWebSocketUrlAsync(ct);

            return Ok(new LiveKitTokenResponse
            {
                LiveKitToken = token,
                LiveKitUrl = url
            });
        }
    }
}
