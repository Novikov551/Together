using System.Diagnostics.CodeAnalysis;

namespace Together.Logic.Models
{
    public record RoomInfoDto : RoomShortInfoDto
    {
        [SetsRequiredMembers]
        public RoomInfoDto(string name, List<string> participants, bool isPrivate)
            : base(name, isPrivate)
        {
            Participants = participants;
        }

        public required List<string> Participants { get; init; } = [];
    }
}
