using System.Text.Json.Serialization;

namespace Together.Endpoints.Rooms.Models.Requests
{
    public class CreateRoomRequest
    {
        [JsonPropertyName("name")]
        public string Name { get; set; }

        [JsonPropertyName("password")]
        public string? Password { get; set; }
    }
}
