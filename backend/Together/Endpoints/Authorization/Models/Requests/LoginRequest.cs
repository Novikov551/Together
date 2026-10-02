using System.Text.Json.Serialization;

namespace Together.Endpoints.Authorization.Models.Requests
{
    public class LoginRequest
    {
        [JsonPropertyName("user_name")]
        public string UserName { get; set; }

        [JsonPropertyName("password")]
        public string Password { get; set; }
    }
}
