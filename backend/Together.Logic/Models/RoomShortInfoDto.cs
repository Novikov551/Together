using System.Diagnostics.CodeAnalysis;

namespace Together.Logic.Models
{
    public record RoomShortInfoDto 
    {
        [SetsRequiredMembers]
        public RoomShortInfoDto(string name, bool isPrivate)
        {
            Name = name;
            IsPrivate = isPrivate;
        }

        public required string Name { get; init; }
        public required bool IsPrivate { get; init; }
    }
}
