# 🌾 KhetiBahi — Farm Expense Tracker

> *Kheti* (खेती) = farming, *Bahi* (बही) = ledger/account book.
> A simple ledger for your farm's money — pesticide, fertilizer, seeds, labor, transport, and more.

A clean, mobile-friendly Next.js app to track every rupee spent on your farm. Every farmer gets their own account (sign up with email/password) and every expense and sale is saved to **MongoDB** — so your data follows you across devices, not just one browser's `localStorage`.

---

## ✨ Features

- **Email/password accounts** — sign up, log in, log out. Passwords are hashed with bcrypt, sessions use JWT in an httpOnly cookie (see "How Authentication Works" below)
- **Every farmer's data is private** — expenses and income are tagged with `userId`; the API only ever returns/modifies records that belong to the logged-in user
- **Add / edit / delete expenses** — date, category, crop, amount, note
- **Log sales (income)** — date, crop, buyer name, quantity in kg, rate per kg, amount paid — supports partial payment, so you can track money still due from a buyer
- **Profit & Loss by crop** — see income earned minus expenses spent, per crop, with quantity sold and amount due at a glance
- **Net Profit/Loss (farm-wide)** — total income minus total expenses, shown front-and-center on the dashboard
- **8 built-in expense categories** — Pesticide, Fertilizer, Seeds, Labor, Transport, Irrigation, Equipment, Miscellaneous
- **Crop-wise tracking** — tag each expense and sale to Tomato, Potato, Cauliflower, Onion, Cabbage, Spinach, or Other
- **Dashboard** — net profit/loss, total income, total spend, this month's spend, category bar chart, recent activity
- **Analytics page** — profit/loss per crop, monthly spending trend (area chart), monthly summary table, crop-wise spending breakdown
- **Filters** — by category/crop/month/search for expenses, and by crop/month/search for income
- **CSV export** — download your filtered expense list or income list to open in Excel
- **Dark mode** — toggle in the navbar, remembers your choice, also respects system preference on first visit
- **Fully responsive** — bottom tab bar on mobile, top nav on desktop

---

## 🧱 Tech Stack

