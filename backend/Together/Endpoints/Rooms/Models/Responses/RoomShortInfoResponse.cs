using System.Text.Json.Serialization;

namespace Together.Endpoints.Rooms.Models.Responses
{
    public class RoomShortInfoResponse
    {
        [JsonPropertyName("name")]
        public string Name { get; set; }

        [JsonPropertyName("is_private")]
        public bool IsPrivate { get; set; }
    }
}