using System.Text.Json.Serialization;

namespace Together.Endpoints.Rooms.Models.Responses
{
    public class RoomInfoResponse : RoomShortInfoResponse
    {
        [JsonPropertyName("participants")]
        public List<string> Participants { get; set; }
    }
}