| Layer       | Choice                                  |
|-------------|------------------------------------------|
| Framework   | Next.js 16 (App Router)                  |
| UI          | React 19 + Tailwind CSS v4               |
| Database    | MongoDB + Mongoose                       |
| Auth        | Custom JWT (via `jose`) in an httpOnly cookie + `bcryptjs` password hashing |
| Route protection | `proxy.ts` (Next.js 16's request-interception file — the renamed `middleware.ts`) |
| Charts      | Recharts                                 |
| Icons       | lucide-react                             |
| Dates       | date-fns                                 |
| Language    | TypeScript                               |

---

## 📁 Folder Structure

```
khetibahi/
├── proxy.ts                     # Runs before every request — redirects/blocks unauthenticated access
│                                 # (this used to be called middleware.ts — Next.js 16 renamed the convention)
│
├── app/
│   ├── layout.tsx              # Root layout — wraps every page with <AuthProvider>, <Navbar>
│   ├── page.tsx                 # Dashboard (home page "/")
│   ├── globals.css              # Tailwind import + dark-mode variant setup
│   │
│   ├── login/page.tsx           # Login form
│   ├── signup/page.tsx          # Signup form
│   │
│   ├── context/
│   │   └── AuthContext.tsx      # Client-side "who is logged in?" state — used by Navbar + every page
│   │
│   ├── api/
│   │   ├── auth/
│   │   │   ├── register/route.ts # POST — create account, hash password, issue JWT cookie
│   │   │   ├── login/route.ts    # POST — verify password, issue JWT cookie
│   │   │   ├── logout/route.ts   # POST — clear the JWT cookie
│   │   │   └── me/route.ts       # GET  — "who am I?" (reads the cookie)
│   │   ├── expenses/
│   │   │   ├── route.ts          # GET (list mine) / POST (create mine)
│   │   │   └── [id]/route.ts     # PUT (update mine) / DELETE (delete mine)
│   │   └── income/
│   │       ├── route.ts          # GET (list mine) / POST (create mine)
│   │       └── [id]/route.ts     # PUT (update mine) / DELETE (delete mine)
│   │
│   ├── expenses/
│   │   └── page.tsx             # Full expense list — filters, edit, delete, CSV export
│   │
│   ├── income/
│   │   └── page.tsx             # Sales log — filters, edit, delete, CSV export
│   │
│   ├── analytics/
│   │   └── page.tsx             # Profit/loss per crop + monthly trend + crop-wise breakdown
│   │
│   ├── components/
│   │   ├── Navbar.tsx           # Top nav (desktop) + bottom tab bar (mobile) + dark mode button
│   │   ├── SummaryCard.tsx      # Reusable stat card (icon + value + label)
│   │   ├── ExpenseForm.tsx      # Modal form — handles both "add" and "edit" for expenses
│   │   ├── ExpenseRow.tsx       # Single row in the expense list
│   │   ├── FilterBar.tsx        # Search + category/crop/month dropdowns (expenses)
│   │   ├── IncomeForm.tsx       # Modal form — handles both "add" and "edit" for sales
│   │   ├── IncomeRow.tsx        # Single row in the income list (shows paid/due status)
│   │   ├── IncomeFilterBar.tsx  # Search + crop/month dropdowns (income)
│   │   ├── CategoryChart.tsx    # Bar chart — spend by category
│   │   └── MonthlyTrendChart.tsx# Area chart — spend by month
│   │
│   ├── hooks/
│   │   ├── useExpenses.ts       # THE BRAIN for expenses — calls /api/expenses, exposes CRUD + filtering + summaries
│   │   ├── useIncome.ts         # THE BRAIN for income — calls /api/income, exposes CRUD + filtering + totals
│   │   └── useDarkMode.ts       # Dark mode state + localStorage persistence (this one's fine staying client-only)
│   │
│   ├── types/
│   │   └── index.ts             # All shared TypeScript types/interfaces (Expense, Income, CropProfitLoss, etc.)
│   │
│   └── utils/
│       ├── constants.ts         # Category/crop metadata (labels, emojis, colors)
│       └── helpers.ts           # Pure functions: formatting, CSV export, aggregation, profit/loss calculation
│
├── lib/
│   ├── mongodb.ts               # Cached MongoDB connection (survives Next.js hot-reload)
│   ├── auth.ts                  # Sign/verify JWTs — used by both API routes and proxy.ts
│   └── session.ts               # getCurrentUser() — reads the cookie, used by API routes only
│
├── models/
│   ├── User.ts                  # Mongoose schema: name, email (unique), passwordHash
│   ├── Expense.ts                # Mongoose schema: userId, date, category, crop, amount, note
│   └── Income.ts                 # Mongoose schema: userId, date, crop, buyer, quantityKg, ratePerKg, amountPaid, note
│
├── public/                      # Static assets (favicon, etc.)
├── .env.example                  # Copy to .env.local and fill in MONGODB_URI + JWT_SECRET
├── package.json
├── tsconfig.json
├── next.config.ts
└── README.md                    # You are here
```

### Why this structure?

- **`hooks/useExpenses.ts` and `hooks/useIncome.ts` are the single sources of truth** for their respective data. Every page calls these hooks instead of calling `fetch()` directly. Each loads from the API (→ MongoDB) on mount, sends every add/edit/delete to the server, and exposes computed summaries. This means there's only one place to look if logic ever needs fixing.
- **`utils/helpers.ts` holds pure functions** (no React, no network calls) — easy to test or reuse outside React entirely. This includes `buildCropProfitLoss()`, the function that powers the Profit & Loss section on the Analytics page.
- **`components/` are all "dumb" presentation components** — they receive data and callbacks as props; they don't know *how* expenses or income are stored, or that a database is even involved.
- **`lib/auth.ts` is split from `lib/session.ts` on purpose.** `auth.ts` only depends on `jose`, so it's safe for `proxy.ts` to import (no Node-only APIs). `session.ts` uses `next/headers`, which only works inside API routes/Server Components — keeping it separate means `proxy.ts` never accidentally pulls in code it can't run.
- **Ownership checks live in the database query, not as a separate `if` statement.** Every update/delete does `findOneAndUpdate({ _id: id, userId: user.userId }, ...)` — one query that's simultaneously "find this record" and "only if it's yours." If it doesn't match both conditions, you get a 404, not a 403 — so a malicious user probing other people's IDs can't even tell whether the ID exists.

---

## 🚀 Setup Instructions

### 1. Prerequisites
- [Node.js](https://nodejs.org/) **v18.18 or later** (v20+ recommended)
- npm (comes with Node.js)
- A MongoDB database — either:
  - **Local MongoDB** ([install guide](https://www.mongodb.com/docs/manual/installation/)), or
  - **[MongoDB Atlas](https://www.mongodb.com/cloud/atlas/register)** — free tier, no credit card, takes about 3 minutes to set up: create a cluster → create a database user → "Connect" → copy the connection string

Check your Node version:
```bash
node -v
```

### 2. Install dependencies
From inside the `khetibahi` folder:
```bash
npm install
```

### 3. Set up environment variables
Copy the example file:
```bash
cp .env.example .env.local
```

Open `.env.local` and fill in two values:
```
MONGODB_URI=mongodb+srv://<user>:<password>@<cluster>.mongodb.net/khetibahi
JWT_SECRET=<a long random string>
```

Generate a strong `JWT_SECRET` with:
```bash
openssl rand -base64 32
```

`.env.local` is already in `.gitignore` — never commit it. `JWT_SECRET` is what lets your server prove a login token is genuine; if it leaks, anyone can forge a session for any user.

### 4. Run the development server
```bash
npm run dev
```

Open **http://localhost:3000** in your browser. You'll be redirected to `/signup` — create an account, and you're in. The app hot-reloads as you edit code.

### 5. Build for production
```bash
npm run build
npm run start
```
This creates an optimized production build and serves it on port 3000.

---

## 🌐 Deploying (optional)

Deploy on:
- **[Vercel](https://vercel.com)** (made by the Next.js team — connect your GitHub repo, add `MONGODB_URI` and `JWT_SECRET` under Project Settings → Environment Variables, then deploy)
- **Netlify**
- Any Node host that supports Next.js

If you used MongoDB Atlas, remember to allow your deployment platform's IP range under Atlas's **Network Access** settings (or allow `0.0.0.0/0` for simplicity, accepting the slightly weaker security that implies).

> ✅ Because data now lives in MongoDB instead of `localStorage`, the same account works across every device — log in from your phone and your laptop and see the same ledger.

---

## 🧭 How to Use the App

1. **Sign up (`/signup`)** — create an account with your name, email, and a password (6+ characters).
2. **Log in (`/login`)** — next time, just log in. Your session lasts 7 days, then you'll need to log in again.
3. **Dashboard (`/`)** — see your total spend, this month's spend, and top category at a glance. Click **+ Add Expense** to log a new cost.
4. **Expenses (`/expenses`)** — see every expense you've logged. Use the search box or dropdowns to filter by category, crop, or month. Click the pencil to edit, the trash icon to delete. Click **Export CSV** to download your data.
5. **Analytics (`/analytics`)** — see your spending trend over time and how much you've spent per crop.
6. **Dark mode** — tap the moon/sun icon in the top-right to switch themes. Your choice is remembered.
7. **Logout** — click your name (desktop) or the Logout tab (mobile) in the nav bar.

---

## 🔐 How Authentication Works

Worth understanding properly, since "how does login actually work" comes up constantly in real-world dev work (and in interviews).

**1. Signup/Login → server issues a token.**
You POST your email + password to `/api/auth/login`. The server looks up your `User` document in MongoDB, and uses `bcrypt.compare()` to check your password against the stored **hash** (the real password is never stored — only a one-way hash of it). If it matches, the server creates a **JWT** (JSON Web Token): a signed string containing your `userId`, `name`, and `email`. "Signed" means: anyone can read it, but only someone holding the secret key (`JWT_SECRET`, which only the server has) could have produced a signature that verifies correctly. So you can't edit the token and pretend to be a different user — the signature would no longer match.

**2. The token lives in an httpOnly cookie.**
The server sends the token back as a cookie with `httpOnly: true`. This is the important part: **JavaScript running in the browser cannot read this cookie at all** — not even your own app's code. That closes off the most common way tokens get stolen (a malicious script reading `document.cookie`). The browser still sends the cookie automatically with every request to your site, which is exactly what you want.

**3. Every request, the server checks the cookie.**
Two layers check it, deliberately redundant:
- **`proxy.ts`** (runs before any page or API route loads) does a fast check: "is there a token, and does its signature verify?" If not, it redirects you to `/login` (for pages) or returns `401 Unauthorized` (for API calls).
- **Each API route** (e.g. `/api/expenses`) calls `getCurrentUser()` again itself, to get the actual `userId` it needs for the database query. This is also the more "authoritative" check — if you ever forget to protect a new route in `proxy.ts`'s matcher list, the route's own check still saves you.

**4. Every database query is scoped to `userId`.**
This is the part that actually keeps your data private from other users. Every expense/income document stores a `userId`. Every query — list, create, update, delete — filters by `{ userId: user.userId }`. The `userId` always comes from the **verified token**, never from anything the client sends in the request body — otherwise anyone could just claim someone else's `userId` and read or modify their data.

**5. Logout just deletes the cookie.**
There's no server-side "session table" to clean up — JWTs are *stateless*. `/api/auth/logout` tells the browser to delete the cookie, and that's it. (Trade-off worth knowing: this also means there's no way to forcibly invalidate a token early, e.g. "log out this device remotely," without adding extra infrastructure like a token blocklist. Fine for an app like this; worth knowing about if you build something with stricter security needs later.)

---

## 🧮 How Profit/Loss Is Calculated

This is the part worth understanding properly, since it's the number that actually matters.

For each crop:
```
income  = sum of (rate per kg × quantity in kg) for every sale of that crop
expense = sum of every expense entry tagged to that exact crop
profit  = income − expense
```

A few deliberate choices baked into this:

1. **Income counts the full sale value, not just what's been paid.** If you sold 100kg of tomato at ₹40/kg, that's ₹4,000 of income even if the buyer still owes you ₹1,000. The "amount due" is tracked separately and shown alongside profit, so you can see both "what I earned" and "what I'm still owed" without one hiding the other.

2. **Expenses tagged "All Crops" are excluded from per-crop profit/loss.** If you tag a pesticide purchase to "Tomato," it counts against tomato's profit. But if you tag it "All Crops" (e.g. a general farm tool, or fuel for the tractor that's used across the whole field), it's a real cost — it just isn't attributable to one crop fairly, so including it would make the per-crop numbers misleading. It still counts in your overall farm total on the Dashboard (`Total Spent` includes every expense regardless of crop tag).

3. **The farm-wide Net Profit on the Dashboard is simpler:** `total income (all sales) − total expenses (all expenses, including "All Crops")`. This is the one true bottom-line number — no exclusions, nothing left out.

If you want per-crop numbers to *include* a fair share of general costs later (e.g. split "All Crops" expenses evenly across active crops each month), that's a deliberate next step, not something done automatically — ping me if you want it, the logic lives in one function (`buildCropProfitLoss` in `app/utils/helpers.ts`) and is easy to extend.

---



- **Add a new category:** edit `app/utils/constants.ts` → add an entry to `CATEGORIES`, then add the matching value to the `ExpenseCategory` type in `app/types/index.ts`.
- **Add a new crop:** same idea, but edit `CROPS` and the `CropType` type.
- **Change currency:** `app/utils/helpers.ts` → `formatNPR()` uses `Intl.NumberFormat` with `currency: "NPR"`. Swap to `"USD"`, `"INR"`, etc. and rename the function if you like.

---

## 🛣️ Future Improvements (ideas, not implemented)

- Email verification on signup, and a "forgot password" flow (currently there's no way to recover a lost password except editing the database directly)
- Rate-limiting login attempts, to slow down brute-force password guessing
- Add photo receipts (store as base64 or upload to cloud storage)
- Multi-language UI (Nepali/English toggle)
- PWA support so it installs like a native app and works fully offline (it already works offline once loaded — a service worker would make first-load offline too)

---

Built for farmers who deserve good tools too.
