# Healthy Lifestyle Tracker

Track daily steps and weight progress with a .NET 8 Web API backend and an Expo-based mobile client.

## Repository structure

- `backend/HealthyApi/` — ASP.NET Core Web API (JWT auth, PostgreSQL, Swagger)
- `mobile/healthy-mobile/` — Expo React Native app

## Prerequisites

- .NET 8 SDK
- Node.js + npm
- PostgreSQL instance for the backend

## Backend setup

1. Configure connection string and JWT settings in
   `backend/HealthyApi/HealthyApi/appsettings.Development.json`:

   ```json
   {
     "ConnectionStrings": {
       "DefaultConnection": "Host=localhost;Database=healthy;Username=postgres;Password=your_password"
     },
     "Jwt": {
       "Issuer": "healthy-api",
       "Audience": "healthy-mobile",
       "Key": "replace-with-a-secure-key-44+chars"
     }
   }
   ```

   Use a 44+ character base64 secret (for example, `openssl rand -base64 32`) for HMAC-SHA256.

2. Apply migrations from `backend/HealthyApi/HealthyApi` for the first run or after schema changes:

   ```bash
   dotnet ef database update
   ```

3. Run the API:

   ```bash
   dotnet run --project backend/HealthyApi/HealthyApi/HealthyApi.csproj
   ```

   The API listens on `http://localhost:5104` with Swagger at `/swagger`.

## API overview

- `POST /api/Auth/register` — create account
- `POST /api/Auth/login` — returns JWT token
- `GET /api/Steps` / `POST /api/Steps` — steps history + create (requires `Authorization: Bearer <token>`)
- `GET /api/Weight` / `POST /api/Weight` — weight history + create (requires `Authorization: Bearer <token>`)

## Mobile app setup

1. Update the API base URL in `mobile/healthy-mobile/api/client.ts` (default is `http://192.168.0.19:5104/api`) to point to your backend, e.g. `http://localhost:5104/api`.
2. Install dependencies:

   ```bash
   cd mobile/healthy-mobile
   npm install
   ```

3. Start Expo:

   ```bash
   npm run start
   ```

## Linting/building

- Backend build: `dotnet build backend/HealthyApi/HealthyApi.sln`
- Mobile lint: `npm --prefix mobile/healthy-mobile run lint`
