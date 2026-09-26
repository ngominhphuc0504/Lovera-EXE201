# LOVERA API deployment (F00)

This directory is a separate deployment copy. The Rider project under `Downloads/Semester FPT/EXE201/lovera-backend 2` is unchanged by this copy.

## Runtime layout

- Build the root `Dockerfile` as one public API service. It listens on `0.0.0.0:8080`; the hosting platform terminates HTTPS and forwards requests to that port.
- Use a managed PostgreSQL database on the same platform and its private connection address. Do not expose the database to the public internet just to serve the API.
- Configure a persistent disk mounted at `/app/avatars` for uploaded avatar files. An ephemeral container filesystem loses these files on restart or redeploy. If the platform cannot provide a persistent disk, keep avatar upload disabled until object storage is implemented; accepting uploads without persistence would break F00.
- Use one API instance when `Database__ApplyMigrationsOnStartup=true`. With multiple instances, run EF Core migrations as a separate release job before starting the API.
- Configure a real SMTP service for verification messages. The local Mailpit container is only for development.

## Required runtime environment

| Name | Example shape | Purpose |
| --- | --- | --- |
| `ASPNETCORE_URLS` | `http://0.0.0.0:8080` | Internal HTTP listener; HTTPS is provided by the hosting platform. |
| `ConnectionStrings__Default` | `Host=<private-db-host>;Port=5432;Database=<db>;Username=<user>;Password=<secret>` | PostgreSQL connection. Add the platform's SSL settings if required. |
| `Otp__Pepper` | a private random value of at least 32 characters | Hashes email verification codes. Keep the value stable across deployments. |
| `Cors__AllowedOrigins` | `https://frontend.example.com` | Exact frontend origin(s), comma separated, without a trailing slash. Leave empty until the frontend origin is known. |
| `Smtp__Host` | provider SMTP hostname | Email verification delivery. |
| `Smtp__Port` | `587` | SMTP port. |
| `Smtp__EnableSsl` | `true` | SMTP TLS/STARTTLS. |
| `Smtp__From` | verified sender address | Sender shown to users. |
| `Smtp__Username` | provider account | SMTP authentication. |
| `Smtp__Password` | private value | SMTP authentication. |
| `Avatar__Directory` | `/app/avatars` | Must be on a persistent disk. |
| `Database__ApplyMigrationsOnStartup` | `true` | Apply EF Core migrations before accepting traffic on a single instance. |

Add sensitive values in the platform's secret/environment settings, never in `appsettings.json`, a repository, or a Docker build argument. The previously shared Gmail and Cloudinary credentials must be rotated before any public deployment.

## API checks

- Set the service's HTTP health check path to `/health/ready`. It returns 200 only when the API can query PostgreSQL.
- After the platform provides a public HTTPS hostname, open `https://<api-host>/swagger/index.html` to inspect F00. Frontend code uses `https://<api-host>` as its API base URL.
- From the frontend origin, a browser preflight request to `OPTIONS /api/auth/login` should receive `Access-Control-Allow-Origin` for that origin. Other origins should not receive the header.
- Register a test account, verify the OTP through the configured mailbox, log in, read `/api/profile/me`, upload an avatar, and read it after a redeploy to confirm storage persistence.

The current backend implements F00 only. F01–F06 are not part of this deployment copy.
