# Deployment Guide

## Option 1: Render

The full application can run as one Node.js web service.

1. Connect the GitHub repository to Render.
2. Create a Web Service.
3. Branch: `main`.
4. Build command: `npm install`.
5. Start command: `npm start`.
6. Health check path: `/api/health`.
7. Deploy.
8. Open the generated URL and verify the board and `/api/health`.

### Persistent data

The included SQLite database is persistent on a normal server filesystem. If the hosting plan uses an ephemeral filesystem, use a persistent disk or migrate the data layer to PostgreSQL/Supabase.

## Option 2: Vercel

The repository includes `api/index.js` and `vercel.json`.

1. Import the GitHub repository into Vercel.
2. Keep the root directory as the repository root.
3. Deploy using the Node.js configuration.
4. Open the deployment URL.
5. Verify `/api/health`.
6. Verify the internship list and application flow.

### Important SQLite note

Vercel serverless functions should not be treated as durable SQLite storage. The database path is `/tmp` when `VERCEL` is set, which allows the demo to run but data may be lost when the function instance is replaced.

For real production persistence, migrate the database layer to PostgreSQL/Supabase and store the database connection string as an environment variable.

## Environment variables

Optional:

```text
PORT=3000
ALLOWED_ORIGIN=https://your-frontend.example.com
```

Do not commit `.env`.

## Deployment verification

Check:

```text
GET /api/health
GET /api/internships
GET /api/domains
```

Then:
1. Search for an internship.
2. Filter by domain.
3. Open details.
4. Submit a test application.
5. Confirm the success state.
6. Confirm invalid input produces validation feedback.
