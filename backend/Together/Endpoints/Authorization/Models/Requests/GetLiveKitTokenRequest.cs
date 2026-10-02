using System.Text.Json.Serialization;

namespace Together.Endpoints.Authorization.Models.Requests
{
    public class GetLiveKitTokenRequest
    {
        [JsonPropertyName("display_name")]
        public string DisplayName { get; set; }

        [JsonPropertyName("room_name")]
        public string RoomName { get; set; }

        [JsonPropertyName("password")]
        public string? Password { get; set; }
    }
}
