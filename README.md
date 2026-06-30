# Purrfect Match MVP

Purrfect Match is a full-stack marketplace MVP that connects cat buyers with verified breeders through trusted listings, breeder certification, direct messaging, saved listings, reviews, and admin moderation.

## Current Product Scope

- Public visitors can browse and filter listings, open listing detail pages, and view public breeder profiles.
- Customers can register, log in, manage their profile and settings, save listings, message breeders, report suspicious listings, and review breeders.
- Breeders can apply for certification, manage their breeder profile, create listings with image uploads, delete their listings, and reply to customer conversations.
- Admins can review breeder certifications, moderate listing reports, inspect users, suspend or ban accounts, remove listings, and view dashboard stats.
- The backend includes JWT authentication, role-based access rules, SQLAlchemy models, Alembic migrations, PostgreSQL persistence, and Cloudinary-backed uploads.

## Tech Stack

### Frontend

- React 19
- Vite
- Tailwind CSS
- React Router
- Axios

### Backend

- Flask
- Flask-SQLAlchemy
- Flask-Migrate
- Flask-JWT-Extended
- Flask-CORS
- PostgreSQL
- Cloudinary SDK
- Pytest
- Gunicorn

### Infrastructure

- Docker
- Docker Compose
- Render Blueprint for the backend and production PostgreSQL
- Vercel-ready frontend deployment path

## Repository Structure

```text
.
|-- backend/
|   |-- app/
|   |   |-- config/
|   |   |-- middleware/
|   |   |-- models/
|   |   |-- routes/
|   |   |-- services/
|   |   |-- tests/
|   |   `-- utils/
|   |-- migrations/
|   |-- requirements.txt
|   `-- run.py
|-- frontend/
|   |-- public/
|   |-- src/
|   |   |-- components/
|   |   |-- context/
|   |   |-- hooks/
|   |   |-- pages/
|   |   |-- routes/
|   |   `-- services/
|   `-- package.json
|-- docker/
|-- docs/
|-- scripts/
|-- docker-compose.yml
|-- render.yaml
|-- .env.example
`-- README.md
```

## Environment Variables

Copy `.env.example` to `.env` before running the project locally.

| Variable | Purpose |
| --- | --- |
| `DATABASE_URL` | PostgreSQL connection string used by the backend. |
| `POSTGRES_DB` | Local Docker PostgreSQL database name. |
| `POSTGRES_USER` | Local Docker PostgreSQL user. |
| `POSTGRES_PASSWORD` | Local Docker PostgreSQL password. |
| `JWT_SECRET_KEY` | Secret used to sign JWT access tokens. |
| `CLOUDINARY_CLOUD_NAME` | Cloudinary cloud name for uploaded files. |
| `CLOUDINARY_API_KEY` | Cloudinary API key. |
| `CLOUDINARY_API_SECRET` | Cloudinary API secret. |
| `PORT` | Backend port, defaulting to `5000`. |
| `VITE_API_URL` | Frontend API target, for example `http://localhost:5000/api/v1`. |
| `PGADMIN_DEFAULT_EMAIL` | Optional pgAdmin login email for the Docker admin profile. |
| `PGADMIN_DEFAULT_PASSWORD` | Optional pgAdmin login password for the Docker admin profile. |

## Local Setup

### Recommended Docker Setup

```bash
cp .env.example .env
docker compose up --build
```

In another terminal, apply database migrations:

```bash
docker compose exec backend flask db upgrade
```

Local services:

- Frontend: `http://localhost:5173`
- Backend health check: `http://localhost:5000/api/v1/health`
- PostgreSQL: `localhost:5432`
- pgAdmin: `docker compose --profile admin up --build`, then open `http://localhost:5050`

### Backend Without Docker

Use this path only if PostgreSQL is already running and `DATABASE_URL` points to it.

```bash
cd backend
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
flask db upgrade
python run.py
```

On Windows PowerShell, activate the virtual environment with:

```powershell
.\.venv\Scripts\Activate.ps1
```

### Frontend Without Docker

```bash
cd frontend
npm install
npm run dev
```

## API Surface

The API is registered under `/api/v1`.

| Area | Main capabilities |
| --- | --- |
| `/health` | Service health checks. |
| `/auth` | Registration, login, and current authenticated user lookup. |
| `/users` | Current user profile, public user lookup, and saved listings. |
| `/breeders` | Breeder applications, authenticated breeder profile management, public breeder profiles, and breeder reviews. |
| `/listings` | Public listing search/detail, breeder listing creation/deletion, and listing reports. |
| `/conversations` | Conversation list/detail plus conversation message creation and retrieval. |
| `/messages` | Message read-status updates. |
| `/reviews` | Review updates and deletion by the review author. |
| `/admin` | Stats, certification review, report moderation, user management, account restrictions, and listing removal. |

## Frontend Routes

### Public

- `/`
- `/login`
- `/register`
- `/customer/listings`
- `/customer/listings/:listingId`
- `/breeders/:breederId`

### Customer

- `/customer/dashboard`
- `/customer/profile`
- `/customer/messages`
- `/customer/saved`
- `/customer/settings`

### Breeder

- `/breeder/dashboard`
- `/breeder/profile`
- `/breeder/certification`
- `/breeder/listings`
- `/breeder/messages`

### Admin

- `/admin/dashboard`
- `/admin/verifications`
- `/admin/verifications/:breederId`
- `/admin/reports`
- `/admin/reports/:reportId`
- `/admin/users`

## Testing And QA

Backend tests:

```bash
docker compose exec backend pytest app/tests
```

Backend smoke test:

```bash
bash scripts/api_smoke_tests.sh
```

The smoke test expects an upload fixture at `test/images/cat.png`. Add that fixture before running the script if it is not present locally.

Frontend checks:

```bash
cd frontend
npm run lint
npm run build
```

## Documentation Status

Existing repository docs:

- `docs/backend-manual-qa-checklist.md`
- `docs/backend-qa-execution-report.md`
- `docs/production-database-setup.md`
- `docs/purrfect-match-backend.postman_collection.json`
- `docs/purrfect-match-backend.postman_environment.json`

Recommended missing docs:

- `docs/api-reference.md` - a readable API reference. The Postman collection exists, but there is no Markdown endpoint guide.
- `docs/frontend-qa-checklist.md` - frontend manual QA coverage. Current QA docs focus on the backend.
- `docs/deployment-checklist.md` - full frontend plus backend deployment steps. The current production doc focuses mostly on the database/backend side.
- `docs/architecture.md` - system overview, data model summary, roles, and main user flows.
- `CONTRIBUTING.md` or `.github/pull_request_template.md` - contribution and pull request workflow guidance. The repository currently does not include a `.github/` folder.

## Deployment

### Backend On Render

The repo includes `render.yaml`, which defines:

- one Python backend web service
- one managed PostgreSQL database
- automatic `DATABASE_URL` injection
- startup migrations through `flask db upgrade && gunicorn run:app`
- health checks at `/api/v1/health`

Required Render secrets:

```text
JWT_SECRET_KEY
CLOUDINARY_CLOUD_NAME
CLOUDINARY_API_KEY
CLOUDINARY_API_SECRET
```

See `docs/production-database-setup.md` for production database notes.

### Frontend On Vercel

Deploy `frontend/` as the Vite app root and configure:

```text
VITE_API_URL=https://<backend-domain>/api/v1
```

## License

This project is licensed under the MIT License. See `LICENSE` for details.
