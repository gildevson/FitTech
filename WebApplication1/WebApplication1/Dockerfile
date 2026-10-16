# API FitTech (.NET 9) para hospedagem em container (Render, Railway, Fly...)
FROM mcr.microsoft.com/dotnet/sdk:9.0 AS build
WORKDIR /src
COPY WebApplication1.csproj .
RUN dotnet restore WebApplication1.csproj
COPY . .
RUN dotnet publish WebApplication1.csproj -c Release -o /app --no-restore

FROM mcr.microsoft.com/dotnet/aspnet:9.0
WORKDIR /app
COPY --from=build /app .
# O Render informa a porta na variável PORT; sem ela, usa 8080
ENV ASPNETCORE_ENVIRONMENT=Production
EXPOSE 8080
CMD ["sh", "-c", "ASPNETCORE_URLS=http://0.0.0.0:${PORT:-8080} dotnet WebApplication1.dll"]
