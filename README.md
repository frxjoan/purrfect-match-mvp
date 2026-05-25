# Purrfect Match MVP

Purrfect Match is a fullstack marketplace MVP that connects verified cat breeders with buyers through trusted listings, breeder verification, and direct messaging.

## Architecture overview

This repository is organized as a monorepo so the frontend, backend, infrastructure, and documentation can evolve together:

- `frontend/` – React + Vite UI with TailwindCSS, routing, shared components, hooks, and service modules.
- `backend/` – Flask REST API using an app factory, SQLAlchemy, JWT auth, Flask-Migrate, and placeholder blueprints.
- `docker/` – Dockerfiles for the frontend and backend services.
- `docs/` – Reserved for product and technical documentation.
- `.github/` – Collaboration defaults such as the pull request template.

## Tech stack

### Frontend
- React 19
- Vite
- TailwindCSS
- React Router
- Axios

### Backend
- Flask
- Flask-SQLAlchemy
- Flask-Migrate
- Flask-JWT-Extended
- Flask-CORS
- Cloudinary SDK
- PostgreSQL
- Pytest

### DevOps
- Docker
- Docker Compose
- Vercel-ready frontend deployment path
- Render/Railway-ready backend deployment path

## Repository structure

```text
project-root/
├── frontend/
│   ├── src/
│   ├── public/
│   ├── components/
│   ├── pages/
│   ├── services/
│   ├── context/
│   ├── hooks/
│   ├── routes/
│   ├── assets/
│   └── tests/
├── backend/
│   ├── app/
│   │   ├── models/
│   │   ├── routes/
│   │   ├── services/
│   │   ├── middleware/
│   │   ├── utils/
│   │   ├── config/
│   │   └── tests/
│   ├── migrations/
│   ├── requirements.txt
│   ├── run.py
│   └── .flaskenv
├── docker/
├── docs/
├── .github/
│   └── pull_request_template.md
├── docker-compose.yml
├── .env.example
├── .gitignore
├── README.md
└── LICENSE
```

## Installation instructions

### 1. Clone and configure environment variables

```bash
git clone <repository-url>
cd purrfect-match-mvp
cp .env.example .env
```

Update the copied `.env` file with real secrets before running services.

### 2. Frontend setup

```bash
cd frontend
npm install
npm run dev
```

The frontend expects `VITE_API_URL` to target the Flask API, for example `http://localhost:5000/api/v1`.

### 3. Backend setup

```bash
cd backend
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
python run.py
```

The backend reads PostgreSQL, JWT, and Cloudinary credentials from environment variables only.

## Docker instructions

```bash
cp .env.example .env
docker compose up --build
```

Available services:

- Frontend: `http://localhost:5173`
- Backend API: `http://localhost:5000/api/v1/health`
- PostgreSQL: `localhost:5432`
- pgAdmin (optional): `docker compose --profile admin up --build`

## Development workflow

1. Create a branch from `develop`.
2. Add or update backend routes, services, and models inside `backend/app/`.
3. Build reusable frontend UI in `frontend/components/` and route pages in `frontend/pages/`.
4. Validate changes locally before opening a pull request.

## Branching strategy

Recommended branches:

- `main` – production-ready history
- `develop` – integration branch for upcoming work
- `feature/*` – new features
- `fix/*` – bug fixes

## API overview

Initial placeholder REST resources are registered under `/api/v1`:

- `/auth`
- `/users`
- `/breeders`
- `/listings`
- `/conversations`
- `/admin`
- `/health`

These routes return placeholder JSON responses so Sprint 1 can begin from a clean, modular Flask blueprint structure.

## Initial frontend routes

The frontend currently includes placeholder pages for:

- Home
- Login
- Register
- Listings
- Listing detail
- Breeder dashboard
- Messages

## Deployment overview

- **Frontend**: deploy the `frontend/` app to Vercel with `VITE_API_URL` configured for the deployed backend.
- **Backend**: deploy the `backend/` app to Render or Railway with PostgreSQL and environment variables configured in the platform dashboard.
- **Database**: use managed PostgreSQL in production and keep secrets in deployment environment settings.

## GitHub workflow recommendations

- Require pull requests into `main` and `develop`.
- Use the PR template in `.github/pull_request_template.md`.
- Prefer small feature branches with focused review scope.
- Run frontend build/lint and backend tests before requesting review.
- Protect `main` with reviews and CI checks once workflows are added.
