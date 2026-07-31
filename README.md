# xVectorLabs Data App

Upload CSV datasets, preview them, compute column statistics, and visualize two columns
as an interactive chart.

## Stack

- Backend: FastAPI, SQLAlchemy, Alembic, PostgreSQL
- Frontend: React, TypeScript, Apache ECharts
- Auth: JWT (single token, expiry + re-login (see "JWT strategy" below))

## Setup

There are two ways to run this: via Docker (recommended, one command) or running
backend/frontend locally.

### Option A : Docker (recommended)

Requires Docker Desktop.

```bash
docker compose up --build
```

This starts Postgres, runs migrations automatically, and serves:
- Backend: http://localhost:8000
- Frontend: http://localhost:5173
- API docs: http://localhost:8000/docs

### Option B : Local (backend + frontend separately)

The requirement is Python 3.12 or later, Node 20 or later, and Docker (note: this is only for Postgres).

**1. Start Postgres:**
```bash
docker compose up -d db
```

**2. Backend:**
```bash
cd backend
python -m venv .venv
Activate source .venv/Scripts/activate  # On Windows in Git Bash; on Mac/Linux use .venv/bin/activate
pip install -r requirements.txt
cp .env.example .env
alembic upgrade head
uvicorn app.main:app --reload
```
Backend runs at http://localhost:8000, docs at http://localhost:8000/docs

**3. Frontend (separate terminal):**
```bash
cd frontend
npm install
cp .env.example .env
npm run dev
```
Frontend runs at http://localhost:5173

## Running tests

Since backend tests make use of their own test database, they never come into contact with your actual data.

```bash
docker compose up -d test_db
cd backend
pytest -v
```

Tests cover the compute endpoint's edge cases specifically: empty column, all-null
Column, and non-numeric column asked for as a numeric operation.

## Trying it out

For testing the upload and preview, a sample CSV is provided at sample-data/sample.csv,
compute, and plot.

## JWT strategy

Single short-lived JWT (default 30 min, configurable via `ACCESS_TOKEN_EXPIRE_MINUTES`
in `.env`), given at login. There is no refresh-token endpoint. When the token expires, the
client re-authenticates via `/auth/login`.

It was a purposeful decision to go with a refresh-token flow. Refresh tokens do introduce a great deal of complexity—such as the need to rotate them, to revoke them when a user logs out, and to store the second token securely—which is not something that can be justified given the scope of this project. In a production system that is processing sensitive data or which requires longer sessions without having to re-prompt the user, implementing a rotating refresh token with revocation would be the usual next step.

## Technical assumptions

- **Dataset storage**: CSVs have arbitrary, unknown-ahead-of-time columns, so rows
  are stored as JSON in a generic `dataset_rows` table rather than creating a real
  There is a separate SQL table for each upload, and `datasets.column_names` keeps track of each dataset's schema.
- **Ownership**: a user is limited to seeing, previewing or deleting their own datasets. Accessing
  another user's dataset by ID returns a plain 404, not a 403 — so a user can't even
  State whether the given ID belongs to someone else.
- **Compute endpoint edge cases**: empty dataset (zero rows), all-null values in the
  requested column, and non-numeric values requested for a numeric operation are all
  is dealt with explicitly and included in the tests in accordance with the specifications' requirements.
- **Pagination**: `GET /dataset` implements real offset-based pagination (`page`,
  This was manually verified by means of a scenario involving three datasets and two entries per page before it was relied upon.
- **Plot response shape**: the plot endpoint returns fixed `col1`/`col2` keys per data
  point rather than the actual column names, so frontend chart code doesn't need to
  the names of the columns needed in order to render them—it simply accesses them via `.col1`/`.col2`. The actual column names are
  The components were returned individually so that the axis labels could be assigned.
- For CSV parsing, pandas is used and empty or missing values are explicitly converted into null.
  before storage (pandas represents them internally as `NaN`, which is not valid JSON
  it would otherwise fail when inserting).