FROM mcr.microsoft.com/dotnet/aspnet:9.0 AS base
WORKDIR /app
EXPOSE 5163

FROM mcr.microsoft.com/dotnet/sdk:9.0 AS build
WORKDIR /src
COPY ["Together/Together.csproj", "Together/"]
COPY ["Together.Logic/Together.Logic.csproj", "Together.Logic/"]
COPY ["Together.Integrations/Together.Integrations.csproj", "Together.Integrations/"]
RUN dotnet restore "Together/Together.csproj"
COPY Together/ Together/
COPY Together.Logic/ Together.Logic/
COPY Together.Integrations/ Together.Integrations/
WORKDIR /src/Together
RUN dotnet build "Together.csproj" -c Release -o /app/build

FROM build AS publish
RUN dotnet publish "Together.csproj" -c Release -o /app/publish

FROM base AS final
WORKDIR /app
COPY --from=publish /app/publish .
ENV ASPNETCORE_URLS=http://+:5163
ENV ASPNETCORE_ENVIRONMENT=Development
ENTRYPOINT ["dotnet", "Together.dll"]