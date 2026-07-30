# Decisions Log

Short notes on choices made and why.

- **Stack**: FastAPI + SQLAlchemy + Alembic + PostgreSQL (backend), React + TypeScript + ECharts (frontend). Matches the spec's tech requirements and prior experience.
- **JWT strategy**: single short-lived JWT, re-login on expiry, no refresh tokens. Spec explicitly allows either ("refresh/re-login strategy"). Refresh tokens add rotation/revocation complexity not justified at this scope.
