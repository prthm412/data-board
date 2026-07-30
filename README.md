# xVectorLabs DataBoard App

Upload CSV datasets, preview them, compute column statistics, and visualize two columns
as an interactive chart.

## Stack

- Backend: FastAPI, SQLAlchemy, Alembic, PostgreSQL
- Frontend: React, TypeScript, Apache ECharts
- Auth: JWT

## Setup

1. Start Postgres:
```bash
   docker compose up -d
```
2. Create backend virtual environment and install dependencies:
```bash
   cd backend
   python -m venv .venv
   source .venv/Scripts/activate   # Windows Git Bash
   pip install -r requirements.txt
```
3. Copy `.env.example` to `.env` and adjust values if needed:
```bash
   cp .env.example .env
```
4. Run migrations:
```bash
   alembic upgrade head
```

## Running

_(to be filled in)_

## Running tests

_(to be filled in)_

## JWT strategy

Single short-lived JWT (default 30 min, see `.env`), issued on login, no refresh
token endpoint. When it expires, the client re-authenticates via `/auth/login`.

Chosen over a refresh-token flow because the added complexity (rotation, revocation,
secure storage of a second token) isn't justified at this project's scope. In a
production system handling sensitive data or requiring longer sessions, a rotating
refresh token with revocation on logout would be the next step.

## Technical assumptions

_(to be filled in)_