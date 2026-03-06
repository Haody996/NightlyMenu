# NightlyMenu

A household meal planning app with a restaurant menu-style UI. Plan what's for dinner tonight, manage your recipe collection, and coordinate with your household.

## Features

- **Menu management** — Add dishes with photos, ingredients, category, and servings
- **Tonight's plan** — Select dishes for tonight from your menu
- **Household system** — Create or join a household via invite code; all members share the same menu
- **Email notifications** — Notify all household members when tonight's menu is set
- **Google Sign-In** — Register and log in with Google or email/password

## Tech Stack

**Client** — React 19, Vite, TypeScript, Tailwind CSS 4, TanStack React Query
**Server** — Express 5, TypeScript, better-sqlite3 (SQLite), JWT auth, Nodemailer, Multer

## Getting Started

### Prerequisites

- Node.js 18+

### Setup

```bash
# Install dependencies
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

# Email notifications (leave SMTP_HOST blank to disable)
SMTP_HOST=
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=
SMTP_PASS=
EMAIL_FROM=
APP_URL=http://localhost:5174
```

### Client environment

Create `client/.env`:

```env
VITE_GOOGLE_CLIENT_ID=your-google-client-id
```

### Run

```bash
# From the root — runs both client and server
npm run dev
```

- Client: http://localhost:5174
- Server: http://localhost:3002

## Project Structure

```
MealPlanner/
├── client/          # React + Vite frontend
│   └── src/
│       ├── components/   # DishCard, DishModal, GoogleSignInButton
│       ├── pages/        # MenuPage, TonightPage, HouseholdPage, LoginPage, RegisterPage
│       ├── contexts/     # AuthContext
│       └── lib/          # api, auth helpers, types
└── server/          # Express backend
    └── src/
        ├── routes/       # auth, dishes, households, mealPlan
        ├── middleware/   # auth (JWT)
        └── lib/          # mailer
```

## SSH Access

To access the app running on a remote server, use SSH port forwarding:

```bash
ssh -L 5174:localhost:5174 user@your-server
```

Then open http://localhost:5174 in your browser.
