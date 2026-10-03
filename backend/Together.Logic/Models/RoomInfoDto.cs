using System.Diagnostics.CodeAnalysis;

namespace Together.Logic.Models
{
    public record RoomInfoDto
    {
        [SetsRequiredMembers]
        public RoomInfoDto(string name, List<string> participants, bool isPrivate)
        {
            Participants = participants;
            Name = name;
            IsPrivate = isPrivate;
        }

        public required List<string> Participants { get; init; } = [];
        public required string Name { get; init; }
        public required bool IsPrivate { get; init; }
    }
}
