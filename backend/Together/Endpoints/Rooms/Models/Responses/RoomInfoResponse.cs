using System.Text.Json.Serialization;

namespace Together.Endpoints.Rooms.Models.Responses
{
    public class RoomInfoResponse
    {
        [JsonPropertyName("participants")]
        public List<string> Participants { get; set; }

        [JsonPropertyName("name")]
        public string Name { get; set; }

        [JsonPropertyName("is_private")]
        public bool IsPrivate { get; set; }
    }
}
