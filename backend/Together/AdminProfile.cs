using System.ComponentModel.DataAnnotations;
using System.Text.Json.Serialization;

namespace Together
{
    public class AdminProfile
    {
        [JsonPropertyName("user_name")]
        public string UserName { get; set; }

        [JsonPropertyName("password")]
        public string Password { get; set; }
    }
}
