# Internship Board

A responsive full-stack internship discovery and application portal built for the Edvyro Full-Stack Development internship tasks.

## Project overview

The project demonstrates the complete progression from a responsive vanilla-JavaScript internship board to a REST API, persistent SQLite data, secure application submission, testing, and deployment preparation.

## Features

### Task 02 — Responsive Internship Board
- Semantic HTML5 structure
- Responsive mobile, tablet, and desktop layout
- Vanilla JavaScript DOM rendering
- Search by keyword
- Domain filtering
- Pagination
- Loading, empty, and error states
- Accessible labels, skip link, focus states, keyboard-friendly controls
- Internship details dialog
- Application dialog

### Task 03 — REST API and Persistent Data
- Node.js + Express REST API
- SQLite persistence with `better-sqlite3`
- Automatic schema creation
- Seed data
- CRUD operations for internships
- Search and domain filtering
- Pagination
- Consistent JSON response format
- Validation and HTTP status codes
- Health endpoint

### Task 04 — Secure Application Integration
- Frontend connected to the REST API
- Application submission endpoint
- Client-side and server-side validation
- Duplicate application protection
- Helmet security headers
- Configurable CORS
- API rate limiting
- Parameterized SQL queries
- Request body size limit
- Safe production error responses
- Environment-variable support

### Task 05 — Production-Ready Capstone
- Responsive user journey
- API health check
- Automated API tests
- Deployment configuration for Vercel and Render
- Deployment documentation
- Security and accessibility documentation

## Tech stack

- HTML5
- CSS3
- Vanilla JavaScript
- Node.js 20+
- Express 5
- SQLite
- better-sqlite3
- Helmet
- Node.js built-in test runner

No frontend framework is used.

## Project structure

```text
internship-portal/
├── api/
│   └── index.js
├── index.html
├── style.css
├── script.js
├── server.js
├── db.js
├── schema.sql
├── seed.js
├── validation.js
├── api.test.js
├── package.json
├── vercel.json
├── render.yaml
├── .env.example
├── .gitignore
├── DEPLOYMENT.md
└── PROJECT_SUMMARY.md
```

## Local setup

### 1. Requirements

Install:
- Node.js 20 or newer
- npm

### 2. Install dependencies

```bash
npm install
```

### 3. Optional environment configuration

Copy `.env.example` to `.env` and set values when needed.

```text
ALLOWED_ORIGIN=
PORT=3000
```

For a same-origin deployment, `ALLOWED_ORIGIN` can remain empty.

### 4. Seed the database

The server automatically seeds an empty database. You can also run:

```bash
npm run seed
```

### 5. Start the application

```bash
npm start
```

Open:

```text
http://localhost:3000
```

Development mode:

```bash
npm run dev
```

## API

Base URL:

```text
/api
```

### Health

```http
GET /api/health
```

### List internships

```http
GET /api/internships?page=1&limit=6
```

Search:

```http
GET /api/internships?search=python
```

Filter:

```http
GET /api/internships?domain=Engineering
```

Combine filters:

```http
GET /api/internships?page=1&limit=6&search=remote&domain=Engineering
```

### Internship details

```http
GET /api/internships/:id
```

### Create internship

```http
POST /api/internships
Content-Type: application/json
```

Example:

```json
{
  "title": "Frontend Developer Intern",
  "company": "Example Labs",
  "location": "Remote",
  "domain": "Engineering",
  "type": "Internship",
  "duration": "3 months",
  "stipend": "₹15,000/month",
  "description": "Build responsive web interfaces.",
  "skills": ["HTML", "CSS", "JavaScript"],
  "apply_url": "https://example.com/apply"
}
```

### Update internship

```http
PUT /api/internships/:id
```

Uses the same JSON structure as create.

### Delete internship

```http
DELETE /api/internships/:id
```

### List domains

```http
GET /api/domains
```

### Submit application

```http
POST /api/applications
Content-Type: application/json
```

Example:

```json
{
  "internship_id": 1,
  "name": "Example Applicant",
  "email": "applicant@example.com",
  "phone": "+91 9876543210",
  "resume_url": "https://example.com/resume.pdf",
  "cover_note": "I am interested in this internship because I enjoy building web applications."
}
```

## Response format

Successful responses use:

```json
{
  "success": true,
  "data": {}
}
```

Errors use:

```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Please correct the highlighted fields.",
    "fields": {}
  }
}
```

## Testing

Run the automated API test suite:

```bash
npm test
```

The tests cover:
- Health endpoint
- Pagination and filtering
- Internship details
- Validation errors
- Internship create/update/delete
- Application submission
- Duplicate applications
- Application validation
- Unknown API routes

## Database

The project uses SQLite for simple persistent local/server storage.

The database is created automatically from `schema.sql`.

Tables:
- `internships`
- `applications`

Indexes are included for domain, creation time, and internship/application lookups.

### Production persistence note

SQLite persists correctly on a normal server filesystem. Vercel serverless functions do not provide durable local storage, so the included Vercel deployment is suitable as a demo but should use PostgreSQL/Supabase for durable production data.

For a durable production database, migrate the data layer to PostgreSQL and configure `DATABASE_URL` through the hosting provider.

## Security

Implemented:
- Helmet security headers
- `x-powered-by` disabled
- Configurable exact-origin CORS
- API rate limiting
- Stricter application rate limiting
- Parameterized SQLite queries
- Request body size limit
- Server-side validation
- Client-side validation
- Duplicate application protection
- Safe production error messages
- `.env` ignored by Git

Never commit:
- `.env`
- database secrets
- API keys
- private credentials

## Accessibility

Implemented:
- Semantic HTML
- Skip-to-content link
- Form labels
- `aria-live` status regions
- `role="alert"` error messages
- Visible keyboard focus
- Keyboard-operable buttons
- Dialog labels
- `aria-invalid` and error descriptions for invalid form fields
- Responsive touch-friendly controls

## Deployment

### Existing Vercel deployment

The repository includes:
- `api/index.js`
- `vercel.json`

After connecting the repository to Vercel, verify:

```text
/api/health
```

The current demo deployment shown in the project repository is:

https://internship-portal-ten-psi.vercel.app

### Render

The repository also includes `render.yaml`.

Use:

```text
Build command: npm install
Start command: npm start
Health check: /api/health
```

See `DEPLOYMENT.md` for details.

## Screenshots

Before final Edvyro submission, add these screenshots to a `screenshots/` directory:

```text
screenshots/
├── desktop.png
├── tablet.png
└── mobile.png
```

Recommended screenshots:
1. Desktop internship board
2. Tablet responsive layout
3. Mobile responsive layout
4. Application form / success state
5. API or test result if requested by the evaluator

## Submission checklist

- [x] Responsive internship board
- [x] Semantic HTML
- [x] Search and domain filtering
- [x] Pagination
- [x] Loading, empty, and error states
- [x] REST API
- [x] Persistent SQLite schema
- [x] CRUD endpoints
- [x] Input validation
- [x] Application endpoint
- [x] Client/server validation
- [x] Security headers
- [x] CORS configuration
- [x] Rate limiting
- [x] Parameterized queries
- [x] Automated API tests
- [x] Deployment configuration
- [x] Documentation
- [ ] Add final screenshots
- [ ] Verify final deployed URL immediately before submission

## Future improvements

- PostgreSQL/Supabase production database
- Authentication and role-based administration
- Admin dashboard
- Resume file upload storage
- Email notifications
- Saved internships
- Advanced filtering and sorting
