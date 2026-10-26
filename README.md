# Booking Marketplace

A production-grade, full-stack booking platform built with a decoupled architecture. The application allows users to browse available properties, securely manage their authentication sessions, create property reservations, and track their upcoming trips through a personalized dashboard. 

## Architecture & Tech Stack

*   **Frontend:** Next.js (App Router), React, Tailwind CSS, TypeScript.
*   **State Management:** Redux Toolkit for global authentication tracking, synced with backend sessions.
*   **Backend:** Python, Django, SQLite.
*   **Authentication:** Session-based authentication relying on HTTP-only cookies (`credentials: "include"`) with strict domain matching.

## Local Development Setup

### Backend (Django)
1. Navigate to the backend directory.
2. Ensure the virtual environment is activated and dependencies are installed.
3. Run database migrations to ensure models are up to date:

```bash
python manage.py migrate
```

4. Start the server on port 8000:

```bash
python manage.py runserver 8000
```

5. **Important** Ensure `SESSION_COOKIE_DOMAIN` = 'localhost' is set in `settings.py`

### Frontend (Next.js)

1. Navigate to the frontend directory.
2. Install dependencies via `npm install`.
3. Start the development server on port 3000:

```bash
npm run dev
```
