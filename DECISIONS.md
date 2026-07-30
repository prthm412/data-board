# Decisions Log

Short notes on choices made and why.

- **Stack**: FastAPI + SQLAlchemy + Alembic + PostgreSQL (backend), React + TypeScript + ECharts (frontend). Matches the spec's tech requirements and prior experience.
- **JWT strategy**: single short-lived JWT, re-login on expiry, no refresh tokens. Spec explicitly allows either ("refresh/re-login strategy"). Refresh tokens add rotation/revocation complexity not justified at this scope.
- **Dataset storage**: CSVs have arbitrary/unknown columns, so we can't create a real SQL table per upload. Chose a generic `dataset_rows` table storing each row as JSON, with `datasets.column_names` tracking the schema. Alternative considered: dynamic `CREATE TABLE` per dataset though rejected as it seemed harder to manage, migrate, and query safely.
