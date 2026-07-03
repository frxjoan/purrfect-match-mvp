# Production Database Setup

Scope: backend production PostgreSQL setup for Purrfect Match.

## Current Local Status

Local Docker DB is ready:

- PostgreSQL service: `postgres`
- Database: `purrfect_match`
- Alembic revision: `8b2c7d4e5f10`
- Backend tests: `37 passed`

Useful local checks:

```bash
cd ~/purrfect-match-mvp
docker compose up -d postgres backend
docker compose exec -T backend flask db upgrade
docker compose exec -T backend flask db current
docker compose exec -T postgres psql -U postgres -d purrfect_match -c "\dt"
docker compose exec -T backend pytest app/tests
```

## Render Setup

This repo includes `render.yaml` for a Render Blueprint.

It creates:

- one Python backend service
- one managed PostgreSQL database
- automatic `DATABASE_URL` injection into the backend service

The backend start command is:

```bash
flask db upgrade && gunicorn run:app
```

That means migrations are applied when the service starts.

### Required Render Environment Variables

Set these manually in Render because they are secrets:

```text
JWT_SECRET_KEY
CLOUDINARY_CLOUD_NAME
CLOUDINARY_API_KEY
CLOUDINARY_API_SECRET
```

Render provides:

```text
DATABASE_URL
```

The app already normalizes `postgres://` to `postgresql://`, so Render-style URLs are supported.

### Health Check

Use:

```text
/api/v1/health
```

Expected response:

```json
{
  "success": true,
  "data": {
    "service": "backend",
    "status": "ok"
  }
}
```

## Railway Setup

If using Railway instead of Render:

1. Create a PostgreSQL database service.
2. Create a backend service from the `backend/` directory.
3. Set the backend start command:

```bash
flask db upgrade && gunicorn run:app
```

4. Add environment variables:

```text
DATABASE_URL=<Railway PostgreSQL connection string>
FLASK_ENV=production
JWT_SECRET_KEY=<long random secret>
CLOUDINARY_CLOUD_NAME=<cloud name>
CLOUDINARY_API_KEY=<api key>
CLOUDINARY_API_SECRET=<api secret>
PORT=<platform-provided port if required>
```

5. Verify:

```bash
curl https://<backend-url>/api/v1/health
```

## Production DB Smoke Checks

After deployment:

```bash
curl https://<backend-url>/api/v1/health
```

Then test the main API flow with either:

- Postman collection: `docs/purrfect-match-backend.postman_collection.json`
- Local smoke test adapted with `API=https://<backend-url>/api/v1`

```bash
API=https://<backend-url>/api/v1 bash scripts/api_smoke_tests.sh
```

Only run the smoke test against production if you are comfortable creating temporary test data there.

## Rollback Notes

If a migration breaks production startup:

1. Check service logs.
2. Check the current Alembic revision.
3. Fix forward with a new migration when possible.
4. Avoid manually editing production schema unless absolutely necessary.
