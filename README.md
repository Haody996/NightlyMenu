# Dinnerly

A household meal planning app with a restaurant menu-style UI. Plan what's for dinner tonight, manage your recipe collection, and coordinate with your household.

**Live:** [dinnerly.menu](https://dinnerly.menu)

## Features

- **Menu management** — Add dishes with photos, ingredients, category, and servings
- **Tonight's plan** — Select dishes for tonight from your menu and notify your household
- **Community feed** — Browse what other households are cooking
- **Household system** — Create or join a household via invite code; all members share the same menu
- **Guest preview** — Visitors see a live demo household without signing in
- **Google Sign-In** — Sign in with Google or email magic code (no password)
- **Bilingual** — English / Chinese toggle
- **Mobile-ready** — iOS app via Capacitor

## Tech Stack

**Client** — React 19, Vite, TypeScript, Tailwind CSS 4, TanStack React Query, Capacitor (iOS)
**Server** — Express 5, TypeScript, better-sqlite3 (SQLite), JWT auth, Nodemailer, Multer
**Infrastructure** — Docker Compose, Nginx reverse proxy

## Getting Started

### Prerequisites

- Node.js 18+
- Docker & Docker Compose (for production)

### Setup

```bash
npm install
cd client && npm install
cd ../server && npm install
```

### Server environment

Create `server/.env`:

```env
JWT_SECRET=change-me-in-production
PORT=3002
GOOGLE_CLIENT_ID=your-google-client-id
DEMO_HOUSEHOLD_ID=1

# Email notifications (leave SMTP_HOST blank to disable)
SMTP_HOST=
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=
SMTP_PASS=
EMAIL_FROM=
APP_URL=http://localhost:5174
CLIENT_URL=http://localhost:5174
```

### Client environment

Create `client/.env`:

```env
VITE_API_URL=http://localhost:3002
VITE_GOOGLE_CLIENT_ID=your-google-client-id
```

### Run (development)

```bash
# From the root — runs both client and server concurrently
npm run dev
```

- Client: http://localhost:5174
- Server: http://localhost:3002

### Run (production)

```bash
docker compose up -d
```

## Project Structure

```
MealPlanner/
├── client/               # React + Vite frontend
│   └── src/
│       ├── components/   # DishCard, DishModal, GoogleSignInButton
│       ├── pages/        # MenuPage, TonightPage, FeedPage, HouseholdPage, LoginPage
│       ├── contexts/     # AuthContext, LanguageContext
│       ├── i18n/         # English & Chinese translations
│       └── lib/          # api, types
└── server/               # Express backend
    └── src/
        ├── routes/       # auth, dishes, households, mealPlan, feed
        ├── middleware/   # auth (JWT)
        └── lib/          # mailer, db
```
