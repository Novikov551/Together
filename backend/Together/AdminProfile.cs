using System.ComponentModel.DataAnnotations;
using System.Text.Json.Serialization;

namespace Together
{
    public class AdminProfile
    {
        [JsonPropertyName("user_name")]
        [Required]
        public string UserName { get; set; }

        [JsonPropertyName("password")]
        [Required]
        public string Password { get; set; }
    }
}
