using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.IdentityModel.Tokens;
using Swashbuckle.AspNetCore.Annotations;
using Together.Endpoints.Authorization.Models.Requests;
using Together.Endpoints.Authorization.Models.Responses;
using Together.Integrations;
using Together.Logic.Rooms;

namespace Together.Endpoints.Authorization
{
    [SwaggerTag("Авторизация")]
    [Route("api/authorization")]
    public class AuthorizationController : BaseController
    {
        private readonly IConfiguration _config;
        private readonly IRoomService _roomStoreService;
        private readonly LiveKitService _liveKitService;

        public AuthorizationController(IConfiguration config,
            IRoomService roomStoreService,
            LiveKitService liveKitService)
        {
            _config = config;
            _roomStoreService = roomStoreService;
            _liveKitService = liveKitService;
        }

        [SwaggerOperation(Summary = "Вход")]
        [HttpPost("login")]
        [ProducesResponseType(typeof(LoginResponse), 200)]
        public async Task<IActionResult> LoginAsync([FromBody] LoginRequest request, CancellationToken ct = default)
        {
            ct.ThrowIfCancellationRequested();

            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }

            var adminProfile = _config.GetSection("AdminProfile");

            if (request.UserName != adminProfile["user_name"] || request.Password != adminProfile["password"])
                return Unauthorized("Неверный логин или пароль");

            // Генерируем сессионный JWT
            var jwtSecret = _config["Jwt:Secret"];
            var key = Encoding.UTF8.GetBytes(jwtSecret);
            var tokenHandler = new JwtSecurityTokenHandler();
            var tokenDescriptor = new SecurityTokenDescriptor
            {
                Subject = new ClaimsIdentity(new[] { new Claim(ClaimTypes.Name, request.UserName) }),
                Expires = DateTime.UtcNow.AddHours(1),
                SigningCredentials = new SigningCredentials(new SymmetricSecurityKey(key), SecurityAlgorithms.HmacSha256Signature)
            };
            var securityToken = tokenHandler.CreateToken(tokenDescriptor);
            var sessionToken = tokenHandler.WriteToken(securityToken);

            // Возвращаем только сессионный токен (без списка комнат)
            return Ok(new { sessionToken });
        }

        [Authorize]
        [SwaggerOperation(Summary = "Получение токена LiveKit")]
        [HttpPost("token")]
        [ProducesResponseType(200)]
        public async Task<IActionResult> GetLiveKitToken([FromBody] GetLiveKitTokenRequest request,
            CancellationToken ct = default)
        {
            var result = await _roomStoreService.ValidatePasswordAsync(request.RoomName, request.Password, ct);
            if(!result)
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
