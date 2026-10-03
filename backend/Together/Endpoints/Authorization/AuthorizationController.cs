using Microsoft.AspNetCore.Mvc;
using Microsoft.IdentityModel.Tokens;
using Swashbuckle.AspNetCore.Annotations;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Security.Cryptography;
using System.Text;
using Together.Endpoints.Authorization.Models.Requests;
using Together.Endpoints.Authorization.Models.Responses;

namespace Together.Endpoints.Authorization
{
    [SwaggerTag("Авторизация")]
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
            ct.ThrowIfCancellationRequested();

            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }

            var adminProfile = _config.GetSection("AdminProfile");

            if (!CryptographicOperations.FixedTimeEquals(Encoding.UTF8.GetBytes(request.UserName), Encoding.UTF8.GetBytes(adminProfile["user_name"])) 
                || !CryptographicOperations.FixedTimeEquals(Encoding.UTF8.GetBytes(request.Password), Encoding.UTF8.GetBytes(adminProfile["password"])))
            {
                return Unauthorized("Неверный логин или пароль");
            }

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
    }
}
