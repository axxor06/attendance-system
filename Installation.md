# Installation Guide

Quick copy-paste reference. For explanations of *why*, see `README.md`.

## Prerequisites

- [ ] Node.js v26+ installed (`node --version`)
- [ ] MongoDB Community Server installed and running (`mongod` running as a service, or started manually)
- [ ] A Gmail account with 2-Step Verification + an App Password generated (for OTP emails)

## Backend

```powershell
cd server
copy .env.example .env
```

Edit `server\.env`:
```
MONGO_URI=mongodb://127.0.0.1:27017/attendance_system
JWT_ACCESS_SECRET=<paste a long random string here>
JWT_REFRESH_SECRET=<paste a different long random string here>
EMAIL_USER=youremail@gmail.com
EMAIL_PASS=<your 16-character Gmail App Password>
SEED_ADMIN_EMAIL=admin@college.edu
SEED_ADMIN_PASSWORD=<pick something you'll change after first login>
```

Generate a random secret quickly with:
```powershell
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```
Run it twice — once for each JWT secret.

Then:
```powershell
npm install
npm run seed
npm run dev
```

Expect to see: `[DB] MongoDB connected` and `[Server] Running in development mode on port 5000`.

## Frontend

Open a **second** terminal:

```powershell
cd client
copy .env.example .env
npm install
npm run dev
```

Expect to see a `Local: http://localhost:5173/` link printed. Open it in your browser.

## First login

Go to `http://localhost:5173`, log in with the `SEED_ADMIN_EMAIL` / `SEED_ADMIN_PASSWORD` you set above. You're now logged in as HOD.

## Production build (optional)

Frontend:
```powershell
cd client
npm run build
```
Outputs static files to `client/dist`, which can be served by any static host (or by the Express server itself if you add `express.static`).

Backend:
```powershell
cd server
set NODE_ENV=production
npm start
```

## Troubleshooting

**`[DB] Initial connection failed: connect ECONNREFUSED`** — MongoDB isn't running. Open MongoDB Compass and check you can connect to `mongodb://127.0.0.1:27017`, or start the MongoDB service from Windows Services.

**`[Email] SMTP verification failed`** at startup — your `EMAIL_USER`/`EMAIL_PASS` are wrong, or you used your normal Gmail password instead of an App Password. The server still starts; only OTP/notification emails will fail until this is fixed.

**Frontend shows a blank page / network errors in the browser console** — check `client/.env`'s `VITE_API_BASE_URL` matches where your backend is actually running (default `http://localhost:5000/api`), and that the backend terminal is still running.

**`EADDRINUSE` on port 5000 or 5173** — something else is already using that port. Either stop it, or change `PORT` in `server/.env` (and `VITE_API_BASE_URL` in `client/.env` to match) / change the Vite port in `client/vite.config.js`.
# Installation Guide

Quick copy-paste reference. For explanations of *why*, see `README.md`.

## Prerequisites

- [ ] Node.js v26+ installed (`node --version`)
- [ ] MongoDB Community Server installed and running (`mongod` running as a service, or started manually)
- [ ] A Gmail account with 2-Step Verification + an App Password generated (for OTP emails)

## Backend

```powershell
cd server
copy .env.example .env
```

Edit `server\.env`:
```
MONGO_URI=mongodb://127.0.0.1:27017/attendance_system
JWT_ACCESS_SECRET=<paste a long random string here>
JWT_REFRESH_SECRET=<paste a different long random string here>
EMAIL_USER=youremail@gmail.com
EMAIL_PASS=<your 16-character Gmail App Password>
SEED_ADMIN_EMAIL=admin@college.edu
SEED_ADMIN_PASSWORD=<pick something you'll change after first login>
```

Generate a random secret quickly with:
```powershell
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```
Run it twice — once for each JWT secret.

Then:
```powershell
npm install
npm run seed
npm run dev
```

Expect to see: `[DB] MongoDB connected` and `[Server] Running in development mode on port 5000`.

## Frontend

Open a **second** terminal:

```powershell
cd client
copy .env.example .env
npm install
npm run dev
```

Expect to see a `Local: http://localhost:5173/` link printed. Open it in your browser.

## First login

Go to `http://localhost:5173`, log in with the `SEED_ADMIN_EMAIL` / `SEED_ADMIN_PASSWORD` you set above. You're now logged in as HOD.

## Production build (optional)

Frontend:
```powershell
cd client
npm run build
```
Outputs static files to `client/dist`, which can be served by any static host (or by the Express server itself if you add `express.static`).

Backend:
```powershell
cd server
set NODE_ENV=production
npm start
```

## Troubleshooting

**`[DB] Initial connection failed: connect ECONNREFUSED`** — MongoDB isn't running. Open MongoDB Compass and check you can connect to `mongodb://127.0.0.1:27017`, or start the MongoDB service from Windows Services.

**`[Email] SMTP verification failed`** at startup — your `EMAIL_USER`/`EMAIL_PASS` are wrong, or you used your normal Gmail password instead of an App Password. The server still starts; only OTP/notification emails will fail until this is fixed.

**Frontend shows a blank page / network errors in the browser console** — check `client/.env`'s `VITE_API_BASE_URL` matches where your backend is actually running (default `http://localhost:5000/api`), and that the backend terminal is still running.

**`EADDRINUSE` on port 5000 or 5173** — something else is already using that port. Either stop it, or change `PORT` in `server/.env` (and `VITE_API_BASE_URL` in `client/.env` to match) / change the Vite port in `client/vite.config.js`.
