# RSTGO — Smart Restaurant Ordering System

NFC/QR-powered table ordering for modern restaurants. Guests tap → order → split bill. Staff see orders in real time. Owners set everything up in 10 minutes.

---

## Features

- **NFC & QR ordering** — guests tap or scan, no app required
- **Shared table cart** — multiple guests, each item labeled by name
- **Split bill** — individual breakdown per guest, auto-calculated
- **Call waiter** — one button, staff notified instantly with table number
- **Staff panel** — PIN-protected, separate URL, live updates every 4 seconds
- **Owner dashboard** — menu editor, table manager, settings, analytics
- **Multi-tenant SaaS** — each restaurant gets its own slug and isolated data

---

## Tech Stack

- **Next.js 14** App Router
- **Tailwind CSS**
- **Supabase** — auth + Postgres + Realtime
- **Vercel** — zero-config deployment

---

## Project Structure

```
app/
  page.tsx                      # Landing page
  (auth)/login/page.tsx         # Login
  (auth)/signup/page.tsx        # 3-step onboarding
  dashboard/
    layout.tsx                  # Sidebar
    page.tsx                    # Stats overview
    menu/page.tsx               # Menu editor
    tables/page.tsx             # Table & NFC manager
    settings/page.tsx           # PIN, branding, plan
  [slug]/
    table/[tableId]/page.tsx    # Customer ordering (PUBLIC)
    staff/page.tsx              # Staff panel (PIN protected)
lib/
  supabase.ts
  utils.ts
supabase-schema.sql
```

---

## Deploy to Vercel in 5 minutes

### 1. Supabase setup
1. [supabase.com](https://supabase.com) → New Project
2. SQL Editor → paste `supabase-schema.sql` → Run
3. Settings → API → copy URL and anon key

### 2. Deploy
```bash
npm i -g vercel
vercel
vercel env add NEXT_PUBLIC_SUPABASE_URL
vercel env add NEXT_PUBLIC_SUPABASE_ANON_KEY
vercel --prod
```

Or: push to GitHub → import on vercel.com → add env vars → done.

---

## NFC Setup

1. Buy NTAG213 NFC stickers (~5–15 UAH/each, AliExpress)
2. Install **NFC Tools** app (iOS/Android)
3. Write → URL → paste from Tables page in dashboard
4. Stick to table

Staff URL: `https://yourdomain.com/[slug]/staff` — PIN protected, never share with guests.

---

## Local Dev

```bash
npm install
cp .env.example .env.local
# add your Supabase keys
npm run dev
```
