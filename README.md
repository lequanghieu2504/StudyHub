# RailLink - Online Train Ticket Booking

RailLink is a full-stack web application for searching, booking, and managing train tickets, with both customer and admin workflows.

## Tech stack

- **Frontend:** Next.js (App Router), React
- **Backend:** Next.js API Routes (REST)
- **Database:** SQLite (`better-sqlite3`)

## Features

### Customer side
- Home page with train search form (departure, arrival, date, passengers)
- Search results with train details and pricing
- Filtering and sorting by price, time, seat class, and train type
- Train detail page with route and seat availability
- Seat selection page with visual seat layout
- Passenger info form
- Booking summary page
- Simulated payment page
- Booking confirmation page with ticket code and QR placeholder
- User registration and login
- User profile page
- Booking history page with cancellation

### Admin side
- Admin dashboard
- Manage stations
- Manage routes
- Manage trains
- Manage schedules
- Manage ticket prices
- Manage bookings
- Booking statistics

## Database models

The app creates and seeds these SQLite tables automatically at startup:

- `users`
- `sessions`
- `stations`
- `routes`
- `trains`
- `schedules`
- `seats`
- `ticket_prices`
- `bookings`
- `passengers`
- `payments`

## REST API endpoints

- `GET /api/search`
- `GET /api/schedules/:id`
- `POST /api/auth/register`
- `POST /api/auth/login`
- `GET /api/auth/me`
- `GET /api/bookings`
- `POST /api/bookings`
- `DELETE /api/bookings/:id`
- `GET /api/admin/:resource`
- `POST /api/admin/:resource`

## Demo credentials

- Customer: `user@raillink.local` / `demo123`
- Admin: `admin@raillink.local` / `demo123`

## Getting started

```bash
npm install
npm run dev
```

Open `http://localhost:3000`.

## Validation

```bash
npm run lint
npm run build
```

> The SQLite database file `raillink.sqlite` is generated automatically with seed data on first run.
