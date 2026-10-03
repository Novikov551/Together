using System.Text.Json.Serialization;

namespace Together.Endpoints.LiveKit.Models.Responses;

public class LiveKitTokenResponse
{
    [JsonPropertyName("live_kit_token")]
    public string LiveKitToken { get; set; }

    [JsonPropertyName("live_kit_url")]
    public string LiveKitUrl { get; set; }
}
