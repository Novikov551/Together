using System.ComponentModel.DataAnnotations;

namespace Together.Integrations.Config
{
    public class LiveKitConfig
    {
        [Required]
        public string ApiKey { get; set; }

        [Required]
        public string ApiSecret { get; set; }

        [Required]
        public string WebSocketUrl { get; set; }

        [Required]
        public string HttpUrl { get; set; }
    }
}
