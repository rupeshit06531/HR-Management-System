# HR Management System

A role-based Human Resource Management System built with Django REST Framework and React, TypeScript, and Vite.

## Features

- Employee, department, and designation management
- Attendance and leave workflows
- Payroll summaries and performance reviews
- Recruitment and candidate tracking
- Holiday calendar, announcements, and document management
- Role-aware dashboards for Super Admin, HR, Manager, and Employee

## Technology

- Python 3.12+ and Django REST Framework
- Node.js 20.19+ (or 22.12+) and npm
- React, TypeScript, and Vite
- SQLite for local development; PostgreSQL settings are available for deployment

## Open and run in VS Code (Windows)

Open the repository folder (`HR-Management-System`) in VS Code. Use two integrated terminals: one for Django and one for the frontend. The local defaults work without creating an environment file.

### 1. Start the backend

In the first PowerShell terminal:

```powershell
cd backend
py -3 -m venv venv
.\venv\Scripts\Activate.ps1
python -m pip install -r requirements.txt
python manage.py migrate
python manage.py runserver
```

Confirm that the Python version selected by `py -3` is 3.12 or newer before installing requirements.

If PowerShell blocks virtual environment activation, run `Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass` in that terminal, then activate again. The policy change applies only to the current terminal process.

Create an administrator account in a second backend terminal (activate the same environment first):

```powershell
cd backend
.\venv\Scripts\Activate.ps1
python manage.py createsuperuser
```

The custom user role defaults to Employee. To use admin-only features, sign into Django Admin at `http://127.0.0.1:8000/admin/` and assign the appropriate role to the account. Keep development credentials local.

### 2. Start the frontend

In the second VS Code terminal:

```powershell
cd frontend
npm install
npm run dev
```

Open the Vite URL printed in the terminal, usually `http://localhost:5173`. The API runs at `http://127.0.0.1:8000`. If Vite selects another port, use the URL it prints.

## Frontend commands

Run these from `frontend/`:

```powershell
npm run dev      # Start the local development server
npm run lint     # Check frontend code
npm run build    # Type-check and create a production build
npm run preview  # Preview the production build locally
```

## Backend commands

Run these from `backend/` with the virtual environment active:

```powershell
python manage.py check       # Check Django configuration
python manage.py makemigrations  # Generate migrations after model changes
python manage.py migrate     # Apply pending database migrations
python manage.py seed_indian_holidays  # Add the India holiday calendar for 2026–2028
```

Always run `migrate` after pulling changes that add migrations. The development database is `backend/db.sqlite3`; back it up before replacing or deleting it.

`seed_indian_holidays` is safe to run more than once and adds any missing holidays without overwriting existing records. The 2026 dates follow the Central Government gazetted calendar; 2027–2028 festival dates are planning estimates and should be confirmed against the official annual circulars.

The optional `backend/seed_employees.py` demo-data script requires a strong `HRMS_SEED_PASSWORD` environment variable; it has no built-in account password. Keep that value temporary and local.

## Configuration

The backend reads configuration from process environment variables. `backend/.env.example` documents the supported Django, database, timezone, email, and `FRONTEND_BASE_URL` settings; Django does not automatically load that file. Local development prints reset emails in the backend terminal. Set `FRONTEND_BASE_URL` to the user-facing app origin so reset links point to the frontend. For production email delivery, set `EMAIL_BACKEND` to Django's SMTP backend and provide the SMTP host, port, user, password, TLS/SSL options, and sender address using environment variables or secret storage. Reset links expire after one hour. Login is limited to 10 attempts/hour per IP; password recovery requests are limited to 5/hour, and reset submissions to 10/hour. The default development cache is process-local; use a shared cache in a multi-instance production deployment so throttling is shared. Employee documents, candidate resumes, and attendance selfies must remain private in production: do not serve `MEDIA_ROOT/employee_documents`, `MEDIA_ROOT/resumes`, or `MEDIA_ROOT/attendance/selfies` directly from a web server or public bucket; serve them through their authenticated download endpoints. Production startup requires `DJANGO_ENV=production`, `DJANGO_DEBUG=False`, a unique `DJANGO_SECRET_KEY`, explicit non-wildcard `DJANGO_ALLOWED_HOSTS`, HTTPS-only CORS/CSRF origins and `FRONTEND_BASE_URL`, and PostgreSQL. Configure SMTP and private file storage before enabling password recovery or document workflows. Never commit real credentials.

Backend logs are written to the console with level, timestamp, and logger name. Set `DJANGO_LOG_LEVEL` to control verbosity (`DEBUG`, `INFO`, `WARNING`, or `ERROR`); production defaults to `INFO`. Forward console logs to a centralized logging service in deployed environments.

`GET /api/health/` is an unauthenticated readiness probe. It checks database connectivity and returns only `{"status":"ok"}` or a generic `503` response; it does not expose dependency error details. Configure monitoring probes at a sensible interval to avoid unnecessary database traffic.

## Project layout

```text
backend/   Django project, API apps, migrations, and development database
frontend/  React application, pages, and Vite configuration
```

## Production status

This project is a development starter/internal prototype. Before production use, complete deployment hardening, automated test coverage, centralized monitoring/log aggregation, backup and audit workflows, and a security review.
