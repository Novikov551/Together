using System.Text.Json.Serialization;

namespace Together.Endpoints.Authorization.Models.Responses
{
    public class LoginResponse
    {
        [JsonPropertyName("session_token")]
        public string SessionToken { get; set; }
    }
}
