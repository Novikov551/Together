using System;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using Livekit.Server.Sdk.Dotnet;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Configuration;
using Microsoft.IdentityModel.Tokens;
using Swashbuckle.AspNetCore.Annotations;
using Together.Endpoints.Authorization.Models.Requests;
using Together.Endpoints.Authorization.Models.Responses;

namespace Together.Endpoints.Authorization
{
    [SwaggerTag("Пользовательский справочник культур")]
    [Route("api/authorization")]
    public class AuthorizationController : BaseController
    {
        private readonly IConfiguration _config;

        public AuthorizationController(IConfiguration config)
        {
            _config = config;
        }

        [SwaggerOperation(Summary = "Вход")]
        [HttpPost("login")]
        [ProducesResponseType(typeof(LoginResponse), 200)]
        public async Task<IActionResult> LoginAsync([FromBody] LoginRequest request, CancellationToken ct = default)
        {
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
        public IActionResult GetLiveKitToken([FromBody] GetLiveKitTokenRequest request)
        {
            var liveKitConfig = _config.GetSection("LiveKit");
            var apiKey = liveKitConfig["ApiKey"];
            var apiSecret = liveKitConfig["ApiSecret"];

            // Генерируем уникальный identity
            var uniqueIdentity = $"{request.DisplayName}-{Random.Shared.Next(1000, 9999):X4}";

            var token = new AccessToken(apiKey, apiSecret)
                .WithIdentity(uniqueIdentity)
                .WithName(request.DisplayName)
                .WithGrants(new VideoGrants
                {
                    RoomJoin = true,
                    Room = request.RoomName 
                });

            return Ok(new LiveKitTokenResponse
            {
                LiveKitToken = token.ToJwt(),
                LiveKitUrl = liveKitConfig["WebSocketUrl"]
            });
        }
    }
}
