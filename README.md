# HR Management System

A modern Human Resource Management System built with Django REST Framework on the backend and React + TypeScript + Vite on the frontend.

## Tech Stack

- Backend: Django 6.1, Django REST Framework
- Frontend: React 19, TypeScript, Vite
- Authentication: JWT via SimpleJWT
- Database: SQLite for development, PostgreSQL-ready configuration
- Styling: custom enterprise dashboard theme with dark mode support

## Features

- Employee management
- Department management
- Attendance tracking
- Leave management
- Payroll summaries
- Performance reviews
- Recruitment workflows
- Holiday calendar
- Announcements
- Document management
- Role-based dashboard access

## Project Structure

```text
HR-Management-System/
├── backend/
│   ├── apps/
│   ├── config/
│   ├── media/
│   ├── db.sqlite3
│   ├── manage.py
│   └── requirements.txt
├── frontend/
│   ├── src/
│   ├── public/
│   ├── package.json
│   ├── vite.config.ts
│   └── README.md
├── .gitignore
├── README.md
└── .env.example
```

## Prerequisites

- Python 3.11+
- Node.js 18+
- npm

## Setup

### Backend

```bash
cd backend
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate
pip install -r requirements.txt
python manage.py migrate
python manage.py runserver
```

### Frontend

```bash
cd frontend
npm install
npm run dev
```

## Default Access

The app is configured for local development and uses the Django development server on:

- Backend: http://localhost:8000
- Frontend: http://localhost:5173 or 5174 depending on existing ports

## Environment Notes

For production deployment, configure environment variables for:

- `DJANGO_SECRET_KEY`
- `DJANGO_DEBUG`
- `DJANGO_ALLOWED_HOSTS`
- `DJANGO_CORS_ALLOWED_ORIGINS`
- `DJANGO_DATABASE_ENGINE`
- `DJANGO_DATABASE_NAME`
- `DJANGO_DATABASE_USER`
- `DJANGO_DATABASE_PASSWORD`
- `DJANGO_DATABASE_HOST`
- `DJANGO_DATABASE_PORT`

## Production Readiness Status

This project is suitable for a demo or internal prototype, but not yet fully production-ready. Recommended follow-up work includes:

- Add environment-based configuration files
- Improve logging and monitoring
- Add automated tests
- Harden auth and deployment settings
- Add backup and audit workflows
- Review error handling for all modules

## License

This project is provided as a development starter for HR management workflows.
