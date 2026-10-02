using Livekit.Server.Sdk.Dotnet;
using Microsoft.Extensions.Options;
using Together.Integrations.Config;

namespace Together.Integrations
{
    public class LiveKitService
    {
        private readonly LiveKitConfig _config;
        private readonly RoomServiceClient _roomServiceClient;

        public LiveKitService(IOptions<LiveKitConfig> options)
        {
            _config = options.Value;

            if (!Uri.TryCreate(_config.HttpUrl, UriKind.Absolute, out _))
            {
                throw new ArgumentException($"LiveKit HttpUrl невалидный: '{_config.HttpUrl}'");
            }

            _roomServiceClient = new RoomServiceClient(_config.HttpUrl,
                _config.ApiKey,
                _config.ApiSecret);
        }

        public async Task<List<string>> GetRoomsAsync(CancellationToken ct = default)
        {
            ct.ThrowIfCancellationRequested();

            var response = await _roomServiceClient.ListRooms(new ListRoomsRequest());
            if(response == null)
            {
                throw new Exception("Ошибка LiveKit");//TODO потом кастомный сделать 
            }

            return response.Rooms.Select(e=>e.Name).ToList();
        }

        public async Task<List<string>> GetRoomParticipantsAsync(string roomName, CancellationToken ct = default)
        {
            ct.ThrowIfCancellationRequested();

            var response = await _roomServiceClient.ListParticipants(new ListParticipantsRequest
            {
                Room = roomName
            });

            if (response == null)
            {
                throw new Exception("Ошибка LiveKit");//TODO потом кастомный сделать 
            }

            return response.Participants.Select(e => e.Name).ToList();
        }

        public async Task<string> CreateRoomAsync(string roomName, CancellationToken ct = default)
        {
            ct.ThrowIfCancellationRequested();

            var response = await _roomServiceClient.CreateRoom(new CreateRoomRequest
            {
                Name = roomName,
            });

            if (response == null)
            {
                throw new Exception("Ошибка LiveKit");//TODO потом кастомный сделать 
            }

            return response.Name;
        }


        public async Task DeleteRoomAsync(string roomName, CancellationToken ct = default)
        {
            ct.ThrowIfCancellationRequested();
            await _roomServiceClient.DeleteRoom(new DeleteRoomRequest { Room = roomName });
        }

        public Task<string> GenerateTokenAsync(string displayName, string room, CancellationToken ct = default)
        {
            ct.ThrowIfCancellationRequested();

            // Генерируем уникальный identity
            var uniqueIdentity = $"{displayName}-{Random.Shared.Next(1000, 9999):X4}";

            var token = new AccessToken(_config.ApiKey, _config.ApiSecret)
                .WithIdentity(uniqueIdentity)
                .WithName(displayName)
                .WithGrants(new VideoGrants
                {
                    RoomJoin = true,
                    Room = room
                });

            return Task.FromResult(token.ToJwt());
        }

        public Task<string> GetWebSocketUrlAsync(CancellationToken ct = default)
        {
            ct.ThrowIfCancellationRequested();

            return Task.FromResult(_config.WebSocketUrl);
        }
    }
}
