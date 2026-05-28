# Frontend (Purrfect Match MVP)

This folder contains the React + Vite frontend for the Purrfect Match MVP.

Run locally (requires Node 18+ and npm):

```bash
cd frontend
npm install
npm run dev -- --host 0.0.0.0
```

Run in Docker (uses docker/docker frontend image by default via root docker-compose):

```bash
# from repository root
docker compose up --build frontend
```

Environment variables:
- VITE_API_URL - base URL for the Flask backend API (e.g. http://localhost:5000)