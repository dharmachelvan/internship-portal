# Deployment guide

## Recommended: Render

The full application can run as one Node.js web service.

1. Connect the GitHub repository to Render.
2. Create a **Web Service**.
3. Branch: `main`.
4. Build command: `npm install`.
5. Start command: `npm start`.
6. Health check path: `/api/health`.
7. Deploy.
8. Open the generated `onrender.com` URL and test the board.

## Vercel

The repository includes `api/index.js` and `vercel.json` for Vercel.

1. Import the GitHub repository into Vercel.
2. Keep the root directory as the repository root.
3. Use the default Node.js detection.
4. Deploy.
5. Open the deployment URL.
6. Verify `/api/health`.

### Important SQLite note

Vercel's serverless filesystem is not a durable database. The app therefore stores the Vercel demo SQLite file under `/tmp`. Data can disappear when the function instance is replaced. For real persistent data, use PostgreSQL/Supabase.
