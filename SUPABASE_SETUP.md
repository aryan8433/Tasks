# Supabase setup for this task app

## 1. Create a project

1. Go to [https://supabase.com](https://supabase.com) and create a project.
2. Wait until the database is ready.

## 2. Run the database schema

1. In the Supabase dashboard, open **SQL Editor** → **New query**.
2. Paste the full contents of `supabase/schema.sql` from this repo.
3. Click **Run**.

This creates `folders` and `tasks` tables, indexes, and **Row Level Security** policies so each user only sees their own rows.

## 3. Enable email login

1. Go to **Authentication** → **Providers**.
2. Enable **Email** (password sign-in).
3. Under **Authentication** → **URL configuration**, add your site URL (e.g. `http://localhost:5173` for local dev).

If **“Confirm email”** is enabled under **Authentication** → **Providers** → **Email**, new users must click the link in their inbox before they can sign in. For quick testing you can disable email confirmation (development only).

## 4. Environment variables

1. Copy `.env.example` to `.env` in the project root.
2. In Supabase: **Project Settings** → **API**, copy:
   - **Project URL** → `VITE_SUPABASE_URL`
   - **anon public** key → `VITE_SUPABASE_ANON_KEY`

Restart `npm run dev` after changing `.env`.

## 5. Run the app

```bash
npm install
npm run dev
```

Sign up once with email + password. The app creates your **Today’s tasks** folder automatically on first load.

## What’s stored where

- **Folders**: title, description, `is_default` for the built-in list.
- **Tasks**: title, description, completed, optional priority/due date/time, `today_date` for rollover in the default folder.
- **Auth**: Supabase Auth (session in the browser; **not** your old `localStorage` task dump).

## Deploying the frontend

Build static files with `npm run build` and host them on Vercel, Netlify, Cloudflare Pages, GitHub Pages, etc. Use the same `VITE_*` env vars in the host’s dashboard (or CI secrets), and add your production URL under Supabase **Authentication** → **URL configuration**.

### GitHub Pages (this repo)

1. Push this repo to GitHub. Do **not** commit `.env` (it stays local only).
2. **Repository → Settings → Secrets and variables → Actions → New repository secret**:
   - `VITE_SUPABASE_URL` — same value as in `.env`
   - `VITE_SUPABASE_ANON_KEY` — Supabase **anon public** key (safe to expose in the browser; RLS protects your data — never put the **service role** key here or in `VITE_*` vars)
3. **Settings → Pages → Build and deployment → Source**: choose **GitHub Actions**.
4. Push to `main` or `master` (or run the **Deploy to GitHub Pages** workflow manually). The workflow builds with those secrets and publishes `dist`.
5. In Supabase **Authentication** → **URL configuration**, set **Site URL** to your live Pages URL, for example:
   - Project site: `https://YOUR_USER.github.io/REPO_NAME/`
   - User site (repo named `YOUR_USER.github.io`): `https://YOUR_USER.github.io/`
   Add the same URL under **Redirect URLs** so email links and OAuth redirects work.
