# Deployment checklist

## Render / Railway / Fly.io style Node deployment

1. Push the repository to GitHub.
2. Create a Node web service.
3. Build command: `npm install`.
4. Start command: `npm start`.
5. The app reads `PORT` from the hosting platform.
6. Run `npm run seed` once if the deployment environment starts with an empty database.
7. Confirm `/api/health` returns `{"success":true,...}`.
8. Open the root URL and test search, filtering, details, and application submission.

## Important persistence note

SQLite is ideal for this learning project and local development. On hosting providers with ephemeral disks, a SQLite database can reset during redeploys. For a production capstone, move the database to PostgreSQL and store uploaded resumes in object storage rather than accepting arbitrary file uploads.
