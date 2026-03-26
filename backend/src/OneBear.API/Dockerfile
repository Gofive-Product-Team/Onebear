FROM mcr.microsoft.com/dotnet/aspnet:9.0 AS base
WORKDIR /app
EXPOSE 8080

FROM mcr.microsoft.com/dotnet/sdk:9.0 AS build
WORKDIR /src
COPY ["src/OneBear.API/OneBear.API.csproj", "src/OneBear.API/"]
COPY ["src/OneBear.Application/OneBear.Application.csproj", "src/OneBear.Application/"]
COPY ["src/OneBear.Domain/OneBear.Domain.csproj", "src/OneBear.Domain/"]
COPY ["src/OneBear.Infrastructure/OneBear.Infrastructure.csproj", "src/OneBear.Infrastructure/"]
COPY ["Directory.Build.props", "."]
RUN dotnet restore "src/OneBear.API/OneBear.API.csproj"
COPY . .
WORKDIR "/src/src/OneBear.API"
RUN dotnet publish -c Release -o /app/publish /p:UseAppHost=false

FROM base AS final
WORKDIR /app
COPY --from=build /app/publish .
ENTRYPOINT ["dotnet", "OneBear.API.dll"]
