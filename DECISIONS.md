# Decisions Log

Short notes on choices made and why.

- **Stack**: FastAPI + SQLAlchemy + Alembic + PostgreSQL (backend), React + TypeScript + ECharts (frontend). Matches the spec's tech requirements and prior experience.
  
- **JWT strategy**: single short-lived JWT, re-login on expiry, no refresh tokens. Spec explicitly allows either ("refresh/re-login strategy"). Refresh tokens add rotation/revocation complexity not justified at this scope.
  
- **Dataset storage**: CSVs have arbitrary/unknown columns, so we can't create a real SQL table per upload. Chose a generic `dataset_rows` table storing each row as JSON, with `datasets.column_names` tracking the schema. Alternative considered: dynamic `CREATE TABLE` per dataset though rejected as it seemed harder to manage, migrate, and query safely.
  
- **Auth style**: register/login take plain JSON `{email, password}` and return a JWT, per spec ("Returns JWT"). Not using FastAPI's default OAuth2 form-login,  that expects `application/x-www-form-urlencoded` username/password, which doesn't match the spec's JSON contract. Used `HTTPBearer` for protected-route auth instead of `OAuth2PasswordBearer`, since the latter assumes the form-login flow even for Swagger's UI.
  
- **Known issue hit**: `passlib`'s bcrypt backend breaks on newer `bcrypt` (>=4.1) due to a removed `__about__` attribute it checks for. Pinned `bcrypt==4.0.1` to fix.