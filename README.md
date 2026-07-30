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

_(to be filled in)_

## Technical assumptions

_(to be filled in)_