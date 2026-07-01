# Student Attendance Management System

A full-stack, period-wise student attendance system built with the MERN stack. Three roles — Head of Department, Faculty, and Student — each get a purpose-built dashboard. Attendance is tracked independently per subject and per period, so a student can be marked present in Chemistry during Period 2 and absent in Biology during Period 5 on the same day, with no interference between the two records.

## Tech stack

**Backend:** Node.js, Express, MongoDB, Mongoose, JWT (access + refresh tokens), Nodemailer (OTP email), PDFKit, ExcelJS, express-validator, helmet, rate limiting.

**Frontend:** React 19, Vite, React Router, Axios, Tailwind CSS v4, Recharts, Lucide icons.

## Project structure

```
attendance-system/
├── server/                  # Express API
│   └── src/
│       ├── config/          # env-driven constants, DB connection
│       ├── models/          # 9 Mongoose schemas
│       ├── controllers/     # route handlers, one file per resource
│       ├── routes/          # Express routers, mounted in routes/index.js
│       ├── middleware/      # auth, error handling, rate limits, validation
│       ├── services/        # attendance math, PDF/Excel builders, email, notifications
│       ├── validators/      # express-validator chains
│       └── utils/           # JWT, OTP, ApiError, seed script
└── client/                  # React + Vite frontend
    └── src/
        ├── api/              # one file per backend resource, all axios calls live here
        ├── context/          # AuthContext (current user, login/logout, refresh)
        ├── components/       # common/ (Button, Card, Modal...), layout/, charts/, auth/
        ├── pages/            # hod/, faculty/, student/, auth/
        └── hooks/
```

## How attendance actually works

This is the part of the system worth understanding before you start configuring it:

1. **Periods are configured per day of week**, not globally. The HOD sets up a "period template" for Monday, a separate one for Tuesday, and so on — so Saturday can have 4 periods while weekdays have 8, with completely different names (Assembly, Lab, Lunch, Period 1...). Periods are also marked as either `class` (attendance can be taken) or `break` (cannot).
2. **One Class per Department + Semester.** There are no divisions/sections in this build — "CSE, Semester 3" is exactly one class, and every student in that department+semester is in it.
3. **Every attendance record is independent.** The database enforces this with a compound unique index on `(student, subject, date, periodOrder)` — there is no shared "session" document, so marking Chemistry attendance can never accidentally touch Biology's record for the same student on the same day.
4. **Subjects belong to one Class** and can have one or more Faculty assigned. By default every student in the class is on the subject's roster; an optional `students` override list exists for electives.

## Getting started (Windows 11 + Node 26 + local MongoDB)

### 1. Prerequisites

- Node.js v26+ and npm (bundled)
- MongoDB Community Server running locally (default port 27017) — MongoDB Compass is handy for inspecting data but not required
- A Gmail account for sending OTP emails (or any SMTP provider — see the email section below)

### 2. Backend setup

```powershell
cd server
copy .env.example .env
```

Open `.env` and fill in at minimum:
- `MONGO_URI` — leave as-is if MongoDB is running locally on the default port
- `JWT_ACCESS_SECRET` and `JWT_REFRESH_SECRET` — generate two different long random strings (see the command in `.env.example`)
- `EMAIL_USER` / `EMAIL_PASS` — see "Setting up email" below
- `SEED_ADMIN_EMAIL` / `SEED_ADMIN_PASSWORD` — the first HOD account's login

Then install and run:

```powershell
npm install
npm run seed     # creates the first HOD account from your .env
npm run dev      # starts the API on http://localhost:5000 with auto-restart
```

You should see `[Server] Running in development mode on port 5000` in the terminal. If MongoDB isn't reachable, the server will print a clear connection error and exit rather than hanging.

### 3. Frontend setup

In a second terminal:

```powershell
cd client
copy .env.example .env
npm install
npm run dev
```

This starts the frontend on `http://localhost:5173`. Open it in your browser and log in with the HOD credentials from your `.env` (`SEED_ADMIN_EMAIL` / `SEED_ADMIN_PASSWORD`).

### 4. First-time setup inside the app

Once logged in as HOD, the system is empty by design — there's no fake data baked in. A practical order to set things up:

1. **Departments** → create at least one (e.g. "Computer Science Engineering", code `CSE`)
2. **Classes & Semesters** → create a semester (e.g. Semester 3), then a class combining it with your department
3. **Period Timetable** → configure each day's periods (or just configure weekdays first, and Saturday separately if it differs)
4. **Faculty & Students** → create faculty accounts (credentials are emailed automatically), or let students self-register via the "Create an account" link on the login page
5. **Subjects** → create subjects under your class and assign faculty to them

After that, faculty can log in and use **Take Attendance**, and students can self-register, verify their email with the OTP that gets sent, and see their dashboard once logged in.

## Setting up email (OTP, password reset, notifications)

This uses Gmail with an App Password, which is free and doesn't require a paid email service:

1. Go to your Google Account → **Security** → turn on **2-Step Verification** (required for App Passwords to be available)
2. Go to **Security** → **App Passwords** → create one for "Mail"
3. Copy the 16-character password Google gives you
4. In `server/.env`, set `EMAIL_USER` to your full Gmail address and `EMAIL_PASS` to that 16-character app password (not your normal Gmail password)

The server checks this connection at startup and logs a clear warning if it can't authenticate, without crashing the app — so you can develop everything except email-dependent flows even before this is configured.

If you'd rather use a different SMTP provider (SendGrid, Mailgun, your college's mail server, etc.), just change `EMAIL_HOST` and `EMAIL_PORT` accordingly; the rest of the code is provider-agnostic.

## Reports

Both PDF and Excel exports are available in three places:
- **Subject report** (HOD/Faculty) — every student's attendance for one subject
- **Class monthly report** (HOD/Faculty) — every student in a class for a chosen month
- **Personal report** (Student, or HOD/Faculty viewing a specific student) — subject-wise breakdown for one student

Reports download as authenticated requests (not plain links), so the access-control rules that apply everywhere else in the API apply to report downloads too — a faculty member can only export reports for subjects they actually teach, and a student can only export their own.

## Environment variables reference

See `server/.env.example` and `client/.env.example` for the full list with inline comments. Nothing besides `MONGO_URI`, the two JWT secrets, and the email credentials needs to change for local development.

## A note on `bcrypt` vs `bcryptjs`

This project uses `bcryptjs` rather than `bcrypt`. They have an identical API, but `bcryptjs` is pure JavaScript with no native compilation step — meaning no Visual Studio Build Tools or Python toolchain requirement on Windows. If you'd prefer the (slightly faster) native `bcrypt` package instead, it's a drop-in swap: `npm install bcrypt`, then change the two `bcryptjs` imports in `src/models/User.js` and `src/utils/otp.js` to `bcrypt`.

## What's deliberately not included

A few things from a "fully production-hardened" system are out of scope for this build and would be reasonable next additions: file storage for avatar uploads (multer is wired in as a dependency but no upload route exists yet), a dedicated admin UI for editing the activity log, and push notifications (in-app notifications exist; email and in-app are the only channels). None of these affect the core attendance, auth, dashboard, or reporting functionality described in the spec.
