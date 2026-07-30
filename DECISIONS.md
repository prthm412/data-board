# Decisions Log

Short notes on choices made and why.

- **Stack**: FastAPI + SQLAlchemy + Alembic + PostgreSQL (backend), React + TypeScript + ECharts (frontend). Matches the spec's tech requirements and prior experience.
  
- **JWT strategy**: single short-lived JWT, re-login on expiry, no refresh tokens. Spec explicitly allows either ("refresh/re-login strategy"). Refresh tokens add rotation/revocation complexity not justified at this scope.
  
- **Dataset storage**: CSVs have arbitrary/unknown columns, so we can't create a real SQL table per upload. Chose a generic `dataset_rows` table storing each row as JSON, with `datasets.column_names` tracking the schema. Alternative considered: dynamic `CREATE TABLE` per dataset though rejected as it seemed harder to manage, migrate, and query safely.
  
- **Auth style**: register/login take plain JSON `{email, password}` and return a JWT, per spec ("Returns JWT"). Not using FastAPI's default OAuth2 form-login,  that expects `application/x-www-form-urlencoded` username/password, which doesn't match the spec's JSON contract. Used `HTTPBearer` for protected-route auth instead of `OAuth2PasswordBearer`, since the latter assumes the form-login flow even for Swagger's UI.
  
- **Known issue hit**: `passlib`'s bcrypt backend breaks on newer `bcrypt` (>=4.1) due to a removed `__about__` attribute it checks for. Pinned `bcrypt==4.0.1` to fix.

- **Pagination verified**: tested `GET /dataset` with 3 datasets, `limit=2`. page 1 returned 2 items, page 2 returned 1 item, `total` correct on both. Confirms it's real offset-based pagination, not stubbed.

- **Known issue hit**: pandas represents empty numeric columns as `float64` NaN, and re-assigning `None` via `df.where(pd.notnull(df), None)` doesn't stick for numeric dtypes. pandas silently converts it back to NaN. Postgres's JSON column type rejects NaN outright (invalid JSON). Fixed by converting to dict first, then replacing NaN with None per-value using `math.isnan()` before insert.

- **Plot response shape**: returns `col1`/`col2` as fixed keys per data point (not the actual column names) so the frontend chart code doesn't need to know column names to render — it just reads `.col1`/`.col2`. Real column names still returned separately for axis labels.

- **CORS**: backend needed explicit CORS middleware to accept requests from the frontend dev server origin (`localhost:5173`), otherwise browser blocks all API calls from the frontend.

- **Known issue hit**: scatter chart hardcoded a numeric X-axis, so plotting a text column (e.g. `city`, `name`) against a numeric one rendered empty/broken. Fixed by detecting whether X values are numeric and falling back to a category axis when they're not — same axis type line/bar charts already used.
  
- **Known issue hit**: nginx served the frontend correctly at `/`, but returned 404 on direct navigation or refresh at any other route (`/login`, `/data`, etc.) — because those routes only exist in React Router's client-side JS, not as real files. Fixed with `try_files $uri $uri/ /index.html` in nginx config so unmatched paths fall through to the SPA.

- **AuthContext split into 3 files**: `AuthContext.ts` (context + type), `AuthProvider.tsx` (component), `useAuth.ts` (hook) — required by ESLint's `react-refresh/only-export-components` rule, which wants files to export either only components or only non-components, not both, for Vite fast-refresh to work reliably.
  
- **DataPage effect wrapped in async function**: `react-hooks/set-state-in-effect` rule flagged calling `loadDatasets` (which sets state) directly in `useEffect`. Wrapped in an inner `async function` — standard pattern for async work inside effects, not a functional change.