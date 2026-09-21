# Booking Marketplace

A production-grade, full-stack booking platform built with a decoupled architecture. The application allows users to browse available properties, securely manage their authentication sessions, create property reservations, and track their upcoming trips through a personalized dashboard. 

## Architecture & Tech Stack

*   **Frontend:** Next.js (App Router), React, Tailwind CSS, TypeScript.
*   **State Management:** Redux Toolkit for global authentication tracking, synced with backend sessions.
*   **Backend:** Python, Django, SQLite.
*   **Authentication:** Session-based authentication relying on HTTP-only cookies (`credentials: "include"`) with strict domain matching.

## Current Features

### Security & Authentication
*   **User Registration & Login:** Dedicated, centered authentication interfaces with strict form validation.
*   **Persistent Sessions:** A custom Next.js `SessionHydrator` automatically pings a Django `/me/` endpoint on page load to restore Redux state, surviving hard browser refreshes.
*   **Protected Routes:** Next.js router strictly guards pages like the Dashboard, seamlessly redirecting unauthenticated users to the login screen.
*   **Authenticated API Calls:** All user-specific frontend requests carry session cookies to ensure strict data isolation on the backend.

### Property Discovery
*   **Global Feed:** A public-facing homepage that fetches and displays a grid of all available marketplace properties.
*   **Detail Pages:** Dynamic routing (`/properties/[id]`) that displays full property specifications, descriptions, and high-quality images served directly via Django absolute URIs.

### Booking Engine
*   **Atomic Reservations:** Authenticated users can select check-in and check-out dates to securely reserve a property.
*   **Data Validation:** The Django backend enforces strictly validated date logic (e.g., check-out must chronologically follow check-in) before committing to the database.
*   **Status Tracking:** Bookings are instantiated with clear, readable states (`PENDING`, `CONFIRMED`, `CANCELLED`, `COMPLETED`).

### User Dashboard
*   **"My Bookings" Portal:** A dedicated control center where users can view all their historical and upcoming reservations.
*   **Optimized Data Pipeline:** The backend utilizes Django's `select_related` and `prefetch_related` to fetch associated property data and images in a highly efficient, N+1 safe query.
*   **Modern UI:** Responsive Tailwind CSS cards display primary property thumbnails, exact date ranges, total price calculations, and current booking statuses, accompanied by a clean "Empty State" for new users.

## Local Development Setup

### Backend (Django)
1. Navigate to the backend directory.
2. Ensure the virtual environment is activated and dependencies are installed.
3. Run database migrations to ensure the `Booking` and `Property` models are up to date:

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